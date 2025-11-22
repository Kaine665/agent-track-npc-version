# NPC Backend - AI NPC 对话系统后端服务

> **v1.0.0** | Node.js + Express.js + MySQL 后端服务

---

## 📋 项目简介

这是 AI NPC 对话系统的后端服务，提供 RESTful API 接口，支持用户管理、NPC 管理、AI 对话和历史记录等功能。

---

## 🚀 快速开始

### 环境要求

- **Node.js**: v18+ 
- **MySQL**: 8.0+
- **npm**: 9+

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env` 文件（参考 `env.example`）：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=npc_world

# 服务器配置
PORT=8000
NODE_ENV=development

# OpenRouter API Key（必需）
OPENROUTER_API_KEY=sk-or-v1-...

# OpenRouter 可选配置
OPENROUTER_REFERER=https://github.com
OPENROUTER_TITLE=NPC Chat
```

### 初始化数据库

```bash
npm run db:init
```

### 启动服务

**开发模式**（自动重启）：
```bash
npm run dev
```

**生产模式**：
```bash
npm start
```

服务启动后访问：http://localhost:8000

---

## 📁 项目结构

```
npc-backend/
├── server.js              # 服务器入口文件
├── config/                # 配置模块
│   ├── config-loader.js   # 配置加载器（支持 YAML 和 .env）
│   ├── database.js        # 数据库连接配置
│   └── models.js          # LLM 模型配置
├── config.yaml            # YAML 配置文件（可选）
├── routes/                # API 路由
│   ├── agents.js          # NPC 管理路由
│   ├── users.js           # 用户管理路由
│   ├── messages.js        # 消息发送路由
│   ├── sessions.js        # 会话管理路由
│   └── history.js         # 历史记录路由
├── services/              # 业务逻辑层
│   ├── AgentService.js    # NPC 业务逻辑
│   ├── UserService.js     # 用户业务逻辑
│   ├── MessageService.js # 消息业务逻辑
│   ├── SessionService.js  # 会话业务逻辑
│   ├── EventService.js    # 事件业务逻辑
│   └── LLMService.js      # LLM 调用服务
├── repositories/          # 数据访问层
│   ├── AgentRepository.js # NPC 数据访问
│   ├── UserRepository.js  # 用户数据访问
│   ├── SessionRepository.js # 会话数据访问
│   └── EventRepository.js # 事件数据访问
├── middleware/           # 中间件
│   └── errorHandler.js    # 统一错误处理
├── utils/                # 工具函数
│   ├── logger.js         # 日志工具
│   └── validator.js      # 数据验证工具
├── migrations/           # 数据库迁移脚本
│   ├── 001_create_database.sql
│   └── 002_add_provider_to_agents.sql
├── scripts/              # 工具脚本
│   ├── init-database.js  # 数据库初始化
│   ├── test-api-simple.js # API 测试
│   └── test-repositories.js # Repository 测试
├── tests/                # 测试文件
│   ├── test-BE-008.js    # LLMService 测试
│   ├── test-BE-010.js    # 对话测试
│   ├── test-BE-011.js    # 历史接口测试
│   └── test-BE-013.js    # 错误处理测试
├── docs/                 # 文档
│   ├── DATABASE_SETUP.md # 数据库设置说明
│   ├── LLM_MODELS.md     # LLM 模型配置说明
│   └── MULTI_API_KEYS.md # 多 API Key 配置说明
└── package.json          # 项目配置
```

---

## 🛠️ 技术栈

- **运行时**: Node.js 18+
- **Web 框架**: Express.js 5.x
- **数据库**: MySQL 8.0+ (使用 mysql2)
- **配置管理**: dotenv + js-yaml
- **日志**: 自定义 logger
- **LLM 提供商**: OpenRouter（统一入口）

---

## 📚 核心功能

### 1. 用户管理
- ✅ 用户注册
- ✅ 用户登录
- ✅ JWT 认证（计划中）

### 2. NPC 管理
- ✅ 创建 NPC（支持预设模型和自定义模型）
- ✅ 获取 NPC 列表
- ✅ 获取 NPC 详情
- ✅ 编辑 NPC（计划中）
- ✅ 删除 NPC（计划中）

### 3. AI 对话
- ✅ 发送消息并获取 AI 回复
- ✅ 支持多轮对话（上下文管理）
- ✅ 支持多种 LLM 模型（通过 OpenRouter）

### 4. 会话管理
- ✅ 自动创建会话
- ✅ 获取用户会话列表
- ✅ 会话历史记录

### 5. 历史记录
- ✅ 获取对话历史
- ✅ 事件记录和查询

