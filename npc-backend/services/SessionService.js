/**
 * ============================================
 * Session 业务逻辑层 (SessionService.js)
 * ============================================
 *
 * 【文件职责】
 * 处理 Session（会话）相关的业务逻辑，包括数据验证、业务规则检查
 *
 * 【主要功能】
 * 1. 参与者列表验证
 * 2. 会话创建和查询（封装 Repository 操作）
 * 3. 会话活动时间管理
 *
 * 【工作流程】
 * 接收数据 → 字段验证 → 业务规则检查 → 调用 Repository → 返回结果
 *
 * 【依赖】
 * - repositories/SessionRepository.js: 数据访问层
 *
 * 【被谁使用】
 * - services/EventService.js: 调用会话管理方法（更新活动时间）
 * - services/MessageService.js: 调用会话创建和查询方法
 * - routes/messages.js: 调用会话查询方法（未来）
 *
 * 【错误处理】
 * - 验证错误：抛出包含错误码和消息的对象
 * - 业务规则错误：抛出包含错误码和消息的对象
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const sessionRepository = require("../repositories/SessionRepository");

/**
 * 获取或创建会话
 *
 * 【功能说明】
 * 获取指定参与者的会话，如果不存在则创建新会话
 * 同一参与者组合只有一个会话（单会话模式）
 *
 * 【工作流程】
 * 1. 验证参与者列表
 * 2. 调用 Repository 获取或创建会话
 * 3. 返回会话对象
 *
 * @param {Array<{type: string, id: string}>} participants - 参与者列表
 * @returns {Object} Session 对象
 * @throws {Object} 错误对象 { code, message }
 */
function getOrCreateSession(participants) {
  // 验证参与者列表
  if (!Array.isArray(participants) || participants.length === 0) {
    throw {
      code: "VALIDATION_ERROR",
      message: "参与者列表不能为空",
    };
  }

  // 验证每个参与者
  for (const participant of participants) {
    if (!participant.type || !participant.id) {
      throw {
        code: "VALIDATION_ERROR",
        message: "参与者必须包含 type 和 id 字段",
      };
    }
    if (!["user", "agent"].includes(participant.type)) {
      throw {
        code: "VALIDATION_ERROR",
        message: "参与者类型必须是 user 或 agent",
      };
    }
  }

  // 调用 Repository 获取或创建会话
  try {
    return sessionRepository.getOrCreateSession(participants);
  } catch (error) {
    throw {
      code: "SYSTEM_ERROR",
      message: "获取或创建会话失败，请稍后重试",
    };
  }
}

/**
 * 查找会话
 *
 * 【功能说明】
 * 查找指定参与者的会话，如果不存在则返回 null
 *
 * @param {Array<{type: string, id: string}>} participants - 参与者列表
 * @returns {Object|null} Session 对象，如果不存在则返回 null
 */
function findSessionByParticipants(participants) {
  if (!Array.isArray(participants) || participants.length === 0) {
    return null;
  }

  return sessionRepository.findSessionByParticipants(participants);
}

/**
 * 更新会话最后活动时间
 *
 * 【功能说明】
 * 更新指定会话的最后活动时间
 *
 * 【使用场景】
 * - 创建事件时调用（EventService.createEvent）
 * - 发送消息时调用（MessageService.sendMessage）
 *
 * @param {string} sessionId - 会话 ID
 */
function updateSessionActivity(sessionId) {
  if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
    return; // 静默失败，不影响主流程
  }

  sessionRepository.updateSessionActivity(sessionId.trim());
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
function getSessionsByUser(userId) {
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return [];
  }

  return sessionRepository.findSessionsByUser(userId.trim());
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
function getSessionsByAgent(agentId) {
  if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
    return [];
  }

  return sessionRepository.findSessionsByAgent(agentId.trim());
}

/**
 * 通过 ID 查询会话
 *
 * 【功能说明】
 * 根据 sessionId 查询 Session
 *
 * @param {string} sessionId - Session ID
 * @returns {Object|null} Session 对象，如果不存在则返回 null
 */
function getSessionById(sessionId) {
  if (!sessionId || typeof sessionId !== "string") {
    return null;
  }

  return sessionRepository.findSessionById(sessionId);
}

module.exports = {
  getOrCreateSession,
  findSessionByParticipants,
  getSessionById,
  updateSessionActivity,
  getSessionsByUser,
  getSessionsByAgent,
};

