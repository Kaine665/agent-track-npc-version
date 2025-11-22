/**
 * ============================================
 * Message 业务逻辑层 (MessageService.js)
 * ============================================
 *
 * 【文件职责】
 * 处理消息发送相关的业务逻辑，编排整个消息发送流程
 *
 * 【主要功能】
 * 1. 消息发送流程编排（8 个步骤）
 * 2. 会话管理（获取或创建 Session）
 * 3. 事件创建（用户消息和 Agent 回复）
 * 4. LLM API 调用（生成回复）
 *
 * 【工作流程】
 * 验证参数 → 获取或创建 Session → 同步创建用户消息 Event → 
 * 获取历史事件 → 异步调用 LLM → 同步创建 Agent 回复 Event → 返回结果
 *
 * 【依赖】
 * - services/SessionService.js: 会话管理
 * - services/EventService.js: 事件创建和查询
 * - services/AgentService.js: 获取 Agent 配置
 * - services/LLMService.js: LLM API 调用
 *
 * 【被谁使用】
 * - routes/messages.js: 调用消息发送方法
 *
 * 【错误处理】
 * - 验证错误：抛出包含错误码和消息的对象
 * - Agent 不存在：抛出 AGENT_NOT_FOUND
 * - LLM API 错误：抛出 LLM_API_ERROR
 * - 系统错误：抛出 SYSTEM_ERROR
 *
 * 【设计决策】
 * 1. 先同步创建用户消息 Event（保证历史事件完整）
 * 2. 然后异步调用 LLM（在等待期间可以做其他事情）
 * 3. LLM 返回后，同步创建 Agent 回复 Event
 * 
 * 【Session 单会话模式】
 * - 同一参与者组合（用户 + Agent）只有一个 Session
 * - 用户 A 再次和 Agent B 对话，会复用同一个 Session
 * - 未来扩展：支持主题自动拆分，将一个 Session 拆分成多个子 Session
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const sessionService = require("./SessionService");
const eventService = require("./EventService");
const agentService = require("./AgentService");
const llmService = require("./LLMService");

/**
 * 发送消息
 *
 * 【功能说明】
 * 处理用户发送消息的完整流程，包括创建事件、调用 LLM、生成回复
 *
 * 【工作流程】
 * 1. 验证参数（userId, agentId, text）
 * 2. 获取或创建 Session（单会话模式：同一参与者组合只有一个 Session）
 * 3. 同步创建用户消息 Event（保证历史事件完整）
 * 4. 获取 Agent 配置（systemPrompt 和 model）
 * 5. 获取最近 N 条历史事件（包含新消息，用于构建上下文）
 * 6. 异步调用 LLM API（在等待期间可以做其他事情）
 * 7. 同步创建 Agent 回复 Event
 * 8. 返回 Agent 回复内容
 *
 * 【设计决策】
 * - 先同步创建用户消息 Event：保证历史事件完整，LLM 上下文包含新消息
 * - 然后异步调用 LLM：LLM 调用本身是异步的，在等待期间可以做其他事情
 * - LLM 返回后同步创建 Agent 回复 Event：保证回复事件及时保存
 *
 * 【错误处理】
 * - 如果步骤 3（创建用户消息 Event）失败：直接抛出错误，不继续执行
 * - 如果步骤 6（调用 LLM）失败：用户消息 Event 已创建，返回错误但不回滚
 * - 如果步骤 7（创建 Agent 回复 Event）失败：LLM 已返回回复，返回错误但不回滚
 *
 * @param {Object} options - 消息发送选项
 * @param {string} options.userId - 用户 ID
 * @param {string} options.agentId - Agent ID
 * @param {string} options.text - 消息内容
 * @param {number} [options.contextLimit] - 上下文事件数量限制（默认 20）
 * @returns {Promise<Object>} Agent 回复事件对象 { eventId, content, timestamp }
 * @throws {Object} 错误对象 { code, message }
 */
