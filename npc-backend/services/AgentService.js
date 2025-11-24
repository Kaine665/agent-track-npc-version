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
 * 4. systemPrompt: 可选，0-5000 字符（不填也可以）
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

  // 验证 systemPrompt（可选，允许为空）
  if (agentData.systemPrompt !== undefined && agentData.systemPrompt !== null) {
    if (typeof agentData.systemPrompt !== "string") {
      return {
        code: "VALIDATION_ERROR",
        message: "人设描述格式不正确",
      };
    }
    const promptLength = agentData.systemPrompt.trim().length;
    if (promptLength > 5000) {
      return {
        code: "VALIDATION_ERROR",
        message: "人设描述不能超过 5000 字符",
      };
    }
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
 * @param {string} agentData.userId - 用户 ID（或 createdBy）
 * @param {string} agentData.name - Agent 名称
 * @param {string} agentData.type - Agent 类型
 * @param {string} agentData.model - LLM 模型名称
 * @param {string} [agentData.provider] - LLM 提供商（可选，预设模型会自动推断）
 * @param {string} agentData.systemPrompt - 人设描述
 * @param {string} [agentData.avatarUrl] - 头像 URL（可选）
 * @returns {Promise<Object>} 创建的 Agent 对象
 * @throws {Object} 错误对象 { code, message }
 */
async function createAgent(agentData) {
  // 支持 createdBy 和 userId 两种字段名
  const userId = (agentData.userId || agentData.createdBy || "").trim();
  if (!userId) {
    throw {
      code: "VALIDATION_ERROR",
      message: "用户 ID 不能为空",
    };
  }
  
  // 统一使用 userId
  agentData.userId = userId;
  
  // 字段验证
  const validationError = validateAgentData(agentData);
  if (validationError) {
    throw validationError;
  }

  // 检查名称唯一性
  const name = agentData.name.trim();

  const nameExists = await agentRepository.checkNameExists(userId, name);
  if (nameExists) {
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
    const agent = await agentRepository.create({
      createdBy: userId,
      name: name,
      type: agentData.type,
      model: model,
      provider: provider, // 存储 provider（预设模型自动推断，自定义模型必填）
      systemPrompt: agentData.systemPrompt ? agentData.systemPrompt.trim() : "", // 允许为空字符串
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
 * @returns {Promise<Array<Object>>} Agent 对象数组，包含 lastMessageAt 字段，按排序规则排序
 */
async function getAgentList(userId) {
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return [];
  }

  const trimmedUserId = userId.trim();

  // 获取用户的所有 Agent
  const agents = await agentRepository.findByUserId(trimmedUserId);

  // 获取用户的所有 Session，构建 agentId -> { lastActiveAt, lastMessageContent } 映射
  const sessions = await sessionService.getSessionsByUser(trimmedUserId);
  const eventService = require("./EventService");
  const agentLastMessageMap = new Map(); // agentId -> { lastActiveAt, lastMessageContent }

  // 遍历 Session，找到每个 Agent 对应的最后活动时间和最后一条消息
  // 使用 Promise.all 并行查询所有 Session 的最后一条消息（提高性能）
  const sessionQueries = sessions.map(async (session) => {
    // 从 participants 中找到 agent 类型的参与者
    const agentParticipant = session.participants.find(
      (p) => p.type === "agent"
    );
    if (!agentParticipant) {
      return null;
    }

    const agentId = agentParticipant.id;
    const lastActiveAt = session.lastActiveAt;

    // 获取该 Session 的最后一条消息（用于预览）
    const recentEvents = await eventService.getRecentEvents(session.sessionId, 1);
    const lastEvent = recentEvents.length > 0 ? recentEvents[recentEvents.length - 1] : null;
    const lastMessageContent = lastEvent ? lastEvent.content : null;

    return {
      agentId,
      lastActiveAt,
      lastMessageContent,
    };
  });

  // 等待所有查询完成
  const sessionResults = await Promise.all(sessionQueries);

  // 构建 agentId -> { lastActiveAt, lastMessageContent } 映射
  for (const result of sessionResults) {
    if (!result) continue;

    const { agentId, lastActiveAt, lastMessageContent } = result;
    const existing = agentLastMessageMap.get(agentId);

    // 如果该 Agent 还没有记录，或者当前 Session 的活动时间更晚，则更新
    if (
      !existing ||
      lastActiveAt > existing.lastActiveAt
    ) {
      agentLastMessageMap.set(agentId, {
        lastActiveAt,
        lastMessageContent,
      });
    }
  }

  // 为每个 Agent 添加 lastMessageAt 和 lastMessagePreview 字段
  const agentsWithLastMessage = agents.map((agent) => {
    const lastMessageInfo = agentLastMessageMap.get(agent.id);
    return {
      ...agent,
      lastMessageAt: lastMessageInfo?.lastActiveAt || null,
      lastMessagePreview: lastMessageInfo?.lastMessageContent || null,
    };
  });

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

/**
 * 更新 Agent
 *
 * 【功能说明】
 * 更新指定 Agent 的信息，包含权限验证和字段验证
 *
 * 【工作流程】
 * 1. 查询 Agent 是否存在
 * 2. 验证权限（只能修改自己的 Agent）
 * 3. 验证更新数据
 * 4. 检查名称唯一性（如果更新了名称）
 * 5. 调用 Repository 更新
 * 6. 返回更新后的 Agent
 *
 * 【错误处理】
 * - AGENT_NOT_FOUND → Agent 不存在
 * - PERMISSION_DENIED → 无权修改此 Agent
 * - VALIDATION_ERROR → 字段验证失败
 * - DUPLICATE_NAME → 名称已存在
 *
 * @param {string} agentId - Agent ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的 Agent 对象
 */
async function updateAgent(agentId, userId, updateData) {
  // 1. 查询 Agent 是否存在
  const agent = await agentRepository.findById(agentId);
  
  if (!agent) {
    const error = new Error('NPC 不存在');
    error.code = 'AGENT_NOT_FOUND';
    throw error;
  }

  // 2. 验证权限（只能修改自己的 Agent）
  if (agent.createdBy !== userId) {
    const error = new Error('无权修改此 NPC');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }

  // 3. 验证更新数据
  const allowedFields = ['name', 'type', 'systemPrompt', 'model', 'provider', 'avatarUrl'];
  const filteredData = {};
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  // 如果更新了名称，验证名称
  if (filteredData.name !== undefined) {
    const nameLength = filteredData.name.trim().length;
    if (nameLength === 0) {
      const error = new Error('NPC 名称不能为空');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    if (nameLength > 50) {
      const error = new Error('NPC 名称不能超过 50 字符');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    // 检查名称唯一性（排除当前 Agent）
    const nameExists = await agentRepository.checkNameExists(userId, filteredData.name);
    if (nameExists) {
      // 检查是否是当前 Agent 的名称
      const existingAgentId = await agentRepository.getExistingAgentIdByName(userId, filteredData.name);
      if (existingAgentId !== agentId) {
        const error = new Error('该名称已存在，请使用其他名称');
        error.code = 'DUPLICATE_NAME';
        throw error;
      }
    }
  }

  // 如果更新了 systemPrompt，验证长度
  if (filteredData.systemPrompt !== undefined) {
    if (typeof filteredData.systemPrompt !== 'string') {
      const error = new Error('人设描述格式不正确');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    const promptLength = filteredData.systemPrompt.trim().length;
    if (promptLength > 5000) {
      const error = new Error('人设描述不能超过 5000 字符');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
  }

  // 如果更新了 model，验证模型有效性
  if (filteredData.model !== undefined) {
    if (!isValidModel(filteredData.model)) {
      const error = new Error(`不支持的模型：${filteredData.model}`);
      error.code = 'INVALID_MODEL';
      throw error;
    }
    // V1 版本统一使用 OpenRouter
    filteredData.provider = 'openrouter';
  }

  // 4. 更新 Agent
  const updatedAgent = await agentRepository.update(agentId, filteredData);

  return updatedAgent;
}

/**
 * 删除 Agent
 *
 * 【功能说明】
 * 删除指定的 Agent，支持软删除和硬删除
 *
 * 【工作流程】
 * 1. 查询 Agent 是否存在
 * 2. 验证权限（只能删除自己的 Agent）
 * 3. 根据选项执行软删除或硬删除
 * 4. 返回删除结果
 *
 * 【错误处理】
 * - AGENT_NOT_FOUND → Agent 不存在
 * - PERMISSION_DENIED → 无权删除此 Agent
 *
 * @param {string} agentId - Agent ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {Object} options - 删除选项
 * @param {boolean} options.hardDelete - 是否硬删除（默认 false，软删除）
 * @returns {Promise<Object>} 删除结果
 */
async function deleteAgent(agentId, userId, options = {}) {
  const { hardDelete = false } = options;

  // 1. 查询 Agent 是否存在
  const agent = await agentRepository.findById(agentId);
  
  if (!agent) {
    const error = new Error('NPC 不存在');
    error.code = 'AGENT_NOT_FOUND';
    throw error;
  }

  // 2. 验证权限（只能删除自己的 Agent）
  if (agent.createdBy !== userId) {
    const error = new Error('无权删除此 NPC');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }

  if (hardDelete) {
    // 硬删除：物理删除 Agent
    // 注意：这会永久删除数据，关联的对话历史保留（不删除）
    await agentRepository.remove(agentId);
    
    return {
      success: true,
      message: 'NPC 已永久删除',
      deletedAt: Date.now(),
    };
  } else {
    // 软删除：标记为已删除，不物理删除数据
    await agentRepository.update(agentId, {
      deleted: true,
      deletedAt: Date.now(),
    });

    return {
      success: true,
      message: 'NPC 已删除',
      deletedAt: Date.now(),
    };
  }
}

module.exports = {
  createAgent,
  getAgentList,
  getAgentById,
  updateAgent,
  deleteAgent,
};
