const APIParser = require('./api-parser');

// 测试API解析器
async function testAPIParser() {
  console.log('开始测试API解析器...');
  
  const parser = new APIParser();
  
  // 测试1: 健康检查
  console.log('\n测试1: 健康检查');
  try {
    const result = await parser.healthCheck();
    console.log('健康检查结果:', result);
  } catch (error) {
    console.error('健康检查失败:', error);
  }
  
  // 测试2: 搜索音乐
  console.log('\n测试2: 搜索音乐');
  try {
    const result = await parser.searchMusic('起风了');
    console.log('搜索结果:', result);
  } catch (error) {
    console.error('搜索失败:', error);
  }
  
  // 测试3: 搜索音乐 - 空参数
  console.log('\n测试3: 搜索音乐 - 空参数');
  try {
    const result = await parser.searchMusic('');
    console.log('空参数结果:', result);
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 测试4: 获取音乐详情
  console.log('\n测试4: 获取音乐详情');
  try {
    const result = await parser.getSongDetail(1);
    console.log('音乐详情:', result);
  } catch (error) {
    console.error('获取详情失败:', error);
  }
  
  // 测试5: 获取音乐详情 - 无效ID
  console.log('\n测试5: 获取音乐详情 - 无效ID');
  try {
    const result = await parser.getSongDetail('abc');
    console.log('无效ID结果:', result);
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 测试6: 解析音乐
  console.log('\n测试6: 解析音乐');
  try {
    const result = await parser.parseMusic('https://example.com/music/1.mp3');
    console.log('解析结果:', result);
  } catch (error) {
    console.error('解析失败:', error);
  }
  
  // 测试7: 解析音乐 - 无效URL
  console.log('\n测试7: 解析音乐 - 无效URL');
  try {
    const result = await parser.parseMusic('invalid-url');
    console.log('无效URL结果:', result);
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 测试8: 批量请求
  console.log('\n测试8: 批量请求');
  try {
    const requests = [
      { method: 'GET', url: '/api/health' },
      { method: 'GET', url: '/api/search', params: { query: '起风了' } }
    ];
    const result = await parser.batchRequests(requests);
    console.log('批量请求结果:', result);
  } catch (error) {
    console.error('批量请求失败:', error);
  }
  
  // 测试9: 带认证的请求
  console.log('\n测试9: 带认证的请求');
  try {
    const config = { method: 'GET', url: '/api/health' };
    const result = await parser.authenticatedRequest(config, 'test-token');
    console.log('带认证请求结果:', result);
  } catch (error) {
    console.error('认证请求失败:', error);
  }
  
  // 测试10: 带认证的请求 - 无令牌
  console.log('\n测试10: 带认证的请求 - 无令牌');
  try {
    const config = { method: 'GET', url: '/api/health' };
    const result = await parser.authenticatedRequest(config, '');
    console.log('无令牌结果:', result);
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  console.log('\nAPI解析器测试完成！');
}

// 运行测试
testAPIParser();