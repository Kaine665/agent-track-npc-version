/**
 * ============================================
 * Agent 数据访问层 (AgentRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 管理 Agent 数据的内存存储和访问操作
 *
 * 【主要功能】
 * 1. 实现方案 C 的存储结构（独立存储 + 用户关系索引）
 * 2. 提供 Agent 的 CRUD 操作
 * 3. 维护索引结构（agentsByUser、userNameIndex）
 * 4. 生成 Agent ID
 *
 * 【工作流程】
 * 创建 Agent → 存储到 agentsMap → 更新索引 → 返回结果
 *
 * 【存储结构】
 * - agentsMap: Map<agentId, Agent> - 全局 Agent 存储
 * - agentsByUser: { [userId]: agentId[] } - 用户关系索引
 * - userNameIndex: { [userId]: { [name]: agentId } } - 用户名称索引
 *
 * 【依赖】
 * - 无外部依赖
 *
 * 【被谁使用】
 * - services/AgentService.js: 调用数据访问方法
 *
 * 【重要说明】
 * - 开发阶段：每次重启清空数据
 * - 未来迁移：可以替换为数据库实现，保持接口不变
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

/**
 * 全局 Agent 存储
 *
 * 【功能说明】
 * 使用 Map 存储所有 Agent，key 为 agentId，value 为 Agent 对象
 *
 * 【格式】
 * Map<agentId, Agent>
 */
const agentsMap = new Map();

/**
 * 用户关系索引
 *
 * 【功能说明】
 * 按用户分组存储 Agent ID 列表，用于快速查询用户的所有 Agent
 *
 * 【格式】
 * { [userId]: agentId[] }
 *
 * 【示例】
 * {
 *   'user_1': ['agent_123', 'agent_456'],
 *   'user_2': ['agent_789']
 * }
 */
const agentsByUser = {};

/**
 * 用户名称索引
 *
 * 【功能说明】
 * 按用户和名称建立索引，用于快速检查名称唯一性（O(1) 查询）
 *
 * 【格式】
 * { [userId]: { [name]: agentId } }
 *
 * 【示例】
 * {
 *   'user_1': {
 *     '学习教练': 'agent_123',
 *     '心理顾问': 'agent_456'
 *   }
 * }
 *
 * 【状态说明】
 * ⚠️ 当前阶段不使用：虽然已实现，但当前阶段不使用此索引
 * - 原因：单个用户的 Agent 数量不会太多，遍历 agentsByUser 的性能开销可接受
 * - 当前实现：使用 agentsByUser 遍历检查名称唯一性（O(n) 查询，n 为用户拥有的 Agent 数量）
 * - 未来扩展：如果用户 Agent 数量增加，可以启用此索引以获得 O(1) 查询性能
 * - 代码保留：保留此索引的创建和维护代码，以便未来需要时快速启用
 */
const userNameIndex = {};

/**
 * 生成 Agent ID
 *
 * 【功能说明】
 * 生成唯一的 Agent ID，格式：agent_{timestamp}_{random}
 *
 * 【工作流程】
 * 1. 获取当前时间戳（毫秒）
 * 2. 生成随机字符串（6 位）
 * 3. 组合为 agent_{timestamp}_{random}
 *
 * 【ID 格式】
 * agent_1703001234567_abc123
 *
 * @returns {string} Agent ID
 */
function generateId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `agent_${timestamp}_${random}`;
}

/**
 * 创建 Agent
 *
 * 【功能说明】
 * 创建新的 Agent 并存储到内存中，同时维护所有索引
 *
 * 【工作流程】
 * 1. 生成 Agent ID
 * 2. 创建 Agent 对象（添加时间戳）
 * 3. 存储到 agentsMap
 * 4. 更新 agentsByUser 索引
 * 5. 更新 userNameIndex 索引
 *
 * @param {Object} agentData - Agent 数据
 * @param {string} agentData.createdBy - 创建者用户 ID
 * @param {string} agentData.name - Agent 名称
 * @param {string} agentData.type - Agent 类型（general/special）
 * @param {string} agentData.model - LLM 模型名称
 * @param {string} [agentData.provider] - LLM 提供商（可选，预设模型会自动推断）
 * @param {string} agentData.systemPrompt - 人设描述
 * @param {string} [agentData.avatarUrl] - 头像 URL（可选）
 * @returns {Object} 创建的 Agent 对象
 */
