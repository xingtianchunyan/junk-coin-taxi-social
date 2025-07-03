import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutoGenerateRequest {
  destination_name: string;
  destination_address: string;
  gaode_api_key?: string; // 可选，用于实际API调用
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { destination_name, destination_address, gaode_api_key }: AutoGenerateRequest = await req.json()

    if (!destination_name || !destination_address) {
      return new Response(
        JSON.stringify({ error: '目的地名称和地址不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`开始为目的地 ${destination_name} 生成固定路线...`)

    // 获取高德地图API密钥
    const gaodeApiKey = Deno.env.get('GAODE_API_KEY')
    
    // 搜索附近的交通枢纽 (模拟数据，实际应使用高德地图API)
    const transportHubs = await searchNearbyTransportHubs(destination_address, gaodeApiKey)
    
    console.log(`找到 ${transportHubs.length} 个交通枢纽`)

    const generatedRoutes = []

    for (const hub of transportHubs) {
      try {
        // 检查是否已存在相同路线
        const { data: existingRoute } = await supabase
          .from('fixed_routes')
          .select('id')
          .eq('start_location', hub.name)
          .eq('end_location', destination_name)
          .single()

        if (existingRoute) {
          console.log(`路线已存在，跳过: ${hub.name} -> ${destination_name}`)
          continue
        }

        // 计算路线信息
        const routeInfo = await calculateRouteInfo(hub.address, destination_address, gaodeApiKey)
        
        // 创建固定路线
        const routeData = {
          name: `${hub.name}到${destination_name}`,
          start_location: hub.name,
          end_location: destination_name,
          distance_km: routeInfo.distance_km,
          estimated_duration_minutes: routeInfo.duration_minutes,
          market_price: routeInfo.market_price,
          our_price: routeInfo.our_price,
          currency: 'CNY',
          is_active: true
        }

        const { data: route, error } = await supabase
          .from('fixed_routes')
          .insert([routeData])
          .select()
          .single()

        if (error) {
          console.error(`创建路线失败: ${hub.name} -> ${destination_name}`, error)
        } else {
          console.log(`成功创建路线: ${route.name}`)
          generatedRoutes.push(route)
        }
      } catch (error) {
        console.error(`处理交通枢纽 ${hub.name} 时出错:`, error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `成功生成 ${generatedRoutes.length} 条固定路线`,
        routes: generatedRoutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('自动生成路线失败:', error)
    return new Response(
      JSON.stringify({ error: '自动生成路线失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// 搜索附近的交通枢纽 (根据目的地获取真实的交通枢纽)
async function searchNearbyTransportHubs(address: string, apiKey?: string): Promise<Array<{name: string, address: string, type: string}>> {
  // 如果有API密钥，调用真实的高德地图API
  if (apiKey) {
    try {
      return await searchWithGaodeAPI(address, apiKey)
    } catch (error) {
      console.error('高德地图API调用失败，使用预设数据:', error)
    }
  }

  // 根据目的地返回预设的真实交通枢纽
  return getPresetTransportHubs(address)
}

// 根据目的地返回预设的真实交通枢纽
function getPresetTransportHubs(address: string): Array<{name: string, address: string, type: string}> {
  // 根据目的地地址返回对应的真实交通枢纽
  if (address.includes('黄山')) {
    return [
      { name: '黄山北站', address: '安徽省黄山市黄山区', type: 'high_speed_rail' },
      { name: '黄山站', address: '安徽省黄山市屯溪区', type: 'railway' },
      { name: '篁墩站', address: '安徽省黄山市屯溪区', type: 'railway' },
      { name: '黄山屯溪国际机场', address: '安徽省黄山市屯溪区', type: 'airport' },
      { name: '王村客运中心', address: '安徽省黄山市屯溪区', type: 'bus_station' }
    ]
  } else if (address.includes('屏南') || address.includes('四坪村') || address.includes('龙潭村') || address.includes('墘头村')) {
    return [
      { name: '宁德站', address: '福建省宁德市蕉城区', type: 'high_speed_rail' },
      { name: '古田北站', address: '福建省宁德市古田县', type: 'high_speed_rail' },
      { name: '屏南汽车站', address: '福建省宁德市屏南县', type: 'bus_station' },
      { name: '宁德汽车北站', address: '福建省宁德市蕉城区', type: 'bus_station' },
      { name: '福州长乐国际机场', address: '福建省福州市长乐区', type: 'airport' }
    ]
  }
  
  // 默认返回一些通用的交通枢纽
  return [
    { name: '当地火车站', address: '当地火车站', type: 'railway' },
    { name: '当地汽车站', address: '当地汽车站', type: 'bus_station' }
  ]
}

// 使用高德地图API搜索 (实际实现) - 搜索目的地附近的交通枢纽
async function searchWithGaodeAPI(address: string, gaodeKey: string): Promise<Array<{name: string, address: string, type: string}>> {
  const hubs: Array<{name: string, address: string, type: string}> = []
  
  // 先获取目的地的城市信息
  let cityName = ''
  try {
    const geoUrl = `https://restapi.amap.com/v3/geocode/geo?key=${gaodeKey}&address=${encodeURIComponent(address)}&output=json`
    const geoResponse = await fetch(geoUrl)
    const geoData = await geoResponse.json()
    
    if (geoData.status === '1' && geoData.geocodes && geoData.geocodes.length > 0) {
      const geocode = geoData.geocodes[0]
      cityName = geocode.city || geocode.province
    }
  } catch (error) {
    console.error('获取城市信息失败:', error)
    return getPresetTransportHubs(address)
  }
  
  // 搜索不同类型的交通枢纽
  const searchTypes = [
    { keywords: '火车站', type: 'railway' },
    { keywords: '高铁站', type: 'high_speed_rail' },
    { keywords: '机场', type: 'airport' },
    { keywords: '汽车站', type: 'bus_station' }
  ]

  for (const searchType of searchTypes) {
    try {
      // 使用目的地的城市来搜索附近的交通枢纽
      const url = `https://restapi.amap.com/v3/place/text?key=${gaodeKey}&keywords=${searchType.keywords}&city=${encodeURIComponent(cityName)}&output=json&offset=5`
      const response = await fetch(url)
      const data = await response.json()

      if (data.status === '1' && data.pois) {
        for (const poi of data.pois) {
          hubs.push({
            name: poi.name,
            address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
            type: searchType.type
          })
        }
      }
    } catch (error) {
      console.error(`搜索 ${searchType.keywords} 失败:`, error)
    }
  }

  // 如果API搜索失败或没有结果，回退到预设数据
  return hubs.length > 0 ? hubs : getPresetTransportHubs(address)
}

// 计算路线信息
async function calculateRouteInfo(startAddress: string, endAddress: string, apiKey?: string): Promise<{
  distance_km: number,
  duration_minutes: number,
  market_price: number,
  our_price: number
}> {
  // 如果有API密钥，可以调用真实的路线规划API
  if (apiKey) {
    try {
      return await calculateWithGaodeAPI(startAddress, endAddress, apiKey)
    } catch (error) {
      console.error('高德地图路线规划API调用失败，使用模拟计算:', error)
    }
  }

  // 模拟计算：基于地名估算距离
  const distance = estimateDistanceByName(startAddress, endAddress)
  const duration = Math.ceil(distance * 2) // 假设每公里2分钟
  const marketPrice = calculateMarketPrice(distance)
  const ourPrice = marketPrice * 0.7 // 市场价的70%

  return {
    distance_km: distance,
    duration_minutes: duration,
    market_price: marketPrice,
    our_price: ourPrice
  }
}

// 使用高德地图API计算路线 (实际实现)
async function calculateWithGaodeAPI(start: string, end: string, apiKey: string): Promise<{
  distance_km: number,
  duration_minutes: number,
  market_price: number,
  our_price: number
}> {
  try {
    // 先获取起点和终点的坐标
    const startCoord = await getCoordinates(start, apiKey)
    const endCoord = await getCoordinates(end, apiKey)

    // 调用路线规划API
    const url = `https://restapi.amap.com/v3/direction/driving?key=${apiKey}&origin=${startCoord}&destination=${endCoord}&output=json`
    const response = await fetch(url)
    const data = await response.json()
    
    console.log(`路线规划API响应 ${start} -> ${end}:`, JSON.stringify(data, null, 2))

    if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
      const path = data.route.paths[0]
      const distance = parseFloat(path.distance) / 1000 // 转换为公里
      const duration = Math.ceil(parseFloat(path.duration) / 60) // 转换为分钟
      
      console.log(`计算得到距离: ${distance}公里, 时间: ${duration}分钟`)
      
      const marketPrice = calculateMarketPrice(distance)
      const ourPrice = marketPrice * 0.7

      return {
        distance_km: Math.round(distance * 100) / 100, // 保留两位小数
        duration_minutes: duration,
        market_price: marketPrice,
        our_price: ourPrice
      }
    }
  } catch (error) {
    console.error('高德地图路线规划失败:', error)
  }

  // 如果API调用失败，回退到模拟计算
  const distance = estimateDistanceByName(start, end)
  return {
    distance_km: distance,
    duration_minutes: Math.ceil(distance * 2),
    market_price: calculateMarketPrice(distance),
    our_price: calculateMarketPrice(distance) * 0.7
  }
}

// 获取地址坐标
async function getCoordinates(address: string, apiKey: string): Promise<string> {
  const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(address)}&output=json`
  const response = await fetch(url)
  const data = await response.json()
  
  console.log(`获取坐标 ${address}:`, data)

  if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
    return data.geocodes[0].location
  }

  throw new Error(`无法获取地址 ${address} 的坐标`)
}

// 基于地名估算距离的简化函数
function estimateDistanceByName(start: string, end: string): number {
  const routes: Record<string, Record<string, number>> = {
    '火车站': { '村里': 25.5, '机场': 15.0, '汽车站': 8.0 },
    '高铁站': { '村里': 28.0, '机场': 12.0, '汽车站': 10.0 },
    '机场': { '村里': 32.0, '火车站': 15.0, '汽车站': 18.0 },
    '汽车站': { '村里': 18.0, '火车站': 8.0, '机场': 18.0 }
  }
  
  // 查找预设距离
  for (const [startKey, destinations] of Object.entries(routes)) {
    if (start.includes(startKey)) {
      for (const [endKey, distance] of Object.entries(destinations)) {
        if (end.includes(endKey)) {
          return distance
        }
      }
    }
  }

  // 如果没有预设，根据地名类型估算
  if (start.includes('机场') || end.includes('机场')) {
    return 30.0 + Math.random() * 10
  } else if (start.includes('高铁') || end.includes('高铁')) {
    return 25.0 + Math.random() * 10
  } else if (start.includes('火车') || end.includes('火车')) {
    return 20.0 + Math.random() * 10
  } else {
    return 15.0 + Math.random() * 10 // 默认距离
  }
}

// 基于距离计算市场价格的简化函数
function calculateMarketPrice(distance: number): number {
  // 简化的出租车计价规则：起步价12元（3公里），超出部分每公里2.5元
  const basePrice = 12
  const baseDistance = 3
  const pricePerKm = 2.5
  
  if (distance <= baseDistance) {
    return basePrice
  }
  
  return basePrice + (distance - baseDistance) * pricePerKm
}