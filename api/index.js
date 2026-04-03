// Vercel Serverless Function

const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');
const { search, getMusicUrl } = require('musicfree-api');

module.exports = async (req, res) => {
  // CORS 响应头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
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

        const songs = result.body.result?.songs?.map(song => {
          return {
            id: song.id,
            name: song.name,
            artists: song.artists?.map(artist => artist.name) || [],
            album: song.album?.name || '',
            duration: song.duration || 0,
            picId: song.album?.picId || '',
            platform: 'netease'
          };
        }) || [];

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
        console.log('[song_url] 开始获取URL, id:', id);
        
        let songUrl = null;
        let songInfo = null;
        
        // 第一步：获取歌曲信息（歌名和歌手）
        try {
          const detailResult = await NeteaseCloudMusicApi.song_detail({ ids: id });
          songInfo = detailResult.body.songs?.[0];
        } catch (e) {
          console.log('[song_url] 获取歌曲信息失败');
        }
        
        // 第二步：尝试网易云音乐，多个比特率
        const bitrates = [null, 320000, 192000, 128000];
        let result = null;
        
        for (let i = 0; i < bitrates.length; i++) {
          const br = bitrates[i];
          const options = { id: id };
          if (br) {
            options.br = br;
          }
          
          console.log(`[song_url] 尝试网易云比特率: ${br || '原音质'}`);
          result = await NeteaseCloudMusicApi.song_url(options);
          songUrl = result.body.data?.[0]?.url;
          
          if (songUrl) {
            console.log(`[song_url] 网易云成功获取URL (比特率: ${br || '原音质'}):`, songUrl);
            res.writeHead(200, headers);
            res.end(JSON.stringify({ url: songUrl, platform: '网易云音乐' }));
            return;
          }
        }
        
        // 第三步：如果网易云失败，尝试其他平台 fallback
        if (songInfo) {
          const songName = songInfo.name;
          const artistName = songInfo.ar?.[0]?.name || '';
          const searchQuery = `${songName} ${artistName}`.trim();
          console.log(`[song_url] 网易云失败，尝试其他平台搜索: "${searchQuery}"`);
          
          const otherPlatforms = ['qq', 'kg']; // 先试QQ音乐和酷狗
          
          for (const plat of otherPlatforms) {
            try {
              console.log(`[song_url] 尝试平台: ${plat}`);
              const searchResult = await search(plat, searchQuery, 1, 5);
              
              if (searchResult && searchResult.data && searchResult.data.length > 0) {
                const matchedSong = searchResult.data[0];
                console.log(`[song_url] 在 ${plat} 找到匹配歌曲:`, matchedSong.name);
                
                const urlResult = await getMusicUrl(plat, matchedSong.id);
                if (urlResult && urlResult.url) {
                  console.log(`[song_url] ${plat} 成功获取URL:`, urlResult.url);
                  const platformName = { 'qq': 'QQ音乐', 'kg': '酷狗音乐', 'xm': '虾米音乐' }[plat] || plat;
                  res.writeHead(200, headers);
                  res.end(JSON.stringify({ url: urlResult.url, platform: platformName }));
                  return;
                }
              }
            } catch (platError) {
              console.log(`[song_url] ${plat} 失败:`, platError.message);
            }
          }
        }
        
        // 所有平台都失败了
        console.log('[song_url] 所有平台都失败了，完整响应:', JSON.stringify(result?.body, null, 2));
        res.writeHead(404, headers);
        res.end(JSON.stringify({ 
          error: '无法获取音乐URL',
          note: '这首歌可能需要登录或付费才能播放'
        }));
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

    // 获取歌曲详情（包含封面）
    if (path === '/api/song/detail' || path === '/_/backend/api/song/detail') {
      const id = url.searchParams.get('id');
      
      if (!id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供歌曲ID' }));
        return;
      }

      try {
        const result = await NeteaseCloudMusicApi.song_detail({ ids: id });
        console.log('[song_detail] API返回:', JSON.stringify(result.body, null, 2));
        
        const song = result.body.songs?.[0];
        
        if (!song) {
          res.writeHead(404, headers);
          res.end(JSON.stringify({ error: '未找到歌曲' }));
          return;
        }

        console.log('[song_detail] 歌曲对象:', JSON.stringify(song, null, 2));
        console.log('[song_detail] song.al:', song.al);
        console.log('[song_detail] song.album:', song.album);

        // 获取封面 URL - 注意网易云API使用 al 而不是 album
        const coverUrl = song.al?.picUrl || song.al?.blurPicUrl || '';
        console.log('[song_detail] 封面URL:', coverUrl);

        res.writeHead(200, headers);
        res.end(JSON.stringify({ 
          cover: coverUrl,
          name: song.name,
          artists: song.ar?.map(a => a.name).join(', '),
          album: song.al?.name
        }));
        return;
      } catch (apiError) {
        console.error('[获取歌曲详情错误]', apiError);
        res.writeHead(500, headers);
        res.end(JSON.stringify({ 
          error: '获取歌曲详情失败'
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
