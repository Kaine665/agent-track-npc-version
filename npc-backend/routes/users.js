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
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

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
 * 登录（返回 Token）
 */
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User ID is required');
    }

    if (!password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Password is required');
    }

    // 验证用户密码
    const user = await userService.login(userId, password);

    // 生成 Access Token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
    });

    // 可选：生成 Refresh Token
    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // 返回 Token 和用户信息
    sendSuccessResponse(res, 200, {
      user: {
        id: user.id,
        username: user.username,
      },
      accessToken,
      refreshToken, // 可选
      expiresIn: '7d', // Token 有效期
    });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : (code === 'INVALID_PASSWORD' ? 401 : (code === 'VALIDATION_ERROR' ? 400 : 500));
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 注册
 */
router.post('/register', async (req, res) => {
  try {
    const { userId, username, password } = req.body;

    if (!userId || !username) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User ID and username are required');
    }

    // 密码可选，如果不提供则使用默认密码123456
    const user = await userService.register({ userId, username, password });
    sendSuccessResponse(res, 201, user);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code.startsWith('DUPLICATE') ? 409 : (code === 'VALIDATION_ERROR' ? 400 : 500);
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 忘记密码 - 重置密码
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User ID is required');
    }

    if (!newPassword) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'New password is required');
    }

    const user = await userService.forgotPassword(userId, newPassword);
    sendSuccessResponse(res, 200, user);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : (code === 'VALIDATION_ERROR' ? 400 : 500);
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 自动登录（用于老用户迁移）
 * 对于在 2025-11-25 之前注册的用户，允许自动登录
 */
router.post('/auto-login', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User ID is required');
    }

    // 验证用户并检查注册日期
    const user = await userService.autoLogin(userId);

    // 生成 Access Token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
    });

    // 可选：生成 Refresh Token
    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // 返回 Token 和用户信息
    sendSuccessResponse(res, 200, {
      user: {
        id: user.id,
        username: user.username,
      },
      accessToken,
      refreshToken,
      expiresIn: '7d',
    });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : 
                   (code === 'AUTO_LOGIN_NOT_ALLOWED' ? 403 : 
                   (code === 'VALIDATION_ERROR' ? 400 : 500));
    sendErrorResponse(res, status, code, error.message);
  }
});

module.exports = router;

