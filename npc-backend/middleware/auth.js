/**
 * ============================================
 * 认证中间件 (auth.js)
 * ============================================
 *
 * 【文件职责】
 * 验证请求中的 JWT Token，提取用户信息
 *
 * 【主要功能】
 * 1. 从请求头提取 Token
 * 2. 验证 Token 有效性
 * 3. 将用户信息附加到 req.user
 */

const { verifyToken } = require('../utils/jwt');

/**
 * JWT 认证中间件
 *
 * 【工作流程】
 * 1. 从请求头提取 Token（Authorization: Bearer <token>）
 * 2. 验证 Token 有效性
 * 3. 将用户信息附加到 req.user
 * 4. 如果 Token 无效或缺失，返回 401
 *
 * 【使用方式】
 * router.get('/protected', authenticate, (req, res) => {
 *   const userId = req.user.userId;
 *   // ...
 * });
 */
function authenticate(req, res, next) {
  // 从请求头提取 Token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '缺少认证 Token',
      },
      timestamp: Date.now(),
    });
  }

  const token = authHeader.substring(7); // 移除 "Bearer " 前缀

  try {
    // 验证 Token
    const decoded = verifyToken(token);
    
    // 检查 Token 类型（只接受 access token）
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token 类型错误',
        },
        timestamp: Date.now(),
      });
    }

    // 将用户信息附加到请求对象
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    const code = error.code || 'TOKEN_INVALID';
    const message = error.message || 'Token 验证失败';
    
    return res.status(401).json({
      success: false,
      error: {
        code,
        message,
      },
      timestamp: Date.now(),
    });
  }
}

/**
 * 可选认证中间件（Token 存在则验证，不存在则跳过）
 *
 * 【使用场景】
 * - 某些接口需要用户信息，但不强制登录
 * - 例如：显示用户个性化内容，但未登录用户也能访问
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Token 不存在，跳过认证
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    if (decoded.type === 'access') {
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
      };
    } else {
      req.user = null;
    }
  } catch (error) {
    // Token 无效，但不阻止请求
    req.user = null;
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuthenticate,
};

