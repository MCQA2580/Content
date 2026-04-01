const express = require('express');
const cors = require('cors');
const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi');
const { search, getMusicUrl } = require('musicfree-api');

const app = express();
const PORT = process.env.PORT || 5000;

// 启用CORS
app.use(cors());
app.use(express.json());

// 搜索音乐API
app.get('/api/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: '搜索关键词不能为空' });
  }
  
  try {
    const result = await NeteaseCloudMusicApi.search({
      keywords: query,
      type: 1, // 1: 单曲
      limit: 10
    });
    
    // 转换结果格式
    const results = result.body.result.songs.map(song => ({
      id: song.id,
      title: song.name,
      artist: song.artists.map(artist => artist.name).join('/'),
      album: song.album.name,
      duration: formatDuration(song.duration),
      url: `https://music.163.com/song?id=${song.id}`
    }));
    
    res.json({ results });
  } catch (error) {
    console.error('搜索错误:', error);
    res.status(500).json({ error: '搜索失败，请稍后重试' });
  }
});

// 获取音乐URL API
app.get('/api/song/url', async (req, res) => {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: '歌曲ID不能为空' });
  }
  
  try {
    const result = await NeteaseCloudMusicApi.song_url({
      id: id
    });
    
    if (result.body.data && result.body.data.length > 0) {
      const songUrl = result.body.data[0].url;
      if (songUrl) {
        res.json({ success: true, url: songUrl });
      } else {
        res.json({ success: false, error: '无法获取歌曲URL' });
      }
    } else {
      res.json({ success: false, error: '获取歌曲URL失败' });
    }
  } catch (error) {
    console.error('获取歌曲URL错误:', error);
    res.status(500).json({ error: '获取歌曲URL失败，请稍后重试' });
  }
});

// 获取歌词API
app.get('/api/song/lyric', async (req, res) => {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: '歌曲ID不能为空' });
  }
  
  try {
    const result = await NeteaseCloudMusicApi.lyric({
      id: id
    });
    
    if (result.body.lrc && result.body.lrc.lyric) {
      res.json({ success: true, lyric: result.body.lrc.lyric });
    } else {
      res.json({ success: false, error: '无法获取歌词' });
    }
  } catch (error) {
    console.error('获取歌词错误:', error);
    res.status(500).json({ error: '获取歌词失败，请稍后重试' });
  }
});

// 获取音乐详情API
app.get('/api/song/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await NeteaseCloudMusicApi.song_detail({
      ids: id
    });
    
    if (result.body.songs && result.body.songs.length > 0) {
      const song = result.body.songs[0];
      const songInfo = {
        id: song.id,
        title: song.name,
        artist: song.artists ? song.artists.map(artist => artist.name).join('/') : '未知歌手',
        album: song.album ? song.album.name : '未知专辑',
        duration: formatDuration(song.duration || 0),
        url: `https://music.163.com/song?id=${song.id}`,
        albumPic: song.album ? song.album.picUrl : null
      };
      
      res.json({ song: songInfo });
    } else {
      res.status(404).json({ error: '歌曲不存在' });
    }
  } catch (error) {
    console.error('获取详情错误:', error);
    res.status(500).json({ error: '获取详情失败，请稍后重试' });
  }
});

// 解析音乐API
app.get('/api/parse', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: '音乐URL不能为空' });
  }
  
  try {
    // 从URL中提取歌曲ID
    const match = url.match(/id=(\d+)/);
    if (match && match[1]) {
      const songId = match[1];
      const result = await NeteaseCloudMusicApi.song_url({
        id: songId
      });
      
      if (result.body.data && result.body.data.length > 0) {
        const songUrl = result.body.data[0].url;
        if (songUrl) {
          res.json({
            success: true,
            downloadUrl: songUrl,
            filename: 'music.mp3'
          });
        } else {
          res.json({
            success: false,
            error: '无法获取歌曲下载链接'
          });
        }
      } else {
        res.json({
          success: false,
          error: '解析失败'
        });
      }
    } else {
      res.json({
        success: false,
        error: '无效的音乐URL'
      });
    }
  } catch (error) {
    console.error('解析错误:', error);
    res.status(500).json({ error: '解析失败，请稍后重试' });
  }
});

