# API 设计最佳实践

**来源**：`docs/RESTful-API设计规范.md`  
**适用场景**：RESTful API 设计、接口规范制定

---

## 🎯 核心设计原则

### 1. 资源导向设计

**原则**：
- 使用名词表示资源，不使用动词
- URL 应该清晰表达资源的层次结构
- 资源应该是可寻址的（有唯一 URL）

**示例**：

```
✅ 正确：
GET /api/users          # 获取用户列表
GET /api/users/123      # 获取 ID 为 123 的用户

❌ 错误：
GET /api/getUsers       # 使用动词
GET /api/user?id=123    # 使用查询参数表示资源 ID
```

---

### 2. 使用标准 HTTP 方法

| HTTP 方法 | 用途 | 幂等性 | 安全性 |
|----------|------|--------|--------|
| GET | 获取资源 | ✅ | ✅ |
| POST | 创建资源 | ❌ | ❌ |
| PUT | 更新资源（完整替换） | ✅ | ❌ |
| PATCH | 更新资源（部分更新） | ❌ | ❌ |
| DELETE | 删除资源 | ✅ | ❌ |

---

### 3. 统一响应格式

**成功响应**：

```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "John"
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
    "message": "Error description"
  },
  "timestamp": 1703001234567
}
```

---

## 📋 状态码使用规范

### 2xx - 成功状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 OK | 请求成功 | GET、PUT、PATCH、DELETE 成功时 |
| 201 Created | 资源创建成功 | POST 创建资源成功时 |
| 204 No Content | 请求成功，无响应体 | DELETE 成功时 |

### 4xx - 客户端错误状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 400 Bad Request | 请求错误 | 参数验证失败、请求格式错误 |
| 401 Unauthorized | 未授权 | 未提供认证信息或认证失败 |
| 403 Forbidden | 禁止访问 | 已认证但无权限 |
| 404 Not Found | 资源不存在 | 请求的资源不存在 |
| 409 Conflict | 冲突 | 资源冲突（如名称重复） |

---

## 🛡️ 安全设计规范

### 认证和授权

```http
# Bearer Token（推荐）
Authorization: Bearer <token>
```

### 输入验证

- 验证所有输入数据
- 防止 SQL 注入、XSS 攻击
- 限制输入长度和类型

### 速率限制

```http
Response: 429 Too Many Requests
Retry-After: 60
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds"
  }
}
```

---

## ⚡ 性能优化建议

### 分页设计

```http
GET /api/users?page=1&limit=20

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 字段选择

```http
# 只返回指定字段
GET /api/users?fields=id,name,email
```

### 缓存策略

```http
Cache-Control: public, max-age=3600
ETag: "abc123"
```

---

## ❌ 常见错误避免

1. **使用动词而非名词**
   ```
   ❌ GET /api/getUsers
   ✅ GET /api/users
   ```

2. **在 URL 中使用动词**
   ```
   ❌ POST /api/users/create
   ✅ POST /api/users
   ```

3. **错误的状态码使用**
   ```
   ❌ 删除成功返回 200 OK
   ✅ 删除成功返回 204 No Content
   ```

4. **暴露敏感信息**
   ```
   ❌ "Database error: connection timeout"
   ✅ "An error occurred. Please try again later"
   ```

---

## 📝 设计原则清单

- ✅ **资源导向**：使用名词表示资源
- ✅ **标准方法**：使用标准 HTTP 方法
- ✅ **无状态**：每个请求独立处理
- ✅ **统一格式**：使用统一的请求和响应格式
- ✅ **错误处理**：提供清晰的错误信息
- ✅ **版本控制**：明确版本管理策略
- ✅ **安全设计**：实施认证、授权、输入验证
- ✅ **性能优化**：支持分页、缓存、批量操作

---

