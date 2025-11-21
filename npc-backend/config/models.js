/**
 * ============================================
 * 模型配置管理 (models.js)
 * ============================================
 *
 * 【文件职责】
 * 管理支持的 LLM 模型配置，从环境变量读取并解析模型列表和提供商启用状态
 *
 * 【主要功能】
 * 1. 从环境变量读取启用的提供商列表
 * 2. 从环境变量读取预设的模型列表（可选）
 * 3. 解析模型配置（格式：模型名:提供商）
 * 4. 提供模型验证函数（支持预设模型和自定义模型）
 * 5. 提供获取模型列表和提供商列表的函数
 *
 * 【工作流程】
 * 环境变量 → 解析提供商启用状态 → 解析预设模型 → 提供验证函数
 *
 * 【环境变量格式】
 * # 启用提供商（必须）
 * ENABLE_OPENAI=true
 * ENABLE_DEEPSEEK=true
 * ENABLE_OPENROUTER=true
 *
 * # 预设模型配置（可选，格式：模型名:提供商）
 * MODELS=gpt-4:openai,gpt-3.5-turbo:openai,deepseek-chat:deepseek
 *
 * 【配置模式】
 * 1. 只启用提供商，不配置模型：
 *    - ENABLE_OPENAI=true
 *    - MODELS= 或 不设置
 *    - 用户可以输入任意模型名称（需要指定提供商）
 *
 * 2. 启用提供商并配置预设模型：
 *    - ENABLE_OPENAI=true
 *    - MODELS=gpt-4:openai,gpt-3.5-turbo:openai
 *    - 用户只能选择预设的模型
 *
 * 【依赖】
 * - dotenv: 环境变量管理（在 server.js 中已加载）
 *
 * 【被谁使用】
 * - services/AgentService.js: 验证模型有效性
 * - services/LLMService.js: 获取模型提供商
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

/**
 * 解析启用的提供商列表
 *
 * 【功能说明】
 * 从环境变量读取启用的提供商
 *
 * 【优先级】
 * 1. 如果设置了 ENABLE_* 环境变量，使用环境变量的值
 * 2. 如果没有设置 ENABLE_* 环境变量，从 MODELS 配置中自动推断启用的提供商
 *
 * 【环境变量】
 * - ENABLE_OPENAI=true/false（可选）
 * - ENABLE_DEEPSEEK=true/false（可选）
 * - ENABLE_OPENROUTER=true/false（可选）
 *
 * 【自动推断】
 * 如果 MODELS 中配置了某个提供商的模型，自动启用该提供商
 *
 * @returns {Object<string, boolean>} 提供商启用状态 { openai: true, deepseek: false, ... }
 */
function parseEnabledProviders() {
  // 1. 先读取环境变量中的显式配置
  const explicitProviders = {
    openai: process.env.ENABLE_OPENAI === "true",
    deepseek: process.env.ENABLE_DEEPSEEK === "true",
    openrouter: process.env.ENABLE_OPENROUTER === "true",
  };

  // 2. 检查是否有显式配置
  const hasExplicitConfig = Object.values(explicitProviders).some(
    (enabled) => enabled === true
  );

  // 3. 如果有显式配置，直接返回
  if (hasExplicitConfig) {
    return explicitProviders;
  }

  // 4. 如果没有显式配置，从 MODELS 配置中自动推断
  const modelsEnv = process.env.MODELS || "";
  const inferredProviders = {
    openai: false,
    deepseek: false,
    openrouter: false,
  };

  if (modelsEnv.trim()) {
    const modelList = modelsEnv
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    for (const modelConfig of modelList) {
      const [, provider] = modelConfig.split(":").map((item) => item.trim());
      if (provider) {
        // 映射提供商名称（anthropic -> openrouter，因为 anthropic 通过 openrouter 使用）
        if (provider === "anthropic") {
          inferredProviders.openrouter = true;
        } else if (provider === "openai" || provider === "deepseek" || provider === "openrouter") {
          inferredProviders[provider] = true;
        }
      }
    }
  }

  return inferredProviders;
}

/**
 * 解析环境变量中的预设模型配置
 *
 * 【功能说明】
 * 从环境变量 MODELS 读取预设模型列表，解析为对象格式
 *
 * 【格式说明】
 * 环境变量格式：MODELS=gpt-4:openai,gpt-3.5-turbo:openai
 * 解析结果：{ 'gpt-4': 'openai', 'gpt-3.5-turbo': 'openai' }
 *
 * 【工作流程】
 * 1. 读取环境变量 MODELS
 * 2. 按逗号分割
 * 3. 按冒号分割每个模型配置
 * 4. 转换为对象
 *
 * @returns {Object<string, string>} 预设模型配置对象 { 模型名: 提供商 }
 */
function parsePresetModels() {
  const modelsEnv = process.env.MODELS || "";

  if (!modelsEnv.trim()) {
    // 如果没有配置预设模型，返回空对象
    return {};
  }

  const models = {};
  const modelList = modelsEnv
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const modelConfig of modelList) {
    const [modelName, provider] = modelConfig
      .split(":")
      .map((item) => item.trim());

    if (modelName && provider) {
      // 映射提供商名称（anthropic -> openrouter，因为 anthropic 通过 openrouter 使用）
      const mappedProvider = provider === "anthropic" ? "openrouter" : provider;
      models[modelName] = mappedProvider;
    }
  }

  return models;
}

/**
 * 启用的提供商列表
 *
 * 【功能说明】
 * 存储从环境变量解析的提供商启用状态
 *
 * 【格式】
 * { openai: true, deepseek: false, openrouter: true }
 */
