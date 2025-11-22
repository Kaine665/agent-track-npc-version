/**
 * ============================================
 * History API 路由 (history.js)
 * ============================================
 *
 * 【文件职责】
 * 处理对话历史相关的 HTTP 请求，调用服务层处理业务逻辑
 *
 * 【主要功能】
 * 1. GET /api/v1/history - 获取用户与指定 Agent 的对话历史
 * 2. 统一响应格式处理
 * 3. 错误处理和状态码设置
 *
 * 【工作流程】
 * 接收请求 → 参数解析 → 调用服务层 → 格式化响应 → 返回结果
 *
 * 【依赖】
 * - express: Web 框架
 * - services/EventService.js: 业务逻辑层
 *
 * 【被谁使用】
 * - server.js: 注册路由
 *
 * 【响应格式】
 * 成功：{ success: true, data: {...}, timestamp: ... }
 * 错误：{ success: false, error: { code, message }, timestamp: ... }
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

const express = require("express");
const router = express.Router();
const eventService = require("../services/EventService");

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
 * 获取对话历史
 *
 * 【路由】
 * GET /api/v1/history?userId=xxx&agentId=yyy
 *
 * 【功能说明】
 * 获取用户与指定 Agent 的完整对话历史记录
 *
 * 【查询参数】
 * - userId: 用户 ID（必填）
 * - agentId: Agent ID（必填）
 *
 * 【工作流程】
 * 1. 获取查询参数（userId, agentId）
 * 2. 验证参数
 * 3. 调用服务层获取对话历史
 * 4. 返回成功响应
 * 5. 捕获错误并返回错误响应
 *
 * 【响应格式】
 * {
 *   "success": true,
 *   "data": {
 *     "session": {
 *       "sessionId": "session_1234567890_xyz789",
 *       "participants": [
 *         { "type": "user", "id": "user_123" },
 *         { "type": "agent", "id": "agent_456" }
 *       ],
 *       "createdAt": 1703001234567,
 *       "lastActiveAt": 1703001235000
 *     },
 *     "events": [
 *       {
 *         "id": "event_1234567890_abc123",
 *         "sessionId": "session_1234567890_xyz789",
 *         "userId": "user_123",
 *         "agentId": "agent_456",
 *         "fromType": "user",
 *         "fromId": "user_123",
 *         "toType": "agent",
 *         "toId": "agent_456",
 *         "content": "你好",
 *         "timestamp": 1703001234567
 *       },
 *       {
 *         "id": "event_1234567890_def456",
 *         "sessionId": "session_1234567890_xyz789",
 *         "userId": "user_123",
 *         "agentId": "agent_456",
 *         "fromType": "agent",
 *         "fromId": "agent_456",
 *         "toType": "user",
 *         "toId": "user_123",
 *         "content": "你好！很高兴认识你",
 *         "timestamp": 1703001235000
 *       }
 *     ]
 *   },
 *   "timestamp": 1703001234567
 * }
 *
 * 【业务规则】
 * 1. 如果 Session 不存在（用户和 Agent 从未对话过），返回 session: null, events: []
 * 2. 如果 Session 存在，返回完整的 Session 信息和该 Session 的所有事件
 * 3. 事件按时间升序排列（最早的在前）
 *
 * 【错误处理】
 * - VALIDATION_ERROR → 400（参数验证失败）
 * - SYSTEM_ERROR → 500（系统错误）
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId;
    const agentId = req.query.agentId;

    // 验证 userId 参数
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "userId 参数不能为空"
      );
    }

    // 验证 agentId 参数
    if (!agentId || typeof agentId !== "string" || !agentId.trim()) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "agentId 参数不能为空"
      );
    }

    // 调用服务层获取对话历史
    // EventService.getHistoryByUserAndAgent 会：
    // 1. 通过 userId 和 agentId 查找 Session
    // 2. 如果 Session 不存在，返回 null
    // 3. 如果 Session 存在，获取该 Session 的所有事件
    // 4. 返回 Session 信息和事件列表
    const history = await eventService.getHistoryByUserAndAgent(
      userId.trim(),
      agentId.trim()
    );

    // 调试日志
    console.log(`[DEBUG] Backend: getHistoryByUserAndAgent result:`, history ? {
      sessionId: history.session?.sessionId,
      eventsCount: history.events?.length || 0
    } : null);

    // 如果 Session 不存在，返回空数据
    if (!history) {
      console.log(`[DEBUG] Backend: No history found for userId=${userId}, agentId=${agentId}`);
      return sendSuccessResponse(res, 200, {
        session: null,
        events: [],
      });
    }

    // 返回成功响应（包含 Session 信息和事件列表）
    console.log(`[DEBUG] Backend: Returning history with ${history.events?.length || 0} events`);
    sendSuccessResponse(res, 200, {
      session: history.session,
      events: history.events || [],
    });
  } catch (error) {
    // 错误处理
    const errorCode = error.code || "SYSTEM_ERROR";
    const errorMessage = error.message || "获取对话历史失败，请稍后重试";

    // 根据错误码设置 HTTP 状态码
    let statusCode = 500;
    if (errorCode === "VALIDATION_ERROR") {
      statusCode = 400;
    }

    sendErrorResponse(res, statusCode, errorCode, errorMessage);
  }
});

module.exports = router;
