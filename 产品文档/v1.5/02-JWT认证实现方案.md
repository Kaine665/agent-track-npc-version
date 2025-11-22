# JWT Token 认证实现方案

**文档版本**：v1.0  
**最后更新**：2025-01-XX  
**相关文档**：[V1.5 版本规划](./README.md)

---

## 功能概述

实现基于 JWT Token 的用户认证机制，替代当前的简单用户ID认证，提升安全性和可扩展性。

---

## 技术方案

### 依赖库

```json
{
  "jsonwebtoken": "^9.0.2"
}
```

### 实现步骤

#### 1. JWT 工具类

**文件**：`npc-backend/utils/jwt.js`

```javascript
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
```

#### 2. 认证中间件

**文件**：`npc-backend/middleware/auth.js`

```javascript
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
```

#### 3. 更新登录接口

**文件**：`npc-backend/routes/users.js`

```javascript
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

/**
 * 登录（返回 Token）
 */
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User ID is required');
    }

    const user = await userService.login(userId, password);

    // 生成 Token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
    });

    // 可选：生成 Refresh Token
    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

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
    const status = code === 'USER_NOT_FOUND' ? 404 : (code === 'INVALID_PASSWORD' ? 401 : 500);
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * Token 刷新接口（可选）
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Refresh token is required');
    }

    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return sendErrorResponse(res, 401, 'TOKEN_INVALID', 'Invalid refresh token');
    }

    // 查询用户信息
    const user = await userService.findById(decoded.userId);
    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    // 生成新的 Access Token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
    });

    sendSuccessResponse(res, 200, {
      accessToken,
      expiresIn: '7d',
    });
  } catch (error) {
    const code = error.code || 'TOKEN_INVALID';
    sendErrorResponse(res, 401, code, error.message);
  }
});
```

#### 4. 更新受保护的路由

**文件**：`npc-backend/routes/agents.js`

```javascript
const { authenticate } = require('../middleware/auth');

// 所有 NPC 相关接口都需要认证
router.use(authenticate);

router.post('/', async (req, res) => {
  // req.user.userId 已由中间件设置
  const userId = req.user.userId;
  // ...
});
```

#### 5. 环境变量配置

**文件**：`npc-backend/.env`

```env
# JWT 配置
JWT_SECRET=your-super-secret-key-change-in-production
```

---

## 前端适配

### 1. 更新 API 适配层

**文件**：`npc-frontend/src/api/httpAdapter.js`

```javascript
class HttpAdapter extends ApiAdapter {
  constructor(baseURL) {
    super(baseURL);
    this.token = null; // 存储 Token
  }

  // 设置 Token
  setToken(token) {
    this.token = token;
    // 保存到 localStorage
    if (token) {
      localStorage.setItem('npc_access_token', token);
    } else {
      localStorage.removeItem('npc_access_token');
    }
  }

  // 从 localStorage 恢复 Token
  loadToken() {
    const token = localStorage.getItem('npc_access_token');
    if (token) {
      this.token = token;
    }
    return token;
  }

  // 请求拦截器：添加 Token
  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 添加 Token
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${url}`, {
      ...options,
      headers,
    });

    // Token 过期处理
    if (response.status === 401) {
      const data = await response.json();
      if (data.error?.code === 'TOKEN_EXPIRED' || data.error?.code === 'TOKEN_INVALID') {
        // 清除 Token，跳转到登录页
        this.setToken(null);
        window.location.href = '/login';
      }
    }

    return response;
  }
}
```

### 2. 更新认证上下文

**文件**：`npc-frontend/src/context/AuthContext.jsx`

```javascript
const login = async (userId, password) => {
  try {
    const response = await api.users.login(userId, password);
    if (response.success) {
      const { user, accessToken } = response.data;
      
      // 保存 Token
      api.setToken(accessToken);
      
      // 保存用户信息
      setUser(user);
      localStorage.setItem('npc_user', JSON.stringify(user));
      
      message.success(`欢迎回来，${user.username}`);
      return { success: true };
    }
  } catch (error) {
    // ...
  }
};

const logout = () => {
  api.setToken(null);
  setUser(null);
  localStorage.removeItem('npc_user');
  localStorage.removeItem('npc_access_token');
};
```

---

## 测试要点

1. **Token 生成**：验证登录后是否正确生成 Token
2. **Token 验证**：验证受保护接口是否正确验证 Token
3. **Token 过期**：验证 Token 过期后的处理
4. **Token 刷新**：验证 Refresh Token 机制（如果实现）
5. **错误处理**：验证 Token 无效时的错误提示

---

## 注意事项

1. **JWT Secret**：
   - 生产环境必须使用强随机密钥
   - 不要将 Secret 提交到代码仓库
   - 使用环境变量管理

2. **Token 存储**：
   - 前端：localStorage（简单，但注意 XSS 风险）
   - 未来可考虑：httpOnly Cookie（更安全）

3. **Token 过期处理**：
   - 前端检测到 401 后自动跳转登录
   - 或者使用 Refresh Token 自动刷新

4. **安全性**：
   - Token 不要包含敏感信息
   - 使用 HTTPS 传输 Token
   - 考虑添加 Token 黑名单机制（可选）

