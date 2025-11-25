/**
 * ============================================
 * 导入路由 (import.js)
 * ============================================
 *
 * 【功能说明】
 * 处理对话历史导入的API路由
 *
 * 【路由】
 * POST /api/v1/import/conversations - 导入对话历史
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

const express = require('express');
const router = express.Router();
const importService = require('../services/ImportService');

/**
 * 统一响应格式：成功
 */
function sendSuccessResponse(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data: data,
    timestamp: Date.now(),
  });
}

/**
 * 统一响应格式：错误
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
 * 导入对话历史
 * POST /api/v1/import/conversations
 *
 * 【请求体格式】
 * {
 *   agentName: string,
 *   messages: [
 *     { role: 'user' | 'assistant', content: string, timestamp?: number }
 *   ]
 * }
 *
 * 【响应格式】
 * {
 *   success: true,
 *   data: {
 *     agentId: string,
 *     sessionId: string,
 *     imported: number,
 *     skipped: number,
 *     errors: Array<{index: number, message: string}>
 *   }
 * }
 */
router.post('/conversations', async (req, res) => {
  try {
    // 从请求中获取userId（假设通过中间件设置，如果没有则从body获取）
    const userId = req.user?.userId || req.body.userId;

    if (!userId) {
      return sendErrorResponse(res, 400, 'MISSING_USER_ID', '用户ID不能为空');
    }

    // 获取导入数据
    const { agentName, messages } = req.body;

    if (!agentName || !messages) {
      return sendErrorResponse(res, 400, 'INVALID_FORMAT', '请求体格式错误：缺少agentName或messages字段');
    }

    // 调用导入服务
    const result = await importService.importConversations(userId, {
      agentName,
      messages,
    });

    // 返回成功响应
    sendSuccessResponse(res, 200, result);
  } catch (error) {
    console.error('导入对话失败:', error);

    // 根据错误类型返回不同的状态码
    const code = error.code || 'SYSTEM_ERROR';
    const statusCode = code === 'INVALID_FORMAT' ? 400 : 500;

    sendErrorResponse(res, statusCode, code, error.message);
  }
});

module.exports = router;

