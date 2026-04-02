// Vercel Serverless Function - URL 功能版（调试版）

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

    // 获取音乐URL
    if (path === '/api/song/url' || path === '/_/backend/api/song/url') {
      const id = url.searchParams.get('id');
      console.log(`[获取URL请求] 歌曲ID: ${id}`);
      
      if (!id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供歌曲ID' }));
        return;
      }

      console.log('[调用网易云API] song_url');
      const result = await NeteaseCloudMusicApi.song_url({ 
        id: id,
        br: 320000
      });

      console.log('[API响应]', JSON.stringify(result, null, 2));

      const songUrl = result.body.data?.[0]?.url;
      console.log('[提取URL]', songUrl);

      if (songUrl) {
        res.writeHead(200, headers);
        res.end(JSON.stringify({ url: songUrl }));
      } else {
        // 尝试更低音质
        console.log('[尝试更低音质] br=128000');
        const result2 = await NeteaseCloudMusicApi.song_url({ 
          id: id,
          br: 128000
        });
        const songUrl2 = result2.body.data?.[0]?.url;
        console.log('[低音质URL]', songUrl2);
        
        if (songUrl2) {
          res.writeHead(200, headers);
          res.end(JSON.stringify({ url: songUrl2 }));
        } else {
          res.writeHead(404, headers);
          res.end(JSON.stringify({ 
            error: '无法获取音乐URL',
            debug: {
              id: id,
              response: result.body
            }
          }));
        }
      }
      return;
    }

    // 其他端点返回简单响应
    res.writeHead(200, headers);
    res.end(JSON.stringify({ 
      message: '功能开发中...',
      path: path,
      available: ['/api/health', '/api/search', '/api/song/url']
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
