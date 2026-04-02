// Vercel Serverless Function
// 这是一个代理函数，将请求转发到我们的后端逻辑

const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');
const { search, getMusicUrl } = require('musicfree-api');

// CORS 响应头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async (req, res) => {
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // 设置 CORS 头
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    console.log(`[请求] ${req.method} ${path}`);

    // 健康检查
    if (path === '/api/health' || path === '/_/backend/api/health') {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    // 搜索音乐
    if (path === '/api/search' || path === '/_/backend/api/search') {
      const query = url.searchParams.get('query');
      console.log(`[搜索请求] 关键词: "${query}"`);
      
      if (!query) {
        res.status(400).json({ error: '请提供搜索关键词' });
        return;
      }

      const result = await NeteaseCloudMusicApi.search({ 
        keywords: query,
        limit: 20
      });

      const songs = result.body.result?.songs?.map(song => ({
        id: song.id,
        name: song.name,
        artists: song.ar?.map(artist => artist.name) || [],
        album: song.al?.name || '',
        duration: song.dt || 0,
        cover: song.al?.picUrl || '',
        platform: 'netease'
      })) || [];

      res.json({ songs });
      return;
    }

    // 获取音乐URL
    if (path === '/api/song/url' || path === '/_/backend/api/song/url') {
      const id = url.searchParams.get('id');
      console.log(`[获取URL请求] 歌曲ID: ${id}`);
      
      if (!id) {
        res.status(400).json({ error: '请提供歌曲ID' });
        return;
      }

      const result = await NeteaseCloudMusicApi.song_url({ 
        id: id,
        br: 320000
      });

      const url = result.body.data?.[0]?.url;
      if (url) {
        res.json({ url });
      } else {
        res.status(404).json({ error: '无法获取音乐URL' });
      }
      return;
    }

    // 获取歌词
    if (path === '/api/song/lyric' || path === '/_/backend/api/song/lyric') {
      const id = url.searchParams.get('id');
      console.log(`[获取歌词请求] 歌曲ID: ${id}`);
      
      if (!id) {
        res.status(400).json({ error: '请提供歌曲ID' });
        return;
      }

      const result = await NeteaseCloudMusicApi.lyric({ id: id });
      const lrc = result.body.lrc?.lyric;
      res.json({ lyric: lrc || '' });
      return;
    }

    // 获取歌曲详情
    if (path.startsWith('/api/song/') || path.startsWith('/_/backend/api/song/')) {
      const id = path.split('/').pop();
      if (id && id !== 'url' && id !== 'lyric') {
        console.log(`[获取详情请求] 歌曲ID: ${id}`);
        
        const result = await NeteaseCloudMusicApi.song_detail({ ids: id });
        const song = result.body.songs?.[0];
        
        if (!song) {
          res.status(404).json({ error: '未找到歌曲' });
          return;
        }

        const formattedSong = {
          id: song.id,
          name: song.name,
          artists: song.ar?.map(artist => artist.name) || [],
          album: song.al?.name || '',
          duration: song.dt || 0,
          cover: song.al?.picUrl || '',
          platform: 'netease'
        };

        res.json({ song: formattedSong });
        return;
      }
    }

    // 解析音乐
    if (path === '/api/parse' || path === '/_/backend/api/parse') {
      const musicUrl = url.searchParams.get('url');
      console.log(`[解析请求] URL: ${musicUrl}`);
      
      if (!musicUrl) {
        res.status(400).json({ error: '请提供音乐URL' });
        return;
      }

      const result = await search({
        input: musicUrl,
        provider: 'netease'
      });

      if (result.length > 0) {
        const song = result[0];
        const urlResult = await getMusicUrl({
          id: song.id,
          provider: 'netease'
        });

        res.json({
          song: {
            id: song.id,
            name: song.title,
            artists: [song.artist] || [],
            album: song.album || '',
            duration: song.duration || 0,
            cover: song.artwork || '',
            url: urlResult.url,
            platform: 'netease'
          }
        });
      } else {
        res.status(404).json({ error: '未找到音乐' });
      }
      return;
    }

    // 多平台搜索
    if (path === '/api/search/multi' || path === '/_/backend/api/search/multi') {
      const query = url.searchParams.get('query');
      console.log(`[多平台搜索请求] 关键词: "${query}"`);
      
      if (!query) {
        res.status(400).json({ error: '请提供搜索关键词' });
        return;
      }

      const neteaseResult = await NeteaseCloudMusicApi.search({ 
        keywords: query,
        limit: 10
      });

      const neteaseSongs = neteaseResult.body.result?.songs?.map(song => ({
        id: song.id,
        name: song.name,
        artists: song.ar?.map(artist => artist.name) || [],
        album: song.al?.name || '',
        duration: song.dt || 0,
        cover: song.al?.picUrl || '',
        platform: 'netease'
      })) || [];

      let otherSongs = [];
      try {
        const otherResult = await search({
          input: query,
          provider: 'kugou'
        });
        otherSongs = otherResult.slice(0, 5).map(song => ({
          id: song.id,
          name: song.title,
          artists: [song.artist] || [],
          album: song.album || '',
          duration: song.duration || 0,
          cover: song.artwork || '',
          platform: 'kugou'
        }));
      } catch (e) {
        console.log('[musicfree-api] 酷狗搜索失败，跳过');
      }

      const allSongs = [...neteaseSongs, ...otherSongs];
      res.json({ songs: allSongs });
      return;
    }

    // 多平台URL
    if (path === '/api/song/url/multi' || path === '/_/backend/api/song/url/multi') {
      const id = url.searchParams.get('id');
      const platform = url.searchParams.get('platform') || 'netease';
      console.log(`[多平台URL请求] 歌曲ID: ${id}, 平台: ${platform}`);
      
      if (!id) {
        res.status(400).json({ error: '请提供歌曲ID' });
        return;
      }

      if (platform === 'netease') {
        const result = await NeteaseCloudMusicApi.song_url({ 
          id: id,
          br: 320000
        });

        const url = result.body.data?.[0]?.url;
        if (url) {
          res.json({ url });
        } else {
          res.status(404).json({ error: '无法获取音乐URL' });
        }
      } else {
        const urlResult = await getMusicUrl({
          id: id,
          provider: platform
        });
        res.json({ url: urlResult.url });
      }
      return;
    }

    // 404
    res.status(404).json({ error: 'API 端点不存在' });

  } catch (error) {
    console.error('[API 错误]', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
};
