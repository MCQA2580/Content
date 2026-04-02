// Vercel Serverless Function - 完整版

const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');
const { search, getMusicUrl } = require('musicfree-api');

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

    // 获取歌曲详情
    if (path.startsWith('/api/song/') || path.startsWith('/_/backend/api/song/')) {
      const id = path.split('/').pop();
      if (id && id !== 'url' && id !== 'lyric') {
        console.log(`[获取详情请求] 歌曲ID: ${id}`);
        
        const result = await NeteaseCloudMusicApi.song_detail({ ids: id });
        const song = result.body.songs?.[0];
        
        if (!song) {
          res.writeHead(404, headers);
          res.end(JSON.stringify({ error: '未找到歌曲' }));
          return;
        }

        const formattedSong = {
          id: song.id,
          name: song.name,
          artists: song.artists?.map(artist => artist.name) || [],
          album: song.album?.name || '',
          duration: song.duration || 0,
          cover: song.album?.picUrl || song.album?.blurPicUrl || '',
          platform: 'netease'
        };

        res.writeHead(200, headers);
        res.end(JSON.stringify({ song: formattedSong }));
        return;
      }
    }

    // 解析音乐
    if (path === '/api/parse' || path === '/_/backend/api/parse') {
      const musicUrl = url.searchParams.get('url');
      console.log(`[解析请求] URL: ${musicUrl}`);
      
      if (!musicUrl) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供音乐URL' }));
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

        res.writeHead(200, headers);
        res.end(JSON.stringify({
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
        }));
      } else {
        res.writeHead(404, headers);
        res.end(JSON.stringify({ error: '未找到音乐' }));
      }
      return;
    }

    // 多平台搜索
    if (path === '/api/search/multi' || path === '/_/backend/api/search/multi') {
      const query = url.searchParams.get('query');
      console.log(`[多平台搜索请求] 关键词: "${query}"`);
      
      if (!query) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供搜索关键词' }));
        return;
      }

      const neteaseResult = await NeteaseCloudMusicApi.search({ 
        keywords: query,
        limit: 10
      });

      const neteaseSongs = neteaseResult.body.result?.songs?.map(song => ({
        id: song.id,
        name: song.name,
        artists: song.artists?.map(artist => artist.name) || [],
        album: song.album?.name || '',
        duration: song.duration || 0,
        cover: song.album?.picUrl || song.album?.blurPicUrl || '',
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
      res.writeHead(200, headers);
      res.end(JSON.stringify({ songs: allSongs }));
      return;
    }

    // 多平台URL
    if (path === '/api/song/url/multi' || path === '/_/backend/api/song/url/multi') {
      const id = url.searchParams.get('id');
      const platform = url.searchParams.get('platform') || 'netease';
      console.log(`[多平台URL请求] 歌曲ID: ${id}, 平台: ${platform}`);
      
      if (!id) {
        res.writeHead(400, headers);
        res.end(JSON.stringify({ error: '请提供歌曲ID' }));
        return;
      }

      if (platform === 'netease') {
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
          res.end(JSON.stringify({ error: '无法获取音乐URL' }));
        }
      } else {
        const urlResult = await getMusicUrl({
          id: id,
          provider: platform
        });
        res.writeHead(200, headers);
        res.end(JSON.stringify({ url: urlResult.url }));
      }
      return;
    }

    // 404
    res.writeHead(404, headers);
    res.end(JSON.stringify({ error: 'API 端点不存在' }));

  } catch (error) {
    console.error('[API 错误]', error);
    res.writeHead(500, headers);
    res.end(JSON.stringify({ 
      error: '服务器内部错误',
      message: error.message
    }));
  }
};
