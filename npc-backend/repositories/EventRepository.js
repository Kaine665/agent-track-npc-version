/**
 * ============================================
 * Event 数据访问层 (EventRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 管理 Event（事件）数据的内存存储和访问操作
 *
 * 【主要功能】
 * 1. 实现中心化存储 + 会话索引的存储结构
 * 2. 提供 Event 的创建和查询操作
 * 3. 维护索引结构（eventsBySession）
 *
 * 【工作流程】
 * 创建 Event → 存储到 eventsMap → 更新会话索引 → 返回结果
 *
 * 【存储结构】
 * - eventsMap: Map<eventId, Event> - 全局 Event 存储（中心化存储）
 * - eventsBySession: { [sessionId]: eventId[] } - 会话事件索引
 *
 * 【依赖】
 * - 无外部依赖（不依赖 SessionRepository，只使用 sessionId）
 *
 * 【被谁使用】
 * - services/EventService.js: 调用数据访问方法
 *
 * 【重要说明】
 * - 开发阶段：每次重启清空数据
 * - 未来迁移：可以替换为数据库实现，保持接口不变
 * - Event 必须属于某个 Session（通过 sessionId 关联）
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

/**
 * 全局 Event 存储（中心化存储 - 单一数据源）
 *
 * 【功能说明】
 * 使用 Map 存储所有 Event，key 为 eventId，value 为 Event 对象
 *
 * 【格式】
 * Map<eventId, Event>
 */
const eventsMap = new Map();

/**
 * 会话事件索引
 *
 * 【功能说明】
 * 按会话分组存储 Event ID 列表，用于快速查询会话的所有事件
 *
 * 【格式】
 * { [sessionId]: eventId[] }
 *
 * 【示例】
 * {
 *   'session_abc123': ['event_111', 'event_112', 'event_113'],
 *   'session_xyz789': ['event_114', 'event_115']
 * }
 */
const eventsBySession = {};

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
 * 创建新的事件并存储到内存中，同时维护索引
 *
 * 【工作流程】
 * 1. 生成 Event ID
 * 2. 创建 Event 对象（添加时间戳）
 * 3. 存储到 eventsMap
 * 4. 更新 eventsBySession 索引
 *
 * 【注意】
 * - 不更新会话活动时间（由 SessionService 负责）
 * - 不验证 Session 是否存在（由 Service 层负责）
 *
 * @param {Object} eventData - Event 数据
 * @param {string} eventData.sessionId - 会话 ID
 * @param {string} eventData.userId - 用户 ID
 * @param {string} eventData.agentId - Agent ID
 * @param {string} eventData.fromType - 发送者类型（user/agent）
 * @param {string} eventData.fromId - 发送者 ID
 * @param {string} eventData.toType - 接收者类型（user/agent）
 * @param {string} eventData.toId - 接收者 ID
 * @param {string} eventData.content - 消息内容
 * @returns {Object} 创建的 Event 对象
 */
function createEvent(eventData) {
  const eventId = generateEventId();
  const now = Date.now();

  const event = {
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

  // 存储到全局 Map
  eventsMap.set(eventId, event);

  // 更新会话事件索引
  const sessionId = eventData.sessionId;
  if (!eventsBySession[sessionId]) {
    eventsBySession[sessionId] = [];
  }
  eventsBySession[sessionId].push(eventId);

  return event;
}

/**
 * 获取会话的所有事件
 *
 * 【功能说明】
 * 获取指定会话的所有事件，按时间升序排列
 *
 * 【工作流程】
 * 1. 从 eventsBySession 索引获取该会话的所有 Event ID
 * 2. 根据 ID 列表从 eventsMap 获取 Event 对象
 * 3. 按时间戳升序排序
 *
 * @param {string} sessionId - 会话 ID
 * @returns {Array<Object>} Event 对象数组，按时间升序
 */
function getEventsBySession(sessionId) {
  const eventIds = eventsBySession[sessionId] || [];
  const events = eventIds
    .map((id) => eventsMap.get(id))
    .filter(Boolean) // 过滤掉不存在的 Event
    .sort((a, b) => a.timestamp - b.timestamp); // 按时间升序

  return events;
}

/**
 * 获取会话的最近 N 条事件（用于构建上下文）
 *
 * 【功能说明】
 * 获取指定会话的最近 N 条事件，按时间升序排列（用于构建 LLM 上下文）
 *
 * 【工作流程】
 * 1. 获取会话的所有事件
 * 2. 取最后 N 条（最近的）
 * 3. 按时间升序排序（LLM 需要按时间顺序）
 *
 * @param {string} sessionId - 会话 ID
 * @param {number} limit - 数量限制（默认 20）
 * @returns {Array<Object>} Event 对象数组，按时间升序
 */
function getRecentEvents(sessionId, limit = 20) {
  const allEvents = getEventsBySession(sessionId);
  // 取最后 N 条（最近的）
  const recentEvents = allEvents.slice(-limit);
  return recentEvents;
}

/**
 * 通过 ID 查询事件
 *
 * 【功能说明】
 * 根据 eventId 从 eventsMap 中查询 Event
 *
 * @param {string} eventId - Event ID
 * @returns {Object|null} Event 对象，如果不存在则返回 null
 */
function findEventById(eventId) {
  return eventsMap.get(eventId) || null;
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
 * 【实现思路】
 * 1. 基于事件内容的语义分析
 * 2. 关键词匹配
 * 3. 时间窗口（同一时间段的事件可能属于同一主题）
 * 4. 对话上下文（连续对话可能属于同一主题）
 *
 * 【使用场景】
 * - 用户想要查看某个主题的对话历史
 * - 例如：只查看"学习计划"相关的对话
 *
 * @param {string} sessionId - 会话 ID
 * @param {Object} options - 查询选项
 * @param {string} options.topic - 主题关键词（可选，未来实现）
 * @param {number} options.limit - 限制数量（可选）
 * @param {number} options.offset - 偏移量（可选）
 * @returns {Array<Object>} Event 对象数组
 */
function getEventsBySessionWithOptions(sessionId, options = {}) {
  const { topic, limit, offset = 0 } = options;

  // 1. 获取所有事件
  let events = getEventsBySession(sessionId);

  // 2. 主题筛选（未来实现）
  if (topic) {
    // TODO: 实现主题筛选算法
    // 可以基于：
    // - 事件内容的语义分析
    // - 关键词匹配
    // - 时间窗口
    // - 对话上下文
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
 * 【实现思路】
 * - 方案1：基于关键词匹配（简单实现）
 * - 方案2：基于语义分析（使用 LLM embedding）
 * - 方案3：基于时间窗口（连续对话）
 * - 方案4：基于事件标签（手动或自动标记）
 *
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
  Object.keys(eventsBySession).forEach((key) => delete eventsBySession[key]);

  // 从中心化存储重建 Event 索引
  eventsMap.forEach((event, eventId) => {
    const sessionId = event.sessionId;
    if (!eventsBySession[sessionId]) {
      eventsBySession[sessionId] = [];
    }
    if (!eventsBySession[sessionId].includes(eventId)) {
      eventsBySession[sessionId].push(eventId);
    }
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
  eventsMap.clear();
  Object.keys(eventsBySession).forEach((key) => delete eventsBySession[key]);
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
  rebuildIndexes,
  clearAll,
};
