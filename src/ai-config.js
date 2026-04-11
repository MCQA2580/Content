// AI服务配置
const AIServiceConfig = {
  // 默认AI服务提供商
  defaultProvider: 'openai', // 可选值: 'openai', 'anthropic', 'gemini', 'azure'

  // API端点配置
  endpoints: {
    openai: {
      baseURL: 'https://api.openai.com/v1',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
    },
    anthropic: {
      baseURL: 'https://api.anthropic.com/v1',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    },
    gemini: {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-pro', 'gemini-pro-vision']
    },
    azure: {
      baseURL: process.env.AZURE_OPENAI_ENDPOINT || '', // 从环境变量获取
      models: ['gpt-35-turbo', 'gpt-4']
    }
  },

  // 默认模型配置
  defaultModel: {
    'openai': 'gpt-3.5-turbo',
    'anthropic': 'claude-3-sonnet',
    'gemini': 'gemini-pro',
    'azure': 'gpt-35-turbo'
  },

  // 请求超时设置（毫秒）
  timeout: 30000,

  // 速率限制配置
  rateLimits: {
    maxRetries: 3,
    retryDelay: 1000 // 初始重试延迟（毫秒）
  }
};

export default AIServiceConfig;