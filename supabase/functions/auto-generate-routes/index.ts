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
    console.log('固定路线生成功能已暂时关闭，以保护手动编辑的数据')

    return new Response(
      JSON.stringify({
        success: false,
        message: '固定路线生成功能已暂时关闭，以保护当前手动编辑的数据',
        status: 'disabled'
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
  // 如果有API密钥，调用改进的高德地图API搜索
  if (apiKey) {
    try {
      return await searchWithImprovedGaodeAPI(address, apiKey)
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

// 使用改进的高德地图API搜索 - 基于行政区划和距离限制搜索交通枢纽
async function searchWithImprovedGaodeAPI(address: string, gaodeKey: string): Promise<Array<{name: string, address: string, type: string}>> {
  try {
    console.log(`开始改进搜索流程，目的地: ${address}`)
    
    // 1. 获取目的地的详细信息和坐标
    const destinationInfo = await getDestinationInfo(address, gaodeKey)
    if (!destinationInfo) {
      console.log('无法获取目的地信息，使用预设数据')
      return getPresetTransportHubs(address)
    }
    
    console.log(`目的地信息:`, destinationInfo)
    
    // 2. 按照行政区划层级搜索交通枢纽
    const allHubs = await searchHubsByAdministrativeDivision(destinationInfo, gaodeKey)
    
    // 3. 去重和标准化枢纽名称
    const deduplicatedHubs = deduplicateTransportHubs(allHubs)
    console.log(`去重后剩余 ${deduplicatedHubs.length} 个交通枢纽`)
    
    // 4. 计算距离并按类型筛选
    const filteredHubs = await filterHubsByDistanceAndType(destinationInfo, deduplicatedHubs, gaodeKey)
    
    console.log(`最终筛选出 ${filteredHubs.length} 个交通枢纽`)
    return filteredHubs
    
  } catch (error) {
    console.error('改进搜索失败:', error)
    return getPresetTransportHubs(address)
  }
}

// 获取目的地详细信息
async function getDestinationInfo(address: string, gaodeKey: string): Promise<{
  name: string,
  coordinates: string,
  district: string,
  city: string,
  province: string
} | null> {
  try {
    const geoUrl = `https://restapi.amap.com/v3/geocode/geo?key=${gaodeKey}&address=${encodeURIComponent(address)}&output=json`
    const geoResponse = await fetch(geoUrl)
    const geoData = await geoResponse.json()
    
    console.log(`地理编码响应:`, JSON.stringify(geoData, null, 2))
    
    if (geoData.status === '1' && geoData.geocodes && geoData.geocodes.length > 0) {
      const geocode = geoData.geocodes[0]
      return {
        name: address,
        coordinates: geocode.location,
        district: geocode.district || '',
        city: geocode.city || '',
        province: geocode.province || ''
      }
    }
  } catch (error) {
    console.error('获取目的地信息失败:', error)
  }
  return null
}

// 按行政区划搜索交通枢纽
async function searchHubsByAdministrativeDivision(destinationInfo: any, gaodeKey: string): Promise<Array<{name: string, address: string, type: string, coordinates?: string}>> {
  const allHubs: Array<{name: string, address: string, type: string, coordinates?: string}> = []
  
  // 定义搜索类型和关键词
  const searchTypes = [
    { keywords: ['机场'], type: 'airport' },
    { keywords: ['高铁站', '高速铁路'], type: 'high_speed_rail' },
    { keywords: ['火车站', '铁路'], type: 'railway' },
    { keywords: ['汽车站', '客运站'], type: 'bus_station' }
  ]
  
  // 搜索范围：先区县级，再市级
  const searchAreas = [
    { name: '区县级', area: destinationInfo.district || destinationInfo.city },
    { name: '市级', area: destinationInfo.city }
  ]
  
  for (const area of searchAreas) {
    if (!area.area) continue
    
    console.log(`在${area.name}搜索交通枢纽: ${area.area}`)
    
    for (const searchType of searchTypes) {
      for (const keyword of searchType.keywords) {
        try {
          const url = `https://restapi.amap.com/v3/place/text?key=${gaodeKey}&keywords=${keyword}&city=${encodeURIComponent(area.area)}&output=json&offset=10`
          const response = await fetch(url)
          const data = await response.json()
          
          if (data.status === '1' && data.pois) {
            for (const poi of data.pois) {
              // 获取每个枢纽的坐标
              const hubCoordinates = poi.location
              
              allHubs.push({
                name: poi.name,
                address: poi.address || `${poi.pname}${poi.cityname}${poi.adname}`,
                type: searchType.type,
                coordinates: hubCoordinates
              })
            }
          }
        } catch (error) {
          console.error(`搜索 ${keyword} 失败:`, error)
        }
        
        // 避免API调用过于频繁
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
  }
  
  // 去重（根据名称）
  const uniqueHubs = allHubs.filter((hub, index, self) => 
    index === self.findIndex(h => h.name === hub.name)
  )
  
  console.log(`搜索到 ${uniqueHubs.length} 个唯一交通枢纽`)
  return uniqueHubs
}

// 根据距离和类型筛选交通枢纽
async function filterHubsByDistanceAndType(destinationInfo: any, hubs: Array<{name: string, address: string, type: string, coordinates?: string}>, gaodeKey: string): Promise<Array<{name: string, address: string, type: string}>> {
  const distanceLimits = {
    'airport': 200000, // 200公里
    'high_speed_rail': 100000, // 100公里
    'railway': 60000, // 60公里
    'bus_station': 30000 // 30公里
  }
  
  const tolerance = 0.1 // 10%容差
  const filteredHubs: Array<{name: string, address: string, type: string}> = []
  
  // 按类型分组
  const hubsByType = hubs.reduce((acc, hub) => {
    if (!acc[hub.type]) acc[hub.type] = []
    acc[hub.type].push(hub)
    return acc
  }, {} as Record<string, typeof hubs>)
  
  for (const [type, typeHubs] of Object.entries(hubsByType)) {
    const limit = distanceLimits[type as keyof typeof distanceLimits] || 30000
    
    console.log(`处理 ${type} 类型枢纽，距离限制: ${limit/1000}公里`)
    
    // 计算每个枢纽到目的地的距离
    const hubsWithDistance = await Promise.all(
      typeHubs.map(async (hub) => {
        try {
          const distance = await calculateDrivingDistance(
            destinationInfo.coordinates,
            hub.coordinates || '',
            gaodeKey
          )
          return { ...hub, distance }
        } catch (error) {
          console.error(`计算距离失败: ${hub.name}`, error)
          return { ...hub, distance: Infinity }
        }
      })
    )
    
    // 筛选在距离限制内的枢纽
    const validHubs = hubsWithDistance.filter(hub => hub.distance <= limit)
    
    if (validHubs.length === 0) {
      console.log(`${type} 类型没有符合距离要求的枢纽`)
      continue
    }
    
    // 找到最近的距离
    const minDistance = Math.min(...validHubs.map(h => h.distance))
    const toleranceDistance = limit * tolerance
    
    // 选择最近的枢纽，以及与最近距离差值在容差范围内的枢纽
    const selectedHubs = validHubs.filter(hub => 
      hub.distance - minDistance <= toleranceDistance
    )
    
    console.log(`${type} 类型选择了 ${selectedHubs.length} 个枢纽`)
    
    filteredHubs.push(...selectedHubs.map(hub => ({
      name: hub.name,
      address: hub.address,
      type: hub.type
    })))
  }
  
  return filteredHubs
}

// 计算驾车距离
async function calculateDrivingDistance(origin: string, destination: string, gaodeKey: string): Promise<number> {
  try {
    const url = `https://restapi.amap.com/v3/direction/driving?key=${gaodeKey}&origin=${origin}&destination=${destination}&output=json`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status === '1' && data.route && data.route.paths && data.route.paths.length > 0) {
      const distance = parseFloat(data.route.paths[0].distance)
      console.log(`距离计算结果: ${distance}米 (${(distance/1000).toFixed(2)}公里)`)
      return distance
    }
  } catch (error) {
    console.error('计算驾车距离失败:', error)
  }
  
  throw new Error('无法计算驾车距离')
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

// 获取地址坐标 (使用改进的验证逻辑)
async function getCoordinates(address: string, apiKey: string): Promise<string> {
  return await getCoordinatesWithValidation(address, apiKey)
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

// 去重交通枢纽函数
function deduplicateTransportHubs(hubs: Array<{name: string, address: string, type: string, coordinates?: string}>): Array<{name: string, address: string, type: string, coordinates?: string}> {
  console.log('开始去重交通枢纽...')
  
  // 创建标准化名称映射
  const standardizeHubName = (name: string): string => {
    // 移除常见的变体后缀和前缀
    let standardized = name
      .replace(/\s*\(.*?\)\s*/g, '') // 移除括号内容
      .replace(/高铁.*?站|.*?高铁站/g, '高铁站') // 标准化高铁站名称
      .replace(/国际机场.*|.*国际机场/g, '国际机场') // 标准化机场名称
      .replace(/客运.*站|.*客运站/g, '客运站') // 标准化客运站名称
      .replace(/汽车.*站|.*汽车站/g, '汽车站') // 标准化汽车站名称
      .trim()
    
    return standardized
  }
  
  // 按标准化名称和坐标去重
  const uniqueHubs = new Map<string, typeof hubs[0]>()
  
  for (const hub of hubs) {
    const standardName = standardizeHubName(hub.name)
    const key = `${standardName}_${hub.type}_${hub.coordinates || hub.address}`
    
    if (!uniqueHubs.has(key)) {
      // 保留原始名称中最短且最标准的版本
      const existingHub = uniqueHubs.get(key)
      if (!existingHub || hub.name.length < existingHub.name.length) {
        uniqueHubs.set(key, {
          ...hub,
          name: hub.name.includes('(') ? hub.name.split('(')[0].trim() : hub.name
        })
      }
    }
  }
  
  const result = Array.from(uniqueHubs.values())
  console.log(`去重完成: ${hubs.length} -> ${result.length}`)
  
  return result
}

// 改进获取地址坐标函数，增加多次尝试和验证
async function getCoordinatesWithValidation(address: string, apiKey: string): Promise<string> {
  const attempts = [
    address, // 原始地址
    address.replace(/\s*\(.*?\)\s*/g, ''), // 移除括号内容
    address.split('(')[0].trim(), // 只取括号前的部分
  ]
  
  for (const attempt of attempts) {
    try {
      const url = `https://restapi.amap.com/v3/geocode/geo?key=${apiKey}&address=${encodeURIComponent(attempt)}&output=json`
      const response = await fetch(url)
      const data = await response.json()
      
      console.log(`获取坐标尝试 "${attempt}":`, data)
      
      if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const geocode = data.geocodes[0]
        const coords = geocode.location
        
        // 验证坐标格式 (应该是 "longitude,latitude" 格式)
        if (coords && coords.includes(',')) {
          const [lng, lat] = coords.split(',').map(Number)
          if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            console.log(`成功获取有效坐标: ${coords}`)
            return coords
          }
        }
      }
    } catch (error) {
      console.error(`获取坐标失败 "${attempt}":`, error)
    }
    
    // 避免API调用过于频繁
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  throw new Error(`无法获取地址 ${address} 的有效坐标`)
}