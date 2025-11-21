/**
 * ============================================
 * Users API 路由 (users.js)
 * ============================================
 * 
 * POST /api/v1/users/login
 * POST /api/v1/users/register
 */

const express = require('express');
const router = express.Router();
const userService = require('../services/UserService');

// 统一响应辅助函数 (复制自其他路由或引入)
function sendSuccessResponse(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data: data,
    timestamp: Date.now(),
  });
}

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
 * 登录
 */
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User ID is required');
    }

    const user = await userService.login(userId, password);
    sendSuccessResponse(res, 200, user);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : (code === 'INVALID_PASSWORD' ? 401 : 500);
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 注册
 */
router.post('/register', async (req, res) => {
  try {
    const { userId, username, password } = req.body;

    if (!userId || !username || !password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Missing required fields');
    }

    const user = await userService.register({ userId, username, password });
    sendSuccessResponse(res, 201, user);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code.startsWith('DUPLICATE') ? 409 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

module.exports = router;

