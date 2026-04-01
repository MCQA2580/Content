class APIParser {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.timeout = 10000;
  }

  // 设置基础URL
  setBaseURL(url) {
    this.baseURL = url;
    return this;
  }

  // 设置超时时间
  setTimeout(timeout) {
    this.timeout = timeout;
    return this;
  }

  // 通用请求方法
  async request(config) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${config.url}`, {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...config.headers
        },
        signal: controller.signal,
        body: config.data ? JSON.stringify(config.data) : undefined
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      return this.handleSuccess(response, data);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 处理成功响应
  handleSuccess(response, data) {
    return {
      success: true,
      data: data,
      status: response.status,
      statusText: response.statusText
    };
  }

  // 处理错误响应
  handleError(error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: {
          code: 'TIMEOUT_ERROR',
          message: '请求超时，请稍后重试',
          data: null
        },
        status: 0
      };
    } else if (error instanceof TypeError) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: '网络连接失败，请检查网络设置',
          data: null
        },
        status: 0
      };
    } else {
      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error.message || '请求错误',
          data: null
        },
        status: 0
      };
    }
  }

  // 构建查询字符串
  buildQueryString(params) {
    if (!params) return '';
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, value);
    });
    return searchParams.toString();
  }

  // 搜索音乐
  async searchMusic(query) {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '搜索关键词不能为空',
          data: null
        },
        status: 400
      };
    }

    const queryString = this.buildQueryString({ query: query.trim() });
    return this.request({
      method: 'GET',
      url: `/api/search?${queryString}`
    });
  }

  // 获取音乐详情
  async getSongDetail(id) {
    if (!id || isNaN(parseInt(id))) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '歌曲ID必须是有效的数字',
          data: null
        },
        status: 400
      };
    }

    return this.request({
      method: 'GET',
      url: `/api/song/${parseInt(id)}`
    });
  }

  // 解析音乐
  async parseMusic(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '音乐URL不能为空',
          data: null
        },
        status: 400
      };
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: '音乐URL格式无效',
          data: null
        },
        status: 400
      };
    }

    const queryString = this.buildQueryString({ url: url.trim() });
    return this.request({
      method: 'GET',
      url: `/api/parse?${queryString}`
    });
  }

  // 健康检查
  async healthCheck() {
    return this.request({
      method: 'GET',
      url: '/api/health'
    });
  }

  // 批量请求
  async batchRequests(requests) {
    if (!Array.isArray(requests)) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '请求列表必须是数组',
          data: null
        },
        status: 400
      };
    }

    try {
      const responses = await Promise.all(
        requests.map(req => this.request(req))
      );
      return {
        success: true,
        data: responses,
        status: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 带认证的请求
  async authenticatedRequest(config, token) {
    if (!token) {
      return {
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: '认证令牌不能为空',
          data: null
        },
        status: 401
      };
    }

    const authenticatedConfig = {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      }
    };

    return this.request(authenticatedConfig);
  }
}

export default APIParser;