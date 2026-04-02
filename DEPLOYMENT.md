# 完整部署指南

## ✅ 已配置完成

### 1. 项目结构
```
Mizuki-Content/
├── src/                    # 前端代码
│   ├── App.jsx
│   ├── config.js           # API 配置
│   ├── components/
│   │   └── BackendStatusIndicator.jsx
│   └── ...
├── backend/                # 后端代码
│   ├── index.js           # 已支持 /_/backend 路由
│   ├── package.json
│   └── ...
├── vercel.json            # ✅ 根目录 Vercel 配置
└── package.json
```

### 2. 配置说明

#### 前端配置 (`src/config.js`)
- **开发环境**：`http://localhost:5000`
- **生产环境**：`/_/backend`（相对路径）

#### 后端配置 (`backend/index.js`)
- ✅ 使用 Express Router
- ✅ 同时支持两种路由：
  - `/api/*`（本地开发）
  - `/_/backend/api/*`（Vercel 部署）

#### Vercel 配置 (`vercel.json`)
- ✅ 前端：Vite 构建到 `dist/`
- ✅ 后端：Node.js 函数
- ✅ 路由：
  - `/_/backend/*` → 后端
  - `/*` → 前端

## 🚀 部署步骤

### 方法一：使用 Vercel Dashboard（推荐）

1. **将代码推送到 GitHub**
   ```bash
   git add .
   git commit -m "配置 Vercel 部署"
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
   - **Project Name**: `music-parser`（或您喜欢的名字）
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`（重要！不要改）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **点击 "Deploy"**
   - 等待部署完成（约2-3分钟）
   - 部署成功后会获得一个 URL

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
   vercel
   ```

4. **按照提示操作**
   - Set up and deploy? `Y`
   - Link to existing project? `N`
   - Project name: `music-parser`
   - In which directory is your code located? `./`
   - Want to modify these settings? `N`

5. **部署到生产环境**
   ```bash
   vercel --prod
   ```

## 🧪 测试部署

部署成功后，测试以下 URL：

1. **健康检查**
   ```
   https://your-domain.vercel.app/_/backend/api/health
   ```

   应该返回：
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

2. **前端页面**
   ```
   https://your-domain.vercel.app
   ```

   应该能看到音乐解析器首页

## ✨ Vercel 的优势

- ✅ **完全免费**（免费额度足够个人使用）
- ✅ **自动 HTTPS**
- ✅ **全球 CDN**
- ✅ **自动扩展**
- ✅ **无需保活**
- ✅ **前后端一起部署**
- ✅ **推送代码自动部署**

## 📝 注意事项

1. **确保根目录有 vercel.json**
2. **确保后端代码支持 /_/backend 路由前缀**（已完成）
3. **首次调用可能有冷启动延迟**（约1-3秒）

## 🆘 遇到问题？

- 查看 Vercel 部署日志：https://vercel.com/dashboard
- 检查函数日志：Vercel Dashboard → Functions
- 查看构建日志：Vercel Dashboard → Deployment
