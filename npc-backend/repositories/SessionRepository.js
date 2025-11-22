/**
 * ============================================
 * Session 数据访问层 (SessionRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 管理 Session（会话）数据的 MySQL 数据库访问操作
 *
 * 【主要功能】
 * 1. 提供 Session 的创建和查询操作
 * 2. 单会话模式：同一参与者组合只有一个会话
 * 3. 参与者标准化排序
 *
 * 【工作流程】
 * 创建 Session → 插入数据库 → 返回结果
 * 查询 Session → 从数据库查询 → 返回结果
 *
 * 【存储结构】
 * - 使用 MySQL sessions 表存储
 * - participants 字段存储为 JSON 格式
 *
 * 【依赖】
 * - config/database.js: 数据库连接和查询方法
 *
 * 【被谁使用】
 * - services/SessionService.js: 调用数据访问方法
 *
 * 【重要说明】
 * - 使用 MySQL 数据库存储
 * - 单会话模式：同一参与者组合只有一个会话
 * - participants 以 JSON 格式存储，查询时通过 JSON 匹配
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-21
 */

const { query } = require("../config/database");

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
 * 查找会话（单会话模式）
 *
 * 【功能说明】
 * 查找指定参与者的会话，如果不存在则返回 null
 * 同一参与者组合只有一个会话（单会话模式）
 *
 * 【工作流程】
 * 1. 标准化参与者列表（排序）
 * 2. 将参与者列表转换为 JSON 字符串
 * 3. 在数据库中查询匹配的会话（通过 JSON 匹配）
 *
 * 【参数说明】
 * @param {Array<{type: string, id: string}>} participants - 参与者列表
 * @returns {Promise<Object|null>} Session 对象，如果不存在则返回 null
 */
async function findSessionByParticipants(participants) {
  if (participants.length === 0) return null;

  // 1. 标准化参与者列表（排序）
  const normalizedParticipants = normalizeParticipants(participants);
  const participantsJson = JSON.stringify(normalizedParticipants);

  // 2. 在数据库中查询匹配的会话
  // 注意：MySQL 5.7+ 支持 JSON 类型和 JSON 函数
  // 使用 JSON_CONTAINS 或直接比较 JSON 字符串
  const sql = `
    SELECT * FROM sessions 
    WHERE participants = ?
    LIMIT 1
  `;
  const results = await query(sql, [participantsJson]);

  if (results.length === 0) {
    return null;
  }

  const session = results[0];
  return {
    sessionId: session.id,
    participants: JSON.parse(session.participants),
    createdAt: session.created_at,
    lastActiveAt: session.last_active_at,
  };
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
 * 4. 插入数据库
 * 5. 返回会话对象
 *
 * 【参数说明】
 * @param {Array<{type: string, id: string}>} participants - 参与者列表
 * @returns {Promise<Object>} Session 对象
 */
async function getOrCreateSession(participants) {
  // 1. 标准化参与者列表（排序）
  const normalizedParticipants = normalizeParticipants(participants);

  // 2. 尝试查找现有会话
  const existingSession = await findSessionByParticipants(normalizedParticipants);
  if (existingSession) {
    return existingSession; // 返回现有会话
  }

  // 3. 创建新会话
  const sessionId = generateSessionId();
  const now = Date.now();
  const participantsJson = JSON.stringify(normalizedParticipants);

  const sql = `
    INSERT INTO sessions (id, participants, created_at, last_active_at)
    VALUES (?, ?, ?, ?)
  `;

  await query(sql, [sessionId, participantsJson, now, now]);

  return {
    sessionId,
    participants: normalizedParticipants,
    createdAt: now,
    lastActiveAt: now,
  };
}

/**
 * 更新会话最后活动时间
 *
 * 【功能说明】
 * 更新指定会话的最后活动时间
 *
 * 【参数说明】
 * @param {string} sessionId - 会话 ID
 */
async function updateSessionActivity(sessionId) {
  const now = Date.now();
  const sql = `UPDATE sessions SET last_active_at = ? WHERE id = ?`;
  await query(sql, [now, sessionId]);
}

/**
 * 查询用户的所有会话
 *
 * 【功能说明】
 * 查询指定用户参与的所有会话，按最后活动时间倒序排列
 *
 * 【工作流程】
 * 1. 在数据库中查询包含该用户的会话（通过 JSON 查询）
 * 2. 按最后活动时间倒序排序
 * 3. 返回会话对象数组
 *
 * 【参数说明】
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array<Object>>} Session 对象数组，按最后活动时间倒序
 */
async function findSessionsByUser(userId) {
  // 使用 JSON_CONTAINS 查询包含指定用户的会话
  // JSON_CONTAINS(participants, '{"type":"user","id":"user_123"}')
  const participantJson = JSON.stringify({ type: "user", id: userId });
  const sql = `
    SELECT * FROM sessions 
    WHERE JSON_CONTAINS(participants, ?)
    ORDER BY last_active_at DESC
  `;
  const results = await query(sql, [participantJson]);

  return results.map((session) => ({
    sessionId: session.id,
    participants: JSON.parse(session.participants),
    createdAt: session.created_at,
    lastActiveAt: session.last_active_at,
  }));
}

/**
 * 查询 Agent 的所有会话
 *
 * 【功能说明】
 * 查询指定 Agent 参与的所有会话，按最后活动时间倒序排列
 *
 * 【工作流程】
 * 1. 在数据库中查询包含该 Agent 的会话（通过 JSON 查询）
 * 2. 按最后活动时间倒序排序
 * 3. 返回会话对象数组
 *
 * 【参数说明】
 * @param {string} agentId - Agent ID
 * @returns {Promise<Array<Object>>} Session 对象数组，按最后活动时间倒序
 */
async function findSessionsByAgent(agentId) {
  // 使用 JSON_CONTAINS 查询包含指定 Agent 的会话
  const participantJson = JSON.stringify({ type: "agent", id: agentId });
  const sql = `
    SELECT * FROM sessions 
    WHERE JSON_CONTAINS(participants, ?)
    ORDER BY last_active_at DESC
  `;
  const results = await query(sql, [participantJson]);

  return results.map((session) => ({
    sessionId: session.id,
    participants: JSON.parse(session.participants),
    createdAt: session.created_at,
    lastActiveAt: session.last_active_at,
  }));
}

/**
 * 通过 ID 查询会话
 *
 * 【功能说明】
 * 根据 sessionId 从数据库查询 Session
 *
 * 【参数说明】
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object|null>} Session 对象，如果不存在则返回 null
 */
async function findSessionById(sessionId) {
  const sql = `SELECT * FROM sessions WHERE id = ?`;
  const results = await query(sql, [sessionId]);

  if (results.length === 0) {
    return null;
  }

  const session = results[0];
  return {
    sessionId: session.id,
    participants: JSON.parse(session.participants),
    createdAt: session.created_at,
    lastActiveAt: session.last_active_at,
  };
}

/**
 * 清空所有数据（用于测试或重置）
 *
 * 【功能说明】
 * 清空所有 Session 数据
 *
 * 【注意】
 * 主要用于测试，生产环境慎用
 */
async function clearAll() {
  await query("DELETE FROM sessions");
}

module.exports = {
  normalizeParticipants,
  generateSessionId,
  findSessionByParticipants,
  getOrCreateSession,
  updateSessionActivity,
  findSessionsByUser,
  findSessionsByAgent,
  findSessionById,
  clearAll,
};
