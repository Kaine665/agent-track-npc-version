/**
 * ============================================
 * 后端服务入口文件 (server.js)
 * ============================================
 *
 * 【文件职责】
 * Express 服务器入口文件，负责启动 HTTP 服务器和配置基础中间件
 *
 * 【主要功能】
 * 1. 加载环境变量配置
 * 2. 创建 Express 应用实例
 * 3. 配置基础中间件（CORS、JSON 解析）
 * 4. 配置 API 路由
 * 5. 启动 HTTP 服务器
 *
 * 【工作流程】
 * 加载环境变量 → 创建 Express 应用 → 配置中间件 → 配置路由 → 启动服务器
 *
 * 【依赖】
 * - express: Web 框架
 * - cors: 跨域资源共享中间件
 * - dotenv: 环境变量管理
 *
 * 【被谁使用】
 * - npm start 命令启动
 * - npm run dev 命令启动（开发模式）
 *
 * 【重要说明】
 * - 端口从环境变量 PORT 读取，默认 8000
 * - 开发模式使用 nodemon 自动重启
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-01-XX
 */

// 加载配置（优先 YAML，回退到 .env）
// 必须在其他模块导入之前调用
const configLoader = require("./config/config-loader");
configLoader.init();

const express = require("express");
const cors = require("cors");
const {
  errorHandler,
  notFoundHandler,
  requestLogger,
} = require("./middleware/errorHandler");

/**
 * 创建 Express 应用实例
 *
 * 【功能说明】
 * 创建并配置 Express 应用，设置基础中间件和路由
 *
 * 【工作流程】
 * 1. 创建 Express 应用
 * 2. 配置 CORS 中间件（允许跨域请求）
 * 3. 配置 JSON 解析中间件
 * 4. 配置健康检查路由
 * 5. 配置 API 路由（占位，后续添加）
 *
 * @returns {express.Application} Express 应用实例
 */
