# RESTful API 设计规范

**文档版本**：v1.0  
**最后更新**：2025-01-XX  
**文档类型**：通用设计规范学习文档

---

## 目录

1. [RESTful API 概述](#1-restful-api-概述)
2. [核心设计原则](#2-核心设计原则)
3. [URL 设计规范](#3-url-设计规范)
4. [HTTP 方法使用规范](#4-http-方法使用规范)
5. [请求和响应设计](#5-请求和响应设计)
6. [状态码使用规范](#6-状态码使用规范)
7. [错误处理规范](#7-错误处理规范)
8. [版本控制策略](#8-版本控制策略)
9. [安全设计规范](#9-安全设计规范)
10. [性能优化建议](#10-性能优化建议)
11. [最佳实践总结](#11-最佳实践总结)

---

## 1. RESTful API 概述

### 1.1 什么是 RESTful API

**REST**（Representational State Transfer，表述性状态转移）是一种软件架构风格，用于设计网络应用程序的 API。

**RESTful API** 是遵循 REST 架构风格设计的 API，具有以下特点：

- **资源导向**：将数据视为资源，通过 URL 访问
- **无状态**：每个请求都包含处理该请求所需的所有信息
- **统一接口**：使用标准的 HTTP 方法（GET、POST、PUT、DELETE 等）
- **可缓存**：响应可以被缓存，提高性能
- **分层系统**：支持中间层（如代理、网关）

### 1.2 RESTful API 的优势

- ✅ **简单直观**：URL 清晰表达资源结构
- ✅ **标准化**：使用标准 HTTP 方法，易于理解
- ✅ **可扩展**：易于添加新资源和功能
- ✅ **可缓存**：利用 HTTP 缓存机制
- ✅ **跨平台**：不依赖特定技术栈

---

## 2. 核心设计原则

### 2.1 资源导向设计

**核心思想**：将数据视为资源，通过 URL 访问资源。

**原则**：
- 使用名词表示资源，不使用动词
- URL 应该清晰表达资源的层次结构
- 资源应该是可寻址的（有唯一 URL）

**示例**：

```
✅ 正确：
GET /api/users          # 获取用户列表
GET /api/users/123      # 获取 ID 为 123 的用户
GET /api/users/123/posts # 获取用户 123 的文章列表

❌ 错误：
GET /api/getUsers       # 使用动词
GET /api/user?id=123    # 使用查询参数表示资源 ID
```

### 2.2 使用标准 HTTP 方法

**原则**：使用标准 HTTP 方法表达操作意图。

| HTTP 方法 | 用途 | 幂等性 | 安全性 |
|----------|------|--------|--------|
| GET | 获取资源 | ✅ | ✅ |
| POST | 创建资源 | ❌ | ❌ |
| PUT | 更新资源（完整替换） | ✅ | ❌ |
| PATCH | 更新资源（部分更新） | ❌ | ❌ |
| DELETE | 删除资源 | ✅ | ❌ |

**示例**：

```
GET    /api/users        # 获取用户列表
POST   /api/users        # 创建新用户
GET    /api/users/123    # 获取用户 123
PUT    /api/users/123    # 完整更新用户 123
PATCH  /api/users/123    # 部分更新用户 123
DELETE /api/users/123    # 删除用户 123
```

### 2.3 无状态设计

**原则**：每个请求都应该包含处理该请求所需的所有信息。

**要求**：
- 不在服务器端存储客户端状态
- 每个请求独立处理
- 认证信息通过请求头传递（如 Authorization）

**示例**：

```
✅ 正确：
GET /api/users/123
Authorization: Bearer <token>

❌ 错误：
# 依赖服务器端 Session，需要先登录建立会话
GET /api/users/123
Cookie: sessionid=xxx
```

---

## 3. URL 设计规范

### 3.1 URL 命名规范

**原则**：
- 使用小写字母
- 使用连字符（-）分隔单词，不使用下划线（_）
- 使用名词复数形式表示资源集合
- 保持 URL 简洁、清晰

**示例**：

```
✅ 正确：
/api/users
/api/user-profiles
/api/order-items

❌ 错误：
/api/Users              # 使用大写
/api/user_profiles      # 使用下划线
/api/getUser            # 使用动词
```

### 3.2 URL 层次结构

**原则**：使用路径表达资源的层次关系。

**示例**：

```
# 用户资源
/api/users
/api/users/{userId}

# 用户的文章资源
/api/users/{userId}/posts
/api/users/{userId}/posts/{postId}

# 文章的评论资源
/api/users/{userId}/posts/{postId}/comments
/api/users/{userId}/posts/{postId}/comments/{commentId}
```

### 3.3 URL 参数使用

**原则**：
- 路径参数：用于标识资源（如资源 ID）
- 查询参数：用于过滤、排序、分页等

**示例**：

```
# 路径参数：标识资源
GET /api/users/123

# 查询参数：过滤、排序、分页
GET /api/users?status=active&sort=created_at&page=1&limit=20

# 查询参数：搜索
GET /api/users?search=john&role=admin
```

### 3.4 URL 长度限制

**建议**：
- URL 总长度不超过 2048 字符
- 避免过深的嵌套层次（建议不超过 4 层）
- 复杂查询使用 POST 请求体

---

## 4. HTTP 方法使用规范

### 4.1 GET - 获取资源

**用途**：获取资源或资源列表。

**特点**：
- 幂等：多次请求结果相同
- 安全：不修改服务器状态
- 可缓存：响应可以被缓存

**示例**：

```http
# 获取资源列表
GET /api/users
Response: 200 OK
{
  "data": [
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ],
  "total": 2
}

# 获取单个资源
GET /api/users/123
Response: 200 OK
{
  "data": {
    "id": 123,
    "name": "John",
    "email": "john@example.com"
  }
}

# 资源不存在
GET /api/users/999
Response: 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

### 4.2 POST - 创建资源

**用途**：创建新资源。

**特点**：
- 非幂等：每次请求可能创建不同资源
- 不安全：会修改服务器状态
- 不可缓存：响应不应该被缓存

**示例**：

```http
# 创建资源
POST /api/users
Content-Type: application/json

{
  "name": "John",
  "email": "john@example.com"
}

Response: 201 Created
Location: /api/users/123
{
  "data": {
    "id": 123,
    "name": "John",
    "email": "john@example.com",
    "createdAt": "2025-01-01T00:00:00Z"
  }
}

# 创建失败（验证错误）
Response: 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required"
  }
}
```

### 4.3 PUT - 完整更新资源

**用途**：完整替换资源（需要提供所有字段）。

**特点**：
- 幂等：多次请求结果相同
- 不安全：会修改服务器状态
- 不可缓存：响应不应该被缓存

**示例**：

```http
# 完整更新资源
PUT /api/users/123
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}

Response: 200 OK
{
  "data": {
    "id": 123,
    "name": "John Updated",
    "email": "john.updated@example.com",
    "updatedAt": "2025-01-01T01:00:00Z"
  }
}

# 资源不存在时创建（可选行为）
PUT /api/users/999
Response: 201 Created
```

### 4.4 PATCH - 部分更新资源

**用途**：部分更新资源（只需提供要更新的字段）。

**特点**：
- 非幂等：多次请求可能产生不同结果
- 不安全：会修改服务器状态
- 不可缓存：响应不应该被缓存

**示例**：

```http
# 部分更新资源
PATCH /api/users/123
Content-Type: application/json

{
  "name": "John Updated"
}

Response: 200 OK
{
  "data": {
    "id": 123,
    "name": "John Updated",
    "email": "john@example.com",  # 保持不变
    "updatedAt": "2025-01-01T01:00:00Z"
  }
}
```

### 4.5 DELETE - 删除资源

**用途**：删除资源。

**特点**：
- 幂等：多次删除同一资源结果相同
- 不安全：会修改服务器状态
- 不可缓存：响应不应该被缓存

**示例**：

```http
# 删除资源
DELETE /api/users/123

Response: 204 No Content
# 无响应体

# 或返回删除的资源信息
Response: 200 OK
{
  "data": {
    "id": 123,
    "deletedAt": "2025-01-01T01:00:00Z"
  }
}

# 资源不存在
Response: 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}
```

---

## 5. 请求和响应设计

### 5.1 请求头规范

**常用请求头**：

```http
Content-Type: application/json          # 请求体格式
Accept: application/json                # 期望的响应格式
Authorization: Bearer <token>          # 认证令牌
X-Request-ID: <uuid>                   # 请求追踪 ID（可选）
X-API-Version: v1                      # API 版本（可选）
```

### 5.2 请求体规范

**原则**：
- 使用 JSON 格式
- 字段命名使用驼峰命名（camelCase）或下划线命名（snake_case），保持一致性
- 避免嵌套过深（建议不超过 3 层）

**示例**：

```json
// 创建用户
POST /api/users
{
  "name": "John",
  "email": "john@example.com",
  "age": 30,
  "address": {
    "street": "123 Main St",
    "city": "New York"
  }
}

// 批量操作
POST /api/users/batch
{
  "users": [
    { "name": "John", "email": "john@example.com" },
    { "name": "Jane", "email": "jane@example.com" }
  ]
}
```

### 5.3 响应体规范

**统一响应格式**：

```json
// 成功响应（单个资源）
{
  "data": {
    "id": 123,
    "name": "John",
    "email": "john@example.com"
  }
}

// 成功响应（资源列表）
{
  "data": [
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// 错误响应
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}  // 可选，详细错误信息
  }
}
```

### 5.4 字段命名规范

**原则**：
- 保持一致性：整个 API 使用统一的命名风格
- 推荐使用驼峰命名（camelCase）或下划线命名（snake_case）
- 使用有意义的字段名

**示例**：

```json
// 驼峰命名（推荐）
{
  "userId": 123,
  "userName": "John",
  "createdAt": "2025-01-01T00:00:00Z"
}

// 下划线命名（也可接受）
{
  "user_id": 123,
  "user_name": "John",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

## 6. 状态码使用规范

### 6.1 2xx - 成功状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 OK | 请求成功 | GET、PUT、PATCH、DELETE 成功时 |
| 201 Created | 资源创建成功 | POST 创建资源成功时 |
| 202 Accepted | 请求已接受，处理中 | 异步处理请求时 |
| 204 No Content | 请求成功，无响应体 | DELETE 成功时 |

**示例**：

```http
# 200 OK - 获取资源成功
GET /api/users/123
Response: 200 OK

# 201 Created - 创建资源成功
POST /api/users
Response: 201 Created
Location: /api/users/123

# 204 No Content - 删除成功
DELETE /api/users/123
Response: 204 No Content
```

### 6.2 4xx - 客户端错误状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 400 Bad Request | 请求错误 | 参数验证失败、请求格式错误 |
| 401 Unauthorized | 未授权 | 未提供认证信息或认证失败 |
| 403 Forbidden | 禁止访问 | 已认证但无权限 |
| 404 Not Found | 资源不存在 | 请求的资源不存在 |
| 409 Conflict | 冲突 | 资源冲突（如名称重复） |
| 422 Unprocessable Entity | 无法处理的实体 | 请求格式正确但语义错误 |
| 429 Too Many Requests | 请求过多 | 超过速率限制 |

**示例**：

```http
# 400 Bad Request - 参数验证失败
POST /api/users
{
  "name": ""  # 空名称
}
Response: 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required"
  }
}

# 401 Unauthorized - 未授权
GET /api/users/123
# 未提供 Authorization 头
Response: 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

# 404 Not Found - 资源不存在
GET /api/users/999
Response: 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User not found"
  }
}

# 409 Conflict - 资源冲突
POST /api/users
{
  "name": "John",
  "email": "existing@example.com"  # 邮箱已存在
}
Response: 409 Conflict
{
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email already exists"
  }
}
```

### 6.3 5xx - 服务器错误状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 500 Internal Server Error | 服务器内部错误 | 未预期的服务器错误 |
| 502 Bad Gateway | 网关错误 | 上游服务器错误 |
| 503 Service Unavailable | 服务不可用 | 服务暂时不可用（维护中） |
| 504 Gateway Timeout | 网关超时 | 上游服务器超时 |

**示例**：

```http
# 500 Internal Server Error - 服务器错误
GET /api/users
Response: 500 Internal Server Error
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}

# 503 Service Unavailable - 服务不可用
GET /api/users
Response: 503 Service Unavailable
{
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Service is temporarily unavailable",
    "retryAfter": 3600  # 秒
  }
}
```

---

## 7. 错误处理规范

### 7.1 统一错误响应格式

**标准格式**：

```json
{
  "error": {
    "code": "ERROR_CODE",        // 错误代码（大写，下划线分隔）
    "message": "Error message",  // 用户友好的错误消息
    "details": {},               // 可选，详细错误信息
    "field": "email"             // 可选，错误字段（用于验证错误）
  },
  "timestamp": "2025-01-01T00:00:00Z"  // 可选，错误发生时间
}
```

### 7.2 错误代码规范

**原则**：
- 使用大写字母和下划线
- 错误代码应该具有描述性
- 保持错误代码的一致性

**示例**：

```
VALIDATION_ERROR          # 验证错误
UNAUTHORIZED              # 未授权
FORBIDDEN                 # 禁止访问
NOT_FOUND                 # 资源不存在
DUPLICATE_EMAIL           # 邮箱重复
INVALID_TOKEN             # 无效令牌
RATE_LIMIT_EXCEEDED       # 超过速率限制
INTERNAL_ERROR            # 内部错误
```

### 7.3 错误消息规范

**原则**：
- 错误消息应该清晰、具体
- 避免暴露敏感信息（如数据库错误详情）
- 提供可操作的错误信息

**示例**：

```
✅ 好的错误消息：
"Email is required"
"Password must be at least 8 characters"
"User not found"
"Rate limit exceeded. Please try again in 60 seconds"

❌ 不好的错误消息：
"Error"                                    # 太模糊
"Database connection failed"               # 暴露技术细节
"Internal server error: null pointer"     # 暴露技术细节
```

### 7.4 验证错误处理

**原则**：返回详细的字段级错误信息。

**示例**：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Email is required", "Email format is invalid"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
```

---

## 8. 版本控制策略

### 8.1 URL 路径版本控制（推荐）

**方式**：在 URL 路径中包含版本号。

**示例**：

```
/api/v1/users
/api/v2/users
```

**优点**：
- 清晰明确
- 易于理解
- 支持多版本共存

**缺点**：
- URL 较长
- 需要维护多个版本

### 8.2 请求头版本控制

**方式**：通过请求头指定版本。

**示例**：

```http
GET /api/users
Accept: application/vnd.api+json;version=1
```

**优点**：
- URL 简洁
- 版本信息分离

**缺点**：
- 不够直观
- 需要客户端支持

### 8.3 查询参数版本控制

**方式**：通过查询参数指定版本。

**示例**：

```
/api/users?version=1
```

**优点**：
- 简单易用

**缺点**：
- 不够标准
- 容易与业务参数混淆

### 8.4 版本控制最佳实践

**建议**：
- ✅ 使用 URL 路径版本控制（最常用）
- ✅ 保持向后兼容性
- ✅ 明确版本废弃策略
- ✅ 提供版本迁移指南

---

## 9. 安全设计规范

### 9.1 认证和授权

**认证方式**：

```http
# Bearer Token（推荐）
Authorization: Bearer <token>

# API Key
Authorization: ApiKey <key>

# Basic Auth（不推荐用于生产环境）
Authorization: Basic <base64(username:password)>
```

**授权检查**：
- 每个需要认证的 API 都应该验证令牌
- 检查用户是否有权限访问资源
- 返回适当的错误码（401 或 403）

### 9.2 HTTPS 使用

**原则**：
- ✅ 生产环境必须使用 HTTPS
- ✅ 避免在 URL 中传递敏感信息
- ✅ 使用安全的传输协议

### 9.3 输入验证

**原则**：
- 验证所有输入数据
- 防止 SQL 注入、XSS 攻击
- 限制输入长度和类型

**示例**：

```javascript
// 验证邮箱格式
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return { error: "Invalid email format" };
}

// 防止 SQL 注入（使用参数化查询）
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

### 9.4 速率限制

**原则**：
- 实施 API 速率限制
- 防止滥用和攻击
- 返回适当的错误码（429）

**示例**：

```http
# 速率限制响应
Response: 429 Too Many Requests
Retry-After: 60
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds"
  }
}
```

### 9.5 CORS 配置

**原则**：
- 正确配置 CORS 策略
- 限制允许的源
- 只允许必要的 HTTP 方法和头部

**示例**：

```
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 10. 性能优化建议

### 10.1 分页设计

**原则**：列表接口应该支持分页。

**示例**：

```http
# 请求
GET /api/users?page=1&limit=20

# 响应
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 10.2 字段选择（Field Selection）

**原则**：允许客户端选择需要的字段。

**示例**：

```http
# 只返回指定字段
GET /api/users?fields=id,name,email

# 排除指定字段
GET /api/users?exclude=password,secret
```

### 10.3 排序和过滤

**原则**：提供灵活的排序和过滤选项。

**示例**：

```http
# 排序
GET /api/users?sort=created_at:desc

# 过滤
GET /api/users?status=active&role=admin

# 搜索
GET /api/users?search=john
```

### 10.4 缓存策略

**原则**：
- 使用适当的 HTTP 缓存头
- GET 请求应该支持缓存
- 提供缓存失效机制

**示例**：

```http
# 缓存响应
Cache-Control: public, max-age=3600
ETag: "abc123"
Last-Modified: Wed, 01 Jan 2025 00:00:00 GMT

# 条件请求
If-None-Match: "abc123"
If-Modified-Since: Wed, 01 Jan 2025 00:00:00 GMT
```

### 10.5 批量操作

**原则**：提供批量操作接口，减少请求次数。

**示例**：

```http
# 批量创建
POST /api/users/batch
{
  "users": [
    { "name": "John", "email": "john@example.com" },
    { "name": "Jane", "email": "jane@example.com" }
  ]
}

# 批量更新
PATCH /api/users/batch
{
  "ids": [1, 2, 3],
  "updates": {
    "status": "active"
  }
}
```

---

## 11. 最佳实践总结

### 11.1 设计原则清单

- ✅ **资源导向**：使用名词表示资源
- ✅ **标准方法**：使用标准 HTTP 方法
- ✅ **无状态**：每个请求独立处理
- ✅ **统一格式**：使用统一的请求和响应格式
- ✅ **错误处理**：提供清晰的错误信息
- ✅ **版本控制**：明确版本管理策略
- ✅ **安全设计**：实施认证、授权、输入验证
- ✅ **性能优化**：支持分页、缓存、批量操作

### 11.2 常见错误避免

**❌ 避免的错误**：

1. **使用动词而非名词**
   ```
   ❌ GET /api/getUsers
   ✅ GET /api/users
   ```

2. **使用查询参数表示资源 ID**
   ```
   ❌ GET /api/user?id=123
   ✅ GET /api/users/123
   ```

3. **在 URL 中使用动词**
   ```
   ❌ POST /api/users/create
   ✅ POST /api/users
   ```

4. **不一致的命名风格**
   ```
   ❌ /api/user-profiles 和 /api/userProfiles 混用
   ✅ 统一使用一种风格
   ```

5. **错误的状态码使用**
   ```
   ❌ 删除成功返回 200 OK
   ✅ 删除成功返回 204 No Content
   ```

6. **暴露敏感信息**
   ```
   ❌ "Database error: connection timeout"
   ✅ "An error occurred. Please try again later"
   ```

### 11.3 文档化建议

**API 文档应该包含**：

1. **接口概述**：接口的用途和功能
2. **请求示例**：完整的请求示例（URL、方法、头部、 body）
3. **响应示例**：成功和失败的响应示例
4. **参数说明**：所有参数的说明和约束
5. **错误码说明**：可能的错误码和含义
6. **认证要求**：是否需要认证，如何认证
7. **速率限制**：是否有速率限制
8. **版本信息**：API 版本和变更历史

### 11.4 测试建议

**API 测试应该覆盖**：

1. **正常流程**：成功场景的测试
2. **错误处理**：各种错误场景的测试
3. **边界条件**：边界值和极端情况的测试
4. **性能测试**：响应时间和吞吐量测试
5. **安全测试**：认证、授权、输入验证测试

---

## 12. 参考资源

### 12.1 官方规范

- [HTTP/1.1 规范 (RFC 7231)](https://tools.ietf.org/html/rfc7231)
- [REST 架构风格 (Roy Fielding)](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)

### 12.2 最佳实践指南

- [Google API Design Guide](https://cloud.google.com/apis/design)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [JSON API Specification](https://jsonapi.org/)

### 12.3 工具和资源

- [OpenAPI (Swagger)](https://swagger.io/specification/) - API 文档规范
- [Postman](https://www.postman.com/) - API 测试工具
- [Insomnia](https://insomnia.rest/) - API 客户端工具

---

## 13. 总结

RESTful API 设计是一个需要综合考虑多个方面的复杂任务。遵循本文档中的规范和最佳实践，可以设计出：

- ✅ **清晰直观**：易于理解和使用的 API
- ✅ **标准化**：符合行业标准和最佳实践
- ✅ **可扩展**：易于维护和扩展
- ✅ **安全可靠**：安全性和可靠性得到保障
- ✅ **高性能**：具有良好的性能表现

**记住**：好的 API 设计不仅仅是技术问题，更是用户体验问题。始终从用户（API 使用者）的角度思考设计决策。

---

**文档维护**：本文档应该随着 RESTful API 设计实践的发展而持续更新。

**最后更新**：2025-01-XX