async function sendMessage(options) {
  const { userId, agentId, text, contextLimit = 20 } = options;

  // ==================== 步骤 1：验证参数 ====================
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    throw {
      code: "VALIDATION_ERROR",
      message: "用户 ID 不能为空",
    };
  }

  if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
    throw {
      code: "VALIDATION_ERROR",
      message: "Agent ID 不能为空",
    };
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    throw {
      code: "VALIDATION_ERROR",
      message: "消息内容不能为空",
    };
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    throw {
      code: "VALIDATION_ERROR",
      message: "消息内容不能为空",
    };
  }

  if (trimmedText.length > 5000) {
    throw {
      code: "VALIDATION_ERROR",
      message: "消息内容不能超过 5000 字符",
    };
  }

  // ==================== 步骤 2：获取或创建 Session ====================
  // 单会话模式：同一参与者组合（用户 + Agent）只有一个 Session
  // 用户 A 再次和 Agent B 对话，会复用同一个 Session
  const session = await sessionService.getOrCreateSession([
    { type: "user", id: userId.trim() },
    { type: "agent", id: agentId.trim() },
  ]);

  // ==================== 步骤 3：同步创建用户消息 Event ====================
  // 先同步创建用户消息 Event，保证历史事件完整
  // 这样在获取历史事件时，新消息已经包含在上下文中
  const userEvent = await eventService.createEvent({
    sessionId: session.sessionId,
    userId: userId.trim(),
    agentId: agentId.trim(),
    fromType: "user",
    fromId: userId.trim(),
    toType: "agent",
    toId: agentId.trim(),
    content: trimmedText,
  });

  // ==================== 步骤 4：获取 Agent 配置 ====================
  const agent = await agentService.getAgentById(agentId.trim());
  if (!agent) {
    throw {
      code: "AGENT_NOT_FOUND",
      message: "Agent 不存在",
    };
  }

  // ==================== 步骤 5：获取最近 N 条历史事件 ====================
  // 获取历史事件（包含新消息），用于构建 LLM 上下文
  const historyEvents = await eventService.getRecentEvents(
    session.sessionId,
    contextLimit
  );

  // ==================== 步骤 6：异步调用 LLM API（后台处理）====================
  // 不等待 LLM 回复，立即返回用户消息 Event ID
  // LLM 调用在后台异步处理，前端通过轮询获取回复
  
  // 后台异步处理 LLM 调用（不阻塞主流程）
  processLLMReplyAsync({
    sessionId: session.sessionId,
    userId: userId.trim(),
    agentId: agentId.trim(),
    agent: agent,
    historyEvents: historyEvents,
  }).catch((error) => {
    // 后台处理失败，记录错误日志（不影响用户消息的创建）
    console.error("[MessageService] Background LLM processing failed:", error);
  });

  // ==================== 步骤 7：立即返回用户消息 Event ====================
  // 不等待 LLM 回复，立即返回用户消息 Event ID
  // 前端通过轮询检查新消息来获取 Agent 回复
  return {
    userEventId: userEvent.id,
    sessionId: session.sessionId,
    timestamp: userEvent.timestamp,
    status: "pending", // 表示 Agent 回复正在处理中
  };
}

/**
 * 后台异步处理 LLM 回复
 *
 * 【功能说明】
 * 在后台异步调用 LLM API 并创建 Agent 回复 Event
 * 不阻塞主流程，允许前端立即收到响应
 *
 * 【工作流程】
 * 1. 调用 LLM API 生成回复
 * 2. 创建 Agent 回复 Event
 * 3. 更新 Session 活动时间
 *
 * 【错误处理】
 * - LLM 调用失败：记录错误日志，但不影响用户消息的创建
 * - Event 创建失败：记录错误日志
 *
 * @param {Object} options - LLM 处理选项
 * @param {string} options.sessionId - 会话 ID
 * @param {string} options.userId - 用户 ID
 * @param {string} options.agentId - Agent ID
 * @param {Object} options.agent - Agent 配置对象
 * @param {Array<Object>} options.historyEvents - 历史事件列表
 */
async function processLLMReplyAsync(options) {
  const { sessionId, userId, agentId, agent, historyEvents } = options;

  try {
    // 调用 LLM API 生成回复
    const reply = await llmService.generateReply({
      model: agent.model,
      provider: agent.provider,
      systemPrompt: agent.systemPrompt,
      messages: historyEvents,
      timeout: 30000, // 30 秒超时
    });

    // 创建 Agent 回复 Event
    await eventService.createEvent({
      sessionId: sessionId,
      userId: userId,
      agentId: agentId,
      fromType: "agent",
      fromId: agentId,
      toType: "user",
      toId: userId,
      content: reply,
    });

    console.log(`[MessageService] Agent reply created for session: ${sessionId}`);
  } catch (error) {
    // LLM 调用失败，记录错误但不抛出（不影响用户消息）
    console.error(`[MessageService] Failed to process LLM reply for session ${sessionId}:`, error);
    // 可以选择创建一个错误 Event，或者只记录日志
  }
}

module.exports = {
  sendMessage,
  processLLMReplyAsync, // 导出供测试使用
};

