# 04-API 设计（V1）

**文档版本**：v1.0.0  
**最后更新**：2025-11-22  
**相关文档**：[功能需求](./03-功能需求.md) | [数据模型](./05-数据模型.md)

---

## 1. API 设计总览

### 1.1 API 基础信息

- **API 版本**：v1
- **基础路径**：`/api/v1`
- **协议**：HTTP/HTTPS
- **数据格式**：JSON
- **字符编码**：UTF-8
- **认证方式**：V1 实现基础用户认证（登录/注册），使用 userId 进行数据隔离

### 1.2 API 设计原则

1. **RESTful 风格**：遵循 RESTful API 设计规范
2. **统一响应格式**：所有 API 使用统一的响应格式
3. **错误处理**：使用统一的错误码和错误信息格式
4. **版本控制**：通过 URL 路径进行版本控制

### 1.3 API 列表（V1 已实现）

| 方法 | 路径                           | 功能             | 优先级 | 状态 |
| ---- | ------------------------------ | ---------------- | ------ | ---- |
| POST | `/api/v1/users/login`          | 用户登录         | P0     | ✅   |
| POST | `/api/v1/users/register`       | 用户注册         | P0     | ✅   |
| POST | `/api/v1/agents`               | 创建 NPC         | P0     | ✅   |
| GET  | `/api/v1/agents`               | 获取 NPC 列表    | P0     | ✅   |
| GET  | `/api/v1/agents/:id`           | 获取 NPC 详情    | P1     | ✅   |
| POST | `/api/v1/messages`              | 发送消息         | P0     | ✅   |
| GET  | `/api/v1/messages/check`       | 检查新消息（轮询）| P0     | ✅   |
| GET  | `/api/v1/history`              | 获取对话历史     | P0     | ✅   |
| GET  | `/api/v1/sessions`              | 获取会话列表     | P0     | ✅   |
| GET  | `/api/v1/health`               | 健康检查         | P0     | ✅   |

---

## 2. 通用规范

### 2.1 请求头

```
Content-Type: application/json
Accept: application/json
```

### 2.2 统一响应格式

**成功响应**：

```json
{
  "success": true,
  "data": {
    // 具体数据
  },
  "timestamp": 1703001234567
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息",
    "details": {} // 可选，详细错误信息
  },
  "timestamp": 1703001234567
}
```

### 2.3 错误码定义

| 错误码              | HTTP 状态码 | 说明                |
| ------------------- | ----------- | ------------------- |
| VALIDATION_ERROR    | 400         | 参数验证失败        |
| UNAUTHORIZED        | 401         | 未授权              |
| NOT_FOUND           | 404         | 资源不存在          |
| DUPLICATE_NAME      | 409         | 名称重复            |
| DUPLICATE_USER_ID   | 409         | 用户 ID 重复        |
| DUPLICATE_USERNAME  | 409         | 用户名重复          |
| USER_NOT_FOUND      | 404         | 用户不存在          |
| INVALID_PASSWORD     | 401         | 密码错误            |
| AGENT_NOT_FOUND     | 404         | NPC 不存在          |
| LLM_API_ERROR       | 502         | LLM API 调用失败    |
| LLM_TIMEOUT         | 504         | LLM API 调用超时    |
| SYSTEM_ERROR        | 500         | 系统内部错误        |

---

## 3. 用户认证 API

### 3.1 用户登录

**接口**：`POST /api/v1/users/login`

**功能描述**：用户登录，通过 User ID 和密码验证身份

**请求体**：

```json
{
  "userId": "user_123",
  "password": "password"
}
```

**字段说明**：

