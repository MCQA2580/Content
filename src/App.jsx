import React, { useState, useEffect } from 'react';
import APIParser from './api-parser';
import BackendStatusIndicator from './components/BackendStatusIndicator';
import CoverImage from './components/CoverImage';
import { API_BASE_URL } from './config';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [lyrics, setLyrics] = useState({});
  const [covers, setCovers] = useState({});
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [activatingBackend, setActivatingBackend] = useState(false);

  // 后端健康检查
  const checkBackendHealth = async () => {
    try {
      console.log('[健康检查] API_BASE_URL:', API_BASE_URL);
      const healthUrl = `${API_BASE_URL}/api/health`;
      console.log('[健康检查] 请求URL:', healthUrl);
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('[健康检查] 响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[健康检查] 响应数据:', data);
        setBackendStatus('online');
        setLastHeartbeat(new Date().toLocaleTimeString());
        return true;
      } else {
        console.error('[健康检查] 响应失败:', response.statusText);
        setBackendStatus('offline');
        return false;
      }
    } catch (error) {
      console.error('[健康检查] 错误:', error);
      console.error('[健康检查] 错误详情:', error.message);
      setBackendStatus('offline');
      return false;
    }
  };

  // 手动激活后端服务
  const activateBackend = async () => {
    console.log('激活按钮被点击');
    setActivatingBackend(true);
    setBackendStatus('checking');
    
    try {
      // 尝试多次连接
      for (let i = 0; i < 5; i++) {
        console.log(`尝试连接 (${i + 1}/5)...`);
        const success = await checkBackendHealth();
        if (success) {
          console.log('连接成功！');
          setActivatingBackend(false);
          return;
        }
        // 等待2秒后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.log('所有尝试都失败了');
      setActivatingBackend(false);
      alert('激活失败，请检查后端服务是否已启动');
    } catch (error) {
      console.error('激活后端服务失败:', error);
      setActivatingBackend(false);
      setBackendStatus('offline');
      alert('激活失败，请检查后端服务是否已启动');
    }
  };

  // 组件加载时启动健康检查和心跳机制
  useEffect(() => {
    // 立即检查一次
    checkBackendHealth();
    
    // 每30秒发送一次心跳，保持后端活跃
    const heartbeatInterval = setInterval(() => {
      checkBackendHealth();
    }, 30000);
    
    // 清理函数
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, []);

  // 搜索音乐
  const searchMusic = async (query) => {
    setLoading(true);
    setError(null);
    setResults([]);
    
    try {
      console.log('[搜索] 开始搜索:', query);
      
      const parser = new APIParser();
      const apiResult = await parser.searchMusic(query);
      
      console.log('[搜索] API 结果:', apiResult);
      
      if (apiResult.success && apiResult.data && apiResult.data.songs) {
        // 转换格式以匹配前端
        const formattedResults = apiResult.data.songs.map(song => ({
          id: song.id,
          title: song.name,
          artist: song.artists?.join(', ') || '',
          album: song.album || '',
          duration: song.duration ? Math.floor(song.duration / 1000) : 0,
          picId: song.picId || ''
        }));
        
        console.log('[搜索] 格式化结果:', formattedResults);
        console.log('[搜索] 第一首歌 picId:', formattedResults[0]?.picId);
        setResults(formattedResults);
      } else {
        setError('未找到结果');
        console.log('[搜索] 未找到结果');
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

  // 使用API解析器实现音乐下载
  const handleDownload = async (song) => {
    try {
      // 开始下载前设置进度
      setDownloadProgress(prev => ({
        ...prev,
        [song.id]: 0
      }));
      
      // 通过后端API获取音乐URL
      console.log('[下载] 获取URL，歌曲ID:', song.id);
      const response = await fetch(`${API_BASE_URL}/api/song/url?id=${song.id}`);
      const result = await response.json();
      
      console.log('[下载] API结果:', result);
      
      if (result && result.url) {
        // 将 HTTP 链接转换为 HTTPS
        const httpsUrl = result.url.replace(/^http:\/\//, 'https://');
        console.log('[下载] 转换后的URL:', httpsUrl);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.href = httpsUrl;
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
        alert(`无法获取下载链接: ${song.title} - ${song.artist}\n${result.note || ''}`);
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

  // 获取歌词
  const fetchLyrics = async (songId) => {
    try {
      console.log('[歌词] 获取歌词，歌曲ID:', songId);
      const response = await fetch(`${API_BASE_URL}/api/song/lyric?id=${songId}`);
      const result = await response.json();
      
      console.log('[歌词] API结果:', result);
      
      if (result && result.lyric) {
        setLyrics(prev => ({
          ...prev,
          [songId]: result.lyric
        }));
      }
    } catch (err) {
      console.error('获取歌词错误:', err);
    }
  };

  // 获取封面
  const fetchCover = async (songId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/song/${songId}`);
      const result = await response.json();
      
      if (result.song && result.song.albumPic) {
        setCovers(prev => ({
          ...prev,
          [songId]: result.song.albumPic
        }));
      }
    } catch (err) {
      console.error('获取封面错误:', err);
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
      
      // 通过后端API获取音乐URL
      console.log('[预览] 获取URL，歌曲ID:', song.id);
      const response = await fetch(`${API_BASE_URL}/api/song/url?id=${song.id}`);
      const result = await response.json();
      
      console.log('[预览] API结果:', result);
      
      if (result && result.url) {
        // 将 HTTP 链接转换为 HTTPS
        const httpsUrl = result.url.replace(/^http:\/\//, 'https://');
        console.log('[预览] 转换后的URL:', httpsUrl);
        
        // 创建带真实URL的歌曲对象
        const songWithUrl = {
          ...song,
          url: httpsUrl,
          songId: song.id
        };
        setCurrentSong(songWithUrl);
        
        // 获取歌词
        fetchLyrics(song.id);
      } else {
        console.error('获取预览链接失败:', result.error);
        alert(`无法获取预览链接\n${result.note || ''}`);
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
    <div className="app">
      {/* 导航栏 */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <div className="navbar-brand">
              <h1 className="brand-title">音乐解析器</h1>
              <p className="brand-subtitle">搜索、解析和下载您喜爱的音乐</p>
            </div>
            {/* 后端状态指示器 */}
            <BackendStatusIndicator
              backendStatus={backendStatus}
              lastHeartbeat={lastHeartbeat}
              activatingBackend={activatingBackend}
              onActivate={activateBackend}
            />
          </div>
          <div className="navbar-features">
            <span className="feature-badge">网易云音乐</span>
            <span className="feature-badge">QQ音乐</span>
            <span className="feature-badge">酷狗音乐</span>
            <span className="feature-badge">虾米音乐</span>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="hero">
        <div className="hero-container">
          <h2 className="hero-title">发现您喜爱的音乐</h2>
          <p className="hero-subtitle">从多个平台搜索并下载高品质音乐</p>
          <form onSubmit={handleSearch} className="hero-search">
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
          <div className="hero-suggestions">
            <span className="suggestion-tag">起风了</span>
            <span className="suggestion-tag">追光者</span>
            <span className="suggestion-tag">光年之外</span>
            <span className="suggestion-tag">平凡之路</span>
          </div>
        </div>
      </section>

      {/* 主内容区 */}
      <main className="main">
        <div className="main-container">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* 搜索结果 */}
          <section className="results-section">
            <h3 className="section-title">搜索结果</h3>
            {loading ? (
              <div className="loading-container">
                <div className="spinner-container">
                  <span className="spinner"></span>
                </div>
                <p className="loading-text">正在从多个平台搜索...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="results-grid">
                {results.map((song) => (
                  <div key={song.id} className="result-card">
                    {/* 歌曲封面 */}
                    <div className="card-cover">
                      <CoverImage songId={song.id} title={song.title} artist={song.artist} />
                    </div>
                    
                    {/* 歌曲信息 */}
                    <div className="card-info">
                      <h4 className="song-title">{song.title}</h4>
                      <p className="song-artist">{song.artist}</p>
                      <p className="song-album">{song.album} · {typeof song.duration === 'number' ? `${Math.floor(song.duration / 60)}:${String(song.duration % 60).padStart(2, '0')}` : song.duration}</p>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="card-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handlePreview(song)}
                        disabled={loading}
                      >
                        {currentSong?.id === song.id ? '停止' : '预览'}
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
                    
                    {/* 音频播放器 */}
                    {currentSong?.id === song.id && (
                      <div className="card-player">
                        <div className="player-content">
                          <audio controls autoPlay className="preview-audio">
                            <source src={currentSong.url} type="audio/mpeg" />
                            您的浏览器不支持音频播放
                          </audio>
                        </div>
                        
                        {/* 歌词 */}
                        {lyrics[currentSong.songId] && (
                          <div className="player-lyrics">
                            <h5>歌词</h5>
                            <div className="lyrics-content">
                              {lyrics[currentSong.songId].split('\n').map((line, index) => (
                                <div key={index} className="lyric-line">
                                  {line}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎵</div>
                <h3 className="empty-title">暂无结果</h3>
                <p className="empty-description">请输入歌曲名称或歌手进行搜索</p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-info">
            <h3 className="footer-title">音乐解析器</h3>
            <p className="footer-description">搜索、解析和下载您喜爱的音乐</p>
          </div>
          <div className="footer-links">
            <a href="https://github.com/MCQA2580/Content" target="_blank" rel="noopener noreferrer" className="footer-link">开源项目</a>
          </div>
          <div className="footer-disclaimer">
            <p>© 2026 音乐解析器 | 仅用于学习和研究目的</p>
            <p>本网站仅解析和提供合法授权的音乐内容</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;