/**
 * ============================================
 * LLM 服务层 (LLMService.js)
 * ============================================
 *
 * 【文件职责】
 * 封装 LLM API 调用，支持多个提供商（OpenAI、DeepSeek、OpenRouter）
 *
 * 【主要功能】
 * 1. 多提供商支持（OpenAI、DeepSeek、OpenRouter）
 * 2. Prompt 构建（systemPrompt + messages）
 * 3. 错误处理和重试机制（最多重试 2 次，间隔 1 秒）
 * 4. 超时处理（30 秒）
 * 5. 统一错误格式
 *
 * 【工作流程】
 * 接收参数 → 选择提供商 → 构建请求 → 调用 API → 重试（如需要）→ 返回结果
 *
 * 【依赖】
 * - config/models.js: 获取模型提供商信息
 * - Node.js 内置 fetch（Node.js 18+）
 *
 * 【被谁使用】
 * - services/MessageService.js: 调用生成回复
 *
 * 【错误处理】
 * - API 错误：抛出包含错误码和消息的对象
 * - 超时错误：抛出 LLM_API_TIMEOUT
 * - 网络错误：自动重试
 *
 * 【环境变量】
 * - OPENAI_API_KEY: OpenAI API Key
 * - DEEPSEEK_API_KEY: DeepSeek API Key
 * - OPENROUTER_API_KEY: OpenRouter API Key
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const { getModelProvider } = require("../config/models");

/**
 * 提供商配置
 *
 * 【功能说明】
 * 定义每个提供商的 API 端点和配置
 *
 * 【API Key 获取方式】
 * 当前：从环境变量读取（process.env[apiKeyEnv]）
 * - OPENAI_API_KEY
 * - DEEPSEEK_API_KEY
 * - OPENROUTER_API_KEY
 *
 * 【未来扩展】
 * 如果将来需要支持用户自定义 API Key（例如在创建 Agent 时指定），可以：
 * 1. 在 models.js 中添加 API Key 配置选项
 * 2. 在 callLLMAPI() 函数中添加参数：callLLMAPI(provider, model, systemPrompt, messages, timeout, customApiKey)
 * 3. 优先使用 customApiKey，如果未提供则使用环境变量中的 API Key
 * 4. 示例：
 *    const apiKey = customApiKey || process.env[config.apiKeyEnv];
 *
 * 【扩展示例】
 * // 在 models.js 中添加：
 * function getApiKeyForModel(modelName, customApiKeys = {}) {
 *   const provider = getModelProvider(modelName);
 *   return customApiKeys[provider] || process.env[`${provider.toUpperCase()}_API_KEY`];
 * }
 */
const PROVIDER_CONFIG = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY", // 环境变量名称
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1",
    apiKeyEnv: "DEEPSEEK_API_KEY", // 环境变量名称
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    }),
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyEnv: "OPENROUTER_API_KEY", // 环境变量名称
    headers: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://github.com",
      "X-Title": process.env.OPENROUTER_TITLE || "NPC Chat",
    }),
  },
};

/**
 * 构建消息列表
 *
 * 【功能说明】
 * 将历史事件转换为 LLM API 需要的消息格式
 *
 * 【工作流程】
 * 1. 遍历历史事件
 * 2. 根据 fromType 转换为 role（user/assistant）
 * 3. 提取 content
 * 4. 按时间顺序排列
 *
 * @param {Array<Object>} events - 历史事件列表（按时间升序）
 * @returns {Array<Object>} 消息列表 [{ role: 'user', content: '...' }, ...]
 */
function buildMessages(events) {
  return events.map((event) => {
    const role = event.fromType === "user" ? "user" : "assistant";
    return {
      role,
      content: event.content,
    };
  });
}

/**
 * 调用 LLM API
 *
 * 【功能说明】
 * 调用指定提供商的 LLM API
 *
 * 【工作流程】
 * 1. 获取提供商配置
 * 2. 获取 API Key
 * 3. 构建请求 URL 和 headers
 * 4. 发送 POST 请求
 * 5. 解析响应
 *
 * @param {string} provider - 提供商名称（openai/deepseek/openrouter）
 * @param {string} model - 模型名称
 * @param {string} systemPrompt - System prompt
 * @param {Array<Object>} messages - 消息列表
 * @param {number} timeout - 超时时间（毫秒，默认 30000）
 * @returns {Promise<string>} AI 回复内容
 * @throws {Object} 错误对象 { code, message }
 */
