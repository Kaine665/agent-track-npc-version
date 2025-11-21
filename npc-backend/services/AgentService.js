/**
 * ============================================
 * Agent 业务逻辑层 (AgentService.js)
 * ============================================
 *
 * 【文件职责】
 * 处理 Agent 相关的业务逻辑，包括数据验证、业务规则检查
 *
 * 【主要功能】
 * 1. 字段验证（名称长度、systemPrompt 长度等）
 * 2. 名称唯一性检查
 * 3. 模型有效性验证
 * 4. 类型验证（general/special）
 * 5. 调用数据访问层创建和查询 Agent
 *
 * 【工作流程】
 * 接收数据 → 字段验证 → 业务规则检查 → 调用 Repository → 返回结果
 *
 * 【依赖】
 * - repositories/AgentRepository.js: 数据访问层
 * - config/models.js: 模型配置验证
 *
 * 【被谁使用】
 * - routes/agents.js: 调用业务逻辑方法
 *
 * 【错误处理】
 * - 验证错误：抛出包含错误码和消息的对象
 * - 业务规则错误：抛出包含错误码和消息的对象
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const agentRepository = require("../repositories/AgentRepository");
const sessionService = require("./SessionService");
const {
  isValidModel,
  isValidModelProvider,
  getModelProvider,
  isProviderEnabled,
} = require("../config/models");

/**
 * 验证 Agent 数据
 *
 * 【功能说明】
 * 验证创建 Agent 所需的所有字段
 *
 * 【验证规则】
 * 1. userId: 必填，字符串
 * 2. name: 必填，1-50 字符
 * 3. type: 必填，必须是 'general' 或 'special'
 * 4. systemPrompt: 必填，10-5000 字符
 * 5. model: 必填，必须在支持的模型列表中
 * 6. avatarUrl: 可选，如果提供必须是有效的 URL 格式
 *
 * @param {Object} agentData - Agent 数据
 * @returns {Object|null} 验证错误对象，如果验证通过则返回 null
 */
function validateAgentData(agentData) {
  // 验证 userId
  if (
    !agentData.userId ||
    typeof agentData.userId !== "string" ||
    !agentData.userId.trim()
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "用户 ID 不能为空",
    };
  }

  // 验证 name
  if (!agentData.name || typeof agentData.name !== "string") {
    return {
      code: "VALIDATION_ERROR",
      message: "NPC 名称不能为空",
    };
  }
  const nameLength = agentData.name.trim().length;
  if (nameLength === 0) {
    return {
      code: "VALIDATION_ERROR",
      message: "NPC 名称不能为空",
    };
  }
  if (nameLength > 50) {
    return {
      code: "VALIDATION_ERROR",
      message: "NPC 名称不能超过 50 字符",
    };
  }

  // 验证 type
  if (!agentData.type || !["general", "special"].includes(agentData.type)) {
    return {
      code: "VALIDATION_ERROR",
      message: "NPC 类型必须是 general 或 special",
    };
  }

  // 验证 systemPrompt
  if (!agentData.systemPrompt || typeof agentData.systemPrompt !== "string") {
    return {
      code: "VALIDATION_ERROR",
      message: "人设描述不能为空",
    };
  }
  const promptLength = agentData.systemPrompt.trim().length;
  if (promptLength < 10) {
    return {
      code: "VALIDATION_ERROR",
      message: "人设描述至少需要 10 字符",
    };
  }
  if (promptLength > 5000) {
    return {
      code: "VALIDATION_ERROR",
      message: "人设描述不能超过 5000 字符",
    };
  }

  // 验证 model
  if (!agentData.model || typeof agentData.model !== "string") {
    return {
      code: "VALIDATION_ERROR",
      message: "模型名称不能为空",
    };
  }

  const model = agentData.model.trim();

  // V1 版本统一使用 OpenRouter，只验证模型是否在预设列表中
  if (!isValidModel(model)) {
    return {
      code: "INVALID_MODEL",
      message: `不支持的模型：${model}。请使用支持的模型。`,
    };
  }

  // V1 版本统一使用 OpenRouter，忽略用户提供的 provider（向后兼容）
  if (agentData.provider && agentData.provider.trim() !== "openrouter") {
    console.warn(
      `警告：V1 版本统一使用 OpenRouter，忽略用户提供的 provider: ${agentData.provider}`
    );
  }

  // 验证 avatarUrl（可选）
  if (agentData.avatarUrl !== undefined && agentData.avatarUrl !== null) {
    if (typeof agentData.avatarUrl !== "string") {
      return {
        code: "VALIDATION_ERROR",
        message: "头像 URL 格式不正确",
      };
    }
    // 简单的 URL 格式验证
    try {
      new URL(agentData.avatarUrl);
    } catch (error) {
      return {
        code: "VALIDATION_ERROR",
        message: "头像 URL 格式不正确",
      };
    }
  }

  return null; // 验证通过
}

