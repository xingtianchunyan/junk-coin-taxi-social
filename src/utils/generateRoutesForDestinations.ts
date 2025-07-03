import { supabase } from '@/integrations/supabase/client';

// 计算两个地址之间的距离（简化实现）
function calculateDistance(addr1: string, addr2: string): number {
  // 屏南县的三个村庄之间距离都在10公里以内
  if ((addr1.includes('四坪村') || addr1.includes('龙潭村') || addr1.includes('墘头村')) &&
      (addr2.includes('四坪村') || addr2.includes('龙潭村') || addr2.includes('墘头村'))) {
    return 5; // 假设都在5公里以内
  }
  return 50; // 其他地址之间距离较远
}

// 为距离较近的目的地创建聚类
function clusterDestinations(destinations: Array<{name: string, address: string}>) {
  const clusters: Array<Array<{name: string, address: string}>> = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < destinations.length; i++) {
    if (processed.has(i)) continue;
    
    const cluster = [destinations[i]];
    processed.add(i);
    
    // 查找距离在10公里内的其他目的地
    for (let j = i + 1; j < destinations.length; j++) {
      if (processed.has(j)) continue;
      
      const distance = calculateDistance(destinations[i].address, destinations[j].address);
      if (distance <= 10) {
        cluster.push(destinations[j]);
        processed.add(j);
      }
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}

// 为聚类创建中心点和代表名称
function createClusterCenter(cluster: Array<{name: string, address: string}>) {
  if (cluster.length === 1) {
    return cluster[0];
  }
  
  // 屏南县三个村庄的聚类处理
  if (cluster.some(dest => dest.address.includes('屏南县'))) {
    return {
      name: '屏南县村庄群',
      address: '福建省宁德市屏南县'
    };
  }
  
  // 默认使用第一个目的地作为代表
  return {
    name: `${cluster[0].name}等${cluster.length}个目的地`,
    address: cluster[0].address
  };
}

// 为所有预设目的地生成固定路线的工具函数
export async function generateRoutesForAllDestinations() {
  const destinations = [
    { name: 'DN黄山', address: '安徽省黄山市屯溪区屯光大道46号' },
    { name: '四坪村', address: '福建省宁德市屏南县四坪村' },
    { name: '龙潭村', address: '福建省宁德市屏南县龙潭村' },
    { name: '墘头村', address: '福建省宁德市屏南县墘头村' }
  ];

  // 对目的地进行聚类
  const clusters = clusterDestinations(destinations);
  console.log(`创建了 ${clusters.length} 个目的地聚类`);
  
  const results = [];
  
  for (const cluster of clusters) {
    const centerPoint = createClusterCenter(cluster);
    
    try {
      console.log(`正在为聚类中心 ${centerPoint.name} 生成路线...`);
      console.log(`包含目的地: ${cluster.map(d => d.name).join(', ')}`);
      
      const { data: result, error } = await supabase.functions.invoke('auto-generate-routes', {
        body: {
          destination_name: centerPoint.name,
          destination_address: centerPoint.address
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      results.push({
        destination: centerPoint.name,
        cluster_destinations: cluster.map(d => d.name),
        success: result.success,
        message: result.message,
        routes: result.routes || []
      });
      
      // 避免API调用过于频繁，每次调用间隔2秒
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`为聚类中心 ${centerPoint.name} 生成路线时出错:`, error);
      results.push({
        destination: centerPoint.name,
        cluster_destinations: cluster.map(d => d.name),
        success: false,
        message: `生成失败: ${error.message}`,
        routes: []
      });
    }
  }
  
  return results;
}