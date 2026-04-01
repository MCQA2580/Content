const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 启用CORS
app.use(cors());
app.use(express.json());

// 模拟音乐数据
const mockMusicData = [
  {
    id: 1,
    title: '起风了',
    artist: '买辣椒也用券',
    album: '起风了',
    duration: '4:11',
    url: 'https://example.com/music/1.mp3'
  },
  {
    id: 2,
    title: '追光者',
    artist: '岑宁儿',
    album: '夏至未至 电视剧原声带',
    duration: '3:55',
    url: 'https://example.com/music/2.mp3'
  },
  {
    id: 3,
    title: '光年之外',
    artist: '邓紫棋',
    album: '光年之外',
    duration: '3:58',
    url: 'https://example.com/music/3.mp3'
  },
  {
    id: 4,
    title: '平凡之路',
    artist: '朴树',
    album: '平凡之路',
    duration: '4:05',
    url: 'https://example.com/music/4.mp3'
  },
  {
    id: 5,
    title: '成都',
    artist: '赵雷',
    album: '成都',
    duration: '5:28',
    url: 'https://example.com/music/5.mp3'
  }
];

// 搜索音乐API
app.get('/api/search', (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: '搜索关键词不能为空' });
  }
  
  // 模拟搜索延迟
  setTimeout(() => {
    const results = mockMusicData.filter(song => 
      song.title.includes(query) || 
      song.artist.includes(query)
    );
    
    res.json({ results });
  }, 500);
});

// 获取音乐详情API
app.get('/api/song/:id', (req, res) => {
  const { id } = req.params;
  const song = mockMusicData.find(s => s.id === parseInt(id));
  
  if (!song) {
    return res.status(404).json({ error: '歌曲不存在' });
  }
  
  res.json({ song });
});

// 解析音乐API（模拟）
app.get('/api/parse', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: '音乐URL不能为空' });
  }
  
  // 模拟解析延迟
  setTimeout(() => {
    res.json({
      success: true,
      downloadUrl: url, // 实际项目中这里会返回解析后的真实下载链接
      filename: 'music.mp3'
    });
  }, 1000);
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('API端点:');
  console.log('- 搜索音乐: GET /api/search?query=关键词');
  console.log('- 获取歌曲详情: GET /api/song/:id');
  console.log('- 解析音乐: GET /api/parse?url=音乐URL');
  console.log('- 健康检查: GET /api/health');
});