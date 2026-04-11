import React, { useState, useEffect } from 'react';
import APIParser from './api-parser';
import BackendStatusIndicator from './components/BackendStatusIndicator';
import CoverImage from './components/CoverImage';
import { API_BASE_URL } from './config';
import AIService from './ai-service';
import AIServiceConfig from './ai-config';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [currentSongUrl, setCurrentSongUrl] = useState(null);
  const [showCopyrightNotice, setShowCopyrightNotice] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [lyrics, setLyrics] = useState({});
  const [covers, setCovers] = useState({});
  const [songStatus, setSongStatus] = useState({}); // 存储每首歌的播放状态
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [activatingBackend, setActivatingBackend] = useState(false);
  const [aiService, setAiService] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState({}); // 存储AI生成的内容

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
    // 初始化AI服务
    const initializeAiService = () => {
      // 从本地存储获取AI API密钥（如果有的话）
      const savedApiKey = localStorage.getItem('ai_api_key');
      if (savedApiKey) {
        const aiSvc = new AIService(savedApiKey);
        setAiService(aiSvc);
        setAiEnabled(true);
        setAiApiKey(savedApiKey);
        console.log('AI服务已初始化');
      } else {
        console.log('未找到AI API密钥，AI功能不可用');
      }
    };

    // 立即检查一次
    checkBackendHealth();
    
    // 每30秒发送一次心跳，保持后端活跃
    const heartbeatInterval = setInterval(() => {
      checkBackendHealth();
    }, 30000);
    
    // 三秒后隐藏导航栏
    const hideNavbarTimeout = setTimeout(() => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.style.display = 'none';
      }
    }, 3000);
    
    // 初始化AI服务
    initializeAiService();
    
    // 清理函数
    return () => {
      clearInterval(heartbeatInterval);
      clearTimeout(hideNavbarTimeout);
    };
  }, []);

  // 检查歌曲播放状态
  const checkSongStatus = async (songId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/song/url?id=${songId}`);
      const result = await response.json();
      
      if (result && result.url) {
        return 'available'; // 可以直接播放
      } else if (result && result.error) {
        if (result.error.includes('登录') || result.error.includes('付费')) {
          return 'paywall'; // 需要付费或登录
        }
      }
      return 'maybe'; // 可能需要登录
    } catch (err) {
      console.error('[状态检查] 错误:', err);
      return 'maybe';
    }
  };

  // 搜索音乐
  const searchMusic = async (query) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSongStatus({});
    
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
        
        // 异步检查每首歌的状态
        const newStatus = {};
        for (const song of formattedResults) {
          newStatus[song.id] = 'checking';
        }
        setSongStatus(newStatus);
        
        // 并行检查状态，但不要阻塞 UI
        formattedResults.forEach(async (song) => {
          const status = await checkSongStatus(song.id);
          setSongStatus(prev => ({ ...prev, [song.id]: status }));
        });
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

  // AI服务相关函数
  // 保存AI API密钥
  const saveAIKey = (apiKey) => {
    if (apiKey) {
      localStorage.setItem('ai_api_key', apiKey);
      const aiSvc = new AIService(apiKey);
      setAiService(aiSvc);
      setAiEnabled(true);
      setAiApiKey(apiKey);
      alert('AI API密钥已保存，AI功能已启用');
    } else {
      localStorage.removeItem('ai_api_key');
      setAiService(null);
      setAiEnabled(false);
      setAiApiKey('');
      alert('AI API密钥已清除，AI功能已禁用');
    }
  };

  // 生成音乐描述
  const generateMusicDescription = async (song) => {
    if (!aiService || !aiEnabled) {
      alert('AI功能未启用，请先设置AI API密钥');
      return;
    }

    try {
      const result = await aiService.generateMusicDescription({
        name: song.name,
        artist: song.artist,
        album: song.album,
        duration: song.duration
      });

      if (result.success) {
        setAiSuggestions(prev => ({
          ...prev,
          [`${song.id}_description`]: result.description
        }));
        alert('音乐描述已生成');
      } else {
        alert('生成音乐描述失败: ' + result.error);
      }
    } catch (error) {
      console.error('生成音乐描述错误:', error);
      alert('生成音乐描述失败，请检查AI API密钥是否正确');
    }
  };

  // 翻译歌词
  const translateLyrics = async (songId, lyrics) => {
    if (!aiService || !aiEnabled) {
      alert('AI功能未启用，请先设置AI API密钥');
      return;
    }

    if (!lyrics) {
      alert('请先获取歌词');
      return;
    }

    try {
      const result = await aiService.translateLyrics(lyrics);

      if (result.success) {
        setAiSuggestions(prev => ({
          ...prev,
          [`${songId}_translated_lyrics`]: result.translatedLyrics
        }));
        alert('歌词翻译已完成');
      } else {
        alert('翻译歌词失败: ' + result.error);
      }
    } catch (error) {
      console.error('翻译歌词错误:', error);
      alert('翻译歌词失败，请检查AI API密钥是否正确');
    }
  };

  // 推荐相似歌曲
  const recommendSimilarSongs = async (song) => {
    if (!aiService || !aiEnabled) {
      alert('AI功能未启用，请先设置AI API密钥');
      return;
    }

    try {
      const result = await aiService.recommendSimilarSongs({
        name: song.name,
        artist: song.artist,
        album: song.album
      });

      if (result.success) {
        setAiSuggestions(prev => ({
          ...prev,
          [`${song.id}_recommendations`]: result.recommendations
        }));
        alert('相似歌曲推荐已生成');
      } else {
        alert('推荐相似歌曲失败: ' + result.error);
      }
    } catch (error) {
      console.error('推荐相似歌曲错误:', error);
      alert('推荐相似歌曲失败，请检查AI API密钥是否正确');
    }
  };

  // 分析歌曲情感
  const analyzeSongEmotion = async (song, lyrics) => {
    if (!aiService || !aiEnabled) {
      alert('AI功能未启用，请先设置AI API密钥');
      return;
    }

    try {
      const result = await aiService.analyzeSongEmotion({
        name: song.name,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        lyrics: lyrics || '无歌词信息'
      });

      if (result.success) {
        setAiSuggestions(prev => ({
          ...prev,
          [`${song.id}_emotion`]: result.emotion
        }));
        alert('歌曲情感分析已完成');
      } else {
        alert('分析歌曲情感失败: ' + result.error);
      }
    } catch (error) {
      console.error('分析歌曲情感错误:', error);
      alert('分析歌曲情感失败，请检查AI API密钥是否正确');
    }
  };

  // 使用API解析器实现音乐下载
  const handleDownload = async (song, bitrate = 320) => {
    try {
      // 开始下载前设置进度
      setDownloadProgress(prev => ({
        ...prev,
        [song.id]: 0
      }));
      
      // 计算音质标签
      const quality = bitrate === 999 ? '无损' : `${bitrate}k`;
      
      // 尝试外部 API
      console.log('[下载] 获取URL，歌曲ID:', song.id, '比特率:', bitrate);
      const response = await fetch(`https://api.qijieya.cn/meting/?type=song&id=${song.id}&br=${bitrate}`);
      const result = await response.json();
      
      console.log('[下载] API结果:', result);
      
      if (result && Array.isArray(result) && result[0] && result[0].url) {
        // 获取真实的音频 URL
        try {
          const audioResponse = await fetch(result[0].url);
          const audioBlob = await audioResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // 创建下载链接
          const link = document.createElement('a');
          link.href = audioUrl;
          link.download = `${song.title} - ${song.artist} (${quality}).mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // 释放 URL 对象
          setTimeout(() => {
            URL.revokeObjectURL(audioUrl);
          }, 1000);
          
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
        
        alert(`开始下载: ${song.title} - ${song.artist} (${quality})`);
        } catch (audioErr) {
          console.error('获取音频 URL 错误:', audioErr);
          alert('获取音频失败，请稍后重试');
          setDownloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[song.id];
            return newProgress;
          });
        }
      } else {
        // 外部 API 失败，尝试我们的后端
        try {
          const backupResponse = await fetch(`${API_BASE_URL}/api/song/url?id=${song.id}&br=${bitrate}`);
          const backupResult = await backupResponse.json();
          
          if (backupResult && backupResult.url) {
            // 将 HTTP 链接转换为 HTTPS
            const httpsUrl = backupResult.url.replace(/^http:/, 'https://');
            console.log('[下载] 转换后的URL:', httpsUrl);
            
            // 创建下载链接
            const link = document.createElement('a');
            link.href = httpsUrl;
            link.download = `${song.title} - ${song.artist} (${quality}).mp3`;
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
            
            alert(`开始下载: ${song.title} - ${song.artist} (${quality})`);
          } else {
            console.error('获取下载链接失败:', backupResult.error);
            alert(`无法获取下载链接: ${song.title} - ${song.artist}\n${backupResult.note || ''}`);
            setDownloadProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[song.id];
              return newProgress;
            });
          }
        } catch (backupErr) {
          console.error('备份下载错误:', backupErr);
          alert(`下载失败，请稍后重试: ${song.title} - ${song.artist}`);
          setDownloadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[song.id];
            return newProgress;
          });
        }
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
      
      // 尝试外部 API
      const url = `https://api.qijieya.cn/meting/?type=song&id=${songId}`;
      console.log('[歌词] 请求URL:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('[歌词] API结果:', result);
      
      if (result && result[0] && result[0].lrc) {
        // 获取歌词内容
        const lrcResponse = await fetch(result[0].lrc);
        const lrcText = await lrcResponse.text();
        console.log('[歌词] 歌词内容:', lrcText);
        setLyrics(prev => ({ ...prev, [songId]: lrcText }));
        return lrcText;
      } else {
        // 外部 API 失败，尝试我们的后端
        try {
          const backupResponse = await fetch(`${API_BASE_URL}/api/song/lyric?id=${songId}`);
          const backupResult = await backupResponse.json();
          
          console.log('[歌词] 备份API结果:', backupResult);
          
          if (backupResult && backupResult.lyric) {
            setLyrics(prev => ({
              ...prev,
              [songId]: backupResult.lyric
            }));
          }
        } catch (backupErr) {
          console.error('[歌词] 备份获取失败:', backupErr);
        }
      }
    } catch (err) {
      console.error('[歌词] 获取失败:', err);
      // 外部 API 失败，尝试我们的后端
      try {
        const backupResponse = await fetch(`${API_BASE_URL}/api/song/lyric?id=${songId}`);
        const backupResult = await backupResponse.json();
        
        if (backupResult && backupResult.lyric) {
          setLyrics(prev => ({
            ...prev,
            [songId]: backupResult.lyric
          }));
        }
      } catch (backupErr) {
        console.error('[歌词] 备份获取失败:', backupErr);
      }
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
      if (currentSongId === song.id) {
        setCurrentSongId(null);
        setCurrentSongUrl(null);
        return;
      }
      
      // 尝试外部 API
      console.log('[预览] 获取URL，歌曲ID:', song.id);
      const response = await fetch(`https://api.qijieya.cn/meting/?type=song&id=${song.id}`);
      const result = await response.json();
      
      console.log('[预览] API结果:', result);
      
      if (result && result[0] && result[0].url) {
        // 直接使用 API 返回的 URL
        setCurrentSongId(song.id);
        setCurrentSongUrl(result[0].url);
        
        // 获取歌词
        if (result[0].lrc) {
          try {
            const lrcResponse = await fetch(result[0].lrc);
            const lrcText = await lrcResponse.text();
            console.log('[歌词] 歌词内容:', lrcText);
            setLyrics(prev => ({
              ...prev,
              [song.id]: lrcText
            }));
          } catch (lrcErr) {
            console.error('获取歌词错误:', lrcErr);
          }
        }
      } else {
        // 外部 API 失败，尝试我们的后端
        try {
          const backupResponse = await fetch(`${API_BASE_URL}/api/song/url?id=${song.id}`);
          const backupResult = await backupResponse.json();
          
          if (backupResult && backupResult.url) {
            // 将 HTTP 链接转换为 HTTPS
            const httpsUrl = backupResult.url.replace(/^http:\/\//, 'https://');
            console.log('[预览] 转换后的URL:', httpsUrl);
            
            setCurrentSongId(song.id);
            setCurrentSongUrl(httpsUrl);
            
            // 获取歌词
            fetchLyrics(song.id);
          } else {
            console.error('获取预览链接失败:', backupResult.error);
            alert(`无法获取预览链接\n${backupResult.note || ''}`);
          }
        } catch (backupErr) {
          console.error('备份预览错误:', backupErr);
          alert('预览失败，请稍后重试');
        }
      }
    } catch (err) {
      console.error('预览错误:', err);
      alert('预览失败，请稍后重试');
    }
  };

  // 停止预览
  const handleStopPreview = () => {
    setCurrentSongId(null);
    setCurrentSongUrl(null);
  };

  return (
    <div className="app">
      {/* 版权公告弹窗 */}
      {showCopyrightNotice && (
        <div className="copyright-notice">
          <div className="copyright-content">
            <h3>重要说明</h3>
            <p>有些歌曲确实需要登录或付费才能播放，这是网易云音乐的版权限制，无法通过代码完全解决。</p>
            <p>我们已经尝试了多个比特率和多平台 fallback，能大幅提高获取成功的几率！</p>
            <button 
              className="copyright-close" 
              onClick={() => setShowCopyrightNotice(false)}
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 导航栏 */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <div className="navbar-brand">
              <h1 className="brand-title">音乐解析器</h1>
              <p className="brand-subtitle">搜索、解析和下载您喜爱的音乐</p>
            </div>
          </div>
          <div className="navbar-features">
            <span className="feature-badge">网易云音乐</span>
            <span className="feature-badge">QQ音乐</span>
            <span className="feature-badge">酷狗音乐</span>
            <span className="feature-badge">虾米音乐</span>
            <button 
              className="ai-settings-btn" 
              onClick={() => {
                const apiKey = prompt('请输入AI API密钥（支持OpenAI、Anthropic、Google Gemini等）:');
                if (apiKey !== null) {
                  saveAIKey(apiKey);
                }
              }}
            >
              AI设置
            </button>
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
                    {/* 左侧：封面、信息和操作按钮 */}
                    <div className="card-left">
                      {/* 歌曲封面 */}
                      <div className="card-cover">
                        <CoverImage songId={song.id} title={song.title} artist={song.artist} />
                      </div>
                      
                      {/* 歌曲信息 */}
                      <div className="card-info">
                        <div className="song-title-row">
                          <h4 className="song-title">{song.title}</h4>
                          <span className="song-status">
                            {songStatus[song.id] === 'checking' && <span className="status-checking">⏳</span>}
                            {songStatus[song.id] === 'available' && <span className="status-available">✅</span>}
                            {songStatus[song.id] === 'maybe' && <span className="status-maybe">⚠️</span>}
                            {songStatus[song.id] === 'paywall' && <span className="status-paywall">🔒</span>}
                          </span>
                        </div>
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
                          {currentSongId === song.id ? '停止' : '预览'}
                        </button>
                        <div className="download-options">
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleDownload(song, 999)}
                            disabled={loading || downloadProgress[song.id] !== undefined}
                            title="无损音质"
                          >
                            无损
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleDownload(song, 320)}
                            disabled={loading || downloadProgress[song.id] !== undefined}
                            title="高品质"
                          >
                            {downloadProgress[song.id] !== undefined ? (
                              <span className="download-progress">
                                {downloadProgress[song.id]}%
                              </span>
                            ) : '320k'}
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleDownload(song, 192)}
                            disabled={loading || downloadProgress[song.id] !== undefined}
                            title="中等品质"
                          >
                            192k
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleDownload(song, 128)}
                            disabled={loading || downloadProgress[song.id] !== undefined}
                            title="标准品质"
                          >
                            128k
                          </button>
                        </div>
                        
                        {/* AI功能按钮 */}
                        <div className="ai-options">
                          <button 
                            className="btn btn-secondary"
                            onClick={() => generateMusicDescription(song)}
                            disabled={loading}
                            title="生成音乐描述"
                          >
                            音乐描述
                          </button>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => translateLyrics(song.id, lyrics[song.id])}
                            disabled={loading}
                            title="翻译歌词"
                          >
                            翻译歌词
                          </button>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => recommendSimilarSongs(song)}
                            disabled={loading}
                            title="推荐相似歌曲"
                          >
                            相似推荐
                          </button>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => analyzeSongEmotion(song, lyrics[song.id])}
                            disabled={loading}
                            title="分析歌曲情感"
                          >
                            情感分析
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* 右侧：音频播放器 */}
                    {currentSongId === song.id && currentSongUrl && (
                      <div className="card-player">
                        <div className="player-content">
                          <audio controls autoPlay className="preview-audio">
                            <source src={currentSongUrl} type="audio/mpeg" />
                            您的浏览器不支持音频播放
                           </audio>
                        </div>
                        
                        {/* 歌词 */}
                        {lyrics[song.id] && (
                          <div className="player-lyrics">
                            <h5>歌词</h5>
                            <div className="lyrics-content">
                              {lyrics[song.id].split('\n').map((line, index) => (
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
          <div className="footer-status">
            <BackendStatusIndicator
              backendStatus={backendStatus}
              lastHeartbeat={lastHeartbeat}
              activatingBackend={activatingBackend}
              onActivate={activateBackend}
            />
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