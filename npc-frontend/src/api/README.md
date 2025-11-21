# 前端 API 层接口文档

**文档版本**：v1.0  
**创建时间**：2025-11-21  
**相关文档**：[后端 API 设计](../../产品文档/04-API设计.md)

---

## 使用方式

```javascript
import api from "@/api";

// 使用示例
const result = await api.agents.getList("user_123");
```

---

## API 接口列表

### Agents API（NPC 管理）

| 方法                                  | 功能          | 参数                                                            | 返回值                                                           | 使用示例                                                                                                                    |
| ------------------------------------- | ------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `api.agents.create(data)`             | 创建 NPC      | `data: { userId, name, type, systemPrompt, model, avatarUrl? }` | `Promise<{ success, data: Agent }>`                              | `await api.agents.create({ userId: 'user_123', name: '学习教练', type: 'special', systemPrompt: '...', model: 'gpt-4.1' })` |
| `api.agents.getList(userId)`          | 获取 NPC 列表 | `userId: string`                                                | `Promise<{ success, data: { agents: Agent[], total: number } }>` | `await api.agents.getList('user_123')`                                                                                      |
| `api.agents.getById(agentId, userId)` | 获取 NPC 详情 | `agentId: string, userId: string`                               | `Promise<{ success, data: Agent }>`                              | `await api.agents.getById('agent_456', 'user_123')`                                                                         |

### Messages API（消息）

| 方法                      | 功能     | 参数                                 | 返回值                                                             | 使用示例                                                                                 |
| ------------------------- | -------- | ------------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `api.messages.send(data)` | 发送消息 | `data: { userId, agentId, content }` | `Promise<{ success, data: { message: Message, reply: Message } }>` | `await api.messages.send({ userId: 'user_123', agentId: 'agent_456', content: '你好' })` |

### History API（对话历史）

| 方法                               | 功能         | 参数                              | 返回值                                                | 使用示例                                         |
| ---------------------------------- | ------------ | --------------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| `api.history.get(userId, agentId)` | 获取对话历史 | `userId: string, agentId: string` | `Promise<{ success, data: { messages: Message[] } }>` | `await api.history.get('user_123', 'agent_456')` |

### Sessions API（会话）

| 方法                           | 功能         | 参数             | 返回值                                                | 使用示例                                 |
| ------------------------------ | ------------ | ---------------- | ----------------------------------------------------- | ---------------------------------------- |
| `api.sessions.getList(userId)` | 获取会话列表 | `userId: string` | `Promise<{ success, data: { sessions: Session[] } }>` | `await api.sessions.getList('user_123')` |

---

## 数据模型

### Agent（NPC）

```typescript
{
  id: string;              // NPC ID
  userId: string;          // 用户 ID
  name: string;            // NPC 名称
  type: 'general' | 'special';  // NPC 类型
  model: string;           // LLM 模型名称
  systemPrompt: string;    // NPC 人设描述
  avatarUrl: string | null; // 头像 URL
  createdAt: number;       // 创建时间戳
  lastMessageAt?: number | null; // 最后对话时间戳（列表接口返回）
}
```

### Message（消息）

```typescript
{
  id: string; // 消息 ID
  sessionId: string; // 会话 ID
  participantId: string; // 参与者 ID
  content: string; // 消息内容
  createdAt: number; // 创建时间戳
}
```

### Session（会话）

```typescript
{
  id: string; // 会话 ID
  participants: Array<{
    // 参与者列表
    id: string;
    type: "user" | "agent";
  }>;
  lastActiveAt: number; // 最后活动时间戳
  createdAt: number; // 创建时间戳
}
```

---

## 响应格式

### 成功响应

```javascript
{
  success: true,
  data: {
    // 具体数据
  },
  timestamp: number
}
```

### 错误响应

```javascript
{
  success: false,
  error: {
    code: string,        // 错误码（如 'VALIDATION_ERROR'）
    message: string,     // 错误描述
    details?: object     // 详细错误信息（可选）
  },
  timestamp: number
}
```

