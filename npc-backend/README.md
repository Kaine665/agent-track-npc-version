# NPC Backend - LLM 配置说明

## 环境变量配置

### V1 版本：统一使用 OpenRouter

**V1 版本统一使用 OpenRouter 作为模型供应商**，所有模型都通过 OpenRouter 调用。

### 1. API Key 配置（必需）

**必须配置 OpenRouter API Key**：

```bash
# OpenRouter API Key（必需）
OPENROUTER_API_KEY=sk-or-v1-...

# OpenRouter 可选配置
OPENROUTER_REFERER=https://github.com
OPENROUTER_TITLE=NPC Chat
```

### 2. 支持的模型列表

V1 版本支持以下模型（统一通过 OpenRouter 调用）：

- `anthropic/claude-sonnet-4.5` - Claude Sonnet 4.5（推荐）
- `anthropic/claude-sonnet-4` - Claude Sonnet 4
- `anthropic/claude-3.7-sonnet` - Claude 3.7 Sonnet
- `google/gemini-3-pro-preview` - Gemini 3 Pro Preview
- `google/gemini-2.5-pro` - Gemini 2.5 Pro
- `openai/gpt-5` - GPT-5
- `openai/gpt-4.1` - GPT-4.1
- `tngtech/deepseek-r1t2-chimera:free` - DeepSeek R1 T2 Chimera（免费）

**注意**：V1 版本不再需要配置 `ENABLE_*` 或 `MODELS` 环境变量，所有模型统一使用 OpenRouter。

**未来扩展**：如果将来需要支持用户自定义 API Key，可以在 `models.js` 中添加配置选项，并在 `LLMService.js` 中支持从用户配置读取 API Key。

## 配置说明

### V1 版本配置

**V1 版本统一使用 OpenRouter**，配置非常简单：

1. **只需配置 OpenRouter API Key**：

   ```bash
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

2. **创建 Agent 时**：
   - 从预设模型列表中选择模型
   - 不需要指定 `provider`（自动使用 OpenRouter）
   - 例如：`{ model: "anthropic/claude-sonnet-4.5" }`

## API 使用示例

### 创建 Agent（V1 版本）

```json
POST /api/v1/agents
{
  "userId": "user_123",
  "name": "学习教练",
  "type": "special",
  "model": "anthropic/claude-sonnet-4.5",
  "systemPrompt": "你是一位专业的学习教练..."
}
```

**注意**：

- `model` 字段必须使用预设模型列表中的模型名称
- 不需要指定 `provider`（自动使用 OpenRouter）
- 如果指定了 `provider`，会被忽略（向后兼容）

## 配置信息查询

可以通过 `config/models.js` 的 `getConfigInfo()` 函数获取当前配置信息：

```javascript
const { getConfigInfo } = require("./config/models");
const config = getConfigInfo();

console.log(config);
// {
//   enabledProviders: ['openrouter'],
//   presetModels: {
//     'anthropic/claude-sonnet-4.5': 'openrouter',
//     'anthropic/claude-sonnet-4': 'openrouter',
//     ...
//   },
//   hasPresetModels: true,
//   allowCustomModels: false
// }
```

## 获取 OpenRouter API Key

1. 访问 [OpenRouter.ai](https://openrouter.ai/)
2. 注册账号并登录
3. 在 Dashboard 中创建 API Key
4. 将 API Key 配置到环境变量 `OPENROUTER_API_KEY`
