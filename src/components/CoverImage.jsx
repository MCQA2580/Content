import React, { useState, useEffect } from 'react';

function CoverImage({ songId, title, artist }) {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCover = async () => {
      console.log('[CoverImage] 开始获取封面, songId:', songId);
      
      if (!songId) {
        console.log('[CoverImage] songId 为空');
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        // 使用外部 API 获取封面
        const url = `https://api.qijieya.cn/meting/?type=song&id=${songId}`;
        console.log('[CoverImage] 请求URL:', url);
        
        const response = await fetch(url);
        console.log('[CoverImage] 响应状态:', response.status);
        
        if (!response.ok) {
          throw new Error(`获取封面失败: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('[CoverImage] API结果:', result);
        
        if (result && result[0] && result[0].pic) {
          console.log('[CoverImage] 封面URL:', result[0].pic);
          setCoverUrl(result[0].pic);
        } else {
          console.log('[CoverImage] 没有封面URL');
          setError(true);
        }
      } catch (err) {
        console.error('[CoverImage] 获取失败:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCover();
  }, [songId]);

  if (loading) {
    return (
      <div className="cover-placeholder">
        <div className="cover-spinner"></div>
      </div>
    );
  }

  if (error || !coverUrl) {
    return (
      <div className="cover-placeholder">
        <span className="cover-icon">🎵</span>
      </div>
    );
  }

  return (
    <img 
      src={coverUrl} 
      alt={`${title} - ${artist}`}
      className="cover-image"
      onError={() => setError(true)}
    />
  );
}

export default CoverImage;