| 字段名   | 类型   | 必填 | 说明                    | 示例       |
| -------- | ------ | ---- | ----------------------- | ---------- |
| userId   | string | 是   | 用户 ID                 | "user_123" |
| password | string | 是   | 密码                    | "password" |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "TestUser",
    "createdAt": 1703001234567
  },
  "timestamp": 1703001234567
}
```

**错误响应示例**：

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在"
  },
  "timestamp": 1703001234567
}
```

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "密码错误"
  },
  "timestamp": 1703001234567
}
```

**业务规则**：

1. User ID 不能为空
2. 密码不能为空
3. 如果用户不存在，返回 `USER_NOT_FOUND` 错误
4. 如果密码错误，返回 `INVALID_PASSWORD` 错误
5. 返回的用户信息不包含密码字段

---

### 3.2 用户注册

**接口**：`POST /api/v1/users/register`

**功能描述**：注册新用户

**请求体**：

```json
{
  "userId": "user_123",
  "username": "TestUser",
  "password": "password"
}
```

**字段说明**：

| 字段名   | 类型   | 必填 | 说明                  | 示例       |
| -------- | ------ | ---- | --------------------- | ---------- |
| userId   | string | 是   | 用户 ID（唯一标识符） | "user_123" |
| username | string | 是   | 用户昵称（显示名称）  | "TestUser" |
| password | string | 是   | 密码                  | "password" |

**成功响应**（HTTP 201）：

```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "TestUser",
    "createdAt": 1703001234567
  },
  "timestamp": 1703001234567
}
```

**错误响应示例**：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields"
  },
  "timestamp": 1703001234567
}
```

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_USER_ID",
    "message": "用户 ID 已存在"
  },
  "timestamp": 1703001234567
}
```

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_USERNAME",
    "message": "用户名已存在"
  },
  "timestamp": 1703001234567
}
```

**业务规则**：

1. User ID、用户名、密码都不能为空
2. User ID 必须唯一，不能重复
3. 用户名必须唯一，不能重复
4. 注册成功后自动返回用户信息（不含密码）

---

## 4. NPC 管理 API

### 4.1 创建 NPC

**接口**：`POST /api/v1/agents`

**功能描述**：创建新的 AI NPC

**请求体**：

```json
{
  "userId": "user_123",
  "name": "学习教练",
  "type": "special",
  "systemPrompt": "你是一位专业的学习教练，擅长制定学习计划、解答学习问题...",
  "model": "anthropic/claude-sonnet-4.5",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**字段说明**：

| 字段名       | 类型   | 必填 | 说明                       | 示例          |
| ------------ | ------ | ---- | -------------------------- | ------------- |
| userId       | string | 是   | 用户 ID                    | "user_123"    |
| name         | string | 是   | NPC 名称，1-50 字符        | "学习教练"    |
| type         | enum   | 是   | NPC 类型：general/special  | "special"     |
| systemPrompt | string | 否   | NPC 人设描述（可选）       | "你是一位..." |
| model        | string | 是   | LLM 模型名称               | "anthropic/claude-sonnet-4.5" |
| avatarUrl    | string | 否   | 头像 URL                   | "https://..." |

**模型配置说明**（V1 版本）：

- V1 版本统一使用 OpenRouter 作为模型供应商
- 所有模型都通过 OpenRouter 调用
- 支持的模型格式：`provider/model-name`（如 `anthropic/claude-sonnet-4.5`）
- 创建 Agent 时不需要指定 `provider`（自动使用 OpenRouter）

**成功响应**（HTTP 201）：

```json
{
  "success": true,
  "data": {
    "id": "agent_456",
    "userId": "user_123",
    "name": "学习教练",
    "type": "special",
    "model": "anthropic/claude-sonnet-4.5",
    "systemPrompt": "你是一位专业的学习教练...",
    "avatarUrl": "https://example.com/avatar.png",
    "createdAt": 1703001234567,
    "updatedAt": 1703001234567
  },
  "timestamp": 1703001234567
}
```

**错误响应示例**：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "NPC 名称不能为空"
  },
  "timestamp": 1703001234567
}
```

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "该名称已存在，请使用其他名称"
  },
  "timestamp": 1703001234567
}
```

**业务规则**：

1. 同一用户的 NPC 名称不能重复（不区分大小写）
2. 名称长度：1-50 字符
3. systemPrompt 为可选字段，可以为空
4. model 必须在支持的模型列表中（通过 OpenRouter）
5. 类型说明：
   - `general`：通用助手，适用于多种场景
   - `special`：特定功能 NPC，专注于某个领域

---

### 4.2 获取 NPC 列表

**接口**：`GET /api/v1/agents?userId=xxx`

**功能描述**：获取用户创建的所有 NPC 列表

**请求参数**：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| userId | string | 是   | 用户 ID |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent_456",
        "name": "学习教练",
        "type": "special",
        "avatarUrl": "https://example.com/avatar.png",
        "createdAt": 1703001234567,
        "lastMessageAt": 1703002000000
      },
      {
        "id": "agent_789",
        "name": "心理导师",
        "type": "special",
        "avatarUrl": null,
        "createdAt": 1703001000000,
        "lastMessageAt": null
      }
    ],
    "total": 2
  },
  "timestamp": 1703001234567
}
```

