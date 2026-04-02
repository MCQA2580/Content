import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

function CoverImage({ songId, title, artist }) {
  const [coverUrl, setCoverUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCover = async () => {
      if (!songId) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch(`${API_BASE_URL}/api/song/detail?id=${songId}`);
        
        if (!response.ok) {
          throw new Error('获取封面失败');
        }
        
        const result = await response.json();
        
        if (result && result.cover) {
          // 将 HTTP 转换为 HTTPS
          const httpsUrl = result.cover.replace(/^http:\/\//, 'https://');
          setCoverUrl(httpsUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('[封面] 获取失败:', err);
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