function create(agentData) {
  const agentId = generateId();
  const now = Date.now();

  const agent = {
    id: agentId,
    createdBy: agentData.createdBy,
    name: agentData.name,
    type: agentData.type,
    model: agentData.model,
    provider: agentData.provider || null, // 提供商（预设模型自动推断，自定义模型必填）
    systemPrompt: agentData.systemPrompt,
    avatarUrl: agentData.avatarUrl || null,
    createdAt: now,
    updatedAt: now,
  };

  // 存储到全局 Map
  agentsMap.set(agentId, agent);

  // 更新用户关系索引
  const userId = agentData.createdBy;
  if (!agentsByUser[userId]) {
    agentsByUser[userId] = [];
  }
  agentsByUser[userId].push(agentId);

  // 更新用户名称索引（⚠️ 当前阶段不使用，但保留代码以便未来启用）
  // 当前阶段：虽然创建和维护索引，但不用于查询（checkNameExists 使用遍历方式）
  // 未来扩展：如果用户 Agent 数量增加，可以启用此索引以获得 O(1) 查询性能
  if (!userNameIndex[userId]) {
    userNameIndex[userId] = {};
  }
  const nameKey = agentData.name.toLowerCase();
  userNameIndex[userId][nameKey] = agentId;

  return agent;
}

/**
 * 通过 ID 查询 Agent
 *
 * 【功能说明】
 * 根据 agentId 从 agentsMap 中查询 Agent
 *
 * @param {string} agentId - Agent ID
 * @returns {Object|null} Agent 对象，如果不存在则返回 null
 */
function findById(agentId) {
  return agentsMap.get(agentId) || null;
}

/**
 * 查询用户的所有 Agent
 *
 * 【功能说明】
 * 根据 userId 查询该用户创建的所有 Agent，按创建时间倒序排列
 *
 * 【工作流程】
 * 1. 从 agentsByUser 索引获取该用户的 Agent ID 列表
 * 2. 根据 ID 列表从 agentsMap 获取 Agent 对象
 * 3. 按创建时间倒序排序
 *
 * @param {string} userId - 用户 ID
 * @returns {Array<Object>} Agent 对象数组，按创建时间倒序
 */
function findByUserId(userId) {
  const agentIds = agentsByUser[userId] || [];
  const agents = agentIds
    .map((id) => agentsMap.get(id))
    .filter(Boolean) // 过滤掉不存在的 Agent
    .sort((a, b) => b.createdAt - a.createdAt); // 按创建时间倒序

  return agents;
}

/**
 * 检查名称唯一性
 *
 * 【功能说明】
 * 检查指定用户是否已存在相同名称的 Agent（不区分大小写）
 *
 * 【工作流程】
 * 1. 从 agentsByUser 获取该用户的所有 Agent ID
 * 2. 遍历 Agent 列表，检查名称（转小写）是否已存在
 *
 * 【性能说明】
 * - 时间复杂度：O(n)，n 为用户拥有的 Agent 数量
 * - 当前阶段：单个用户的 Agent 数量不会太多，此性能开销可接受
 * - 未来优化：如果用户 Agent 数量增加，可以启用 userNameIndex 以获得 O(1) 查询性能
 *
 * @param {string} userId - 用户 ID
 * @param {string} name - Agent 名称
 * @returns {boolean} 名称是否已存在
 */
