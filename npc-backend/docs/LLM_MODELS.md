# LLM 模型列表和更新信息

**文档版本**：v1.0  
**最后更新**：2025-11-20  
**数据来源**：各提供商官方文档和公开资料

---

## 1. OpenAI

### 1.1 当前可用模型（Chat Completions API）

| 模型名称 | 发布时间 | 说明 | 状态 |
|---------|---------|------|------|
| `gpt-4o` | 2024-05-13 | 最新旗舰模型，多模态支持 | ✅ 可用 |
| `gpt-4o-mini` | 2024-10-29 | GPT-4o 的轻量版本 | ✅ 可用 |
| `gpt-4-turbo` | 2024-04-09 | GPT-4 的快速版本 | ✅ 可用 |
| `gpt-4` | 2023-03-14 | GPT-4 标准版 | ✅ 可用 |
| `gpt-3.5-turbo` | 2023-03-01 | GPT-3.5 Turbo | ✅ 可用 |

### 1.2 最新更新

- **GPT-4o**（2024-05-13）：多模态模型，支持文本、图像、音频输入
- **GPT-4.5 (Orion)**（2025-02-27）：下一代模型，性能更强（可能尚未全面开放）

### 1.3 API 端点

- Base URL: `https://api.openai.com/v1`
- Chat Completions: `POST /chat/completions`

---

## 2. DeepSeek

### 2.1 当前可用模型（Chat Completions API）

| 模型名称 | 发布时间 | 说明 | 状态 |
|---------|---------|------|------|
| `deepseek-chat` | 2024-12 | 通用对话模型 | ✅ 可用 |
| `deepseek-v3` | 2024-12-26 | 最新版本，性能对标 GPT-4o | ✅ 可用 |
| `deepseek-r1` | 2025-01-10 | 推理增强模型 | ✅ 可用 |

### 2.2 最新更新

- **DeepSeek-V3**（2024-12-26）：专注于数学、编码和中文任务
- **DeepSeek-R1-0528**（2025-05-28）：增强思维深度与推理能力
- **DeepSeek-V3.1**（2025-08-21）：混合架构，支持思考和非思考模式
- **DeepSeek-V3.2-Exp**（2025-10）：采用 Sparse Attention 机制

### 2.3 API 端点

- Base URL: `https://api.deepseek.com/v1`
- Chat Completions: `POST /chat/completions`

---

## 3. OpenRouter

### 3.1 支持的模型格式

OpenRouter 支持多个提供商的模型，模型名称格式为：`provider/model-name`

### 3.2 主要支持的模型

| 模型名称 | 提供商 | 说明 | 状态 |
|---------|--------|------|------|
| `openai/gpt-4o` | OpenAI | GPT-4o | ✅ 可用 |
| `openai/gpt-4-turbo` | OpenAI | GPT-4 Turbo | ✅ 可用 |
| `openai/gpt-3.5-turbo` | OpenAI | GPT-3.5 Turbo | ✅ 可用 |
| `anthropic/claude-4.5-sonnet` | Anthropic | Claude 4.5 Sonnet（最新，2025-09-30） | ✅ 可用 |
| `anthropic/claude-3.5-sonnet` | Anthropic | Claude 3.5 Sonnet | ✅ 可用 |
| `anthropic/claude-3-opus` | Anthropic | Claude 3 Opus | ✅ 可用 |
| `anthropic/claude-3-haiku` | Anthropic | Claude 3 Haiku | ✅ 可用 |
| `google/gemini-pro-1.5` | Google | Gemini 1.5 Pro | ✅ 可用 |
| `meta-llama/llama-3.1-70b-instruct` | Meta | Llama 3.1 70B | ✅ 可用 |
| `deepseek/deepseek-chat` | DeepSeek | DeepSeek Chat | ✅ 可用 |

### 3.3 最新更新

- **Claude 4.5 Sonnet**（2025-09-30）：最新版本，在 SWE-bench Verify 中准确率达 82%
- **Claude 4.1 Opus**（2025-08-06）：增强代理任务、代码编写和逻辑推理能力
- **Claude 4 Opus**（2025-05-22）：被誉为"世界上最好的编程模型"
- **Claude 3.7 系列**（2025-03）：提升道德推理和长期记忆能力
- **Gemini 2.5 系列**（2025-03-25）：推理能力显著提升，支持 1M token 上下文
- **Llama 4 系列**（2025-04）：支持 1000 万 tokens 上下文窗口

### 3.4 API 端点

- Base URL: `https://openrouter.ai/api/v1`
- Chat Completions: `POST /chat/completions`
- 模型列表: `GET /models`（可动态获取可用模型列表）

---

## 4. 模型选择建议

### 4.1 按用途选择

- **通用对话**：`gpt-4o`, `deepseek-chat`, `openai/gpt-3.5-turbo`
- **代码生成**：`deepseek-chat`, `gpt-4o`
- **数学推理**：`deepseek-v3`, `gpt-4o`
- **长文本处理**：`anthropic/claude-3.5-sonnet`（200K tokens）

### 4.2 按成本选择

- **经济型**：`gpt-3.5-turbo`, `deepseek-chat`
- **平衡型**：`gpt-4o-mini`, `deepseek-v3`
- **高性能**：`gpt-4o`, `anthropic/claude-3.5-sonnet`

---

## 5. 配置示例

### 5.1 OpenAI 配置

```bash
ENABLE_OPENAI=true
OPENAI_API_KEY=sk-...
MODELS=gpt-4o:openai,gpt-4-turbo:openai,gpt-3.5-turbo:openai
```

### 5.2 DeepSeek 配置

```bash
ENABLE_DEEPSEEK=true
DEEPSEEK_API_KEY=sk-...
MODELS=deepseek-chat:deepseek,deepseek-v3:deepseek
```

### 5.3 OpenRouter 配置

```bash
ENABLE_OPENROUTER=true
OPENROUTER_API_KEY=sk-...
MODELS=openai/gpt-4o:openrouter,anthropic/claude-4.5-sonnet:openrouter
```

---

## 6. 注意事项

1. **模型名称格式**：
   - OpenAI/DeepSeek：直接使用模型名称（如 `gpt-4o`）
   - OpenRouter：使用 `provider/model-name` 格式（如 `anthropic/claude-3-opus`）

2. **模型可用性**：
   - 部分模型可能在不同地区有不同的可用性
   - 建议定期查看各提供商的官方文档获取最新信息

3. **API 版本**：
   - 各提供商的 API 可能会更新，建议关注官方公告

---

## 7. 参考链接

- [OpenAI Models](https://platform.openai.com/docs/models)
- [DeepSeek API Documentation](https://api-docs.deepseek.com/)
- [OpenRouter Models](https://openrouter.ai/models)

---

**最后更新**：2025-11-20  
**维护者**：开发团队

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

