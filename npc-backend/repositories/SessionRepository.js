/**
 * ============================================
 * Session 数据访问层 (SessionRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 管理 Session（会话）数据的内存存储和访问操作
 *
 * 【主要功能】
 * 1. 实现中心化存储 + 参与者索引的存储结构
 * 2. 提供 Session 的创建和查询操作
 * 3. 维护索引结构（sessionsByUser、sessionsByAgent）
 *
 * 【工作流程】
 * 创建 Session → 存储到 sessionsMap → 更新参与者索引 → 返回结果
 *
 * 【存储结构】
 * - sessionsMap: Map<sessionId, Session> - 全局 Session 存储（中心化存储）
 * - sessionsByUser: { [userId]: sessionId[] } - 用户关系索引
 * - sessionsByAgent: { [agentId]: sessionId[] } - Agent 关系索引
 *
 * 【依赖】
 * - 无外部依赖
 *
 * 【被谁使用】
 * - services/SessionService.js: 调用数据访问方法
 *
 * 【重要说明】
 * - 开发阶段：每次重启清空数据
 * - 未来迁移：可以替换为数据库实现，保持接口不变
 * - 单会话模式：同一参与者组合只有一个会话
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

/**
 * 全局 Session 存储（中心化存储 - 单一数据源）
 *
 * 【功能说明】
 * 使用 Map 存储所有 Session，key 为 sessionId，value 为 Session 对象
 *
 * 【格式】
 * Map<sessionId, Session>
 */
const sessionsMap = new Map();

/**
 * 用户关系索引（参与者视角 - 性能优化）
 *
 * 【功能说明】
 * 按用户分组存储 Session ID 列表，用于快速查询用户参与的所有会话
 *
 * 【格式】
 * { [userId]: sessionId[] }
 *
 * 【示例】
 * {
 *   'user_123': ['session_abc123', 'session_xyz789'],
 *   'user_456': ['session_def456']
 * }
 */
const sessionsByUser = {};

/**
 * Agent 关系索引（参与者视角 - 性能优化）
 *
 * 【功能说明】
 * 按 Agent 分组存储 Session ID 列表，用于快速查询 Agent 参与的所有会话
 *
 * 【格式】
 * { [agentId]: sessionId[] }
 *
 * 【示例】
 * {
 *   'agent_456': ['session_abc123', 'session_def456'],
 *   'agent_789': ['session_xyz789']
 * }
 */
const sessionsByAgent = {};

/**
 * 标准化参与者列表（排序）
 *
 * 【功能说明】
 * 对参与者列表进行排序，确保顺序一致
 *
 * 【排序规则】
 * 1. 先按 type 排序（user < agent < bot < system）
 * 2. 再按 id 排序（字母序）
 *
 * 【目的】
 * - 保证存储顺序一致
 * - 便于比较两个会话是否相同
 * - 避免重复创建会话
 *
 * @param {Array<{type: string, id: string}>} participants - 参与者列表
 * @returns {Array<{type: string, id: string}>} 排序后的参与者列表
 */
function normalizeParticipants(participants) {
  // 定义类型优先级
  const typeOrder = {
    user: 1,
    agent: 2,
    bot: 3,
    system: 4,
  };

  return [...participants].sort((a, b) => {
    // 1. 先按 type 排序
    const typeDiff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
    if (typeDiff !== 0) {
      return typeDiff;
    }

    // 2. 再按 id 排序（字母序）
    return a.id.localeCompare(b.id);
  });
}

/**
 * 生成 Session ID
 *
 * 【功能说明】
 * 生成唯一的 Session ID，格式：session_{timestamp}_{random}
 *
 * 【ID 格式】
 * session_1703001234567_abc123
 *
 * @returns {string} Session ID
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${random}`;
}

/**
 * 更新参与者索引
 *
 * 【功能说明】
 * 将 sessionId 添加到指定参与者的索引中
 *
 * @param {Object} participant - 参与者 {type, id}
 * @param {string} sessionId - 会话 ID
 */
