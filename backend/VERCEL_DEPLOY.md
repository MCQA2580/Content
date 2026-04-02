# 后端部署到 Vercel 指南

## ✅ 已完成的配置

1. **`backend/vercel.json`** - Vercel 部署配置
2. **后端代码已就绪** - 使用 `process.env.PORT`，兼容 Vercel

## 🚀 部署步骤

### 方法一：使用 Vercel Dashboard（推荐）

1. **将代码推送到 GitHub**
   ```bash
   git add .
   git commit -m "准备部署到 Vercel"
   git push
   ```

2. **访问 Vercel**
   - 打开：https://vercel.com
   - 使用 GitHub 账号登录

3. **导入项目**
   - 点击 "New Project"
   - 选择您的 GitHub 仓库
   - 点击 "Import"

4. **配置项目**
   - **Project Name**: `music-parser-backend`（或您喜欢的名字）
   - **Framework Preset**: `Other`
   - **Root Directory**: `backend`（重要！）
   - **Build Command**: 留空
   - **Output Directory**: 留空

5. **点击 "Deploy"**
   - 等待部署完成（约1-2分钟）
   - 部署成功后会获得一个 URL，例如：
     `https://music-parser-backend.vercel.app`

### 方法二：使用 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   cd backend
   vercel
   ```

4. **按照提示操作**
   - Set up and deploy? `Y`
   - Link to existing project? `N`
   - Project name: `music-parser-backend`
   - In which directory is your code located? `./`
   - Want to modify these settings? `N`

5. **部署到生产环境**
   ```bash
   vercel --prod
   ```

## 🔧 更新前端配置

部署成功后，更新 `src/config.js`：

```javascript
production: {
  apiBaseUrl: 'https://your-vercel-domain.vercel.app'
  // 替换为您的实际 Vercel 域名
}
```

## ✨ Vercel 的优势

- ✅ **完全免费**（免费额度足够个人使用）
- ✅ **自动 HTTPS**
- ✅ **全球 CDN**
- ✅ **自动扩展**
- ✅ **无需保活**（Vercel 自动管理）
- ✅ **自动部署**（推送代码自动更新）

## 📝 注意事项

1. **Vercel Serverless 函数有执行时间限制**（免费版最长 10 秒）
2. **首次调用可能有冷启动延迟**（约1-3秒）
3. **确保后端目录是 `backend/`**

## 🔍 测试部署

部署成功后，测试健康检查：

```
https://your-vercel-domain.vercel.app/api/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🆘 遇到问题？

- 查看 Vercel 部署日志：https://vercel.com/dashboard
- 检查函数日志：Vercel Dashboard → Functions
