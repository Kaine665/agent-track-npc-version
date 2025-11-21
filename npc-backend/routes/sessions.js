/**
 * ============================================
 * Sessions API 路由 (sessions.js)
 * ============================================
 *
 * 【文件职责】
 * 处理用户会话列表相关的 HTTP 请求，调用服务层处理业务逻辑
 *
 * 【主要功能】
 * 1. GET /api/v1/sessions?userId=xxx - 获取用户的所有会话列表（包含 Agent 信息）
 * 2. 统一响应格式处理
 * 3. 错误处理和状态码设置
 *
 * 【工作流程】
 * 接收请求 → 参数解析 → 调用服务层 → 格式化响应 → 返回结果
 *
 * 【依赖】
 * - express: Web 框架
 * - services/SessionService.js: 会话管理
 * - services/AgentService.js: 获取 Agent 信息
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
const sessionService = require("../services/SessionService");
const agentService = require("../services/AgentService");

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
 * 获取用户的所有会话列表
 *
 * 【路由】
 * GET /api/v1/sessions?userId=xxx
 *
 * 【功能说明】
 * 获取用户参与的所有会话列表，每个会话包含 Agent 信息
 *
 * 【查询参数】
 * - userId: 用户 ID（必填）
 *
 * 【工作流程】
 * 1. 获取查询参数 userId
 * 2. 验证参数
 * 3. 调用服务层获取用户的所有会话
 * 4. 为每个会话补充 Agent 信息
 * 5. 返回成功响应
 * 6. 捕获错误并返回错误响应
 *
 * 【响应格式】
 * {
 *   "success": true,
 *   "data": {
 *     "sessions": [
 *       {
 *         "sessionId": "session_1234567890_xyz789",
 *         "agentId": "agent_456",
 *         "agent": {
 *           "id": "agent_456",
 *           "name": "学习教练",
 *           "type": "special",
 *           "model": "gpt-4",
 *           "avatarUrl": "https://..."
 *         },
 *         "createdAt": 1703001234567,
 *         "lastActiveAt": 1703001235000
 *       },
 *       ...
 *     ]
 *   },
 *   "timestamp": 1703001234567
 * }
 *
 * 【业务规则】
 * 1. 只返回用户参与的会话（参与者中包含该用户）
 * 2. 会话按最后活动时间倒序排列（最新的在前）
 * 3. 每个会话包含对应的 Agent 信息
 * 4. 如果 Agent 不存在（可能被删除），agent 字段为 null
 *
 * 【错误处理】
 * - VALIDATION_ERROR → 400（参数验证失败）
 * - SYSTEM_ERROR → 500（系统错误）
 */
router.get("/", (req, res) => {
  try {
    const userId = req.query.userId;

    // 验证 userId 参数
    if (!userId || typeof userId !== "string" || !userId.trim()) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "userId 参数不能为空"
      );
    }

    // 调用服务层获取用户的所有会话
    // SessionService.getSessionsByUser 会：
    // 1. 查询用户参与的所有 Session
    // 2. 按最后活动时间倒序排列
    const sessions = sessionService.getSessionsByUser(userId.trim());

    // 为每个会话补充 Agent 信息
    // 从 Session 的 participants 中找到 agent 类型的参与者
    const sessionsWithAgentInfo = sessions.map((session) => {
      // 找到 Agent 参与者
      const agentParticipant = session.participants.find(
        (p) => p.type === "agent"
      );

      let agent = null;
      if (agentParticipant) {
        // 获取 Agent 信息
        agent = agentService.getAgentById(agentParticipant.id);
        // 如果 Agent 不存在，agent 为 null（不抛出错误，因为 Agent 可能被删除）
      }

      return {
        sessionId: session.sessionId,
        agentId: agentParticipant ? agentParticipant.id : null,
        agent: agent
          ? {
              id: agent.id,
              name: agent.name,
              type: agent.type,
              model: agent.model,
              avatarUrl: agent.avatarUrl,
            }
          : null,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
      };
    });

    // 返回成功响应
    sendSuccessResponse(res, 200, {
      sessions: sessionsWithAgentInfo,
    });
  } catch (error) {
    // 错误处理
    const errorCode = error.code || "SYSTEM_ERROR";
    const errorMessage = error.message || "获取会话列表失败，请稍后重试";

    // 根据错误码设置 HTTP 状态码
    let statusCode = 500;
    if (errorCode === "VALIDATION_ERROR") {
      statusCode = 400;
    }

    sendErrorResponse(res, statusCode, errorCode, errorMessage);
  }
});

module.exports = router;
