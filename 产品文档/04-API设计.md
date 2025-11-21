# 04-API 设计

**文档版本**：v1.1  
**最后更新**：2025-11-21  
**相关文档**：[功能需求](./03-功能需求.md) | [数据模型](./05-数据模型.md)

---

## 1. API 设计总览

### 1.1 API 基础信息

- **API 版本**：v1
- **基础路径**：`/api/v1`
- **协议**：HTTP/HTTPS
- **数据格式**：JSON
- **字符编码**：UTF-8
- **认证方式**：V1 实现基础用户认证（登录/注册），使用 userId 进行数据隔离（V1.5 实现 JWT Token）

### 1.2 API 设计原则

1. **RESTful 风格**：遵循 RESTful API 设计规范
2. **统一响应格式**：所有 API 使用统一的响应格式
3. **错误处理**：使用统一的错误码和错误信息格式
4. **版本控制**：通过 URL 路径进行版本控制
5. **幂等性**：POST 请求支持幂等性（通过 idempotency key）

### 1.3 API 列表

| 方法 | 路径                     | 功能          | 优先级 |
| ---- | ------------------------ | ------------- | ------ |
| POST | `/api/v1/users/login`    | 用户登录      | P0     |
| POST | `/api/v1/users/register` | 用户注册      | P0     |
| POST | `/api/v1/agents`         | 创建 NPC      | P0     |
| GET  | `/api/v1/agents`         | 获取 NPC 列表 | P0     |
| GET  | `/api/v1/agents/:id`     | 获取 NPC 详情 | P1     |
| POST | `/api/v1/messages`       | 发送消息      | P0     |
| GET  | `/api/v1/history`        | 获取对话历史  | P0     |
| GET  | `/api/v1/events`         | 查询事件记录  | P0     |

---

## 2. 通用规范

### 2.1 请求头

