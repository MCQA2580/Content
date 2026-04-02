// Vercel Serverless Function - URL 功能版（修复版）

const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');

module.exports = async (req, res) => {
  // CORS 响应头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, headers);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    console.log(`[请求] ${req.method} ${path}`);

    // 健康检查
    if (path === '/api/health' || path === '/_/backend/api/health') {
      res.writeHead(200, headers);
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        message: 'Vercel Serverless Function 工作正常!'
      }));
      return;
    }

    // 搜索音乐
    if (path === '/api/search' || path === '/_/backend/api/search') {
      const query = url.searchParams.get('query');
      console.log(`[搜索请求] 关键词: "${query}"`);
      
      if (!query) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供搜索关键词' }));
        return;
      }

      const result = await NeteaseCloudMusicApi.search({ 
        keywords: query,
        limit: 20
      });

      const songs = result.body.result?.songs?.map(song => ({
        id: song.id,
        name: song.name,
        artists: song.artists?.map(artist => artist.name) || [],
        album: song.album?.name || '',
        duration: song.duration || 0,
        cover: song.album?.picUrl || song.album?.blurPicUrl || '',
        platform: 'netease'
      })) || [];

      res.writeHead(200, headers);
      res.end(JSON.stringify({ songs }));
      return;
    }

    // 获取音乐URL - 尝试多种方法
    if (path === '/api/song/url' || path === '/_/backend/api/song/url') {
      const id = url.searchParams.get('id');
      console.log(`[获取URL请求] 歌曲ID: ${id}`);
      
      if (!id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供歌曲ID' }));
        return;
      }

      // 方法1: 不指定音质
      console.log('[方法1] 不指定音质');
      let result = await NeteaseCloudMusicApi.song_url({ id: id });
      let songUrl = result.body.data?.[0]?.url;
      
      // 方法2: 尝试标准音质
      if (!songUrl) {
        console.log('[方法2] 标准音质 br=128000');
        result = await NeteaseCloudMusicApi.song_url({ id: id, br: 128000 });
        songUrl = result.body.data?.[0]?.url;
      }
      
      // 方法3: 尝试高品质
      if (!songUrl) {
        console.log('[方法3] 高品质 br=320000');
        result = await NeteaseCloudMusicApi.song_url({ id: id, br: 320000 });
        songUrl = result.body.data?.[0]?.url;
      }
      
      // 方法4: 尝试无损音质
      if (!songUrl) {
        console.log('[方法4] 无损音质 br=999000');
        result = await NeteaseCloudMusicApi.song_url({ id: id, br: 999000 });
        songUrl = result.body.data?.[0]?.url;
      }

      console.log('[最终URL]', songUrl);

      if (songUrl) {
        res.writeHead(200, headers);
        res.end(JSON.stringify({ url: songUrl }));
      } else {
        res.writeHead(404, headers);
        res.end(JSON.stringify({ 
          error: '无法获取音乐URL',
          note: '这首歌可能需要登录或付费才能播放'
        }));
      }
      return;
    }

    // 获取歌词
    if (path === '/api/song/lyric' || path === '/_/backend/api/song/lyric') {
      const id = url.searchParams.get('id');
      console.log(`[获取歌词请求] 歌曲ID: ${id}`);
      
      if (!id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供歌曲ID' }));
        return;
      }

      const result = await NeteaseCloudMusicApi.lyric({ id: id });
      const lrc = result.body.lrc?.lyric;
      res.writeHead(200, headers);
      res.end(JSON.stringify({ lyric: lrc || '' }));
      return;
    }

    // 其他端点返回简单响应
    res.writeHead(200, headers);
    res.end(JSON.stringify({ 
      message: '功能开发中...',
      path: path,
      available: ['/api/health', '/api/search', '/api/song/url', '/api/song/lyric']
    }));

  } catch (error) {
    console.error('[API 错误]', error);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ 
      error: '服务器内部错误',
      message: error.message
    }));
  }
};