---

## 错误处理

```javascript
import api from "@/api";

try {
  const result = await api.agents.getList("user_123");
  if (result.success) {
    // 处理成功数据
    console.log(result.data.agents);
  } else {
    // 处理业务错误
    console.error(result.error.message);
  }
} catch (error) {
  // 处理网络错误或其他异常
  console.error("请求失败:", error);
}
```

---

## 模式切换

通过环境变量 `VITE_API_MODE` 控制使用 Mock 还是真实 API：

- `auto`：自动检测后端可用性（默认）
  - 如果后端可用（2秒内响应健康检查），使用 HTTP 适配器
  - 如果后端不可用，自动回退到 Mock 适配器
- `mock`：强制使用 Mock 数据
- `http`：强制使用真实后端 API

```bash
# .env.development（自动检测模式，推荐）
VITE_API_MODE=auto
VITE_API_BASE_URL=http://localhost:8000

# 或者明确指定模式
VITE_API_MODE=mock  # 强制使用 Mock
VITE_API_MODE=http  # 强制使用 HTTP

# .env.production
VITE_API_MODE=http
VITE_API_BASE_URL=https://api.example.com
```

**自动检测策略**：
- 应用启动时自动检测后端健康检查端点（`/api/v1/health`）
- 检测超时时间：2秒
- 如果后端可用，自动使用 HTTP 适配器
- 如果后端不可用，自动使用 Mock 适配器
- 检测过程在控制台输出日志，方便调试

---

## 架构说明

### 前端 API 层架构

```
前端业务代码
    ↓
前端 API 层（统一接口）
    ↓
适配器层
    ├── Mock 适配器 → 使用 Mock 数据
    └── HTTP 适配器 → 调用后端 API → 适配数据格式 → 返回前端 API 格式
```

### 设计原则

1. **前端维护统一 API 接口**：业务代码只关心前端 API，不关心数据来源
2. **Mock 适配器使用前端 API**：Mock 数据直接返回前端 API 格式
3. **HTTP 适配器适配后端 API**：调用后端 API，将后端数据格式转换为前端 API 格式

### 适配层职责

- **Mock 适配器**：实现前端 API 接口，使用 Mock 数据（符合前端 API 格式）
- **HTTP 适配器**：实现前端 API 接口，调用后端 API，适配后端数据格式到前端 API 格式

---

## 实现状态

| 接口               | Mock 适配器 | HTTP 适配器 | 后端 API  | 说明                    |
| ------------------ | ----------- | ----------- | --------- | ----------------------- |
| `agents.create`    | ✅ 已实现   | ✅ 已实现   | ✅ 已实现 | 创建 NPC 功能已完成     |
| `agents.getList`   | ✅ 已实现   | ✅ 已实现   | ✅ 已实现 | NPC 列表功能已完成      |
| `agents.getById`   | ✅ 已实现   | ✅ 已实现   | ✅ 已实现 | NPC 详情功能已完成      |
| `messages.send`    | ✅ 已实现   | ✅ 已实现   | ✅ 已实现 | 消息发送功能已完成      |
| `history.get`      | ✅ 已实现   | ✅ 已实现   | ✅ 已实现 | 对话历史功能已完成      |
| `sessions.getList` | ⏳ 待实现   | ✅ 已实现   | ✅ 已实现 | 会话列表功能（暂未使用）|

**图例**：

- ✅ 已实现
- ⏳ 待实现
- 🚧 开发中

**说明**：

- **Mock 适配器**：前端代码，使用 Mock 数据，返回前端 API 格式
- **HTTP 适配器**：前端代码，调用后端 API，适配数据格式到前端 API 格式
- **后端 API**：后端代码，已实现的 HTTP 接口

---

**文档维护**：新增或修改 API 接口时，需同步更新本文档。