// 多平台搜索API
app.get('/api/search/multi', async (req, res) => {
  const { query, platform } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: '搜索关键词不能为空' });
  }
  
  try {
    // 支持的平台
    const platforms = platform ? [platform] : ['wy', 'qq', 'kg', 'xm'];
    const results = [];
    
    // 并行搜索所有平台
    const searchPromises = platforms.map(async (plat) => {
      try {
        const searchResult = await search(plat, query, 1, 10);
        if (searchResult && searchResult.data) {
          const platformName = {
            'wy': '网易云音乐',
            'qq': 'QQ音乐',
            'kg': '酷狗音乐',
            'xm': '虾米音乐'
          }[plat] || plat;
          
          const platformResults = searchResult.data.map(item => ({
            id: `${plat}-${item.id}`,
            title: item.name,
            artist: item.artists ? item.artists.join('/') : item.artist,
            album: item.album,
            duration: formatDuration(item.duration || 0),
            url: item.url || `https://music.${plat === 'wy' ? '163' : plat === 'qq' ? 'qq' : plat === 'kg' ? 'kugou' : 'xiami'}.com/song?id=${item.id}`,
            provider: platformName,
            platform: plat
          }));
          
          results.push(...platformResults);
        }
      } catch (error) {
        console.error(`${plat}搜索错误:`, error);
      }
    });
    
    await Promise.all(searchPromises);
    
    res.json({ results });
  } catch (error) {
    console.error('多平台搜索错误:', error);
    res.status(500).json({ error: '搜索失败，请稍后重试' });
  }
});

// 多平台音乐URL获取API
app.get('/api/song/url/multi', async (req, res) => {
  const { id, platform } = req.query;
  
  if (!id || !platform) {
    return res.status(400).json({ error: '歌曲ID和平台不能为空' });
  }
  
  console.log(`获取歌曲URL: platform=${platform}, id=${id}`);
  
  try {
    // 尝试使用musicfree-api获取音乐URL
    const result = await getMusicUrl(platform, id);
    console.log('musicfree-api结果:', result);
    
    if (result && result.url) {
      res.json({ success: true, url: result.url });
    } else {
      // 如果musicfree-api失败，尝试使用网易云音乐API作为fallback
      console.log('musicfree-api失败，尝试使用网易云音乐API');
      if (platform === 'wy') {
        const neteaseResult = await NeteaseCloudMusicApi.song_url({
          id: id
        });
        
        console.log('网易云音乐API结果:', neteaseResult);
        
        if (neteaseResult.body.data && neteaseResult.body.data.length > 0) {
          const songUrl = neteaseResult.body.data[0].url;
          if (songUrl) {
            res.json({ success: true, url: songUrl });
          } else {
            res.json({ success: false, error: '无法获取歌曲URL' });
          }
        } else {
          res.json({ success: false, error: '获取歌曲URL失败' });
        }
      } else {
        res.json({ success: false, error: '无法获取歌曲URL' });
      }
    }
  } catch (error) {
    console.error('获取歌曲URL错误:', error);
    
    // 尝试使用网易云音乐API作为fallback
    if (platform === 'wy') {
      try {
        console.log('尝试使用网易云音乐API作为fallback');
        const neteaseResult = await NeteaseCloudMusicApi.song_url({
          id: id
        });
        
        console.log('网易云音乐API结果:', neteaseResult);
        
        if (neteaseResult.body.data && neteaseResult.body.data.length > 0) {
          const songUrl = neteaseResult.body.data[0].url;
          if (songUrl) {
            res.json({ success: true, url: songUrl });
          } else {
            res.json({ success: false, error: '无法获取歌曲URL' });
          }
        } else {
          res.json({ success: false, error: '获取歌曲URL失败' });
        }
      } catch (neteaseError) {
        console.error('网易云音乐API错误:', neteaseError);
        res.status(500).json({ error: '获取歌曲URL失败，请稍后重试' });
      }
    } else {
      res.status(500).json({ error: '获取歌曲URL失败，请稍后重试' });
    }
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 格式化时长
function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / 1000 / 60) % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API端点:');
  console.log('- 搜索音乐: GET /api/search?query=关键词');
  console.log('- 获取歌曲详情: GET /api/song/:id');
  console.log('- 获取歌曲URL: GET /api/song/url?id=歌曲ID');
  console.log('- 解析音乐: GET /api/parse?url=音乐URL');
  console.log('- 健康检查: GET /api/health');
});