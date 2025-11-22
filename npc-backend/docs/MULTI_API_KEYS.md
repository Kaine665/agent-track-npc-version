# 多 API Key 故障转移配置指南

**文档版本**：v1.0  
**最后更新**：2025-11-22

---

## 📋 概述

系统支持为每个 LLM 提供商配置多个 API Key，实现自动故障转移。当第一个 API Key 失败时，系统会自动尝试下一个，提高服务的可用性和稳定性。

---

## 🚀 快速开始

### 配置多个 API Key

在 `.env` 文件中，用**逗号分隔**多个 API Key：

```env
# OpenRouter API Key（多个）
OPENROUTER_API_KEY=key1,key2,key3

# OpenAI API Key（多个）
OPENAI_API_KEY=key1,key2,key3

# DeepSeek API Key（多个）
DEEPSEEK_API_KEY=key1,key2,key3
```

### 示例

```env
# 配置 3 个 OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-abc123,sk-or-v1-def456,sk-or-v1-ghi789
```

---

## 🔄 故障转移机制

### 触发条件

系统会在以下情况自动切换到下一个 API Key：

1. **401 Unauthorized**：API Key 无效或已过期
2. **403 Forbidden**：API Key 权限不足
3. **429 Too Many Requests**：API Key 达到速率限制
4. **超时错误**：API 调用超时（默认 30 秒）
5. **网络错误**：连接失败、DNS 解析失败等

### 不触发故障转移的情况

以下情况**不会**触发故障转移（会直接抛出错误）：

1. **400 Bad Request**：请求格式错误（所有 API Key 都会失败）
2. **500+ Server Error**：服务器错误（不是 API Key 问题）
3. **所有 API Key 都已尝试**：最后一个 API Key 失败后抛出错误

---

## 📊 工作流程

```
调用 LLM API
    ↓
尝试 API Key 1
    ↓
成功？ → 是 → 返回结果 ✅
    ↓
    否
    ↓
是否可重试错误？ → 否 → 抛出错误 ❌
    ↓
    是
    ↓
还有更多 API Key？ → 否 → 抛出最后一个错误 ❌
    ↓
    是
    ↓
尝试 API Key 2
    ↓
（重复上述流程）
```

---

## 💡 使用场景

### 场景 1：API Key 配额管理

**问题**：单个 API Key 有速率限制，高峰期容易触发 429 错误。

**解决方案**：配置多个 API Key，系统自动负载均衡。

```env
OPENROUTER_API_KEY=key1,key2,key3
```

### 场景 2：API Key 失效保护

**问题**：API Key 可能过期或被撤销，导致服务中断。

**解决方案**：配置备用 API Key，主 Key 失效时自动切换。

```env
OPENROUTER_API_KEY=primary_key,backup_key1,backup_key2
```

### 场景 3：多账户管理

**问题**：使用多个账户的 API Key，需要统一管理。

**解决方案**：将所有 API Key 配置在一起，系统自动选择可用的。

```env
OPENROUTER_API_KEY=account1_key,account2_key,account3_key
```

---

## 📝 日志说明

### 成功日志

如果使用了备用 API Key（第 2 个或之后），会记录日志：

```
[LLMService] Successfully used API Key 2/3 after 1 failed attempts
```

### 警告日志

当 API Key 失败并切换到下一个时，会记录警告：

```
[LLMService] API Key 1/3 failed (401): User not found., trying next...
[LLMService] API Key 2/3 timeout, trying next...
[LLMService] API Key 1/3 network error: Connection timeout, trying next...
```

### 错误日志

所有 API Key 都失败时，会抛出最后一个错误：

```
[MessageService] Failed to process LLM reply: {
  code: 'LLM_API_ERROR',
  message: '所有 API Key 调用失败',
  provider: 'openrouter'
}
```

---

## ⚙️ 配置示例

### Docker Compose 配置

在 `docker-compose.yml` 中：

```yaml
services:
  backend:
    environment:
      # 多个 API Key，用逗号分隔
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:-}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY:-}
```

在 `.env` 文件中：

```env
# 多个 OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-key1,sk-or-v1-key2,sk-or-v1-key3

# 单个 OpenAI API Key（也支持）
OPENAI_API_KEY=sk-abc123

# 多个 DeepSeek API Key
DEEPSEEK_API_KEY=sk-deepseek-key1,sk-deepseek-key2
```

---

## 🔍 故障排查

### 问题 1：所有 API Key 都失败

**症状**：日志显示所有 API Key 都尝试失败。

**可能原因**：
- 所有 API Key 都已过期
- 请求格式错误（400 错误不会触发故障转移）
- 网络问题

**解决方案**：
1. 检查 API Key 是否有效
2. 检查网络连接
3. 查看详细错误日志

### 问题 2：故障转移不工作

**症状**：第一个 API Key 失败后没有尝试下一个。

**可能原因**：
- 错误类型不是可重试错误（如 400 Bad Request）
- API Key 格式错误（没有用逗号分隔）

**解决方案**：
1. 检查 API Key 格式：`key1,key2,key3`（逗号分隔，无空格）
2. 检查错误类型：只有 401/403/429/超时/网络错误会触发故障转移

### 问题 3：性能问题

**症状**：故障转移导致响应时间变长。

**可能原因**：
- 第一个 API Key 超时（30 秒）后才尝试下一个
- 配置了太多 API Key

**解决方案**：
1. 将最可靠的 API Key 放在第一位
2. 减少超时时间（修改 `timeout` 参数）
3. 定期检查 API Key 有效性

---

## 📚 相关文档

- [LLM 模型配置指南](./LLM_MODELS.md)
- [部署文档](../../DEPLOYMENT.md)
- [环境变量配置](../../env.example)

---

## 🔗 相关文件

- `npc-backend/services/LLMService.js`：LLM 服务实现
- `npc-backend/config/config-loader.js`：配置加载器
- `docker-compose.yml`：Docker Compose 配置
- `.env`：环境变量配置

---

## 📌 注意事项

1. **API Key 顺序**：将最可靠的 API Key 放在第一位，减少故障转移次数
2. **安全性**：不要在代码中硬编码 API Key，使用环境变量
3. **配额管理**：注意每个 API Key 的配额限制，避免同时耗尽
4. **日志监控**：定期查看日志，及时发现 API Key 问题
5. **格式要求**：API Key 之间用逗号分隔，不要有空格（系统会自动去除空格）

---

## ✅ 最佳实践

1. **配置 2-3 个备用 API Key**：提供足够的冗余
2. **定期轮换 API Key**：将使用频率低的 Key 放在前面，平衡使用
3. **监控故障转移频率**：如果频繁切换，检查 API Key 状态
4. **测试故障转移**：定期测试备用 API Key 是否正常工作

---

## 🆘 获取帮助

如果遇到问题，请：

1. 查看日志：`sudo docker-compose logs backend | grep LLMService`
2. 检查配置：确认 `.env` 文件格式正确
3. 测试 API Key：使用 curl 测试单个 API Key 是否有效
4. 查看文档：参考相关文档和错误信息

