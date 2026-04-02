# Cloudflare Workers 部署指南

## ⚠️ 重要提示

Cloudflare Workers **不能直接运行**原来的 Node.js Express 后端，因为：

1. Workers 不支持 Node.js 特定的 API
2. `NeteaseCloudMusicApi` 和 `musicfree-api` 依赖 Node.js 环境
3. 需要使用其他方式来实现音乐 API 功能

## 已创建的文件

- `worker/index.js` - Workers 后端基础结构
- `wrangler.toml` - Wrangler 配置文件

## 部署方案建议

### 方案一：分开部署（推荐）

1. **前端**：部署到 Cloudflare Workers / Pages
2. **后端**：部署到其他平台（Vercel, Railway, Render 等）

### 方案二：使用外部音乐 API

将音乐 API 调用改为使用外部 API 服务

## Workers 后端功能

当前 Workers 后端已实现：
- ✅ 健康检查 (`/api/health`)
- ✅ CORS 支持
- ⚠️ 其他 API 端点（需要配置实际音乐 API）

## 部署步骤

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
```

### 3. 本地预览

```bash
wrangler dev
```

### 4. 部署到生产环境

```bash
wrangler deploy
```

## 更新前端配置

部署 Workers 后端后，更新 `src/config.js` 中的生产环境地址：

```javascript
production: {
  apiBaseUrl: 'https://your-worker-name.your-subdomain.workers.dev'
}
```

## 保活机制

Cloudflare Workers 的优势：
- ✅ 无需手动保活
- ✅ 自动扩展
- ✅ 全球边缘节点
- ✅ 按使用量付费

## 更多信息

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
