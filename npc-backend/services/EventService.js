/**
 * ============================================
 * Event 业务逻辑层 (EventService.js)
 * ============================================
 *
 * 【文件职责】
 * 处理 Event（事件）相关的业务逻辑，包括数据验证、业务规则检查
 *
 * 【主要功能】
 * 1. 事件数据验证（字段验证、内容长度等）
 * 2. 事件创建和查询（封装 Repository 操作）
 * 3. 构建对话上下文（获取最近 N 条事件）
 *
 * 【工作流程】
 * 接收数据 → 字段验证 → 业务规则检查 → 调用 Repository → 更新 Session 活动时间 → 返回结果
 *
 * 【依赖】
 * - repositories/EventRepository.js: 数据访问层
 * - services/SessionService.js: 更新会话活动时间
 * - services/AgentService.js: 获取 Agent 信息（用于验证）
 *
 * 【被谁使用】
 * - services/MessageService.js: 调用事件创建和查询方法
 * - routes/history.js: 调用事件查询方法（阶段 5）
 *
 * 【错误处理】
 * - 验证错误：抛出包含错误码和消息的对象
 * - 业务规则错误：抛出包含错误码和消息的对象
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const eventRepository = require("../repositories/EventRepository");
const sessionService = require("./SessionService");
const agentService = require("./AgentService");

/**
 * 验证事件数据
 *
 * 【功能说明】
 * 验证创建 Event 所需的所有字段
 *
 * 【验证规则】
 * 1. sessionId: 必填，字符串
 * 2. userId: 必填，字符串
 * 3. agentId: 必填，字符串
 * 4. fromType: 必填，必须是 'user' 或 'agent'
 * 5. fromId: 必填，字符串
 * 6. toType: 必填，必须是 'user' 或 'agent'
 * 7. toId: 必填，字符串
 * 8. content: 必填，1-50000 字符
 *
 * @param {Object} eventData - Event 数据
 * @returns {Object|null} 验证错误对象，如果验证通过则返回 null
 */
function validateEventData(eventData) {
  // 验证 sessionId
  if (
    !eventData.sessionId ||
    typeof eventData.sessionId !== "string" ||
    !eventData.sessionId.trim()
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "会话 ID 不能为空",
    };
  }

  // 验证 userId
  if (
    !eventData.userId ||
    typeof eventData.userId !== "string" ||
    !eventData.userId.trim()
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "用户 ID 不能为空",
    };
  }

  // 验证 agentId
  if (
    !eventData.agentId ||
    typeof eventData.agentId !== "string" ||
    !eventData.agentId.trim()
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "Agent ID 不能为空",
    };
  }

  // 验证 fromType
  if (!eventData.fromType || !["user", "agent"].includes(eventData.fromType)) {
    return {
      code: "VALIDATION_ERROR",
      message: "发送者类型必须是 user 或 agent",
    };
  }

  // 验证 fromId
  if (
    !eventData.fromId ||
    typeof eventData.fromId !== "string" ||
    !eventData.fromId.trim()
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "发送者 ID 不能为空",
    };
  }

  // 验证 toType
  if (!eventData.toType || !["user", "agent"].includes(eventData.toType)) {
    return {
      code: "VALIDATION_ERROR",
      message: "接收者类型必须是 user 或 agent",
    };
  }

  // 验证 toId
  if (
    !eventData.toId ||
    typeof eventData.toId !== "string" ||
    !eventData.toId.trim()
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "接收者 ID 不能为空",
    };
  }

  // 验证 content
  if (!eventData.content || typeof eventData.content !== "string") {
    return {
      code: "VALIDATION_ERROR",
      message: "消息内容不能为空",
    };
  }
  const contentLength = eventData.content.trim().length;
  if (contentLength === 0) {
    return {
      code: "VALIDATION_ERROR",
      message: "消息内容不能为空",
    };
  }
  if (contentLength > 50000) {
    return {
      code: "VALIDATION_ERROR",
      message: "消息内容不能超过 50000 字符",
    };
  }

  // 验证业务规则：fromType 和 toType 必须相反
  if (eventData.fromType === eventData.toType) {
    return {
      code: "VALIDATION_ERROR",
      message: "发送者和接收者类型不能相同",
    };
  }

  // 验证业务规则：fromId 和 toId 必须对应正确的类型
  if (eventData.fromType === "user" && eventData.fromId !== eventData.userId) {
    return {
      code: "VALIDATION_ERROR",
      message: "用户发送事件时，fromId 必须等于 userId",
    };
  }
  if (
    eventData.fromType === "agent" &&
    eventData.fromId !== eventData.agentId
  ) {
    return {
      code: "VALIDATION_ERROR",
      message: "Agent 发送事件时，fromId 必须等于 agentId",
    };
  }
  if (eventData.toType === "user" && eventData.toId !== eventData.userId) {
    return {
      code: "VALIDATION_ERROR",
      message: "发送给用户的事件，toId 必须等于 userId",
    };
  }
  if (eventData.toType === "agent" && eventData.toId !== eventData.agentId) {
    return {
      code: "VALIDATION_ERROR",
      message: "发送给 Agent 的事件，toId 必须等于 agentId",
    };
  }

  return null; // 验证通过
}

