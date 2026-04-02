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
  // 生产环境 (GitHub Pages)
  // 注意：GitHub Pages 不能托管后端，这里需要填写您实际部署的后端地址
  production: {
    apiBaseUrl: 'https://your-backend-domain.com' // 请替换为您的实际后端地址
  }
};

// 根据当前环境选择配置
const currentConfig = isProduction ? config.production : config.development;

export const API_BASE_URL = currentConfig.apiBaseUrl;

export default {
  API_BASE_URL
};