**响应字段说明**：

| 字段名                 | 类型         | 说明           |
| ---------------------- | ------------ | -------------- |
| agents                 | array        | NPC 列表       |
| agents[].id            | string       | NPC ID         |
| agents[].name          | string       | NPC 名称       |
| agents[].type          | string       | NPC 类型       |
| agents[].avatarUrl     | string\|null | 头像 URL       |
| agents[].createdAt     | number       | 创建时间戳     |
| agents[].lastMessageAt | number\|null | 最后对话时间戳 |
| total                  | number       | 总数           |

**排序规则**：

- 按 `lastMessageAt` 倒序排列（有对话记录的在前）
- 如果 `lastMessageAt` 为 null，按 `createdAt` 倒序排列

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "userId 参数不能为空"
  },
  "timestamp": 1703001234567
}
```

---

### 4.3 获取 NPC 详情

**接口**：`GET /api/v1/agents/:id?userId=xxx`

**功能描述**：获取指定 NPC 的详细信息

**路径参数**：

| 参数名 | 类型   | 必填 | 说明   |
| ------ | ------ | ---- | ------ |
| id     | string | 是   | NPC ID |

**查询参数**：

| 参数名 | 类型   | 必填 | 说明                    |
| ------ | ------ | ---- | ----------------------- |
| userId | string | 是   | 用户 ID（用于权限验证） |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "id": "agent_456",
    "userId": "user_123",
    "name": "学习教练",
    "type": "special",
    "model": "anthropic/claude-sonnet-4.5",
    "systemPrompt": "你是一位专业的学习教练...",
    "avatarUrl": "https://example.com/avatar.png",
    "createdAt": 1703001234567,
    "updatedAt": 1703001234567
  },
  "timestamp": 1703001234567
}
```

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "NPC 不存在"
  },
  "timestamp": 1703001234567
}
```

**业务规则**：

1. 只能查询当前用户创建的 NPC
2. 如果 NPC 不存在或不属于当前用户，返回 404

---

## 5. 对话系统 API

### 5.1 发送消息

**接口**：`POST /api/v1/messages`

**功能描述**：用户向 NPC 发送消息，系统调用 LLM API 生成回复（异步处理）

**请求体**：

```json
{
  "userId": "user_123",
  "agentId": "agent_456",
  "content": "今天有什么学习建议？",
  "contextLimit": 20
}
```

**字段说明**：

| 字段名       | 类型   | 必填 | 说明                  | 示例                   |
| ------------ | ------ | ---- | --------------------- | ---------------------- |
| userId       | string | 是   | 用户 ID               | "user_123"             |
| agentId      | string | 是   | NPC ID                | "agent_456"            |
| content      | string | 是   | 消息内容，1-5000 字符 | "今天有什么学习建议？" |
| contextLimit | number | 否   | 上下文条数（默认 20） | 20                      |

**成功响应**（HTTP 200，立即返回）：

```json
{
  "success": true,
  "data": {
    "userEventId": "event_789",
    "sessionId": "session_xxx"
  },
  "timestamp": 1703001234567
}
```

**响应字段说明**：

| 字段名      | 类型   | 说明                                   |
| ----------- | ------ | -------------------------------------- |
| userEventId | string | 用户发言事件 ID（前端可立即显示）      |
| sessionId   | string | 会话 ID（用于轮询检查新消息）         |

**处理流程**（V1 实现：短轮询方案）：

1. 验证参数（userId, agentId, content）
2. 获取或创建 Session
3. 创建用户消息 Event（同步）
4. 立即返回用户消息 Event ID
5. 后台异步处理：
   - 读取 Agent 配置
   - 获取最近 N 条历史事件（上下文）
   - 构建 LLM Prompt
   - 调用 LLM API（异步）
   - 创建 NPC 回复 Event（同步）

**前端轮询**：

前端收到响应后，需要轮询检查新消息：

```
GET /api/v1/messages/check?sessionId=xxx&lastEventId=yyy
```

每 5 秒轮询一次，最多轮询 60 次（5 分钟）。

**错误响应示例**：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "消息不能为空"
  },
  "timestamp": 1703001234567
}
```

