# 管理后台前端

**版本**：v1.0.0  
**创建时间**：2025-01-XX

---

## 📋 项目简介

这是 AI NPC 对话系统的管理后台前端应用，用于系统管理、数据统计、用户管理等。

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

服务启动后访问：http://localhost:3001

### 构建生产版本

```bash
npm run build
```

---

## 🔑 测试账号

- **用户 ID**：`admin`
- **密码**：`admin123`

---

## 📁 项目结构

```
admin-frontend/
├── src/
│   ├── api/              # API 适配层
│   │   ├── adapter.js   # 适配器接口定义
│   │   ├── mockAdapter.js # Mock 适配器
│   │   ├── httpAdapter.js # HTTP 适配器
│   │   └── index.js     # API 入口
│   ├── mocks/            # Mock 数据
│   │   └── data/
│   │       ├── users.js
│   │       ├── agents.js
│   │       └── statistics.js
│   ├── pages/            # 页面组件
│   │   ├── Login/        # 登录页
│   │   ├── Dashboard/    # 仪表盘
│   │   ├── Users/        # 用户管理
│   │   └── Agents/       # NPC 管理
│   ├── router/           # 路由配置
│   ├── App.jsx           # 根组件
│   └── main.jsx          # 入口文件
├── vite.config.js        # Vite 配置
└── package.json
```

---

## 🔌 API 适配层

管理后台使用与 C 端相同的 API 适配层设计：

- **Mock 适配器**：使用 Mock 数据，前端可以独立开发
- **HTTP 适配器**：调用真实后端 API
- **自动切换**：根据后端可用性自动选择适配器

### 环境变量

- `VITE_API_MODE`：`mock` | `http` | `auto`（默认 `auto`）
- `VITE_API_BASE_URL`：API 基础路径（默认 `http://localhost:8000`）

---

## 📝 功能列表

### 已实现

- ✅ 登录页面
- ✅ 仪表盘（数据概览）
- ✅ 用户管理（列表、搜索、禁用/启用、删除）
- ✅ NPC 管理（列表、搜索、删除）

### 待实现

- ⏳ 用户详情页
- ⏳ NPC 详情页
- ⏳ 数据统计图表
- ⏳ 系统配置

---

## 🎨 UI 组件库

使用 **Ant Design**，与 C 端保持一致。

---

## 📖 相关文档

- [多应用架构方案](../docs/多应用架构方案.md)
- [管理后台设计文档](../docs/管理后台设计文档.md)