async function callLLMAPI(
  provider,
  model,
  systemPrompt,
  messages,
  timeout = 30000
) {
  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    throw {
      code: "INVALID_PROVIDER",
      message: `不支持的提供商：${provider}`,
    };
  }

  // 从环境变量读取 API Key
  // ⚠️ 未来扩展：如果支持用户自定义 API Key，可以添加参数：
  // const apiKey = customApiKey || process.env[config.apiKeyEnv];
  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw {
      code: "API_KEY_MISSING",
      message: `缺少 ${provider} API Key，请设置环境变量 ${config.apiKeyEnv}`,
    };
  }

  // 构建请求体
  const requestBody = {
    model: model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      ...messages,
    ],
    temperature: 0.7,
  };

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    // ⚠️ 未来扩展：如果需要代理支持，可以添加：
    // const fetchOptions = {
    //   method: "POST",
    //   headers: config.headers(apiKey),
    //   body: JSON.stringify(requestBody),
    //   signal: controller.signal,
    // };
    // if (process.env.HTTP_PROXY) {
    //   fetchOptions.agent = new HttpsProxyAgent(process.env.HTTP_PROXY);
    // }
    // const response = await fetch(`${config.baseUrl}/chat/completions`, fetchOptions);

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: config.headers(apiKey),
      body: JSON.stringify(requestBody),
      signal: controller.signal,
      // 增加连接超时时间（Node.js fetch 默认可能较短）
      // 注意：fetch 的超时由 AbortController 控制，这里只是注释说明
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        code: "LLM_API_ERROR",
        message:
          errorData.error?.message ||
          `LLM API 调用失败：${response.status} ${response.statusText}`,
        status: response.status,
        provider,
      };
    }

    const data = await response.json();

    // 提取回复内容
    if (
      data.choices &&
      data.choices.length > 0 &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      return data.choices[0].message.content.trim();
    }

    throw {
      code: "LLM_API_ERROR",
      message: "LLM API 返回格式异常",
      provider,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    // 超时错误
    if (error.name === "AbortError") {
      throw {
        code: "LLM_API_TIMEOUT",
        message: "LLM API 调用超时，请稍后重试",
        provider,
      };
    }

    // 如果是我们抛出的错误，直接抛出
    if (error.code) {
      throw error;
    }

    // 网络错误或其他错误
    const errorMessage = error.message || String(error);
    const errorCause = error.cause
      ? ` (原因: ${error.cause.message || error.cause})`
      : "";

    throw {
      code: "LLM_API_ERROR",
      message: `LLM API 调用失败：${errorMessage}${errorCause}`,
      provider,
      originalError: errorMessage,
      errorType: error.name || error.constructor?.name || "Unknown",
    };
  }
}

/**
 * 生成 AI 回复
 *
 * 【功能说明】
 * 调用 LLM API 生成回复，包含重试机制
 *
 * 【工作流程】
 * 1. 验证参数
 * 2. 获取模型提供商
 * 3. 构建消息列表
 * 4. 调用 LLM API（带重试）
 * 5. 返回回复内容
 *
 * 【重试机制】
 * - 最多重试 2 次（总共 3 次尝试）
 * - 重试间隔：1 秒（指数退避：1s, 2s）
 * - 超时错误不重试
 * - API Key 错误不重试
 *
 * @param {Object} options - 调用选项
 * @param {string} options.model - 模型名称
 * @param {string} [options.provider] - 提供商名称（可选，预设模型会自动推断）
 * @param {string} options.systemPrompt - System prompt
 * @param {Array<Object>} options.messages - 消息列表（历史事件）
 * @param {number} [options.timeout] - 超时时间（毫秒，默认 30000）
 * @returns {Promise<string>} AI 回复内容
 * @throws {Object} 错误对象 { code, message }
 */
async function generateReply(options) {
  const { model, provider, systemPrompt, messages, timeout = 30000 } = options;

  // 参数验证
  if (!model || typeof model !== "string") {
    throw {
      code: "VALIDATION_ERROR",
      message: "模型名称不能为空",
    };
  }

  if (!systemPrompt || typeof systemPrompt !== "string") {
    throw {
      code: "VALIDATION_ERROR",
      message: "System prompt 不能为空",
    };
  }

  if (!Array.isArray(messages)) {
    throw {
      code: "VALIDATION_ERROR",
      message: "消息列表必须是数组",
    };
  }

  // 获取模型提供商
  // 优先使用传入的 provider（如果提供），否则从预设模型推断
  let modelProvider = provider;
  if (!modelProvider) {
    modelProvider = getModelProvider(model);
  }

  // 如果仍然没有 provider，说明是自定义模型但没有指定提供商
  if (!modelProvider) {
    throw {
      code: "PROVIDER_REQUIRED",
      message: `自定义模型 ${model} 需要指定提供商（provider）`,
    };
  }

  // 验证提供商是否启用
  const { isProviderEnabled } = require("../config/models");
  if (!isProviderEnabled(modelProvider)) {
    throw {
      code: "INVALID_PROVIDER",
      message: `提供商 ${modelProvider} 未启用，请在环境变量中启用`,
    };
  }

  // 构建消息列表（如果传入的是事件列表，需要转换）
  let formattedMessages = messages;
  // 判断是否是事件列表：检查第一个元素是否有 fromType 字段
  if (
    messages.length > 0 &&
    typeof messages[0] === "object" &&
    messages[0].fromType !== undefined
  ) {
    // 如果传入的是事件列表，转换为消息格式
    formattedMessages = buildMessages(messages);
  }

  // 重试机制
  const maxRetries = 2;
  const retryDelay = 1000; // 1 秒

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const reply = await callLLMAPI(
        modelProvider,
        model,
        systemPrompt,
        formattedMessages,
        timeout
      );
      return reply;
    } catch (error) {
      lastError = error;

      // 不重试的错误：超时、API Key 错误、无效模型
      if (
        error.code === "LLM_API_TIMEOUT" ||
        error.code === "API_KEY_MISSING" ||
        error.code === "INVALID_MODEL" ||
        error.code === "INVALID_PROVIDER"
      ) {
        throw error;
      }

      // 最后一次尝试失败，抛出错误
      if (attempt === maxRetries) {
        throw error;
      }

      // 等待后重试（指数退避）
      const delay = retryDelay * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 理论上不会执行到这里
  throw (
    lastError || {
      code: "LLM_API_ERROR",
      message: "LLM API 调用失败",
    }
  );
}

/**
 * 从事件列表构建 Prompt
 *
 * 【功能说明】
 * 将历史事件转换为 LLM API 需要的格式
 *
 * 【工作流程】
 * 1. 验证事件列表
 * 2. 转换为消息格式
 * 3. 返回消息列表
 *
 * @param {Array<Object>} events - 历史事件列表（按时间升序）
 * @returns {Array<Object>} 消息列表
 */
function buildPromptFromEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  return buildMessages(events);
}

module.exports = {
  generateReply,
  buildPromptFromEvents,
};