/**
 * 创建事件
 *
 * 【功能说明】
 * 创建新的事件，包含完整的验证和业务规则检查
 *
 * 【工作流程】
 * 1. 验证字段
 * 2. 验证 Agent 是否存在（如果 fromType 或 toType 是 agent）
 * 3. 调用 Repository 创建 Event
 * 4. 更新 Session 活动时间（通过 SessionService）
 * 5. 返回创建的 Event
 *
 * 【错误处理】
 * - 验证错误 → 抛出 { code: 'VALIDATION_ERROR', message: '...' }
 * - Agent 不存在 → 抛出 { code: 'AGENT_NOT_FOUND', message: '...' }
 * - 系统错误 → 抛出 { code: 'SYSTEM_ERROR', message: '...' }
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
 * @throws {Object} 错误对象 { code, message }
 */
function createEvent(eventData) {
  // 字段验证
  const validationError = validateEventData(eventData);
  if (validationError) {
    throw validationError;
  }

  // 验证 Agent 是否存在（如果涉及 Agent）
  const agentId = eventData.agentId.trim();
  const agent =
    eventData.fromType === "agent" || eventData.toType === "agent"
      ? agentService.getAgentById(agentId)
      : null;

  if (
    (eventData.fromType === "agent" || eventData.toType === "agent") &&
    !agent
  ) {
    throw {
      code: "AGENT_NOT_FOUND",
      message: "Agent 不存在",
    };
  }

  // 创建 Event
  try {
    const event = eventRepository.createEvent({
      sessionId: eventData.sessionId.trim(),
      userId: eventData.userId.trim(),
      agentId: agentId,
      fromType: eventData.fromType,
      fromId: eventData.fromId.trim(),
      toType: eventData.toType,
      toId: eventData.toId.trim(),
      content: eventData.content.trim(),
    });

    // 更新 Session 活动时间（通过 SessionService）
    sessionService.updateSessionActivity(event.sessionId);

    return event;
  } catch (error) {
    // 捕获创建过程中的错误
    throw {
      code: "SYSTEM_ERROR",
      message: "创建事件失败，请稍后重试",
    };
  }
}

/**
 * 获取会话的所有事件
 *
 * 【功能说明】
 * 获取指定会话的所有事件，按时间升序排列
 *
 * 【工作流程】
 * 1. 验证 sessionId
 * 2. 调用 Repository 查询事件
 * 3. 返回事件列表
 *
 * @param {string} sessionId - 会话 ID
 * @returns {Array<Object>} Event 对象数组，按时间升序
 */
