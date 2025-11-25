/**
 * ============================================
 * Feedbacks API 路由 (feedbacks.js)
 * ============================================
 *
 * 【文件职责】
 * 处理反馈相关的 HTTP 请求，调用服务层处理业务逻辑
 *
 * 【主要功能】
 * 1. POST /api/v1/feedbacks - 提交反馈
 * 2. GET /api/v1/feedbacks - 查询用户的反馈列表
 * 3. GET /api/v1/feedbacks/:id - 查询反馈详情
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

const express = require('express');
const router = express.Router();
const feedbackService = require('../services/FeedbackService');

/**
 * 统一响应格式
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
 * 提交反馈
 * POST /api/v1/feedbacks
 *
 * 【请求体】
 * {
 *   "userId": "user_123",
 *   "type": "bug",
 *   "title": "登录按钮点击无响应",
 *   "content": "详细描述...",
 *   "screenshots": ["url1", "url2"] // 可选
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, content, screenshots } = req.body;
    
    // 验证必填参数
    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', '用户 ID 不能为空');
    }
    
    // 自动获取用户环境信息
    const userAgent = {
      browser: req.headers['user-agent'] || 'unknown',
      platform: req.headers['sec-ch-ua-platform'] || 'unknown',
      language: req.headers['accept-language'] || 'unknown',
      referer: req.headers['referer'] || 'unknown',
    };
    
    const feedback = await feedbackService.submitFeedback(userId, {
      type,
      title,
      content,
      screenshots,
      userAgent,
    });
    
    sendSuccessResponse(res, 201, feedback);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = 
      code === 'VALIDATION_ERROR' ? 400 :
      code === 'INVALID_TYPE' ? 400 : 500;
    
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 查询用户的反馈列表
 * GET /api/v1/feedbacks?userId=xxx&page=1&pageSize=20&type=bug&status=pending
 */
router.get('/', async (req, res) => {
  try {
    // 从认证中间件获取 userId（优先），如果没有则从查询参数获取（兼容旧代码）
    const userId = req.user?.userId || req.query.userId;
    const { page, pageSize, type, status } = req.query;
    
    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', '用户 ID 不能为空');
    }
    
    const feedbacks = await feedbackService.getUserFeedbacks(userId, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      type,
      status,
    });
    
    sendSuccessResponse(res, 200, feedbacks);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'VALIDATION_ERROR' ? 400 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 查询反馈详情
 * GET /api/v1/feedbacks/:id?userId=xxx
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // 从认证中间件获取 userId（优先），如果没有则从查询参数获取（兼容旧代码）
    const userId = req.user?.userId || req.query.userId;
    
    const feedback = await feedbackService.getFeedbackById(id, userId);
    
    sendSuccessResponse(res, 200, feedback);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = 
      code === 'FEEDBACK_NOT_FOUND' ? 404 :
      code === 'PERMISSION_DENIED' ? 403 :
      code === 'VALIDATION_ERROR' ? 400 : 500;
    
    sendErrorResponse(res, status, code, error.message);
  }
});

module.exports = router;