function updateParticipantIndex(participant, sessionId) {
  if (participant.type === "user") {
    if (!sessionsByUser[participant.id]) {
      sessionsByUser[participant.id] = [];
    }
    if (!sessionsByUser[participant.id].includes(sessionId)) {
      sessionsByUser[participant.id].push(sessionId);
    }
  } else if (participant.type === "agent") {
    if (!sessionsByAgent[participant.id]) {
      sessionsByAgent[participant.id] = [];
    }
    if (!sessionsByAgent[participant.id].includes(sessionId)) {
      sessionsByAgent[participant.id].push(sessionId);
    }
  }
  // 未来扩展：支持更多参与者类型
  //
  // 【扩展场景】
  // 1. bot（机器人）：自动化的对话机器人，可能需要独立的索引 sessionsByBot
  // 2. system（系统）：系统消息或通知，可能需要独立的索引 sessionsBySystem
  // 3. group（群组）：群组会话，可能需要独立的索引 sessionsByGroup
  //
  // 【扩展步骤】
  // 1. 在文件顶部添加对应的索引对象（如 sessionsByBot = {}）
  // 2. 在此函数中添加对应的 else if 分支处理逻辑
  // 3. 在 findSessionByParticipants() 函数中添加对应的查询逻辑
  // 4. 在 normalizeParticipants() 函数中确保类型优先级正确（已定义：user=1, agent=2, bot=3, system=4）
  // 5. 在 rebuildIndexes() 函数中添加重建逻辑
  // 6. 在 clearAll() 函数中添加清空逻辑
  //
  // 【注意事项】
  // - 保持索引结构的一致性（所有参与者类型都使用 { [id]: sessionId[] } 格式）
  // - 确保 normalizeParticipants() 中的类型优先级与扩展顺序一致
  // - 扩展后需要同步更新 SessionService.js 中的参与者类型验证逻辑
}

/**
 * 查找会话（单会话模式）
 *
 * 【功能说明】
 * 查找指定参与者的会话，如果不存在则返回 null
 * 同一参与者组合只有一个会话（单会话模式）
 *
 * 【工作流程】
 * 1. 标准化参与者列表（排序）
 * 2. 获取每个参与者的会话列表
 * 3. 找到所有列表的交集（共同会话）
 * 4. 返回第一个会话（单会话模式，应该只有一个）
 *
 * @param {Array<{type: string, id: string}>} participants - 参与者列表
 * @returns {Object|null} Session 对象，如果不存在则返回 null
 */
function findSessionByParticipants(participants) {
  if (participants.length === 0) return null;

  // 1. 标准化参与者列表（排序）
  const normalizedParticipants = normalizeParticipants(participants);

  // 2. 获取每个参与者的会话列表
  const sessionSets = normalizedParticipants.map((p) => {
    const sessions =
      p.type === "user"
        ? sessionsByUser[p.id] || []
        : p.type === "agent"
        ? sessionsByAgent[p.id] || []
        : [];
    return new Set(sessions);
  });

  // 3. 找到所有 Set 的交集（共同会话）
  if (sessionSets.length === 0) return null;

  let commonSessions = sessionSets[0];
  for (let i = 1; i < sessionSets.length; i++) {
    commonSessions = new Set(
      [...commonSessions].filter((id) => sessionSets[i].has(id))
    );
  }

  // 4. 返回第一个会话（单会话模式，应该只有一个）
  if (commonSessions.size > 0) {
    const sessionId = [...commonSessions][0];
    return sessionsMap.get(sessionId);
  }

  return null;
}

/**
 * 获取或创建会话（单会话模式）
 *
 * 【功能说明】
 * 如果会话已存在，返回现有会话
 * 如果不存在，创建新会话
 * 同一参与者组合只有一个会话（单会话模式）
 *
 * 【工作流程】
 * 1. 标准化参与者列表（排序）
 * 2. 尝试查找现有会话
 * 3. 如果不存在，创建新会话
 * 4. 存储到中心化存储
 * 5. 更新每个参与者的索引
 *
 * @param {Array<{type: string, id: string}>} participants - 参与者列表
 * @returns {Object} Session 对象
 */