```
Content-Type: application/json
Accept: application/json
User-Agent: npc-client/1.0
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
| UNAUTHORIZED        | 401         | 未授权（V1.5 实现） |
| FORBIDDEN           | 403         | 无权限（V1.5 实现） |
| NOT_FOUND           | 404         | 资源不存在          |
| DUPLICATE_NAME      | 409         | 名称重复            |
| LLM_API_ERROR       | 500         | LLM API 调用失败    |
| LLM_API_TIMEOUT     | 504         | LLM API 调用超时    |
| SYSTEM_ERROR        | 500         | 系统内部错误        |
| RATE_LIMIT_EXCEEDED | 429         | 请求频率过高        |

### 2.4 分页参数（V1 暂不支持，预留接口）

```json
{
  "page": 1, // 页码，从 1 开始
  "pageSize": 20, // 每页数量
  "total": 100, // 总记录数
  "totalPages": 5 // 总页数
}
```

---

## 3. 用户认证 API

### 3.1 用户登录

**接口**：`POST /api/v1/users/login`

**功能描述**：用户登录，通过 User ID 和密码（可选）验证身份

**请求体**：

```json
{
  "userId": "user_123",
  "password": "password" // 可选，V1 版本简化处理
}
```

**字段说明**：

| 字段名   | 类型   | 必填 | 说明                    | 示例       |
| -------- | ------ | ---- | ----------------------- | ---------- |
| userId   | string | 是   | 用户 ID                 | "user_123" |
| password | string | 否   | 密码（V1 版本可选验证） | "password" |

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
2. 如果用户不存在，返回 `USER_NOT_FOUND` 错误
3. 如果提供了密码但密码错误，返回 `INVALID_PASSWORD` 错误
4. 返回的用户信息不包含密码字段

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

### 3.1 创建 NPC

**接口**：`POST /api/v1/agents`

**功能描述**：创建新的 AI NPC

**请求体**：

```json
{
  "userId": "user_123",
  "name": "学习教练",
  "type": "special",
  "systemPrompt": "你是一位专业的学习教练，擅长制定学习计划、解答学习问题...",
  "model": "gpt-4.1",
  "avatarUrl": "https://example.com/avatar.png" // 可选
}
```

**字段说明**：

| 字段名       | 类型   | 必填 | 说明                       | 示例          |
| ------------ | ------ | ---- | -------------------------- | ------------- |
| userId       | string | 是   | 用户 ID                    | "user_123"    |
| name         | string | 是   | NPC 名称，1-50 字符        | "学习教练"    |
| type         | enum   | 是   | NPC 类型：general/special  | "special"     |
| systemPrompt | string | 是   | NPC 人设描述，10-5000 字符 | "你是一位..." |
| model        | string | 是   | LLM 模型名称               | "gpt-4.1"     |
| avatarUrl    | string | 否   | 头像 URL                   | "https://..." |

**成功响应**（HTTP 201）：

```json
{
  "success": true,
  "data": {
    "id": "agent_456",
    "userId": "user_123",
    "name": "学习教练",
    "type": "special",
    "model": "gpt-4.1",
    "systemPrompt": "你是一位专业的学习教练...",
    "avatarUrl": "https://example.com/avatar.png",
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
3. systemPrompt 长度：10-5000 字符
4. model 必须在支持的模型列表中

**支持的模型列表**（示例，需根据实际情况配置）：

- `gpt-4.1`
- `gpt-3.5-turbo`
- `claude-3-opus`
- `claude-3-sonnet`

---

### 3.2 获取 NPC 列表

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

### 3.3 获取 NPC 详情

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
    "model": "gpt-4.1",
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

### 4.1 发送消息

**接口**：`POST /api/v1/messages`

**功能描述**：用户向 NPC 发送消息，系统调用 LLM API 生成回复

**请求体**：

```json
{
  "userId": "user_123",
  "agentId": "agent_456",
  "text": "今天有什么学习建议？"
}
```

**字段说明**：

| 字段名  | 类型   | 必填 | 说明                  | 示例                   |
| ------- | ------ | ---- | --------------------- | ---------------------- |
| userId  | string | 是   | 用户 ID               | "user_123"             |
| agentId | string | 是   | NPC ID                | "agent_456"            |
| text    | string | 是   | 消息内容，1-5000 字符 | "今天有什么学习建议？" |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "userEvent": {
      "id": "event_111",
      "sessionId": "user_123_agent_456",
      "from": "user",
      "fromId": "user_123",
      "to": "agent",
      "toId": "agent_456",
      "content": "今天有什么学习建议？",
      "timestamp": 1703001234567
    },
    "agentEvent": {
      "id": "event_112",
      "sessionId": "user_123_agent_456",
      "from": "agent",
      "fromId": "agent_456",
      "to": "user",
      "toId": "user_123",
      "content": "我们先从制定学习计划开始吧...",
      "timestamp": 1703001234568
    },
    "reply": "我们先从制定学习计划开始吧..."
  },
  "timestamp": 1703001234568
}
```

**响应字段说明**：

| 字段名     | 类型   | 说明                                   |
| ---------- | ------ | -------------------------------------- |
| userEvent  | object | 用户发言事件记录                       |
| agentEvent | object | NPC 回复事件记录                       |
| reply      | string | NPC 回复内容（简化字段，方便前端使用） |

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

```json
{
  "success": false,
  "error": {
    "code": "LLM_API_ERROR",
    "message": "AI 回复生成失败，请稍后重试",
    "details": {
      "llmError": "API rate limit exceeded"
    }
  },
  "timestamp": 1703001234567
}
```

**业务规则**：

1. 消息长度限制：1-5000 字符
2. 自动创建两个事件：用户发言事件和 NPC 回复事件
3. 上下文窗口：默认获取最近 20 条事件作为上下文
4. 重试机制：LLM API 失败时自动重试 2 次
5. 超时时间：LLM API 调用超时时间 30 秒
6. 并发控制：同一用户同一 NPC 的请求串行处理

**处理流程**：

1. 验证参数（userId, agentId, text）
2. 验证 Agent 是否存在
3. 写入用户发言事件
4. 获取最近 N 条历史事件（构建上下文）
5. 读取 Agent 配置（systemPrompt, model）
6. 构建 LLM Prompt
7. 调用 LLM API（使用 Agent 配置的 model）
8. 写入 NPC 回复事件
9. 返回响应

**性能要求**：

- P95 响应时间 < 3 秒（取决于 LLM API 速度）
- 支持至少 100 并发请求

---

### 4.2 获取对话历史

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
        "sessionId": "user_123_agent_456",
        "from": "user",
        "fromId": "user_123",
        "to": "agent",
        "toId": "agent_456",
        "content": "你好",
        "timestamp": 1703001000000
      },
      {
        "id": "event_2",
        "sessionId": "user_123_agent_456",
        "from": "agent",
        "fromId": "agent_456",
        "to": "user",
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
| events[].from      | string | 发送者类型：user/agent   |
| events[].fromId    | string | 发送者 ID                |
| events[].to        | string | 接收者类型：user/agent   |
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

## 6. 事件系统 API

### 5.1 查询事件记录

**接口**：`GET /api/v1/events`

**功能描述**：查询事件记录，支持多种查询条件

**查询参数**：

| 参数名    | 类型   | 必填 | 说明                                |
| --------- | ------ | ---- | ----------------------------------- |
| sessionId | string | 否   | 会话 ID（userId_agentId）           |
| userId    | string | 否   | 用户 ID（需与 agentId 一起使用）    |
| agentId   | string | 否   | NPC ID（需与 userId 一起使用）      |
| from      | string | 否   | 发送者类型：user/agent              |
| startTime | number | 否   | 开始时间戳（毫秒）                  |
| endTime   | number | 否   | 结束时间戳（毫秒）                  |
| limit     | number | 否   | 返回数量限制（默认 100，最大 1000） |
| offset    | number | 否   | 偏移量（用于分页）                  |
| orderBy   | string | 否   | 排序字段：timestamp（默认）         |
| order     | string | 否   | 排序方向：asc/desc（默认 asc）      |

**成功响应**（HTTP 200）：

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_1",
        "sessionId": "user_123_agent_456",
        "from": "user",
        "fromId": "user_123",
        "to": "agent",
        "toId": "agent_456",
        "content": "你好",
        "timestamp": 1703001000000
      }
    ],
    "total": 1,
    "limit": 100,
    "offset": 0
  },
  "timestamp": 1703001234567
}
```