/**
 * 创建 Agent
 *
 * 【功能说明】
 * 创建新的 Agent，包含完整的验证和业务规则检查
 *
 * 【工作流程】
 * 1. 验证字段
 * 2. 检查名称唯一性
 * 3. 调用 Repository 创建 Agent
 * 4. 返回创建的 Agent
 *
 * 【错误处理】
 * - 验证错误 → 抛出 { code: 'VALIDATION_ERROR', message: '...' }
 * - 名称重复 → 抛出 { code: 'DUPLICATE_NAME', message: '...' }
 * - 系统错误 → 抛出 { code: 'SYSTEM_ERROR', message: '...' }
 *
 * @param {Object} agentData - Agent 数据
 * @param {string} agentData.userId - 用户 ID
 * @param {string} agentData.name - Agent 名称
 * @param {string} agentData.type - Agent 类型
 * @param {string} agentData.model - LLM 模型名称
 * @param {string} [agentData.provider] - LLM 提供商（可选，预设模型会自动推断）
 * @param {string} agentData.systemPrompt - 人设描述
 * @param {string} [agentData.avatarUrl] - 头像 URL（可选）
 * @returns {Object} 创建的 Agent 对象
 * @throws {Object} 错误对象 { code, message }
 */
function createAgent(agentData) {
  // 字段验证
  const validationError = validateAgentData(agentData);
  if (validationError) {
    throw validationError;
  }

  // 检查名称唯一性
  const userId = agentData.userId.trim();
  const name = agentData.name.trim();

  if (agentRepository.checkNameExists(userId, name)) {
    throw {
      code: "DUPLICATE_NAME",
      message: "该名称已存在，请使用其他名称",
    };
  }

  // V1 版本统一使用 OpenRouter
  const model = agentData.model.trim();
  const provider = "openrouter"; // 统一使用 OpenRouter

  // 创建 Agent
  try {
    const agent = agentRepository.create({
      createdBy: userId,
      name: name,
      type: agentData.type,
      model: model,
      provider: provider, // 存储 provider（预设模型自动推断，自定义模型必填）
      systemPrompt: agentData.systemPrompt.trim(),
      avatarUrl: agentData.avatarUrl ? agentData.avatarUrl.trim() : null,
    });

    return agent;
  } catch (error) {
    // 捕获创建过程中的错误
    throw {
      code: "SYSTEM_ERROR",
      message: "创建 Agent 失败，请稍后重试",
    };
  }
}

/**
 * 获取用户的 Agent 列表
 *
 * 【功能说明】
 * 查询指定用户创建的所有 Agent，按最后对话时间倒序排列（有对话记录的在前）
 * 如果没有对话记录，按创建时间倒序排列
 *
 * 【工作流程】
 * 1. 验证 userId
 * 2. 调用 Repository 查询用户的所有 Agent
 * 3. 获取用户的所有 Session，构建 agentId -> lastActiveAt 映射
 * 4. 为每个 Agent 添加 lastMessageAt 字段
 * 5. 按排序规则排序：lastMessageAt 倒序，如果为 null 则按 createdAt 倒序
 * 6. 返回列表
 *
 * 【排序规则】
 * - 按 lastMessageAt 倒序排列（有对话记录的在前）
 * - 如果 lastMessageAt 为 null，按 createdAt 倒序排列
 *
 * @param {string} userId - 用户 ID
 * @returns {Array<Object>} Agent 对象数组，包含 lastMessageAt 字段，按排序规则排序
 */
function getAgentList(userId) {
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return [];
  }

  const trimmedUserId = userId.trim();

  // 获取用户的所有 Agent
  const agents = agentRepository.findByUserId(trimmedUserId);

  // 获取用户的所有 Session，构建 agentId -> lastActiveAt 映射
  const sessions = sessionService.getSessionsByUser(trimmedUserId);
  const agentLastMessageMap = new Map();

  // 遍历 Session，找到每个 Agent 对应的最后活动时间
  for (const session of sessions) {
    // 从 participants 中找到 agent 类型的参与者
    const agentParticipant = session.participants.find(
      (p) => p.type === "agent"
    );
    if (agentParticipant) {
      const agentId = agentParticipant.id;
      const lastActiveAt = session.lastActiveAt;

      // 如果该 Agent 还没有记录，或者当前 Session 的活动时间更晚，则更新
      if (
        !agentLastMessageMap.has(agentId) ||
        lastActiveAt > agentLastMessageMap.get(agentId)
      ) {
        agentLastMessageMap.set(agentId, lastActiveAt);
      }
    }
  }

  // 为每个 Agent 添加 lastMessageAt 字段
  const agentsWithLastMessage = agents.map((agent) => ({
    ...agent,
    lastMessageAt: agentLastMessageMap.get(agent.id) || null,
  }));

  // 排序：按 lastMessageAt 倒序，如果为 null 则按 createdAt 倒序
  agentsWithLastMessage.sort((a, b) => {
    // 如果两个都有 lastMessageAt，按 lastMessageAt 倒序
    if (a.lastMessageAt && b.lastMessageAt) {
      return b.lastMessageAt - a.lastMessageAt;
    }
    // 如果只有 a 有 lastMessageAt，a 排在前面
    if (a.lastMessageAt && !b.lastMessageAt) {
      return -1;
    }
    // 如果只有 b 有 lastMessageAt，b 排在前面
    if (!a.lastMessageAt && b.lastMessageAt) {
      return 1;
    }
    // 如果两个都没有 lastMessageAt，按 createdAt 倒序
    return b.createdAt - a.createdAt;
  });

  return agentsWithLastMessage;
}

/**
 * 通过 ID 获取 Agent
 *
 * 【功能说明】
 * 根据 agentId 查询 Agent
 *
 * @param {string} agentId - Agent ID
 * @returns {Object|null} Agent 对象，如果不存在则返回 null
 */
function getAgentById(agentId) {
  if (!agentId || typeof agentId !== "string") {
    return null;
  }

  return agentRepository.findById(agentId);
}

module.exports = {
  createAgent,
  getAgentList,
  getAgentById,
};
