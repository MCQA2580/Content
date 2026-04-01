const axios = require('axios');

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

  // 创建axios实例
  createAxiosInstance() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  // 通用请求方法
  async request(config) {
    const instance = this.createAxiosInstance();
    
    try {
      const response = await instance(config);
      return this.handleSuccess(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 处理成功响应
  handleSuccess(response) {
    return {
      success: true,
      data: response.data,
      status: response.status,
      statusText: response.statusText
    };
  }

  // 处理错误响应
  handleError(error) {
    if (error.response) {
      // 服务器返回错误状态码
      return {
        success: false,
        error: {
          code: error.response.status,
          message: error.response.data.error || '服务器错误',
          data: error.response.data
        },
        status: error.response.status
      };
    } else if (error.request) {
      // 请求已发送但没有收到响应
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
      // 请求配置错误
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

    return this.request({
      method: 'GET',
      url: '/api/search',
      params: { query: query.trim() }
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

    return this.request({
      method: 'GET',
      url: '/api/parse',
      params: { url: url.trim() }
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

module.exports = APIParser;