**查询示例**：

1. **查询指定会话的所有事件**：

   ```
   GET /api/v1/events?sessionId=user_123_agent_456
   ```

2. **查询用户与 NPC 的事件**：

   ```
   GET /api/v1/events?userId=user_123&agentId=agent_456
   ```

3. **查询最近 N 条事件（用于构建上下文）**：

   ```
   GET /api/v1/events?sessionId=user_123_agent_456&limit=20&order=desc
   ```

4. **查询时间范围内的事件**：
   ```
   GET /api/v1/events?sessionId=user_123_agent_456&startTime=1703001000000&endTime=1703002000000
   ```

**业务规则**：

1. 如果提供 `sessionId`，直接使用 sessionId 查询
2. 如果提供 `userId` 和 `agentId`，组合成 sessionId 查询
3. 必须提供 sessionId 或 (userId + agentId)，否则返回参数错误
4. 默认按 timestamp 升序排列
5. limit 最大值为 1000，超过则返回错误

**错误响应**：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "必须提供 sessionId 或 (userId + agentId)"
  },
  "timestamp": 1703001234567
}
```

---

## 7. API 测试示例

### 6.1 使用 cURL 测试

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
    "model": "gpt-4.1"
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
    "text": "今天有什么学习建议？"
  }'
```

**获取对话历史**：

```bash
curl "http://localhost:8000/api/v1/history?userId=user_123&agentId=agent_456"
```

### 6.2 使用 JavaScript 测试

```javascript
// 用户登录
const login = async (userId, password) => {
  const response = await fetch("http://localhost:8000/api/v1/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  const data = await response.json();
  return data;
};

// 用户注册
const register = async (userId, username, password) => {
  const response = await fetch("http://localhost:8000/api/v1/users/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, username, password }),
  });
  const data = await response.json();
  return data;
};

// 创建 NPC
const createAgent = async () => {
  const response = await fetch("http://localhost:8000/api/v1/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "user_123",
      name: "学习教练",
      type: "special",
      systemPrompt: "你是一位专业的学习教练...",
      model: "gpt-4.1",
    }),
  });
  const data = await response.json();
  return data;
};

// 发送消息
const sendMessage = async (userId, agentId, text) => {
  const response = await fetch("http://localhost:8000/api/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, agentId, text }),
  });
  const data = await response.json();
  return data;
};
```

---

## 8. API 版本管理

### 7.1 版本策略

- **URL 路径版本控制**：`/api/v1/...`
- **向后兼容**：新版本保持向后兼容，不破坏现有 API
- **版本升级**：重大变更时创建新版本（如 `/api/v2/...`）

### 7.2 废弃 API

废弃的 API 会在响应头中标记：

```
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
```

---

## 9. 限流策略（V1.5 实现）

### 8.1 限流规则

- **用户级别限流**：每个用户每分钟最多 60 次请求
- **IP 级别限流**：每个 IP 每分钟最多 100 次请求
- **LLM API 限流**：根据 LLM 服务商的限流规则

### 8.2 限流响应

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求频率过高，请稍后重试"
  },
  "timestamp": 1703001234567
}
```

响应头：

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703001300
```

---

## 10. 相关文档

- [功能需求](./03-功能需求.md) - 功能需求详细说明
- [数据模型](./05-数据模型.md) - 数据结构设计
- [系统架构](./06-系统架构.md) - 系统架构设计（待生成）

---

**文档维护**：API 变更时，需同步更新本文档和功能需求文档。