---

## 🔌 API 接口

### 基础信息

- **Base URL**: `http://localhost:8000/api/v1`
- **Content-Type**: `application/json`

### 主要接口

#### NPC 管理

- `POST /api/v1/agents` - 创建 NPC
- `GET /api/v1/agents` - 获取 NPC 列表
- `GET /api/v1/agents/:id` - 获取 NPC 详情

#### 消息发送

- `POST /api/v1/messages` - 发送消息并获取 AI 回复

#### 会话管理

- `GET /api/v1/sessions` - 获取用户会话列表

#### 历史记录

- `GET /api/v1/history` - 获取对话历史

#### 用户管理

- `POST /api/v1/users/register` - 用户注册
- `POST /api/v1/users/login` - 用户登录

详细 API 文档请查看：[产品文档/API设计](../产品文档/v1/04-API设计.md)

---

## 🧪 测试

### 运行测试

```bash
# LLMService 测试
npm run test:BE-008

# 对话测试（交互式）
npm run test:BE-010

# 历史接口测试
npm run test:BE-011

# 错误处理测试
npm run test:BE-013

# API 简单测试
npm run test:api

# Repository 测试
npm run test:repos
```

### 测试说明

- **test-BE-008**: 测试 LLMService 是否正常工作，需要配置 OpenRouter API Key
- **test-BE-010**: 交互式对话测试，可以测试完整的对话流程
- **test-BE-011**: 测试历史记录接口功能
- **test-BE-013**: 测试错误处理和日志系统

---

## ⚙️ 配置说明

### LLM 配置

**V1 版本统一使用 OpenRouter** 作为模型供应商，所有模型都通过 OpenRouter 调用。

#### 支持的模型列表

- `anthropic/claude-sonnet-4.5` - Claude Sonnet 4.5（推荐）
- `anthropic/claude-sonnet-4` - Claude Sonnet 4
- `anthropic/claude-3.7-sonnet` - Claude 3.7 Sonnet
- `google/gemini-3-pro-preview` - Gemini 3 Pro Preview
- `google/gemini-2.5-pro` - Gemini 2.5 Pro
- `openai/gpt-5` - GPT-5
- `openai/gpt-4.1` - GPT-4.1
- `tngtech/deepseek-r1t2-chimera:free` - DeepSeek R1 T2 Chimera（免费）

#### 获取 OpenRouter API Key

1. 访问 [OpenRouter.ai](https://openrouter.ai/)
2. 注册账号并登录
3. 在 Dashboard 中创建 API Key
4. 将 API Key 配置到环境变量 `OPENROUTER_API_KEY`

详细配置说明请查看：[docs/LLM_MODELS.md](./docs/LLM_MODELS.md)

### 数据库配置

数据库配置通过环境变量或 `config.yaml` 文件设置。

详细说明请查看：[docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)

---

## 📝 开发规范

### 代码架构

- **分层架构**: Routes → Services → Repositories → Database
- **单一职责**: 每个模块只负责一个功能
- **依赖注入**: 通过构造函数注入依赖
- **错误处理**: 统一错误处理中间件

### 命名规范

- **文件**: 使用 PascalCase（如 `UserService.js`）
- **函数**: 使用 camelCase（如 `getUserById`）
- **常量**: 使用 UPPER_SNAKE_CASE（如 `MAX_RETRY_COUNT`）

### 注释规范

遵循项目统一的三层注释体系：
- **文件级注释**: 说明文件职责和主要功能
- **函数级注释**: 说明函数功能、参数、返回值
- **代码行注释**: 说明复杂逻辑的设计意图

---

## 🐛 问题排查

### 常见问题

1. **数据库连接失败**
   - 检查 `.env` 中的数据库配置
   - 确保 MySQL 服务已启动
   - 检查数据库用户权限

2. **LLM API 调用失败**
   - 检查 `OPENROUTER_API_KEY` 是否正确配置
   - 检查网络连接（如在中国大陆可能需要代理）
   - 查看后端日志获取详细错误信息

3. **端口被占用**
   - 修改 `.env` 中的 `PORT` 配置
   - 或使用 `lsof -i :8000` 查找占用进程

### 查看日志

日志输出到控制台，包含：
- 请求日志（请求方法、路径、状态码）
- 错误日志（错误信息、堆栈跟踪）
- 业务日志（关键操作记录）

---

## 📖 相关文档

- [数据库设置说明](./docs/DATABASE_SETUP.md)
- [LLM 模型配置说明](./docs/LLM_MODELS.md)
- [多 API Key 配置说明](./docs/MULTI_API_KEYS.md)
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
