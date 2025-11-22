/**
 * ============================================
 * Event 数据访问层 (EventRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 管理 Event（事件）数据的 MySQL 数据库访问操作
 *
 * 【主要功能】
 * 1. 提供 Event 的创建和查询操作
 * 2. 查询会话的所有事件（按时间升序）
 * 3. 查询会话的最近 N 条事件
 *
 * 【工作流程】
 * 创建 Event → 插入数据库 → 返回结果
 * 查询 Event → 从数据库查询 → 返回结果
 *
 * 【存储结构】
 * - 使用 MySQL events 表存储
 * - 通过 session_id 索引优化查询性能
 *
 * 【依赖】
 * - config/database.js: 数据库连接和查询方法
 *
 * 【被谁使用】
 * - services/EventService.js: 调用数据访问方法
 *
 * 【重要说明】
 * - 使用 MySQL 数据库存储
 * - Event 必须属于某个 Session（通过 sessionId 关联）
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-21
 */

const { query } = require("../config/database");

/**
 * 生成 Event ID
 *
 * 【功能说明】
 * 生成唯一的 Event ID，格式：event_{timestamp}_{random}
 *
 * 【ID 格式】
 * event_1703001234567_xyz789
 *
 * @returns {string} Event ID
 */
function generateEventId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `event_${timestamp}_${random}`;
}

/**
 * 创建事件
 *
 * 【功能说明】
 * 创建新的事件并保存到数据库
 *
 * 【工作流程】
 * 1. 生成 Event ID
 * 2. 创建 Event 对象（添加时间戳）
 * 3. 插入数据库
 * 4. 返回 Event 对象
 *
 * 【注意】
 * - 不更新会话活动时间（由 SessionService 负责）
 * - 不验证 Session 是否存在（由 Service 层负责）
 *
 * 【参数说明】
 * @param {Object} eventData - Event 数据
 * @param {string} eventData.sessionId - 会话 ID
 * @param {string} eventData.userId - 用户 ID
 * @param {string} eventData.agentId - Agent ID
 * @param {string} eventData.fromType - 发送者类型（user/agent）
 * @param {string} eventData.fromId - 发送者 ID
 * @param {string} eventData.toType - 接收者类型（user/agent）
 * @param {string} eventData.toId - 接收者 ID
 * @param {string} eventData.content - 消息内容
 * @returns {Promise<Object>} 创建的 Event 对象
 */
