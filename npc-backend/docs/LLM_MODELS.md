# LLM 模型列表和更新信息（2025年及之后）

**文档版本**：v2.0  
**最后更新**：2025-11-20  
**数据来源**：各提供商官方文档和公开资料  
**说明**：本文档仅包含 2025 年及之后发布的模型

---

## 1. OpenAI（2025年模型）

### 1.1 模型列表

| 模型名称（API调用） | 发布时间 | 说明 | 状态 |
|-------------------|---------|------|------|
| `gpt-4.5` | 2025-02-27 | GPT-4.5 (代号 Orion)，下一代模型 | ✅ 可用 |
| `gpt-4.1` | 2025-04-14 | GPT-4.1 标准版，支持 100万 token 上下文 | ✅ 可用 |
| `gpt-4.1-mini` | 2025-04-14 | GPT-4.1 轻量版本 | ✅ 可用 |
| `gpt-4.1-nano` | 2025-04-14 | GPT-4.1 超轻量版本 | ✅ 可用 |
| `gpt-5` | 2025-09 | GPT-5，最先进的 AI 系统 | ✅ 可用 |
| `o3-mini` | 2025-01-31 | OpenAI o3-mini，推理增强模型 | ✅ 可用 |
| `o3-mini-high` | 2025-01-31 | OpenAI o3-mini-high，高性能推理模型 | ✅ 可用 |
| `gpt-oss-120b` | 2025-08-05 | GPT-OSS 1170亿参数开源模型 | ✅ 可用 |
| `gpt-oss-20b` | 2025-08-05 | GPT-OSS 210亿参数开源模型 | ✅ 可用 |

### 1.2 API 端点

- **OpenAI 直接调用**：
  - Base URL: `https://api.openai.com/v1`
  - Chat Completions: `POST /chat/completions`
  - 模型名称：直接使用上表中的模型名称（如 `gpt-4.5`）

- **通过 OpenRouter 调用**：
  - Base URL: `https://openrouter.ai/api/v1`
  - Chat Completions: `POST /chat/completions`
  - 模型名称格式：`openai/gpt-4.5`、`openai/gpt-4.1`、`openai/gpt-5` 等

### 1.3 重要说明

- **模型名称差异**：OpenAI 官方 API 使用 `gpt-4.5`，OpenRouter 使用 `openai/gpt-4.5`
- **GPT-4.5 (Orion)**：可能尚未全面开放，需检查可用性
- **GPT-OSS 系列**：开源模型，采用 Apache 2.0 授权

---

## 2. Anthropic Claude（2025年模型）

### 2.1 模型列表

| 模型名称（API调用） | 发布时间 | 说明 | 状态 |
|-------------------|---------|------|------|
| `claude-4-5-sonnet` | 2025-09-30 | Claude 4.5 Sonnet，最新版本 | ✅ 可用 |
| `claude-4-5-haiku` | 2025-10-15 | Claude 4.5 Haiku，轻量版本 | ✅ 可用 |
| `claude-4-sonnet` | 2025-11 | Claude 4 Sonnet，支持 200K token 上下文 | ✅ 可用 |
| `claude-3-7-sonnet` | 2025-03 | Claude 3.7 Sonnet，提升道德推理能力 | ✅ 可用 |

### 2.2 API 端点

- **Anthropic 直接调用**：
  - Base URL: `https://api.anthropic.com/v1`
  - Chat Completions: `POST /messages`
  - 模型名称：直接使用上表中的模型名称（如 `claude-4-5-sonnet`）

- **通过 OpenRouter 调用**：
  - Base URL: `https://openrouter.ai/api/v1`
  - Chat Completions: `POST /chat/completions`
  - 模型名称格式：`anthropic/claude-4-5-sonnet`、`anthropic/claude-4-5-haiku`、`anthropic/claude-4-sonnet`、`anthropic/claude-3-7-sonnet`

### 2.3 重要说明

- **模型名称差异**：
  - **Anthropic 官方 API**：`claude-4-5-sonnet`、`claude-4-5-haiku`（版本号在前）
  - **OpenRouter API**：可能存在两种格式：
    - `anthropic/claude-4-5-sonnet`（版本号在前，标准格式）
    - `anthropic/claude-sonnet-4.5`（模型类型在前，代码中使用的格式）
  - **建议**：通过 OpenRouter 的 `GET /models` 接口确认实际可用的模型名称格式

- **Claude 4.5 Sonnet**：在 SWE-bench Verify 中准确率达 82%
- **Claude 4.5 Haiku**：轻量版本，适合快速响应场景
- **Claude with Skills**：2025-10 推出的新功能，允许动态调用"技能"处理专业化任务

---

## 3. OpenRouter（2025年模型）

### 3.1 支持的模型格式

OpenRouter 支持多个提供商的模型，模型名称格式为：`provider/model-name`

### 3.2 2025年新增模型

