# AI NPC 单人世界

AI NPC 对话系统 - 前后端分离项目

## 📋 项目简介

这是一个 AI NPC 对话系统项目，采用前后端分离架构：

- **后端**：Node.js + Express.js + MySQL
- **前端**：React + Vite

## 🚀 快速开始

### 方式一：一键启动（推荐）

在项目根目录运行：

```bash
npm run dev
```

这将同时启动前端和后端服务：

- 后端服务：http://localhost:8000
- 前端服务：http://localhost:3000

### 方式二：使用启动脚本

```bash
node start.js
```

### 方式三：分别启动

**启动后端**：

```bash
cd npc-backend
npm run dev
```

**启动前端**：

```bash
cd npc-frontend
npm run dev
```

## 📁 项目结构

```
npc-version/
├── npc-backend/          # 后端服务
│   ├── server.js        # 服务器入口
│   ├── routes/          # API 路由
│   ├── services/        # 业务逻辑
│   └── ...
├── npc-frontend/         # 前端应用
│   ├── src/             # 源代码
│   ├── index.html       # HTML 入口
│   └── ...
├── 产品文档/             # 产品文档
├── package.json         # 根目录配置（一键启动）
├── start.js             # 启动脚本
└── README.md            # 项目说明
```

## 📝 开发阶段

当前阶段：

- ✅ 阶段 0：项目准备（后端 + 前端初始化完成）
- ⏳ 阶段 1：创建 NPC API（下一步）

详细进度请查看：[开发进度.md](./开发进度.md)

## 🛠️ 技术栈

- **前端**：React 18 + Vite 5
- **后端**：Node.js + Express.js 5
- **数据库**：MySQL
- **构建工具**：Vite
- **开发工具**：Nodemon（后端热重载）

## 📚 相关文档

- [项目结构演进指南](./项目结构演进指南.md) - 开发结构演进说明
- [开发进度](./开发进度.md) - 开发进度记录
- [开发环境配置指南](./开发环境配置指南.md) - 环境配置说明
- [产品文档](./产品文档/) - 完整产品文档

## 📄 License

ISC
