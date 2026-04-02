// Vercel Serverless Function

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
      
      if (!query) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供搜索关键词' }));
        return;
      }

      try {
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
          cover: '', // 暂时不提供封面，需要更复杂的加密逻辑
          platform: 'netease'
        })) || [];

        res.writeHead(200, headers);
        res.end(JSON.stringify({ songs }));
        return;
      } catch (apiError) {
        console.error('[网易云API错误]', apiError);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ 
          error: '搜索失败，请稍后重试'
        }));
        return;
      }
    }

    // 获取音乐URL
    if (path === '/api/song/url' || path === '/_/backend/api/song/url') {
      const id = url.searchParams.get('id');
      
      if (!id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供歌曲ID' }));
        return;
      }

      try {
        let result = await NeteaseCloudMusicApi.song_url({ id: id });
        let songUrl = result.body.data?.[0]?.url;
        
        if (!songUrl) {
          result = await NeteaseCloudMusicApi.song_url({ id: id, br: 128000 });
          songUrl = result.body.data?.[0]?.url;
        }

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
      } catch (apiError) {
        console.error('[获取URL错误]', apiError);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ 
          error: '获取URL失败'
        }));
        return;
      }
    }

    // 获取歌词
    if (path === '/api/song/lyric' || path === '/_/backend/api/song/lyric') {
      const id = url.searchParams.get('id');
      
      if (!id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供歌曲ID' }));
        return;
      }

      try {
        const result = await NeteaseCloudMusicApi.lyric({ id: id });
        const lrc = result.body.lrc?.lyric;
        res.writeHead(200, headers);
        res.end(JSON.stringify({ lyric: lrc || '' }));
        return;
      } catch (apiError) {
        console.error('[获取歌词错误]', apiError);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ 
          error: '获取歌词失败'
        }));
        return;
      }
    }

    // 404
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: 'API 端点不存在' }));

  } catch (error) {
    console.error('[全局错误]', error);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ 
      error: '服务器内部错误'
    }));
  }
};