function getOrCreateSession(participants) {
  // 1. 标准化参与者列表（排序）
  const normalizedParticipants = normalizeParticipants(participants);

  // 2. 尝试查找现有会话
  const existingSession = findSessionByParticipants(normalizedParticipants);
  if (existingSession) {
    return existingSession; // 返回现有会话
  }

  // 3. 创建新会话
  const sessionId = generateSessionId();
  const now = Date.now();
  const session = {
    sessionId,
    participants: normalizedParticipants,
    createdAt: now,
    lastActiveAt: now,
  };

  // 4. 存储到中心化存储
  sessionsMap.set(sessionId, session);

  // 5. 更新每个参与者的索引
  normalizedParticipants.forEach((participant) => {
    updateParticipantIndex(participant, sessionId);
  });

  return session;
}

/**
 * 更新会话最后活动时间
 *
 * 【功能说明】
 * 更新指定会话的最后活动时间
 *
 * @param {string} sessionId - 会话 ID
 */
function updateSessionActivity(sessionId) {
  const session = sessionsMap.get(sessionId);
  if (session) {
    session.lastActiveAt = Date.now();
  }
}

/**
 * 查询用户的所有会话
 *
 * 【功能说明】
 * 查询指定用户参与的所有会话，按最后活动时间倒序排列
 *
 * @param {string} userId - 用户 ID
 * @returns {Array<Object>} Session 对象数组，按最后活动时间倒序
 */
function findSessionsByUser(userId) {
  const sessionIds = sessionsByUser[userId] || [];
  const sessions = sessionIds
    .map((id) => sessionsMap.get(id))
    .filter(Boolean) // 过滤掉不存在的 Session
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt); // 按最后活动时间倒序

  return sessions;
}

/**
 * 查询 Agent 的所有会话
 *
 * 【功能说明】
 * 查询指定 Agent 参与的所有会话，按最后活动时间倒序排列
 *
 * @param {string} agentId - Agent ID
 * @returns {Array<Object>} Session 对象数组，按最后活动时间倒序
 */
function findSessionsByAgent(agentId) {
  const sessionIds = sessionsByAgent[agentId] || [];
  const sessions = sessionIds
    .map((id) => sessionsMap.get(id))
    .filter(Boolean) // 过滤掉不存在的 Session
    .sort((a, b) => b.lastActiveAt - a.lastActiveAt); // 按最后活动时间倒序

  return sessions;
}

/**
 * 通过 ID 查询会话
 *
 * 【功能说明】
 * 根据 sessionId 从 sessionsMap 中查询 Session
 *
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session 对象，如果不存在则返回 null
 */
function findSessionById(sessionId) {
  return sessionsMap.get(sessionId) || null;
}

/**
 * 重建所有索引（从中心化存储）
 *
 * 【功能说明】
 * 从中心化存储重建所有索引
 *
 * 【使用场景】
 * - 系统启动时验证索引一致性
 * - 索引损坏时恢复
 * - 数据迁移时重建索引
 *
 * @returns {void}
 */
function rebuildIndexes() {
  // 清空现有索引
  Object.keys(sessionsByUser).forEach((key) => delete sessionsByUser[key]);
  Object.keys(sessionsByAgent).forEach((key) => delete sessionsByAgent[key]);

  // 从中心化存储重建 Session 索引
  sessionsMap.forEach((session, sessionId) => {
    session.participants.forEach((participant) => {
      updateParticipantIndex(participant, sessionId);
    });
  });
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
  sessionsMap.clear();
  Object.keys(sessionsByUser).forEach((key) => delete sessionsByUser[key]);
  Object.keys(sessionsByAgent).forEach((key) => delete sessionsByAgent[key]);
}

module.exports = {
  getOrCreateSession,
  findSessionByParticipants,
  findSessionById,
  updateSessionActivity,
  findSessionsByUser,
  findSessionsByAgent,
  rebuildIndexes,
  clearAll,
};
