// Vercel Serverless Function - 调试版

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
        console.log('[搜索失败] 缺少关键词');
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供搜索关键词' }));
        return;
      }

      try {
        console.log('[调用网易云API] 开始...');
        const result = await NeteaseCloudMusicApi.search({ 
          keywords: query,
          limit: 20
        });
        
        // 打印第一首歌的 album 对象，查看所有字段
        if (result.body.result?.songs?.[0]?.album) {
          console.log('[Album 对象字段]', Object.keys(result.body.result.songs[0].album));
          console.log('[Album 完整对象]', JSON.stringify(result.body.result.songs[0].album, null, 2));
        }

        const songs = result.body.result?.songs?.map(song => {
          // 根据 picId 构建封面 URL
          let coverUrl = '';
          if (song.album?.picId) {
            coverUrl = `https://p1.music.126.net/${song.album.picId}.jpg`;
          }
          
          return {
            id: song.id,
            name: song.name,
            artists: song.artists?.map(artist => artist.name) || [],
            album: song.album?.name || '',
            duration: song.duration || 0,
            cover: coverUrl,
            platform: 'netease'
          };
        }) || [];

        console.log(`[搜索成功] 返回 ${songs.length} 首歌曲`);
        console.log('[第一首歌]', songs[0]);
        res.writeHead(200, headers);
        res.end(JSON.stringify({ songs }));
        return;
      } catch (apiError) {
        console.error('[网易云API错误]', apiError);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ 
          error: '搜索失败，请稍后重试',
          details: apiError.message
        }));
        return;
      }
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

      try {
        console.log('[调用网易云API] song_url...');
        let result = await NeteaseCloudMusicApi.song_url({ id: id });
        let songUrl = result.body.data?.[0]?.url;
        
        if (!songUrl) {
          console.log('[尝试128kbps]');
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
          error: '获取URL失败',
          details: apiError.message
        }));
        return;
      }
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
          error: '获取歌词失败',
          details: apiError.message
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
      error: '服务器内部错误',
      message: error.message
    }));
  }
};