function createApp() {
  const app = express();

  // 配置 CORS：根据环境变量允许特定来源
  /**
   * 获取允许的 CORS 来源列表
   * 
   * 【优先级】
   * 1. CORS_ORIGINS 环境变量（最高优先级，用逗号分隔）
   * 2. 根据环境自动生成（生产环境、测试环境等）
   * 
   * 【环境变量说明】
   * - CORS_ORIGINS: 允许的来源列表，用逗号分隔
   *   例如：CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://example.com
   * - SERVER_IP: 服务器 IP 地址（用于自动生成允许的来源）
   * - FRONTEND_DOMAIN: 前端域名（如果有）
   * - NODE_ENV: 环境类型（production/development）
   */
  const getAllowedOrigins = () => {
    const origins = [];
    
    // 1. 从环境变量 CORS_ORIGINS 读取（优先级最高）
    if (process.env.CORS_ORIGINS) {
      const envOrigins = process.env.CORS_ORIGINS
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0);
      origins.push(...envOrigins);
    }
    
    // 2. 获取服务器 IP（用于自动生成允许的来源）
    const serverIP = process.env.SERVER_IP || 
                     (process.env.DB_HOST && process.env.DB_HOST !== 'mysql' ? process.env.DB_HOST : null) ||
                     'localhost';
    
    // 3. 生产环境：通过 Nginx 访问（端口 80）
    if (process.env.NODE_ENV === 'production') {
      origins.push(
        `http://${serverIP}`,
        `http://${serverIP}:80`
      );
      
      // 如果有域名配置
      if (process.env.FRONTEND_DOMAIN) {
        origins.push(
          `http://${process.env.FRONTEND_DOMAIN}`,
          `https://${process.env.FRONTEND_DOMAIN}`
        );
      }
    }
    
    // 4. Green 环境测试（端口 3001）
    origins.push(`http://${serverIP}:3001`);
    
    // 5. Blue 环境测试（端口 3000，如果有）
    origins.push(`http://${serverIP}:3000`);
    
    // 6. 开发环境：允许本地开发服务器
    if (process.env.NODE_ENV !== 'production') {
      origins.push(
        'http://localhost:3000',
        'http://localhost:5173', // Vite 默认端口
        'http://127.0.0.1:3000'
      );
    }
    
    // 去重并过滤空值
    return [...new Set(origins.filter(Boolean))];
  };

  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = getAllowedOrigins();
      
      // 没有 origin（如 Postman、curl、服务器端请求），允许通过
      // 有 origin 时，检查是否在允许列表中
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // 记录拒绝的来源（用于调试）
        console.warn(`⚠️  CORS 拒绝来源: ${origin}`);
        console.warn(`   允许的来源列表: ${allowedOrigins.join(', ')}`);
        callback(new Error('不允许的 CORS 来源'));
      }
    },
    credentials: true, // 允许携带凭证（如 Cookie、Authorization header）
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400 // 预检请求缓存时间（24小时）
  };

  app.use(cors(corsOptions));
  
  // 启动时输出允许的 CORS 来源（用于调试）
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_CORS === 'true') {
    const allowedOrigins = getAllowedOrigins();
    console.log('🔒 CORS 允许的来源:');
    allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  }

  // 配置 JSON 解析中间件
  // 用于解析请求体中的 JSON 数据
  app.use(express.json());

  // 配置请求日志中间件（在所有路由之前）
  // 记录所有 HTTP 请求和响应
  app.use(requestLogger);

  // 配置健康检查路由
  // 用于检查服务器是否正常运行
  app.get("/api/v1/health", (req, res) => {
    res.json({
      success: true,
      data: {
        status: "ok",
        message: "Server is running",
      },
      timestamp: Date.now(),
    });
  });

  // 配置根路径路由
  // 提供简单的欢迎信息
  app.get("/", (req, res) => {
    res.json({
      success: true,
      data: {
        message: "NPC Backend API",
        version: "1.0.0",
      },
      timestamp: Date.now(),
    });
  });

  // 配置 API 路由
  app.use("/api/v1/agents", require("./routes/agents"));
  app.use("/api/v1/messages", require("./routes/messages"));
  app.use("/api/v1/history", require("./routes/history"));
  app.use("/api/v1/sessions", require("./routes/sessions"));
  app.use("/api/v1/users", require("./routes/users")); // 新增用户路由
  app.use("/api/v1/import", require("./routes/import")); // 导入路由
  app.use("/api/v1/feedbacks", require("./routes/feedbacks")); // 反馈路由
  app.use("/api/v1/versions", require("./routes/versions")); // 版本更新日志路由
  // TODO: 后续阶段添加其他 API 路由

  // 配置 404 错误处理（在所有路由之后，错误处理之前）
  // 处理未找到的路由
  app.use(notFoundHandler);

  // 配置统一错误处理中间件（必须在所有路由之后）
  // 捕获所有路由中的错误并统一处理
  app.use(errorHandler);

  return app;
}

/**
 * 启动服务器
 *
 * 【功能说明】
 * 创建 Express 应用并启动 HTTP 服务器
 *
 * 【工作流程】
 * 1. 创建 Express 应用
 * 2. 从环境变量读取端口（默认 8000）
 * 3. 启动 HTTP 服务器
 * 4. 监听服务器启动事件
 *
 * 【错误处理】
 * - 端口被占用 → 输出错误信息并退出
 * - 其他错误 → 输出错误信息并退出
 */
function startServer() {
  const app = createApp();

  // 从环境变量读取端口，默认 8000
  const PORT = process.env.PORT || 8000;

  // 启动 HTTP 服务器
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/v1/health`);
  });

  // 监听服务器错误事件
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use`);
      console.error(
        `💡 Please change the PORT in .env file or stop the process using port ${PORT}`
      );
    } else {
      console.error("❌ Server error:", error);
    }
    process.exit(1);
  });
}

// 启动服务器
startServer();
