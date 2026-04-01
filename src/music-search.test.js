import { searchSong, Providers } from './music-search';

// 测试音乐搜索功能
async function testSearchSong() {
  console.log('开始测试音乐搜索功能...');
  
  // 测试1: 正常搜索
  console.log('\n测试1: 正常搜索');
  try {
    const result = await searchSong('买辣椒也用券', '起风了', '');
    console.log('搜索结果:', result);
    if (result) {
      console.log('歌曲名称:', result.name);
      console.log('歌手:', result.singer);
      console.log('得分:', result.score);
      console.log('来源数量:', result.sources.length);
      console.log('来源:', result.sources);
    } else {
      console.log('未找到歌曲');
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 测试2: 排除某个提供者
  console.log('\n测试2: 排除某个提供者');
  try {
    const result = await searchSong('买辣椒也用券', '起风了', 'Provider1');
    console.log('搜索结果:', result);
    if (result) {
      console.log('歌曲名称:', result.name);
      console.log('歌手:', result.singer);
      console.log('来源数量:', result.sources.length);
      console.log('来源:', result.sources);
    } else {
      console.log('未找到歌曲');
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 测试3: 搜索不存在的歌曲
  console.log('\n测试3: 搜索不存在的歌曲');
  try {
    const result = await searchSong('未知歌手', '未知歌曲', '');
    console.log('搜索结果:', result);
    if (result) {
      console.log('歌曲名称:', result.name);
      console.log('歌手:', result.singer);
    } else {
      console.log('未找到歌曲');
    }
  } catch (error) {
    console.error('测试失败:', error);
  }
  
  // 测试4: 测试所有提供者
  console.log('\n测试4: 测试所有提供者');
  console.log('提供者数量:', Providers.length);
  Providers.forEach(provider => {
    console.log('提供者名称:', provider.name);
  });
  
  console.log('\n音乐搜索功能测试完成！');
}

// 运行测试
testSearchSong();