| 模型名称（OpenRouter格式） | 提供商 | 发布时间 | 说明 | 状态 |
|-------------------------|--------|---------|------|------|
| `openai/gpt-4.5` | OpenAI | 2025-02-27 | GPT-4.5 (Orion) | ✅ 可用 |
| `openai/gpt-4.1` | OpenAI | 2025-04-14 | GPT-4.1 | ✅ 可用 |
| `openai/gpt-4.1-mini` | OpenAI | 2025-04-14 | GPT-4.1 Mini | ✅ 可用 |
| `openai/gpt-4.1-nano` | OpenAI | 2025-04-14 | GPT-4.1 Nano | ✅ 可用 |
| `openai/gpt-5` | OpenAI | 2025-09 | GPT-5 | ✅ 可用 |
| `openai/o3-mini` | OpenAI | 2025-01-31 | OpenAI o3-mini | ✅ 可用 |
| `openai/o3-mini-high` | OpenAI | 2025-01-31 | OpenAI o3-mini-high | ✅ 可用 |
| `openai/gpt-oss-120b` | OpenAI | 2025-08-05 | GPT-OSS 120B | ✅ 可用 |
| `openai/gpt-oss-20b` | OpenAI | 2025-08-05 | GPT-OSS 20B | ✅ 可用 |
| `anthropic/claude-4-5-sonnet` | Anthropic | 2025-09-30 | Claude 4.5 Sonnet（标准格式） | ✅ 可用 |
| `anthropic/claude-sonnet-4.5` | Anthropic | 2025-09-30 | Claude 4.5 Sonnet（代码中使用的格式） | ⚠️ 需确认 |
| `anthropic/claude-4-5-haiku` | Anthropic | 2025-10-15 | Claude 4.5 Haiku（标准格式） | ✅ 可用 |
| `anthropic/claude-4-sonnet` | Anthropic | 2025-11 | Claude 4 Sonnet | ✅ 可用 |
| `anthropic/claude-sonnet-4` | Anthropic | 2025-11 | Claude 4 Sonnet（代码中使用的格式） | ⚠️ 需确认 |
| `anthropic/claude-3-7-sonnet` | Anthropic | 2025-03 | Claude 3.7 Sonnet（标准格式） | ✅ 可用 |
| `anthropic/claude-sonnet-3.7` | Anthropic | 2025-03 | Claude 3.7 Sonnet（代码中使用的格式） | ⚠️ 需确认 |
| `openrouter/cypher-alpha` | OpenRouter | 2025-07 | Cypher Alpha，支持 100万 token 上下文 | ✅ 可用 |

### 3.3 API 端点

- Base URL: `https://openrouter.ai/api/v1`
- Chat Completions: `POST /chat/completions`
- 模型列表: `GET /models`（可动态获取可用模型列表）

### 3.4 重要说明

- **模型名称格式**：必须使用 `provider/model-name` 格式
- **动态获取**：可通过 `GET /models` 接口动态获取最新可用模型列表
- **Cypher Alpha**：OpenRouter 独家模型，支持 100万 token 上下文，具备推理能力

---

## 4. 模型选择建议

### 4.1 按用途选择

- **通用对话**：`openai/gpt-4.1`、`anthropic/claude-4-5-sonnet`
- **代码生成**：`openai/gpt-5`、`anthropic/claude-4-5-sonnet`
- **数学推理**：`openai/o3-mini`、`openai/o3-mini-high`
- **长文本处理**：`anthropic/claude-4-sonnet`（200K tokens）、`openrouter/cypher-alpha`（100万 tokens）
- **轻量快速**：`openai/gpt-4.1-mini`、`openai/gpt-4.1-nano`、`anthropic/claude-4-5-haiku`

### 4.2 按成本选择

- **经济型**：`openai/gpt-4.1-mini`、`openai/gpt-4.1-nano`
- **平衡型**：`openai/gpt-4.1`、`anthropic/claude-4-5-haiku`
- **高性能**：`openai/gpt-5`、`anthropic/claude-4-5-sonnet`、`openrouter/cypher-alpha`

---

## 5. 配置示例

### 5.1 OpenAI 直接调用配置

```bash
ENABLE_OPENAI=true
OPENAI_API_KEY=sk-...
MODELS=gpt-4.5:openai,gpt-4.1:openai,gpt-5:openai
```

### 5.2 Anthropic 直接调用配置

```bash
ENABLE_ANTHROPIC=true
ANTHROPIC_API_KEY=sk-ant-...
MODELS=claude-4-5-sonnet:anthropic,claude-4-5-haiku:anthropic
```

### 5.3 OpenRouter 配置（推荐）

```bash
ENABLE_OPENROUTER=true
OPENROUTER_API_KEY=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
MODELS=openai/gpt-4.5:openrouter,openai/gpt-4.1:openrouter,openai/gpt-5:openrouter,anthropic/claude-4-5-sonnet:openrouter,anthropic/claude-4-5-haiku:openrouter
```

