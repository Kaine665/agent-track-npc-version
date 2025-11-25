/**
 * ============================================
 * JWT 工具 (jwt.js)
 * ============================================
 *
 * 【文件职责】
 * 提供 JWT Token 生成和验证功能
 *
 * 【主要功能】
 * 1. 生成 Access Token
 * 2. 生成 Refresh Token（可选）
 * 3. 验证 Token
 * 4. 解析 Token 载荷
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRES_IN = '7d'; // Access Token 有效期：7天
const REFRESH_TOKEN_EXPIRES_IN = '30d'; // Refresh Token 有效期：30天（可选）

/**
 * 生成 Access Token
 *
 * @param {Object} payload - Token 载荷（包含用户信息）
 * @returns {string} JWT Token
 */
function generateAccessToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      username: payload.username,
      type: 'access', // Token 类型
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }
  );
}

/**
 * 生成 Refresh Token（可选）
 *
 * @param {Object} payload - Token 载荷
 * @returns {string} Refresh Token
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      type: 'refresh',
    },
    JWT_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }
  );
}

/**
 * 验证 Token
 *
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的载荷
 * @throws {Error} Token 无效或过期
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const err = new Error('Token 已过期');
      err.code = 'TOKEN_EXPIRED';
      throw err;
    }
    if (error.name === 'JsonWebTokenError') {
      const err = new Error('Token 无效');
      err.code = 'TOKEN_INVALID';
      throw err;
    }
    throw error;
  }
}

/**
 * 解析 Token（不验证，仅用于调试）
 *
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的载荷
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};

