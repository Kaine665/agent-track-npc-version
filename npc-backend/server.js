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
 * @lastModified 2025-11-20
 */

// 加载环境变量（必须在其他模块导入之前）
require("dotenv").config();

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

  // 配置 CORS：允许所有来源（开发环境）
  // 生产环境需要配置具体的允许来源
  app.use(cors());

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