---

## 6. 注意事项

1. **模型名称格式差异**：
   - **OpenAI 直接调用**：使用 `gpt-4.5`、`gpt-4.1`、`gpt-5` 等
   - **Anthropic 直接调用**：使用 `claude-4-5-sonnet`、`claude-4-5-haiku` 等
   - **OpenRouter 调用**：使用 `openai/gpt-4.5`、`anthropic/claude-4-5-sonnet` 等格式

2. **模型可用性**：
   - 部分模型可能在不同地区有不同的可用性
   - 建议定期查看各提供商的官方文档获取最新信息
   - 可通过 OpenRouter 的 `GET /models` 接口动态获取可用模型列表

3. **API 版本**：
   - 各提供商的 API 可能会更新，建议关注官方公告
   - OpenAI 和 Anthropic 的 API 格式可能不同（如 Anthropic 使用 `/messages` 而非 `/chat/completions`）

4. **代码中的模型名称**：
   - 代码中使用的模型名称格式：`anthropic/claude-sonnet-4.5`、`anthropic/claude-sonnet-4`、`anthropic/claude-3.7-sonnet`
   - 标准 API 格式可能是：`anthropic/claude-4-5-sonnet`、`anthropic/claude-4-sonnet`、`anthropic/claude-3-7-sonnet`
   - **建议**：通过 OpenRouter 的 `GET /models` 接口或实际测试确认正确的 API 调用名称
   - **当前代码使用的格式**（在 `config/models.js` 中）：
     - `anthropic/claude-sonnet-4.5`
     - `anthropic/claude-sonnet-4`
     - `anthropic/claude-3.7-sonnet`
     - `openai/gpt-5`
     - `openai/gpt-4.1`

---

## 7. 参考链接

- [OpenAI Models](https://platform.openai.com/docs/models)
- [DeepSeek API Documentation](https://api-docs.deepseek.com/)
- [OpenRouter Models](https://openrouter.ai/models)

---

**最后更新**：2025-11-20  
**维护者**：开发团队

---

## 7. 代码中实际使用的模型名称

### 7.1 当前代码配置（config/models.js）

以下模型名称是代码中实际使用的格式（通过 OpenRouter 调用）：

**Anthropic Claude 模型**：
- `anthropic/claude-sonnet-4.5` - Claude Sonnet 4.5
- `anthropic/claude-sonnet-4` - Claude Sonnet 4
- `anthropic/claude-3.7-sonnet` - Claude 3.7 Sonnet

**OpenAI 模型**：
- `openai/gpt-5` - GPT-5
- `openai/gpt-4.1` - GPT-4.1

**其他模型**：
- `google/gemini-3-pro-preview` - Gemini 3 Pro Preview
- `google/gemini-2.5-pro` - Gemini 2.5 Pro
- `tngtech/deepseek-r1t2-chimera:free` - DeepSeek R1T2 Chimera (免费)

### 7.2 格式说明

- **Anthropic 模型格式**：代码中使用 `anthropic/claude-sonnet-4.5`（模型类型在前），而非标准格式 `anthropic/claude-4-5-sonnet`（版本号在前）
- **OpenAI 模型格式**：代码中使用 `openai/gpt-5`、`openai/gpt-4.1`（标准格式）
- **所有模型**：统一通过 OpenRouter 调用，提供商为 `openrouter`

### 7.3 使用建议

1. **创建 Agent 时**：使用代码中配置的模型名称格式
2. **验证模型**：可通过 `config/models.js` 的 `getSupportedModels()` 函数获取支持的模型列表
3. **动态获取**：可通过 OpenRouter 的 `GET /models` 接口获取最新可用模型列表

---

## 8. 文档维护说明

### ⚠️ 重要提示

**本文档需要人工维护**，因为：

1. **模型更新频繁**：各提供商定期发布新模型，模型列表会变化
2. **模型名称变化**：同一模型可能有多个版本名称
3. **模型格式差异**：不同提供商的模型命名格式不同
4. **模型可用性变化**：某些模型可能被弃用或替换

### 维护策略

1. **定期检查**：建议每月检查一次各提供商的模型更新
2. **更新文档**：发现新模型或模型变化时，及时更新本文档
3. **测试验证**：更新后通过 `test-llm.js` 验证模型可用性
4. **同步代码**：如有必要，同步更新代码中的相关注释

### 参考资源

- [OpenAI Models](https://platform.openai.com/docs/models) - OpenAI 官方模型文档
- [DeepSeek API Documentation](https://api-docs.deepseek.com/) - DeepSeek 官方 API 文档
- [OpenRouter Models](https://openrouter.ai/models) - OpenRouter 模型列表（可动态获取）

### 相关文档

- [实现问题记录.md](../实现问题记录.md) - PROB-006：LLM 模型列表数据维护问题