function getEventsBySession(sessionId) {
  if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
    return [];
  }

  return eventRepository.getEventsBySession(sessionId.trim());
}

/**
 * 获取会话的最近 N 条事件（用于构建上下文）
 *
 * 【功能说明】
 * 获取指定会话的最近 N 条事件，按时间升序排列（用于构建 LLM 上下文）
 *
 * 【工作流程】
 * 1. 验证 sessionId 和 limit
 * 2. 调用 Repository 查询最近事件
 * 3. 返回事件列表
 *
 * @param {string} sessionId - 会话 ID
 * @param {number} limit - 数量限制（默认 20）
 * @returns {Array<Object>} Event 对象数组，按时间升序
 */
function getRecentEvents(sessionId, limit = 20) {
  if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
    return [];
  }

  if (typeof limit !== "number" || limit < 1) {
    limit = 20; // 默认值
  }

  return eventRepository.getRecentEvents(sessionId.trim(), limit);
}

/**
 * 通过 ID 查询事件
 *
 * 【功能说明】
 * 根据 eventId 查询 Event
 *
 * @param {string} eventId - Event ID
 * @returns {Object|null} Event 对象，如果不存在则返回 null
 */
function getEventById(eventId) {
  if (!eventId || typeof eventId !== "string") {
    return null;
  }

  return eventRepository.findEventById(eventId);
}

/**
 * 通过用户和 Agent 获取对话历史
 *
 * 【功能说明】
 * 根据 userId 和 agentId 获取对话历史（Session 信息 + 事件列表）
 *
 * 【工作流程】
 * 1. 验证 userId 和 agentId
 * 2. 通过参与者列表查找 Session
 * 3. 如果 Session 不存在，返回 null（表示没有对话历史）
 * 4. 如果 Session 存在，获取该 Session 的所有事件
 * 5. 返回 Session 信息和事件列表
 *
 * 【使用场景】
 * - 获取用户与指定 Agent 的完整对话历史
 * - 用于前端展示对话记录
 *
 * 【返回格式】
 * {
 *   session: {
 *     sessionId: "...",
 *     participants: [...],
 *     createdAt: 1234567890,
 *     lastActiveAt: 1234567890
 *   },
 *   events: [...]
 * }
 *
 * @param {string} userId - 用户 ID
 * @param {string} agentId - Agent ID
 * @returns {Object|null} 包含 Session 和 events 的对象，如果 Session 不存在则返回 null
 */
function getHistoryByUserAndAgent(userId, agentId) {
  // 验证参数
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return null;
  }
  if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
    return null;
  }

  // 构建参与者列表（标准化排序）
  const participants = [
    { type: "user", id: userId.trim() },
    { type: "agent", id: agentId.trim() },
  ];

  // 查找 Session
  const session = sessionService.findSessionByParticipants(participants);
  if (!session) {
    // Session 不存在，返回 null（表示没有对话历史）
    return null;
  }

  // 获取该 Session 的所有事件
  const events = eventRepository.getEventsBySession(session.sessionId);

  // 返回 Session 信息和事件列表
  return {
    session: {
      sessionId: session.sessionId,
      participants: session.participants,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
    },
    events: events,
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
  // ⚠️ 未来功能：当前阶段不使用此函数
  // 使用 getEventsBySession() 或 getRecentEvents() 代替

  if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
    return [];
  }

  // 调用 Repository 的未来功能
  return eventRepository.getEventsBySessionWithOptions(
    sessionId.trim(),
    options
  );
}

module.exports = {
  // Event 相关
  createEvent,
  getEventsBySession,
  getRecentEvents,
  getEventById,
  getHistoryByUserAndAgent, // 通过用户和 Agent 获取对话历史

  // 未来功能（已实现但未使用）
  getEventsBySessionWithOptions, // ⚠️ 未来功能：主题筛选
};
