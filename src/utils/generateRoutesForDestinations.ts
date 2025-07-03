import { supabase } from '@/integrations/supabase/client';

// 为所有预设目的地生成固定路线的工具函数
export async function generateRoutesForAllDestinations() {
  const destinations = [
    { name: 'DN黄山', address: '安徽省黄山市屯溪区屯光大道46号' },
    { name: '四坪村', address: '福建省宁德市屏南县四坪村' },
    { name: '龙潭村', address: '福建省宁德市屏南县龙潭村' },
    { name: '墘头村', address: '福建省宁德市屏南县墘头村' }
  ];

  const results = [];
  
  for (const destination of destinations) {
    try {
      console.log(`正在为 ${destination.name} 生成路线...`);
      
      const { data: result, error } = await supabase.functions.invoke('auto-generate-routes', {
        body: {
          destination_name: destination.name,
          destination_address: destination.address,
          gaode_api_key: true // 指示使用真实API
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      results.push({
        destination: destination.name,
        success: result.success,
        message: result.message,
        routes: result.routes || []
      });
      
      // 避免API调用过于频繁，每次调用间隔2秒
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`为 ${destination.name} 生成路线时出错:`, error);
      results.push({
        destination: destination.name,
        success: false,
        message: `生成失败: ${error.message}`,
        routes: []
      });
    }
  }
  
  return results;
}