// API 配置文件
// 根据环境选择不同的 API 地址

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

// 配置不同环境的 API 地址
const config = {
  // 本地开发环境
  development: {
    apiBaseUrl: 'http://localhost:5000'
  },
  // 生产环境 (使用 /_/backend 路由前缀)
  production: {
    apiBaseUrl: '/_/backend'
  }
};

// 根据当前环境选择配置
const currentConfig = isProduction ? config.production : config.development;

export const API_BASE_URL = currentConfig.apiBaseUrl;

export default {
  API_BASE_URL
};