```json
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "NPC 不存在"
  },
  "timestamp": 1703001234567
}
```

**业务规则**：

1. 消息长度限制：1-5000 字符
2. 上下文窗口：默认获取最近 20 条事件（可通过 contextLimit 配置）
3. 重试机制：LLM API 失败时自动重试 2 次（指数退避）
4. 超时时间：LLM API 调用超时时间 30 秒
5. 并发控制：同一用户同一 NPC 的对话请求串行处理

---

### 5.2 检查新消息（轮询）

**接口**：`GET /api/v1/messages/check?sessionId=xxx&lastEventId=yyy`

**功能描述**：检查指定会话中是否有新消息（在 lastEventId 之后的消息），用于前端轮询获取 Agent 回复

**查询参数**：

| 参数名      | 类型   | 必填 | 说明                                    |
| ----------- | ------ | ---- | --------------------------------------- |
| sessionId   | string | 是   | 会话 ID                                 |
| lastEventId | string | 是   | 最后已知的事件 ID（检查此 ID 之后的消息） |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "hasNew": true,
    "newEvent": {
      "id": "event_790",
      "fromType": "agent",
      "content": "我们先从制定学习计划开始吧...",
      "timestamp": 1703001234568
    }
  },
  "timestamp": 1703001234568
}
```

**响应字段说明**：

| 字段名           | 类型    | 说明                           |
| ---------------- | ------- | ------------------------------ |
| hasNew           | boolean | 是否有新消息                   |
| newEvent         | object  | 新消息事件（如果有）           |
| newEvent.id      | string  | 事件 ID                        |
| newEvent.fromType | string  | 发送者类型：user/agent         |
| newEvent.content | string  | 消息内容                       |
| newEvent.timestamp | number | 时间戳（毫秒）                 |

**无新消息响应**：

```json
{
  "success": true,
  "data": {
    "hasNew": false
  },
  "timestamp": 1703001234568
}
```

**业务规则**：

1. 只检查指定 sessionId 的事件
2. 只返回 lastEventId 之后的事件（按时间顺序）
3. 如果有多条新消息，只返回第一条（按时间顺序）
4. 前端应每 5 秒轮询一次，最多轮询 60 次（5 分钟）

---

### 5.3 获取对话历史

**接口**：`GET /api/v1/history?userId=xxx&agentId=yyy`

**功能描述**：获取用户与指定 NPC 的完整对话历史

**查询参数**：

| 参数名  | 类型   | 必填 | 说明                                    |
| ------- | ------ | ---- | --------------------------------------- |
| userId  | string | 是   | 用户 ID                                 |
| agentId | string | 是   | NPC ID                                  |
| limit   | number | 否   | 返回数量限制（默认不限制，V1 暂不支持） |
| offset  | number | 否   | 偏移量（用于分页，V1 暂不支持）         |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_1",
        "sessionId": "session_xxx",
        "fromType": "user",
        "fromId": "user_123",
        "toType": "agent",
        "toId": "agent_456",
        "content": "你好",
        "timestamp": 1703001000000
      },
      {
        "id": "event_2",
        "sessionId": "session_xxx",
        "fromType": "agent",
        "fromId": "agent_456",
        "toType": "user",
        "toId": "user_123",
        "content": "你好！我是你的学习教练...",
        "timestamp": 1703001001000
      }
    ],
    "total": 2
  },
  "timestamp": 1703001234567
}
```

**响应字段说明**：

| 字段名             | 类型   | 说明                     |
| ------------------ | ------ | ------------------------ |
| events             | array  | 事件列表，按时间升序排列 |
| events[].id        | string | 事件 ID                  |
| events[].sessionId | string | 会话 ID                  |
| events[].fromType  | string | 发送者类型：user/agent   |
| events[].fromId    | string | 发送者 ID                |
| events[].toType    | string | 接收者类型：user/agent   |
| events[].toId      | string | 接收者 ID                |
| events[].content   | string | 消息内容                 |
| events[].timestamp | number | 时间戳（毫秒）           |
| total              | number | 总事件数                 |

