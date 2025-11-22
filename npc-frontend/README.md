# NPC Frontend - AI NPC 对话系统前端应用

> **v1.0.0** | React + Vite + Ant Design 前端应用

---

## 📋 项目简介

这是 AI NPC 对话系统的前端应用，使用 React 18 + Vite 5 构建，提供现代化的用户界面和交互体验。

---

## 🚀 快速开始

### 环境要求

- **Node.js**: v18+ 或更高版本
- **npm**: 9+ 或更高版本

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:8000
```

**注意**：Vite 要求环境变量必须以 `VITE_` 开头才能在前端代码中访问。

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

---

## 📁 项目结构

```
npc-frontend/
├── src/
│   ├── main.jsx              # React 应用入口文件
│   ├── App.jsx               # 根组件
│   ├── index.css             # 全局样式
│   ├── api/                  # API 接口层
│   │   ├── index.js          # API 统一入口
│   │   ├── adapter.js        # 适配器接口
│   │   ├── httpAdapter.js    # HTTP 适配器实现
│   │   ├── mockAdapter.js    # Mock 适配器实现
│   │   └── README.md         # API 使用说明
│   ├── components/           # 通用组件
│   │   ├── AgentCard/        # NPC 卡片组件
│   │   ├── MessageBubble/   # 消息气泡组件
│   │   ├── LoginModal/       # 登录弹窗组件
│   │   ├── Button/           # 按钮组件
│   │   ├── Card/             # 卡片组件
│   │   ├── Input/            # 输入框组件
│   │   └── Loading/          # 加载组件
│   ├── pages/                # 页面组件
│   │   ├── AgentList/        # NPC 列表页
│   │   ├── CreateAgent/      # 创建 NPC 页
│   │   ├── Chat/             # 对话页
│   │   ├── Register/         # 注册页
│   │   └── ApiTest/          # API 测试页
│   ├── context/              # React Context
│   │   └── AuthContext.jsx   # 用户认证上下文
│   ├── router/               # 路由配置
│   │   └── index.jsx         # 路由定义
│   └── mocks/                # Mock 数据
│       └── data/              # Mock 数据文件
├── tests/                    # 测试文件
│   └── test-antd.jsx         # Ant Design 测试组件
├── index.html                # HTML 入口文件
├── vite.config.js           # Vite 配置
├── package.json              # 项目配置
└── README.md                 # 项目说明
```

---

## 🛠️ 技术栈

- **框架**: React 18
- **构建工具**: Vite 5
- **UI 组件库**: Ant Design 5.x
- **路由**: React Router DOM 7.x
- **Markdown 渲染**: react-markdown + remark-gfm
- **代码高亮**: react-syntax-highlighter
- **开发语言**: JavaScript (JSX)

---

## 📚 核心功能

### 1. 用户认证
- ✅ 用户登录（弹窗形式）
- ✅ 用户注册
- ✅ 认证状态管理（Context）

### 2. NPC 管理
- ✅ NPC 列表展示（卡片形式）
- ✅ 创建 NPC（表单）
- ✅ NPC 详情查看

### 3. AI 对话
- ✅ 对话界面（消息列表）
- ✅ 发送消息
- ✅ 接收 AI 回复
- ✅ Markdown 渲染（支持代码高亮、表格等）
- ✅ 对话历史加载

### 4. 响应式设计
- ✅ 移动端自适应
- ✅ 桌面端优化

---

## 🎨 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 重定向到 `/agents` |
| `/agents` | NPC 列表页 | 显示所有 NPC 卡片 |
| `/agents/create` | 创建 NPC 页 | 创建新 NPC 的表单 |
| `/chat/:agentId` | 对话页 | 与指定 NPC 对话 |
| `/register` | 注册页 | 用户注册 |
| `/test` | API 测试页 | API 接口测试工具 |

---

## 🔌 API 集成

### API 适配器模式

前端使用适配器模式封装 API 调用，支持：
- **HTTP 适配器**: 真实 API 调用
- **Mock 适配器**: 开发时使用 Mock 数据

### API 使用示例

```javascript
import api from './api';

