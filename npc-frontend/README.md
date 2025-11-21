# NPC Frontend

AI NPC 单人世界 - 前端应用

## 📋 项目简介

这是 AI NPC 单人世界项目的前端应用，使用 React + Vite 构建。

## 🚀 快速开始

### 环境要求

- Node.js v18+ 或更高版本
- npm 9+ 或更高版本

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后访问：http://localhost:3000

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

## 📁 项目结构

```
npc-frontend/
├── src/
│   ├── main.jsx         # React 入口文件
│   ├── App.jsx          # 根组件
│   └── index.css        # 全局样式
├── index.html           # HTML 入口
├── vite.config.js       # Vite 配置
├── package.json         # 项目配置
└── README.md           # 项目说明
```

## ⚙️ 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
VITE_API_BASE_URL=http://localhost:8000
```

**注意**：Vite 要求环境变量必须以 `VITE_` 开头才能在前端代码中访问。

## 🔗 相关文档

- [项目结构演进指南](../项目结构演进指南.md)
- [开发进度](../开发进度.md)
- [产品文档](../产品文档/)

## 📝 开发阶段

当前阶段：**阶段 7 - 前端项目初始化** ✅

下一步：阶段 8 - 基础框架和组件库

## 🛠️ 技术栈

- **框架**：React 18
- **构建工具**：Vite 5
- **开发语言**：JavaScript (JSX)

## 📄 License

ISC

