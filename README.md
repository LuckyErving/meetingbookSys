# MeetingBookSys Backend

Node.js + Express 后端服务，负责会议室预订系统的 API、业务逻辑、数据库交互。

## 目录结构建议
- backend/
  - db.sql                # 数据库初始化脚本
  - src/
    - app.js              # 入口文件
    - config/
      - db.js             # 数据库连接配置
    - models/             # 数据库模型
    - routes/             # 路由
    - controllers/        # 控制器
    - middlewares/        # 中间件
    - utils/              # 工具函数
    - services/           # 业务逻辑
  - package.json

## 启动
1. 安装依赖：npm install
2. 启动服务：npm start

---

# MeetingBookSys Frontend

基于 Vue3 + Electron + Element Plus 的桌面端前端项目，支持 Windows 7 x64 等老系统。

## 环境配置

项目支持通过环境变量配置后端 API 地址，便于不同环境部署：

### 环境变量文件
- `.env` - 生产环境配置
- `.env.development` - 开发环境配置
- `.env.production` - 正式生产环境配置

### 配置项说明
```bash
# 后端 API 基础地址
VITE_API_BASE_URL=http://192.168.1.100:3001

# 应用标题
VITE_APP_TITLE=会议室预订系统
```

### 部署注意事项
1. **开发环境**：使用 `.env.development`，API 地址为 `http://localhost:3001`
2. **生产环境**：修改 `.env` 或 `.env.production` 中的 `VITE_API_BASE_URL` 为实际后端服务器地址
3. **局域网部署**：将 IP 地址改为后端服务器的内网 IP，如 `http://192.168.1.100:3001`
4. **公网部署**：将 IP 地址改为公网域名或 IP，如 `http://your-domain.com:3001`

## 目录结构建议
- frontend/
  - src/
    - main.js             # Electron 主进程入口
    - renderer/           # Vue 前端代码
      - App.vue
      - main.js
      - components/
      - views/
      - router/
      - config/
        - api.js          # API 配置和工具函数
  - .env                  # 生产环境变量
  - .env.development      # 开发环境变量
  - .env.production       # 正式生产环境变量
  - package.json

## 启动和构建
1. 安装依赖：`npm install`
2. 开发模式：`npm run electron:dev`
3. 构建应用：`npm run electron:build`
4. 普通构建：`npm run build`

## Windows 7 支持
- 使用 Electron 19.1.9 版本，确保 Windows 7 兼容性
- 构建目标为 x64 架构，支持 64 位 Windows 7 系统
- 构建产物包含绿色版（win-unpacked）和安装包（.exe）

## API 配置管理
项目通过 `src/renderer/config/api.js` 统一管理 API 配置：
- `buildApiUrl(endpoint)` - 构建完整 API URL
- `getAuthHeaders()` - 获取认证头信息
- `API_ENDPOINTS` - API 端点常量定义

---

详细接口、功能模块、自动更新等后续分步开发。



# MeetingBookSys 开发指南

cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && npm run electron:dev

cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && npm run electron:build:mac

cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && npm run electron:build:win


cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && open dist/mac-arm64/meetingbooksys-frontend.app



"electron:build:mac": "npm run build && cp -r dist build_output && rm -rf build_output/mac-arm64 && ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm_config_registry=https://registry.npmmirror.com electron-builder --mac",

"electron:build:mac": "npm run build && cp -r dist build_output && rm -rf build_output/mac-arm64 && electron-builder --mac"

cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ && npm run electron:build:win



cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && rm -rf node_modules package-lock.json


### 强制构建
cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && rm -rf dist/win-* dist/*.exe dist/*.blockmap
cd /Users/ervin/Studio/zPlayground/meetingbookSys/frontend && export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ && npx electron-builder --win --x64



## TO-DO
- [x] 数据库 created_at 和 updated_at 时间不对，要改为北京时间
- [ ] 