const enabledProviders = parseEnabledProviders();

/**
 * 预设的模型配置
 *
 * 【功能说明】
 * 存储从环境变量解析的预设模型配置
 *
 * 【格式】
 * { 'gpt-4': 'openai', 'gpt-3.5-turbo': 'openai', ... }
 */
const presetModels = parsePresetModels();

/**
 * 验证模型是否有效
 *
 * 【功能说明】
 * 检查指定的模型名称是否有效
 *
 * 【验证规则】
 * 1. 如果是预设模型，直接验证通过
 * 2. 如果不是预设模型，检查是否有启用的提供商（允许自定义模型）
 * 3. 如果没有任何启用的提供商，返回 false
 *
 * 【工作流程】
 * 1. 检查模型是否在预设列表中
 * 2. 如果在，返回 true
 * 3. 如果不在，检查是否有启用的提供商
 * 4. 如果有，返回 true（允许自定义模型）
 * 5. 如果没有，返回 false
 *
 * @param {string} modelName - 模型名称
 * @returns {boolean} 模型是否有效
 *
 * @example
 * isValidModel('gpt-4') // true（预设模型）
 * isValidModel('custom-model') // true（如果启用了提供商，允许自定义）
 */
function isValidModel(modelName) {
  if (!modelName || typeof modelName !== "string") {
    return false;
  }

  // 1. 检查是否是预设模型
  if (modelName in presetModels) {
    return true;
  }

  // 2. 检查是否有启用的提供商（允许自定义模型）
  const hasEnabledProvider = Object.values(enabledProviders).some(
    (enabled) => enabled === true
  );

  return hasEnabledProvider;
}

/**
 * 获取模型的提供商
 *
 * 【功能说明】
 * 根据模型名称获取对应的提供商
 *
 * 【工作流程】
 * 1. 如果是预设模型，直接返回预设的提供商
 * 2. 如果不是预设模型，需要用户指定提供商（返回 undefined，由调用方处理）
 *
 * @param {string} modelName - 模型名称
 * @returns {string|undefined} 提供商名称，如果模型不存在则返回 undefined
 *
 * @example
 * getModelProvider('gpt-4') // 'openai'（预设模型）
 * getModelProvider('custom-model') // undefined（自定义模型，需要用户指定提供商）
 */
function getModelProvider(modelName) {
  // 如果是预设模型，返回预设的提供商
  if (modelName in presetModels) {
    return presetModels[modelName];
  }

  // 自定义模型需要用户指定提供商
  return undefined;
}

/**
 * 验证模型和提供商的组合是否有效
 *
 * 【功能说明】
 * 验证模型和提供商的组合是否有效
 *
 * 【验证规则】
 * 1. 如果是预设模型，验证提供商是否匹配
 * 2. 如果是自定义模型，验证提供商是否启用
 *
 * @param {string} modelName - 模型名称
 * @param {string} provider - 提供商名称
 * @returns {boolean} 组合是否有效
 */
function isValidModelProvider(modelName, provider) {
  if (!modelName || !provider) {
    return false;
  }

  // 1. 检查提供商是否启用
  if (!enabledProviders[provider]) {
    return false;
  }

  // 2. 如果是预设模型，验证提供商是否匹配
  if (modelName in presetModels) {
    return presetModels[modelName] === provider;
  }

  // 3. 如果是自定义模型，只要提供商启用就允许
  return true;
}

/**
 * 获取支持的模型列表（预设模型）
 *
 * 【功能说明】
 * 返回所有预设的模型名称数组
 *
 * @returns {string[]} 预设的模型名称列表
 *
 * @example
 * getSupportedModels() // ['gpt-4', 'gpt-3.5-turbo', ...]
 */
function getSupportedModels() {
  return Object.keys(presetModels);
}

/**
 * 获取启用的提供商列表
 *
 * 【功能说明】
 * 返回所有启用的提供商名称数组
 *
 * @returns {string[]} 启用的提供商列表
 *
 * @example
 * getEnabledProviders() // ['openai', 'deepseek']
 */
function getEnabledProviders() {
  return Object.keys(enabledProviders).filter(
    (provider) => enabledProviders[provider] === true
  );
}

/**
 * 检查提供商是否启用
 *
 * 【功能说明】
 * 检查指定的提供商是否已启用
 *
 * @param {string} provider - 提供商名称
 * @returns {boolean} 提供商是否启用
 *
 * @example
 * isProviderEnabled('openai') // true
 */
function isProviderEnabled(provider) {
  return enabledProviders[provider] === true;
}

/**
 * 获取完整的模型配置对象（预设模型）
 *
 * 【功能说明】
 * 返回所有预设模型配置（包含模型名和提供商）
 *
 * @returns {Object<string, string>} 预设模型配置对象
 */
function getAllModels() {
  return { ...presetModels };
}

/**
 * 获取配置信息（用于调试和前端展示）
 *
 * 【功能说明】
 * 返回完整的配置信息，包括启用的提供商和预设模型
 *
 * @returns {Object} 配置信息对象
 */
function getConfigInfo() {
  return {
    enabledProviders: getEnabledProviders(),
    presetModels: getAllModels(),
    hasPresetModels: Object.keys(presetModels).length > 0,
    allowCustomModels: Object.values(enabledProviders).some(
      (enabled) => enabled === true
    ),
  };
}

module.exports = {
  isValidModel,
  isValidModelProvider,
  getSupportedModels,
  getModelProvider,
  getAllModels,
  getEnabledProviders,
  isProviderEnabled,
  getConfigInfo,
};