// 获取 NPC 列表
const agents = await api.agents.getList(userId);

// 创建 NPC
const newAgent = await api.agents.create({
  userId,
  name: 'AI 助手',
  type: 'special',
  model: 'anthropic/claude-sonnet-4.5',
  systemPrompt: '你是一位友好的 AI 助手'
});

// 发送消息
const response = await api.messages.send({
  userId,
  agentId,
  text: '你好'
});
```

详细 API 文档请查看：[src/api/README.md](./src/api/README.md)

---

## 🎨 组件说明

### 通用组件

- **AgentCard**: NPC 卡片组件，显示 NPC 基本信息
- **MessageBubble**: 消息气泡组件，支持用户和 AI 消息
- **LoginModal**: 登录弹窗组件
- **Button/Card/Input/Loading**: 基础 UI 组件

### 页面组件

- **AgentList**: NPC 列表页，展示所有 NPC
- **CreateAgent**: 创建 NPC 页，包含表单和验证
- **Chat**: 对话页，支持消息发送和接收
- **Register**: 注册页，用户注册表单

---

## 📝 开发规范

### 代码组织

- **组件化**: 每个功能模块独立组件
- **样式隔离**: 使用 CSS Modules
- **状态管理**: React Context + useState
- **路由管理**: React Router DOM

### 命名规范

- **组件文件**: PascalCase（如 `AgentCard.jsx`）
- **组件目录**: PascalCase（如 `AgentCard/`）
- **样式文件**: `ComponentName.module.css`
- **函数**: camelCase（如 `handleSubmit`）

### 注释规范

遵循项目统一的三层注释体系：
- **文件级注释**: 说明组件职责和主要功能
- **函数级注释**: 说明函数功能、参数、返回值
- **代码行注释**: 说明复杂逻辑的设计意图

---

## 🧪 测试

### Ant Design 测试

测试 Ant Design 组件是否正常安装和配置：

```bash
# 在路由中添加测试路由（临时）
# 访问 /test-antd 查看测试页面
```

测试文件位于：`tests/test-antd.jsx`

### API 测试

使用内置的 API 测试页面：
1. 启动开发服务器
2. 访问 `/test` 路由
3. 测试各个 API 接口

---

## 🐛 问题排查

### 常见问题

1. **API 请求失败**
   - 检查 `VITE_API_BASE_URL` 环境变量配置
   - 确保后端服务已启动
   - 检查浏览器控制台的错误信息

2. **样式不生效**
   - 检查 CSS Modules 导入是否正确
   - 检查样式文件路径
   - 清除浏览器缓存

3. **路由不工作**
   - 检查路由配置是否正确
   - 确保使用 `RouterProvider` 包裹应用
   - 检查路由路径拼写

4. **Markdown 渲染异常**
   - 检查 `react-markdown` 和插件是否正确安装
   - 检查代码高亮插件配置

---

## 📦 构建优化

### 生产构建

```bash
npm run build
```

构建优化包括：
- 代码压缩和混淆
- 资源优化（图片、CSS）
- Tree Shaking（移除未使用代码）
- 代码分割（按路由）

详细优化说明请查看：[BUILD_OPTIMIZATION.md](./BUILD_OPTIMIZATION.md)

### 性能优化

- **代码分割**: 按路由懒加载
- **图片优化**: 使用 WebP 格式
- **缓存策略**: 静态资源长期缓存
- **CDN 加速**: 生产环境使用 CDN

---

## 📖 相关文档

- [构建优化说明](./BUILD_OPTIMIZATION.md)
- [原型设计](./原型设计.md)
- [API 使用说明](./src/api/README.md)
- [产品文档](../产品文档/)
- [部署指南](../DEPLOYMENT.md)

---

## 📄 License

ISC

---

## 🎯 项目状态

**当前版本**: v1.0.0 ✅  
**完成时间**: 2025-11-22  
**状态**: 生产环境运行中

---

**开始使用** 👉 [快速开始](#-快速开始)
