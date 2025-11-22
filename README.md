# AI NPC 单人世界

> **v1.0.0** | AI NPC 对话系统 - 前后端分离项目

---

## 📋 项目简介

这是一个 AI NPC 对话系统项目，采用前后端分离架构：

- **后端**：Node.js + Express.js + MySQL
- **前端**：React + Vite + Ant Design
- **部署**：Docker + Nginx

---

## 🚀 快速开始

### 开发环境

**前置要求**：
- Node.js v18+
- MySQL 8.0+
- npm 9+

**一键启动**：
```bash
npm run dev
```

这将同时启动前端和后端服务：
- 后端服务：http://localhost:8000
- 前端服务：http://localhost:3000

**分别启动**：
```bash
# 后端
cd npc-backend
npm install
npm run dev

# 前端（新终端）
cd npc-frontend
npm install
npm run dev
```

### 生产部署

详细部署指南请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)

**快速部署**：
```bash
# 1. 配置环境变量
cp env.example .env
nano .env  # 修改 DB_PASSWORD 和 API_KEY

# 2. 一键部署
chmod +x deploy.sh
./deploy.sh
```

---

## 📁 项目结构

```
agent-track-npc-version/
├── npc-backend/          # 后端服务
│   ├── server.js        # 服务器入口
│   ├── routes/          # API 路由
│   ├── services/        # 业务逻辑层
│   ├── repositories/    # 数据访问层
│   ├── middleware/     # 中间件
│   ├── utils/           # 工具函数
│   ├── config/          # 配置模块
│   ├── migrations/      # 数据库迁移
│   ├── scripts/         # 工具脚本
│   ├── tests/           # 测试文件
│   └── docs/            # 技术文档
├── npc-frontend/         # 前端应用
│   ├── src/             # 源代码
│   │   ├── api/         # API 接口层
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # 通用组件
│   │   ├── router/      # 路由配置
│   │   └── context/     # React Context
│   ├── tests/           # 测试文件
│   └── vite.config.js   # Vite 配置
├── nginx/                # Nginx 配置
├── scripts/              # 工具脚本
├── docker-compose.yml    # Docker 编排
├── start.js              # 一键启动脚本
└── DEPLOYMENT.md         # 部署指南
```

---

## 🛠️ 技术栈

- **前端**：React 18 + Vite 5 + Ant Design
- **后端**：Node.js + Express.js
- **数据库**：MySQL 8.0
- **部署**：Docker + Docker Compose + Nginx

---

## 📚 核心功能

- ✅ 用户认证（登录/注册）
- ✅ NPC 管理（创建、列表、详情）
- ✅ AI 对话（支持多 LLM 提供商）
- ✅ 对话历史（历史记录、会话列表）
- ✅ Markdown 渲染（代码高亮、表格等）
- ✅ 移动端自适应
- ✅ Docker 部署

---

## 📖 文档

### 项目文档
- **[部署指南](./DEPLOYMENT.md)** - 生产环境部署说明
- **[开发进度](./开发进度.md)** - 开发进度记录
- **[问题记录](./实现问题记录.md)** - 已解决问题记录

### 子项目文档
- **[后端 README](./npc-backend/README.md)** - 后端服务详细说明
- **[前端 README](./npc-frontend/README.md)** - 前端应用详细说明
- **[脚本工具 README](./scripts/README.md)** - 工具脚本使用说明

### 产品文档
- **[产品文档](./产品文档/)** - 完整产品文档
  - [v1.0 版本文档](./产品文档/v1/) - 当前版本功能文档
  - [v1.5 版本规划](./产品文档/v1.5/) - 下一版本功能规划

---

## 🔧 开发工具

### 脚本工具

项目提供了便捷的脚本工具（位于 `scripts/` 目录）：

```bash
# 健康检查
./scripts/check-health.sh

# 查看日志
./scripts/view-logs.sh

# 快速检查
./scripts/quick-check.sh
```

详细说明请查看：[scripts/README.md](./scripts/README.md)

---

## 📝 开发规范

- **代码架构**：遵循单一职责、依赖倒置原则
- **注释规范**：文件级 → 函数级 → 代码行级三层注释体系
- **命名规范**：函数用动词，类用名词，见名知意

详细规范请查看项目根目录的规范文档。

---

## 🐛 问题排查

### 常见问题

1. **刷新页面 404**：重新加载 Nginx 配置（见 [DEPLOYMENT.md](./DEPLOYMENT.md)）
2. **AI 无响应**：检查 API Key 配置和后端日志
3. **数据库连接失败**：检查 `.env` 中的数据库配置

更多问题请查看：[实现问题记录.md](./实现问题记录.md)

---

## 📄 License

ISC

---

## 🎯 项目状态

**当前版本**：v1.0.0 ✅  
**完成时间**：2025-11-22  
**状态**：生产环境运行中

---

**开始使用** 👉 [部署指南](./DEPLOYMENT.md)
