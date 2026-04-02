import React from 'react';

function BackendStatusIndicator({ 
  backendStatus, 
  lastHeartbeat, 
  activatingBackend, 
  onActivate 
}) {
  return (
    <div className="backend-status">
      <div className={`status-indicator ${backendStatus}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {backendStatus === 'checking' ? '检查中...' : 
           backendStatus === 'online' ? '后端在线' : '后端离线'}
        </span>
      </div>
      {lastHeartbeat && backendStatus === 'online' && (
        <div className="heartbeat-time">
          最后心跳: {lastHeartbeat}
        </div>
      )}
      {/* 激活后端按钮 */}
      {backendStatus !== 'online' && (
        <button 
          className="activate-backend-btn"
          onClick={onActivate}
          disabled={activatingBackend}
        >
          {activatingBackend ? (
            <span className="spinner-small"></span>
          ) : '激活后端'}
        </button>
      )}
    </div>
  );
}

export default BackendStatusIndicator;