function checkNameExists(userId, name) {
  // ⚠️ 当前实现：使用遍历方式检查名称唯一性（不使用 userNameIndex）
  // 原因：单个用户的 Agent 数量不会太多，遍历性能开销可接受
  // 未来扩展：如果用户 Agent 数量增加，可以启用 userNameIndex 以获得 O(1) 查询性能
  // 启用方式：将下面的遍历逻辑替换为：
  //   const userNames = userNameIndex[userId] || {};
  //   const nameKey = name.toLowerCase();
  //   return nameKey in userNames;

  const agentIds = agentsByUser[userId] || [];
  const nameKey = name.toLowerCase();

  for (const agentId of agentIds) {
    const agent = agentsMap.get(agentId);
    if (agent && agent.name.toLowerCase() === nameKey) {
      return true;
    }
  }

  return false;
}

/**
 * 获取名称冲突的 Agent ID
 *
 * 【功能说明】
 * 如果名称已存在，返回已存在的 Agent ID（用于错误提示）
 *
 * 【工作流程】
 * 1. 从 agentsByUser 获取该用户的所有 Agent ID
 * 2. 遍历 Agent 列表，查找名称（转小写）匹配的 Agent
 *
 * 【性能说明】
 * - 时间复杂度：O(n)，n 为用户拥有的 Agent 数量
 * - 当前阶段：单个用户的 Agent 数量不会太多，此性能开销可接受
 * - 未来优化：如果用户 Agent 数量增加，可以启用 userNameIndex 以获得 O(1) 查询性能
 *
 * @param {string} userId - 用户 ID
 * @param {string} name - Agent 名称
 * @returns {string|null} 已存在的 Agent ID，如果不存在则返回 null
 */
function getExistingAgentIdByName(userId, name) {
  // ⚠️ 当前实现：使用遍历方式查找名称冲突（不使用 userNameIndex）
  // 原因：单个用户的 Agent 数量不会太多，遍历性能开销可接受
  // 未来扩展：如果用户 Agent 数量增加，可以启用 userNameIndex 以获得 O(1) 查询性能
  // 启用方式：将下面的遍历逻辑替换为：
  //   const userNames = userNameIndex[userId] || {};
  //   const nameKey = name.toLowerCase();
  //   return userNames[nameKey] || null;

  const agentIds = agentsByUser[userId] || [];
  const nameKey = name.toLowerCase();

  for (const agentId of agentIds) {
    const agent = agentsMap.get(agentId);
    if (agent && agent.name.toLowerCase() === nameKey) {
      return agentId;
    }
  }

  return null;
}

/**
 * 删除 Agent（可选功能，当前阶段不需要）
 *
 * 【功能说明】
 * 删除指定的 Agent，同时清理所有相关索引
 *
 * 【注意】
 * 当前阶段不需要删除功能，但可以预留接口
 *
 * @param {string} agentId - Agent ID
 * @returns {boolean} 是否删除成功
 */
function remove(agentId) {
  const agent = agentsMap.get(agentId);
  if (!agent) {
    return false;
  }

  const userId = agent.createdBy;

  // 从全局 Map 删除
  agentsMap.delete(agentId);

  // 从用户关系索引删除
  if (agentsByUser[userId]) {
    const index = agentsByUser[userId].indexOf(agentId);
    if (index > -1) {
      agentsByUser[userId].splice(index, 1);
    }
  }

  // 从用户名称索引删除（⚠️ 当前阶段不使用，但保留代码以便未来启用）
  if (userNameIndex[userId]) {
    const nameKey = agent.name.toLowerCase();
    delete userNameIndex[userId][nameKey];
  }

  return true;
}

/**
 * 清空所有数据（用于测试或重置）
 *
 * 【功能说明】
 * 清空所有存储的数据和索引
 *
 * 【注意】
 * 开发阶段每次重启会自动清空，此函数主要用于测试
 */
function clearAll() {
  agentsMap.clear();
  Object.keys(agentsByUser).forEach((key) => delete agentsByUser[key]);
  Object.keys(userNameIndex).forEach((key) => delete userNameIndex[key]);
}

module.exports = {
  create,
  findById,
  findByUserId,
  checkNameExists,
  getExistingAgentIdByName,
  remove,
  clearAll,
};