**排序规则**：

- 按 `timestamp` 升序排列（最早的在前面）

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "userId 和 agentId 参数不能为空"
  },
  "timestamp": 1703001234567
}
```

**业务规则**：

1. 只返回指定 userId 和 agentId 的事件记录
2. 按时间升序排列
3. V1 返回所有历史记录（不限制数量）

**性能要求**：

- 在 1000 条记录内，查询时间 < 100ms

---

## 6. 会话系统 API

### 6.1 获取会话列表

**接口**：`GET /api/v1/sessions?userId=xxx`

**功能描述**：获取用户的所有会话列表，每个会话对应一个用户与 NPC 的对话

**查询参数**：

| 参数名 | 类型   | 必填 | 说明    |
| ------ | ------ | ---- | ------- |
| userId | string | 是   | 用户 ID |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_xxx",
        "participants": [
          { "id": "user_123", "type": "user" },
          { "id": "agent_456", "type": "agent" }
        ],
        "agent": {
          "id": "agent_456",
          "name": "学习教练",
          "avatarUrl": "https://..."
        },
        "lastActiveAt": 1703002000000,
        "createdAt": 1703001000000
      }
    ],
    "total": 1
  },
  "timestamp": 1703001234567
}
```

**响应字段说明**：

| 字段名                    | 类型   | 说明                     |
| ------------------------- | ------ | ------------------------ |
| sessions                  | array  | 会话列表                 |
| sessions[].id             | string | 会话 ID                  |
| sessions[].participants   | array  | 参与者列表               |
| sessions[].agent          | object | Agent 信息               |
| sessions[].lastActiveAt   | number | 最后活动时间戳           |
| sessions[].createdAt      | number | 创建时间戳               |
| total                     | number | 总会话数                 |

**业务规则**：

1. **单会话模式**：同一参与者组合（用户 + Agent）只有一个会话
2. **排序规则**：按最后活动时间倒序排列
3. **Agent 信息**：为每个会话补充对应的 Agent 信息

---

## 7. 健康检查 API

### 7.1 健康检查

**接口**：`GET /api/v1/health`

**功能描述**：检查服务器是否正常运行

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Server is running"
  },
  "timestamp": 1703001234567
}
```

**用途**：

- 前端自动检测后端可用性
- 部署监控和健康检查
- 负载均衡器健康检查

---

## 8. API 测试示例

### 8.1 使用 cURL 测试

**用户登录**：

```bash
curl -X POST http://localhost:8000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "password": "password"
  }'
```

**用户注册**：

```bash
curl -X POST http://localhost:8000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "username": "TestUser",
    "password": "password"
  }'
```

**创建 NPC**：

```bash
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "name": "学习教练",
    "type": "special",
    "systemPrompt": "你是一位专业的学习教练...",
    "model": "anthropic/claude-sonnet-4.5"
  }'
```

**获取 NPC 列表**：

```bash
curl "http://localhost:8000/api/v1/agents?userId=user_123"
```

**发送消息**：

```bash
curl -X POST http://localhost:8000/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "agentId": "agent_456",
    "content": "今天有什么学习建议？"
  }'
```

**检查新消息**：

```bash
curl "http://localhost:8000/api/v1/messages/check?sessionId=session_xxx&lastEventId=event_789"
```

**获取对话历史**：

```bash
curl "http://localhost:8000/api/v1/history?userId=user_123&agentId=agent_456"
```

---

## 9. API 版本管理

### 9.1 版本策略

- **URL 路径版本控制**：`/api/v1/...`
- **向后兼容**：新版本保持向后兼容，不破坏现有 API
- **版本升级**：重大变更时创建新版本（如 `/api/v2/...`）

---

## 10. 相关文档

- [功能需求](./03-功能需求.md) - 功能需求详细说明
- [数据模型](./05-数据模型.md) - 数据结构设计
- [系统架构](./06-系统架构.md) - 系统架构设计

---

**文档维护**：API 变更时，需同步更新本文档和功能需求文档。

