const APIParser = require('./api-parser');

// 示例：使用API解析器
async function useAPIParser() {
  console.log('API解析器使用示例');
  
  // 创建解析器实例
  const parser = new APIParser()
    .setBaseURL('http://localhost:5000')
    .setTimeout(15000);
  
  console.log('\n1. 搜索音乐');
  const searchResult = await parser.searchMusic('起风了');
  if (searchResult.success) {
    console.log('搜索成功，找到', searchResult.data.results.length, '首歌曲');
    console.log('第一个结果:', searchResult.data.results[0]);
  } else {
    console.error('搜索失败:', searchResult.error.message);
  }
  
  console.log('\n2. 获取音乐详情');
  const detailResult = await parser.getSongDetail(1);
  if (detailResult.success) {
    console.log('获取详情成功:');
    console.log('歌曲标题:', detailResult.data.song.title);
    console.log('歌手:', detailResult.data.song.artist);
    console.log('专辑:', detailResult.data.song.album);
  } else {
    console.error('获取详情失败:', detailResult.error.message);
  }
  
  console.log('\n3. 解析音乐');
  const parseResult = await parser.parseMusic('https://example.com/music/1.mp3');
  if (parseResult.success) {
    console.log('解析成功:');
    console.log('下载链接:', parseResult.data.downloadUrl);
    console.log('文件名:', parseResult.data.filename);
  } else {
    console.error('解析失败:', parseResult.error.message);
  }
  
  console.log('\n4. 健康检查');
  const healthResult = await parser.healthCheck();
  if (healthResult.success) {
    console.log('服务健康状态:', healthResult.data.status);
    console.log('检查时间:', healthResult.data.timestamp);
  } else {
    console.error('健康检查失败:', healthResult.error.message);
  }
  
  console.log('\n5. 批量请求');
  const batchResult = await parser.batchRequests([
    { method: 'GET', url: '/api/health' },
    { method: 'GET', url: '/api/search', params: { query: '追光者' } }
  ]);
  if (batchResult.success) {
    console.log('批量请求成功，返回', batchResult.data.length, '个结果');
    console.log('第一个请求结果:', batchResult.data[0].data);
  } else {
    console.error('批量请求失败:', batchResult.error.message);
  }
  
  console.log('\nAPI解析器使用示例完成！');
}

// 运行示例
useAPIParser();