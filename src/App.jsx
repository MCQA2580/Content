import React, { useState, useEffect } from 'react';
import APIParser from './api-parser';
import { searchSong } from './music-search';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [selectedSource, setSelectedSource] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});

  // 使用音乐搜索和合并功能
  const searchMusic = async (query) => {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      // 尝试从查询中提取歌手和歌曲名
      const parts = query.split(' ');
      let singer = '';
      let songName = '';
      
      if (parts.length > 1) {
        // 假设最后一个词是歌曲名，前面的是歌手
        songName = parts[parts.length - 1];
        singer = parts.slice(0, -1).join(' ');
      } else {
        // 如果只有一个词，同时作为歌手和歌曲名
        singer = query;
        songName = query;
      }
      
      // 使用音乐搜索和合并功能
      const mergedSong = await searchSong(singer, songName, '');
      
      if (mergedSong) {
        // 将合并后的歌曲转换为前端需要的格式
        const result = {
          id: mergedSong.sources[0].id,
          title: mergedSong.name,
          artist: mergedSong.singer,
          album: mergedSong.album,
          duration: mergedSong.duration,
          url: mergedSong.sources[0].url,
          sources: mergedSong.sources,
          score: mergedSong.score
        };
        setResults([result]);
      } else {
        // fallback到API解析器
        const parser = new APIParser();
        const apiResult = await parser.searchMusic(query);
        
        if (apiResult.success) {
          setResults(apiResult.data.results);
        } else {
          // fallback到本地音乐数据库
          const musicDatabase = [
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
            },
            {
              id: 6,
              title: '海阔天空',
              artist: 'Beyond',
              album: '海阔天空',
              duration: '5:26',
              url: 'https://example.com/music/6.mp3'
            },
            {
              id: 7,
              title: '青花瓷',
              artist: '周杰伦',
              album: '我很忙',
              duration: '3:59',
              url: 'https://example.com/music/7.mp3'
            },
            {
              id: 8,
              title: '小幸运',
              artist: '田馥甄',
              album: '我的少女时代 电影原声带',
              duration: '3:40',
              url: 'https://example.com/music/8.mp3'
            }
          ];
          
          const filteredResults = musicDatabase.filter(song => 
            song.title.toLowerCase().includes(query.toLowerCase()) || 
            song.artist.toLowerCase().includes(query.toLowerCase())
          );
          
          setResults(filteredResults);
        }
      }
    } catch (err) {
      setError('搜索失败，请稍后重试');
      console.error('搜索错误:', err);
      setResults([]);
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

  // 处理来源选择
  const handleSourceSelect = (songId, source) => {
    setSelectedSource(prev => ({
      ...prev,
      [songId]: source
    }));
  };

  // 使用API解析器实现音乐下载
  const handleDownload = async (song) => {
    try {
      // 获取选中的来源或默认使用第一个来源
      const selected = selectedSource[song.id] || song.sources?.[0] || song;
      
      // 从歌曲ID中提取平台信息
      const platformMatch = selected.id.match(/^(wy|qq|kg|xm)-/);
      const platform = platformMatch ? platformMatch[1] : 'wy';
      const songId = selected.id.replace(/^\w+-/, '');
      
      // 开始下载前设置进度
      setDownloadProgress(prev => ({
        ...prev,
        [song.id]: 0
      }));
      
      // 通过后端API获取音乐URL
      const response = await fetch(`http://localhost:5000/api/song/url/multi?id=${songId}&platform=${platform}`);
      const result = await response.json();
      
      if (result.success && result.url) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = result.url;
        link.download = `${song.title} - ${song.artist}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 模拟下载完成
        setTimeout(() => {
          setDownloadProgress(prev => ({
            ...prev,
            [song.id]: 100
          }));
          
          // 3秒后清除进度
          setTimeout(() => {
            setDownloadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[song.id];
              return newProgress;
            });
          }, 3000);
        }, 1000);
        
        alert(`开始下载: ${song.title} - ${song.artist}`);
      } else {
        console.error('获取下载链接失败:', result.error);
        alert(`无法获取下载链接: ${song.title} - ${song.artist}`);
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[song.id];
          return newProgress;
        });
      }
    } catch (err) {
      console.error('下载错误:', err);
      alert(`下载失败，请稍后重试: ${song.title} - ${song.artist}`);
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[song.id];
        return newProgress;
      });
    }
  };

  // 处理音乐预览
  const handlePreview = async (song) => {
    try {
      // 如果已经在播放当前歌曲，则停止
      if (currentSong?.id === song.id) {
        setCurrentSong(null);
        return;
      }
      
      // 获取选中的来源或默认使用第一个来源
      const selected = selectedSource[song.id] || song.sources?.[0] || song;
      
      // 从歌曲ID中提取平台信息
      const platformMatch = selected.id.match(/^(wy|qq|kg|xm)-/);
      const platform = platformMatch ? platformMatch[1] : 'wy';
      const songId = selected.id.replace(/^\w+-/, '');
      
      // 通过后端API获取音乐URL
      const response = await fetch(`http://localhost:5000/api/song/url/multi?id=${songId}&platform=${platform}`);
      const result = await response.json();
      
      if (result.success && result.url) {
        // 创建带真实URL的歌曲对象
        const songWithUrl = {
          ...song,
          url: result.url
        };
        setCurrentSong(songWithUrl);
      } else {
        console.error('获取预览链接失败:', result.error);
        alert('无法获取预览链接');
      }
    } catch (err) {
      console.error('预览错误:', err);
      alert('预览失败，请稍后重试');
    }
  };

  // 停止预览
  const handleStopPreview = () => {
    setCurrentSong(null);
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">音乐解析器</h1>
          <p className="header-subtitle">搜索、解析和下载您喜爱的音乐</p>
          <div className="header-features">
            <span className="feature-badge">网易云音乐</span>
            <span className="feature-badge">QQ音乐</span>
            <span className="feature-badge">酷狗音乐</span>
            <span className="feature-badge">虾米音乐</span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSearch} className="search-container">
        <div className="search-box">
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
        </div>
      </form>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="results-container">
        <h2 className="results-title">搜索结果</h2>
        {loading ? (
          <div className="loading-container">
            <div className="spinner-container">
              <span className="spinner"></span>
            </div>
            <p className="loading-text">正在从多个平台搜索...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((song) => (
            <div key={song.id} className="result-card">
              <div className="song-info">
                <h3 className="song-title">{song.title}</h3>
                <p className="song-artist">{song.artist}</p>
                <p className="song-album">{song.album} · {song.duration}</p>
                
                {/* 来源选择 */}
                {song.sources && song.sources.length > 1 && (
                  <div className="sources-selector">
                    <label>选择来源：</label>
                    <select 
                      className="source-select"
                      value={selectedSource[song.id]?.id || song.sources[0].id}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedSourceObj = song.sources.find(s => s.id === selectedId);
                        if (selectedSourceObj) {
                          handleSourceSelect(song.id, selectedSourceObj);
                        }
                      }}
                    >
                      {song.sources.map(source => (
                        <option key={source.id} value={source.id}>
                          {source.provider}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* 音频播放器 */}
                {currentSong?.id === song.id && (
                  <div className="audio-player">
                    <audio controls autoPlay className="preview-audio">
                      <source src={song.url} type="audio/mpeg" />
                      您的浏览器不支持音频播放
                    </audio>
                    <button 
                      className="stop-preview-btn"
                      onClick={handleStopPreview}
                    >
                      停止预览
                    </button>
                  </div>
                )}
              </div>
              
              <div className="action-buttons">
                <button 
                  className="btn btn-secondary"
                  onClick={() => handlePreview(song)}
                  disabled={loading}
                >
                  {currentSong?.id === song.id ? '停止预览' : '预览'}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleDownload(song)}
                  disabled={loading || downloadProgress[song.id] !== undefined}
                >
                  {downloadProgress[song.id] !== undefined ? (
                    <span className="download-progress">
                      {downloadProgress[song.id]}%
                    </span>
                  ) : '下载'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎵</div>
            <h3 className="empty-title">暂无结果</h3>
            <p className="empty-description">请输入歌曲名称或歌手进行搜索</p>
            <div className="empty-suggestions">
              <span className="suggestion-tag">起风了</span>
              <span className="suggestion-tag">追光者</span>
              <span className="suggestion-tag">光年之外</span>
              <span className="suggestion-tag">平凡之路</span>
            </div>
          </div>
        )}
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">© 2026 音乐解析器 | 仅用于学习和研究目的</p>
          <p className="footer-disclaimer">本网站仅解析和提供合法授权的音乐内容</p>
          <div className="footer-links">
            <a href="#" className="footer-link">关于我们</a>
            <a href="#" className="footer-link">使用条款</a>
            <a href="#" className="footer-link">隐私政策</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;