async function createEvent(eventData) {
  const eventId = generateEventId();
  const now = Date.now();

  const sql = `
    INSERT INTO events (
      id, session_id, user_id, agent_id, from_type, from_id, to_type, to_id, content, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await query(sql, [
    eventId,
    eventData.sessionId,
    eventData.userId,
    eventData.agentId,
    eventData.fromType,
    eventData.fromId,
    eventData.toType,
    eventData.toId,
    eventData.content,
    now,
  ]);

  return {
    id: eventId,
    sessionId: eventData.sessionId,
    userId: eventData.userId,
    agentId: eventData.agentId,
    fromType: eventData.fromType,
    fromId: eventData.fromId,
    toType: eventData.toType,
    toId: eventData.toId,
    content: eventData.content,
    timestamp: now,
  };
}

/**
 * 获取会话的所有事件
 *
 * 【功能说明】
 * 获取指定会话的所有事件，按时间升序排列
 *
 * 【工作流程】
 * 1. 执行 SQL 查询（使用 session_id 索引）
 * 2. 按时间戳升序排序
 * 3. 返回 Event 对象数组
 *
 * 【参数说明】
 * @param {string} sessionId - 会话 ID
 * @returns {Promise<Array<Object>>} Event 对象数组，按时间升序
 */
async function getEventsBySession(sessionId) {
  const sql = `
    SELECT * FROM events 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
  `;
  const results = await query(sql, [sessionId]);

  return results.map((event) => ({
    id: event.id,
    sessionId: event.session_id,
    userId: event.user_id,
    agentId: event.agent_id,
    fromType: event.from_type,
    fromId: event.from_id,
    toType: event.to_type,
    toId: event.to_id,
    content: event.content,
    timestamp: event.timestamp,
  }));
}

/**
 * 获取会话的最近 N 条事件（用于构建上下文）
 *
 * 【功能说明】
 * 获取指定会话的最近 N 条事件，按时间升序排列（用于构建 LLM 上下文）
 *
 * 【工作流程】
 * 1. 执行 SQL 查询（使用 session_id 索引）
 * 2. 按时间戳降序排序，取前 N 条
 * 3. 反转顺序，按时间升序返回（LLM 需要按时间顺序）
 *
 * 【参数说明】
 * @param {string} sessionId - 会话 ID
 * @param {number} limit - 数量限制（默认 20）
 * @returns {Promise<Array<Object>>} Event 对象数组，按时间升序
 */
async function getRecentEvents(sessionId, limit = 20) {
  // 注意：LIMIT 参数不能使用参数化查询，需要直接拼接
  // 但 limit 是数字，可以安全拼接（已通过参数验证）
  const safeLimit = parseInt(limit, 10) || 20;
  const sql = `
    SELECT * FROM events 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ${safeLimit}
  `;
  const results = await query(sql, [sessionId]);

  // 反转顺序，按时间升序返回（LLM 需要按时间顺序）
  return results
    .reverse()
    .map((event) => ({
      id: event.id,
      sessionId: event.session_id,
      userId: event.user_id,
      agentId: event.agent_id,
      fromType: event.from_type,
      fromId: event.from_id,
      toType: event.to_type,
      toId: event.to_id,
      content: event.content,
      timestamp: event.timestamp,
    }));
}

/**
 * 通过 ID 查询事件
 *
 * 【功能说明】
 * 根据 eventId 从数据库查询 Event
 *
 * 【参数说明】
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Event 对象，如果不存在则返回 null
 */
async function findEventById(eventId) {
  const sql = `SELECT * FROM events WHERE id = ?`;
  const results = await query(sql, [eventId]);

  if (results.length === 0) {
    return null;
  }

  const event = results[0];
  return {
    id: event.id,
    sessionId: event.session_id,
    userId: event.user_id,
    agentId: event.agent_id,
    fromType: event.from_type,
    fromId: event.from_id,
    toType: event.to_type,
    toId: event.to_id,
    content: event.content,
    timestamp: event.timestamp,
  };
}

// ==================== 未来功能（已实现但未使用） ====================

/**
 * 获取会话的事件（支持主题筛选）- 未来功能
 *
 * 【功能说明】
 * 获取指定会话的所有事件，支持按主题筛选
 *
 * 【状态】
 * ⚠️ 未来功能：已实现但当前阶段不使用
 * 当前阶段：使用 getEventsBySession() 获取所有事件
 * 未来扩展：通过算法分析事件内容，实现主题筛选
 *
 * 【参数说明】
 * @param {string} sessionId - 会话 ID
 * @param {Object} options - 查询选项
 * @param {string} options.topic - 主题关键词（可选，未来实现）
 * @param {number} options.limit - 限制数量（可选）
 * @param {number} options.offset - 偏移量（可选）
 * @returns {Promise<Array<Object>>} Event 对象数组
 */
async function getEventsBySessionWithOptions(sessionId, options = {}) {
  const { topic, limit, offset = 0 } = options;

  // 1. 获取所有事件
  let events = await getEventsBySession(sessionId);

  // 2. 主题筛选（未来实现）
  if (topic) {
    // TODO: 实现主题筛选算法
    events = filterEventsByTopic(events, topic);
  }

  // 3. 分页
  if (offset > 0 || limit) {
    const start = offset;
    const end = limit ? start + limit : undefined;
    events = events.slice(start, end);
  }

  return events;
}

/**
 * 按主题筛选事件（未来功能）
 *
 * 【功能说明】
 * 根据主题关键词筛选事件
 *
 * 【状态】
 * ⚠️ 未来功能：已实现但当前阶段不使用
 *
 * 【参数说明】
 * @param {Array<Object>} events - 事件列表
 * @param {string} topic - 主题关键词
 * @returns {Array<Object>} 筛选后的事件列表
 */
function filterEventsByTopic(events, topic) {
  // TODO: 实现主题筛选算法
  // 当前实现：简单的关键词匹配（示例）
  return events.filter((event) => {
    return event.content.toLowerCase().includes(topic.toLowerCase());
  });
}

/**
 * 清空所有数据（用于测试或重置）
 *
 * 【功能说明】
 * 清空所有 Event 数据
 *
 * 【注意】
 * 主要用于测试，生产环境慎用
 */
async function clearAll() {
  await query("DELETE FROM events");
}

module.exports = {
  // Event 相关
  createEvent,
  getEventsBySession,
  getRecentEvents,
  findEventById,

  // 未来功能（已实现但未使用）
  getEventsBySessionWithOptions, // ⚠️ 未来功能：主题筛选
  filterEventsByTopic, // ⚠️ 未来功能：主题筛选算法

  // 工具函数
  clearAll,
};
