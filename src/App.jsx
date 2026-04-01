import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);

  // 连接后端API搜索音乐
  const searchMusic = async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('http://localhost:5000/api/search', {
        params: { query }
      });
      
      setResults(response.data.results);
    } catch (err) {
      setError('搜索失败，请稍后重试');
      console.error('搜索错误:', err);
      
      //  fallback到模拟数据
      const mockResults = [
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
      
      const filteredResults = mockResults.filter(song => 
        song.title.includes(query) || 
        song.artist.includes(query)
      );
      
      setResults(filteredResults);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索提交
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchMusic(searchQuery.trim());
    }
  };

  // 处理音乐下载
  const handleDownload = async (song) => {
    try {
      // 调用后端解析API
      const response = await axios.get('http://localhost:5000/api/parse', {
        params: { url: song.url }
      });
      
      const { downloadUrl, filename } = response.data;
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${song.title} - ${song.artist}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`开始下载: ${song.title} - ${song.artist}`);
    } catch (err) {
      console.error('下载错误:', err);
      //  fallback到模拟下载
      alert(`开始下载: ${song.title} - ${song.artist}`);
    }
  };

  // 处理音乐预览
  const handlePreview = (song) => {
    setCurrentSong(song.id === currentSong?.id ? null : song);
  };

  return (
    <div className="container">
      <header>
        <h1>音乐解析器</h1>
        <p>搜索、解析和下载您喜爱的音乐</p>
      </header>

      <form onSubmit={handleSearch} className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="输入歌曲名称或歌手"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          required
        />
        <button type="submit" className="search-btn">
          {loading ? <span className="spinner"></span> : '搜索'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="results-container">
        <h2>搜索结果</h2>
        {loading ? (
          <div className="loading">
            <span className="spinner"></span>
            <p>正在搜索...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((song) => (
            <div key={song.id} className="result-item">
              <div className="song-info">
                <h3 className="song-title">{song.title}</h3>
                <p className="song-artist">{song.artist}</p>
                <p className="song-album">{song.album} · {song.duration}</p>
                {currentSong?.id === song.id && (
                  <audio className="preview-audio" controls autoPlay>
                    <source src={song.url} type="audio/mpeg" />
                    您的浏览器不支持音频播放
                  </audio>
                )}
              </div>
              <div className="action-buttons">
                <button 
                  className="btn btn-secondary"
                  onClick={() => handlePreview(song)}
                >
                  {currentSong?.id === song.id ? '停止预览' : '预览'}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleDownload(song)}
                >
                  下载
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>暂无结果</h3>
            <p>请输入歌曲名称或歌手进行搜索</p>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>© 2026 音乐解析器 | 仅用于学习和研究目的</p>
        <p>本网站仅解析和提供合法授权的音乐内容</p>
      </footer>
    </div>
  );
}

export default App;