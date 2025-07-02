import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteCalculationRequest {
  start_location: string;
  end_location: string;
  distance_km?: number;
}

interface RouteCalculationResponse {
  distance_km: number;
  estimated_duration_minutes: number;
  market_price_cny: number;
  our_price_cny: number;
  our_price_usdt: number;
  usdt_to_cny_rate: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { start_location, end_location, distance_km }: RouteCalculationRequest = await req.json()

    if (!start_location || !end_location) {
      return new Response(
        JSON.stringify({ error: '起点和终点不能为空' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 如果没有提供距离，估算距离（实际项目中应该调用高德地图API）
    const estimatedDistance = distance_km || estimateDistance(start_location, end_location)
    
    // 基于距离计算市场价格（简化的计算方式，实际应该调用高德地图API）
    const marketPrice = calculateMarketPrice(estimatedDistance)
    
    // 计算我们的价格（市场价的70%）
    const ourPrice = marketPrice * 0.7
    
    // 获取USDT/CNY汇率
    const usdtRate = await getUSDTToCNYRate()
    
    // 转换为USDT价格
    const ourPriceUSDT = ourPrice / usdtRate

    const response: RouteCalculationResponse = {
      distance_km: estimatedDistance,
      estimated_duration_minutes: Math.ceil(estimatedDistance * 2), // 假设每公里2分钟
      market_price_cny: marketPrice,
      our_price_cny: ourPrice,
      our_price_usdt: Math.round(ourPriceUSDT * 100) / 100, // 保留两位小数
      usdt_to_cny_rate: usdtRate
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Route calculation error:', error)
    return new Response(
      JSON.stringify({ error: '价格计算失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// 估算距离的简化函数（实际应该使用高德地图API）
function estimateDistance(start: string, end: string): number {
  // 基于地名的简单距离估算
  const routes: Record<string, Record<string, number>> = {
    '火车站': { '村里': 25.5, '机场': 15.0, '汽车站': 8.0 },
    '机场': { '村里': 32.0, '火车站': 15.0, '汽车站': 18.0 },
    '汽车站': { '村里': 18.0, '火车站': 8.0, '机场': 18.0 }
  }
  
  return routes[start]?.[end] || routes[end]?.[start] || 20.0 // 默认20公里
}

// 基于距离计算市场价格的简化函数（实际应该使用高德地图API）
function calculateMarketPrice(distance: number): number {
  // 简化的出租车计价规则：起步价12元（3公里），超出部分每公里2.5元
  const basePrice = 12
  const baseDiatance = 3
  const pricePerKm = 2.5
  
  if (distance <= baseDiatance) {
    return basePrice
  }
  
  return basePrice + (distance - baseDiatance) * pricePerKm
}

// 获取USDT/CNY汇率
async function getUSDTToCNYRate(): Promise<number> {
  try {
    // 使用CoinGecko API获取USDT价格
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=cny')
    const data = await response.json()
    
    return data.tether?.cny || 7.2 // 默认汇率
  } catch (error) {
    console.error('Failed to fetch USDT rate:', error)
    return 7.2 // 返回默认汇率
  }
}