# 音乐解析器

一个功能完整的音乐解析网站，支持音乐搜索、解析和下载功能。

## 功能特点

- 🎵 音乐搜索功能
- 📥 音乐下载功能
- 🔊 音乐预览功能
- 📱 响应式设计，适配不同设备
- 🌐 前后端分离架构
- 🛡️ 错误处理和用户反馈机制
- ⚡ 性能优化

## 技术栈

### 前端
- React 18
- Vite
- Axios
- CSS3 (响应式设计)

### 后端
- Node.js
- Express
- Axios
- CORS

## 快速开始

### 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd backend
npm install
```

### 启动服务

```bash
# 启动前端开发服务器
npm run dev

# 启动后端服务器
cd backend
npm start
```

### 构建生产版本

```bash
# 构建前端
npm run build

# 后端无需构建，直接运行
```

## API 端点

### 后端API
- `GET /api/search?query=关键词` - 搜索音乐
- `GET /api/song/:id` - 获取歌曲详情
- `GET /api/parse?url=音乐URL` - 解析音乐
- `GET /api/health` - 健康检查

## 项目结构

```
music-parser/
├── src/                 # 前端源代码
│   ├── App.jsx          # 主应用组件
│   ├── main.jsx         # 应用入口
│   └── index.css        # 全局样式
├── backend/             # 后端代码
│   ├── index.js         # 后端主文件
│   └── package.json     # 后端依赖
├── index.html           # HTML入口
├── package.json         # 前端依赖
├── vite.config.js       # Vite配置
└── README.md            # 项目说明
```

## 注意事项

1. 本项目仅用于学习和研究目的
2. 仅解析和提供合法授权的音乐内容
3. 实际部署时需要配置真实的音乐资源接口
4. 请遵守相关法律法规，不要用于非法用途

## 浏览器兼容性

- Chrome >= 60
- Firefox >= 55
- Safari >= 12
- Edge >= 79

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！