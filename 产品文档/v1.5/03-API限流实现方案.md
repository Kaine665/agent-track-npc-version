# API 限流实现方案

**文档版本**：v1.0  
**最后更新**：2025-01-XX  
**相关文档**：[V1.5 版本规划](./README.md)

---

## 功能概述

实现 API 请求限流，防止恶意请求和 API 滥用，保护系统稳定性和 LLM API 调用成本。

---

## 技术方案

### 依赖库

```json
{
  "express-rate-limit": "^7.1.5"
}
```

### 实现策略

- **当前版本**：内存存储（简单、零依赖）
- **未来扩展**：可替换为 Redis 存储（接口不变）

---

## 实现步骤

#### 1. 限流中间件

**文件**：`npc-backend/middleware/rateLimiter.js`

```javascript
/**
 * ============================================
 * API 限流中间件 (rateLimiter.js)
 * ============================================
 *
 * 【文件职责】
 * 实现 API 请求限流，防止滥用
 *
 * 【主要功能】
 * 1. IP 级别限流（全局）
 * 2. 用户级别限流（依赖 JWT Token）
 * 3. LLM API 特殊限流（防止成本过高）
 *
 * 【扩展性】
 * - 当前：内存存储（express-rate-limit）
 * - 未来：可替换为 Redis（rate-limit-redis），接口不变
 */

const rateLimit = require('express-rate-limit');

/**
 * IP 级别限流（全局）
 *
 * 【限流策略】
 * - 窗口：1分钟
 * - 最大请求数：100次
 * - 适用于：所有 API 接口
 */
const ipLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 最多100次请求
  standardHeaders: true, // 返回标准的 RateLimit-* 头
  legacyHeaders: false, // 不返回 X-RateLimit-* 头
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
    },
    timestamp: Date.now(),
  },
  // 自定义 key 生成器（使用 IP）
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
});

/**
 * 用户级别限流（需要 JWT Token）
 *
 * 【限流策略】
 * - 窗口：1分钟
 * - 最大请求数：60次
 * - 适用于：需要认证的接口
 *
 * 【工作原理】
 * - 优先使用用户 ID（如果已认证）
 * - 回退到 IP（如果未认证）
 */
const userLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 60, // 最多60次请求
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: '请求过于频繁，请稍后再试',
    },
    timestamp: Date.now(),
  },
  // 自定义 key 生成器（优先用户ID，回退到IP）
  keyGenerator: (req) => {
    // 如果用户已认证，使用用户ID
    if (req.user && req.user.userId) {
      return `user:${req.user.userId}`;
    }
    // 否则使用IP
    return req.ip || req.connection.remoteAddress;
  },
  // 跳过成功响应（只限制失败响应）
  skipSuccessfulRequests: false,
});

/**
 * LLM API 特殊限流（防止成本过高）
 *
 * 【限流策略】
 * - 窗口：1分钟
 * - 最大请求数：20次
 * - 适用于：LLM 调用接口（/api/v1/messages）
 *
 * 【说明】
 * - LLM 调用成本较高，需要更严格的限流
 * - 用户级别限流（依赖 JWT Token）
 */
const llmLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 20, // 最多20次请求（LLM调用更严格）
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'LLM 调用过于频繁，请稍后再试',
    },
    timestamp: Date.now(),
  },
  // 使用用户ID或IP
  keyGenerator: (req) => {
    if (req.user && req.user.userId) {
      return `llm:user:${req.user.userId}`;
    }
    return `llm:ip:${req.ip || req.connection.remoteAddress}`;
  },
});

/**
 * 创建自定义限流器（可配置）
 *
 * 【用途】
 * - 为特定接口创建自定义限流策略
 * - 例如：注册接口限制更严格（防止刷号）
 *
 * @param {Object} options - 限流配置
 * @returns {Function} 限流中间件
 */
function createLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs || 1 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message || {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: '请求过于频繁，请稍后再试',
      },
      timestamp: Date.now(),
    },
    keyGenerator: options.keyGenerator || ((req) => req.ip),
  });
}

module.exports = {
  ipLimiter,
  userLimiter,
  llmLimiter,
  createLimiter,
};
```

#### 2. 应用到路由

**文件**：`npc-backend/server.js`

```javascript
const { ipLimiter } = require('./middleware/rateLimiter');

// 全局 IP 限流（应用到所有接口）
app.use('/api', ipLimiter);
```

**文件**：`npc-backend/routes/agents.js`

```javascript
const { userLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

// 用户级别限流（需要认证）
router.use(authenticate); // 先认证
router.use(userLimiter); // 再限流
```

**文件**：`npc-backend/routes/messages.js`

```javascript
const { llmLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');

// LLM API 特殊限流
router.post('/', authenticate, llmLimiter, async (req, res) => {
  // ...
});
```

#### 3. 配置说明

**文件**：`npc-backend/config/rateLimit.js`（可选）

```javascript
/**
 * API 限流配置
 *
 * 【配置说明】
 * - 可以根据环境变量调整限流策略
 * - 开发环境可以放宽限制
 */

module.exports = {
  // IP 级别限流配置
  ip: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1分钟
    max: parseInt(process.env.RATE_LIMIT_IP_MAX || '100', 10), // 100次
  },
  
  // 用户级别限流配置
  user: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_USER_MAX || '60', 10), // 60次
  },
  
  // LLM API 限流配置
  llm: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_LLM_MAX || '20', 10), // 20次
  },
};
```

---

## 扩展性设计

### 未来切换到 Redis（可选）

**文件**：`npc-backend/middleware/rateLimiter.js`（未来版本）

```javascript
// 未来可以这样扩展：
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const ipLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:ip:', // Redis key 前缀
  }),
  windowMs: 1 * 60 * 1000,
  max: 100,
  // ... 其他配置不变
});

// 接口保持不变，只是存储方式改变
```

---

## 测试要点

1. **限流生效**：验证超过限制后是否正确返回 429 错误
2. **限流重置**：验证时间窗口重置后是否可以继续请求
3. **用户级别限流**：验证不同用户的限流是否独立
4. **IP 级别限流**：验证不同 IP 的限流是否独立
5. **LLM 限流**：验证 LLM 接口的限流是否更严格

---

## 注意事项

1. **内存存储限制**：
   - 当前使用内存存储，服务器重启后限流计数会重置
   - 多实例部署时，每个实例的限流计数独立（未来需要 Redis）

2. **限流策略调整**：
   - 可以根据实际使用情况调整限流参数
   - 建议通过环境变量配置，便于调整

3. **错误处理**：
   - 限流错误应该返回友好的错误信息
   - 前端应该处理 429 错误，提示用户稍后重试

4. **监控**：
   - 建议记录限流事件，便于分析
   - 可以添加告警机制（如果限流频繁触发）

