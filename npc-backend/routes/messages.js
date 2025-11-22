/**
 * ============================================
 * Message API 路由 (messages.js)
 * ============================================
 *
 * 【文件职责】
 * 处理消息发送相关的 HTTP 请求，调用服务层处理业务逻辑
 *
 * 【主要功能】
 * 1. POST /api/v1/messages - 发送消息并获取 AI 回复
 * 2. 统一响应格式处理
 * 3. 错误处理和状态码设置
 *
 * 【工作流程】
 * 接收请求 → 参数解析 → 调用服务层 → 格式化响应 → 返回结果
 *
 * 【依赖】
 * - express: Web 框架
 * - services/MessageService.js: 业务逻辑层
 *
 * 【被谁使用】
 * - server.js: 注册路由
 *
 * 【响应格式】
 * 成功：{ success: true, data: {...}, timestamp: ... }
 * 错误：{ success: false, error: { code, message }, timestamp: ... }
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const express = require("express");
const router = express.Router();
const messageService = require("../services/MessageService");

/**
 * 统一响应格式
 *
 * 【功能说明】
 * 格式化成功响应，符合 API 设计规范
 *
 * @param {Object} res - Express 响应对象
 * @param {number} statusCode - HTTP 状态码
 * @param {Object} data - 响应数据
 */
function sendSuccessResponse(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data: data,
    timestamp: Date.now(),
  });
}

/**
 * 统一错误响应格式
 *
 * 【功能说明】
 * 格式化错误响应，符合 API 设计规范
 *
 * @param {Object} res - Express 响应对象
 * @param {number} statusCode - HTTP 状态码
 * @param {string} code - 错误码
 * @param {string} message - 错误消息
 */
function sendErrorResponse(res, statusCode, code, message) {
  res.status(statusCode).json({
    success: false,
    error: {
      code: code,
      message: message,
    },
    timestamp: Date.now(),
  });
}

/**
 * 发送消息
 *
 * 【路由】
 * POST /api/v1/messages
 *
 * 【功能说明】
 * 发送用户消息并获取 AI Agent 的回复
 *
 * 【请求体】
 * {
 *   "userId": "user_123",
 *   "agentId": "agent_456",
 *   "text": "你好，我想了解一下学习计划",
 *   "contextLimit": 20  // 可选，默认 20
 * }
 *
 * 【工作流程】
 * 1. 接收请求体（userId, agentId, text, contextLimit）
 * 2. 调用服务层发送消息（异步）
 * 3. 返回成功响应（HTTP 200）
 * 4. 捕获错误并返回错误响应
 *
 * 【响应格式】
 * {
 *   "success": true,
 *   "data": {
 *     "eventId": "event_1234567890_abc123",
 *     "content": "你好！我很乐意帮助你制定学习计划...",
 *     "timestamp": 1703001234567
 *   },
 *   "timestamp": 1703001234567
 * }
 *
 * 【错误处理】
 * - VALIDATION_ERROR → 400（参数验证失败）
 * - AGENT_NOT_FOUND → 404（Agent 不存在）
 * - LLM_API_ERROR → 502（LLM API 调用失败）
 * - SYSTEM_ERROR → 500（系统错误）
 */
router.post("/", async (req, res) => {
  try {
    const { userId, agentId, text, contextLimit } = req.body;

    // 调用服务层发送消息（异步处理，立即返回）
    // MessageService.sendMessage 现在会：
    // 1. 验证参数
    // 2. 获取或创建 Session
    // 3. 创建用户消息 Event
    // 4. 后台异步处理 LLM 调用和 Agent 回复
    // 5. 立即返回用户消息 Event ID
    const result = await messageService.sendMessage({
      userId,
      agentId,
      text,
      contextLimit,
    });

    // 返回成功响应（包含用户消息 Event ID，前端可以开始轮询）
    sendSuccessResponse(res, 200, result);
  } catch (error) {
    // 错误处理
    const errorCode = error.code || "SYSTEM_ERROR";
    const errorMessage = error.message || "发送消息失败，请稍后重试";

    // 根据错误码设置 HTTP 状态码
    let statusCode = 500;
    if (errorCode === "VALIDATION_ERROR") {
      statusCode = 400;
    } else if (errorCode === "AGENT_NOT_FOUND") {
      statusCode = 404;
    } else if (errorCode === "LLM_API_ERROR" || errorCode === "LLM_TIMEOUT") {
      statusCode = 502; // Bad Gateway，表示上游服务（LLM API）错误
    }

    sendErrorResponse(res, statusCode, errorCode, errorMessage);
  }
});

/**
 * 检查新消息（用于轮询）
 *
 * 【路由】
 * GET /api/v1/messages/check?sessionId=xxx&lastEventId=xxx
 *
 * 【功能说明】
 * 检查指定会话中是否有新消息（在 lastEventId 之后的消息）
 * 用于前端轮询获取 Agent 回复
 *
 * 【查询参数】
 * - sessionId: 会话 ID（必填）
 * - lastEventId: 最后已知的事件 ID（可选，如果不提供则返回所有事件）
 *
 * 【响应格式】
 * {
 *   "success": true,
 *   "data": {
 *     "hasNew": true,
 *     "events": [
 *       {
 *         "id": "event_123",
 *         "fromType": "agent",
 *         "content": "回复内容",
 *         "timestamp": 1703001234567
 *       }
 *     ]
 *   }
 * }
 */
router.get("/check", async (req, res) => {
  try {
    const { sessionId, lastEventId } = req.query;

    // 验证参数
    if (!sessionId || typeof sessionId !== "string" || !sessionId.trim()) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "sessionId 参数不能为空"
      );
    }

    // 获取会话的所有事件
    const eventService = require("../services/EventService");
    const allEvents = await eventService.getEventsBySession(sessionId.trim());

    // 如果提供了 lastEventId，只返回之后的事件
    let newEvents = allEvents;
    if (lastEventId && typeof lastEventId === "string" && lastEventId.trim()) {
      const lastIndex = allEvents.findIndex(
        (e) => e.id === lastEventId.trim()
      );
      if (lastIndex >= 0) {
        newEvents = allEvents.slice(lastIndex + 1);
      }
    }

    // 返回结果
    sendSuccessResponse(res, 200, {
      hasNew: newEvents.length > 0,
      events: newEvents,
    });
  } catch (error) {
    // 错误处理
    const errorCode = error.code || "SYSTEM_ERROR";
    const errorMessage = error.message || "检查新消息失败，请稍后重试";

    sendErrorResponse(res, 500, errorCode, errorMessage);
  }
});

module.exports = router;

