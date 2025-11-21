# NPC Backend - LLM 配置说明

## 环境变量配置

### 1. 启用提供商

通过环境变量控制启用哪些 LLM 提供商：

```bash
# 启用 OpenAI
ENABLE_OPENAI=true

# 启用 DeepSeek
ENABLE_DEEPSEEK=true

# 启用 OpenRouter
ENABLE_OPENROUTER=true
```

### 2. 配置预设模型（可选）

如果配置了预设模型，用户只能选择预设的模型。如果不配置，用户可以输入任意模型名称（需要指定提供商）。

```bash
# 格式：模型名:提供商，多个模型用逗号分隔
MODELS=gpt-4:openai,gpt-3.5-turbo:openai,deepseek-chat:deepseek
```

### 3. API Key 配置

**当前方式**：在环境变量中配置 API Key（服务端统一管理）

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-...

# DeepSeek API Key
DEEPSEEK_API_KEY=sk-...

# OpenRouter API Key
OPENROUTER_API_KEY=sk-...

# OpenRouter 可选配置
OPENROUTER_REFERER=https://github.com
OPENROUTER_TITLE=NPC Chat
```

**未来扩展**：如果将来需要支持用户自定义 API Key，可以在 `models.js` 中添加配置选项，并在 `LLMService.js` 中支持从用户配置读取 API Key。

## 配置模式

### 模式 1：只启用提供商，不配置预设模型

**配置示例**：
```bash
ENABLE_OPENAI=true
ENABLE_DEEPSEEK=true
# MODELS 不设置或为空
```

**行为**：
- 用户可以输入任意模型名称
- 创建 Agent 时必须指定 `provider` 字段
- 例如：`{ model: "custom-model", provider: "openai" }`

### 模式 2：启用提供商并配置预设模型

**配置示例**：
```bash
ENABLE_OPENAI=true
ENABLE_DEEPSEEK=true
MODELS=gpt-4:openai,gpt-3.5-turbo:openai,deepseek-chat:deepseek
```

**行为**：
- 用户只能选择预设的模型
- 创建 Agent 时不需要指定 `provider`（自动推断）
- 例如：`{ model: "gpt-4" }`（provider 自动推断为 "openai"）

## API 使用示例

### 创建 Agent（预设模型）

```json
POST /api/v1/agents
{
  "userId": "user_123",
  "name": "学习教练",
  "type": "special",
  "model": "gpt-4",
  "systemPrompt": "你是一位专业的学习教练..."
}
```

### 创建 Agent（自定义模型）

```json
POST /api/v1/agents
{
  "userId": "user_123",
  "name": "学习教练",
  "type": "special",
  "model": "custom-model-name",
  "provider": "openai",
  "systemPrompt": "你是一位专业的学习教练..."
}
```

## 配置信息查询

可以通过 `config/models.js` 的 `getConfigInfo()` 函数获取当前配置信息：

```javascript
const { getConfigInfo } = require('./config/models');
const config = getConfigInfo();

console.log(config);
// {
//   enabledProviders: ['openai', 'deepseek'],
//   presetModels: { 'gpt-4': 'openai', 'gpt-3.5-turbo': 'openai' },
//   hasPresetModels: true,
//   allowCustomModels: true
// }
```
