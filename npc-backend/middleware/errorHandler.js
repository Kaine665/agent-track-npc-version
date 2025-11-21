/**
 * ============================================
 * 统一错误处理中间件 (errorHandler.js)
 * ============================================
 *
 * 【文件职责】
 * 统一处理所有 API 路由的错误，提供一致的错误响应格式
 *
 * 【主要功能】
 * 1. 捕获同步和异步错误
 * 2. 统一错误响应格式
 * 3. 记录错误日志
 * 4. 根据错误类型设置 HTTP 状态码
 *
 * 【工作流程】
 * 路由抛出错误 → 中间件捕获 → 格式化错误 → 记录日志 → 返回错误响应
 *
 * 【依赖】
 * - express: Web 框架
 * - utils/logger.js: 日志工具
 * - utils/validator.js: 验证工具（ValidationError）
 *
 * 【被谁使用】
 * - server.js: 注册为全局错误处理中间件
 *
 * 【错误码映射】
 * - VALIDATION_ERROR → 400（参数验证失败）
 * - AGENT_NOT_FOUND → 404（Agent 不存在）
 * - DUPLICATE_NAME → 409（名称重复）
 * - INVALID_MODEL → 400（无效的模型）
 * - PROVIDER_REQUIRED → 400（缺少提供商）
 * - LLM_API_ERROR → 502（LLM API 调用失败）
 * - LLM_TIMEOUT → 502（LLM API 超时）
 * - SYSTEM_ERROR → 500（系统错误）
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

const logger = require("../utils/logger");
const { ValidationError } = require("../utils/validator");

/**
 * 错误码到 HTTP 状态码的映射
 *
 * 【功能说明】
 * 根据错误码返回对应的 HTTP 状态码
 */
const ERROR_CODE_TO_STATUS = {
  VALIDATION_ERROR: 400,
  AGENT_NOT_FOUND: 404,
  DUPLICATE_NAME: 409,
  INVALID_MODEL: 400,
  PROVIDER_REQUIRED: 400,
  LLM_API_ERROR: 502,
  LLM_TIMEOUT: 502,
  SYSTEM_ERROR: 500,
};

/**
 * 统一错误处理中间件
 *
 * 【功能说明】
 * Express 错误处理中间件，捕获所有路由中的错误并统一处理
 *
 * 【工作流程】
 * 1. 接收错误对象（err）
 * 2. 提取错误码和错误消息
 * 3. 根据错误码设置 HTTP 状态码
 * 4. 记录错误日志
 * 5. 返回统一格式的错误响应
 *
 * 【错误处理】
 * - 如果错误有 code 属性，使用该 code
 * - 如果是 ValidationError，使用 VALIDATION_ERROR
 * - 其他情况使用 SYSTEM_ERROR
 *
 * @param {Error} err - 错误对象
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
function errorHandler(err, req, res, next) {
  // 提取错误信息
  let errorCode = err.code || "SYSTEM_ERROR";
  let errorMessage = err.message || "系统错误，请稍后重试";

  // 如果是 ValidationError，使用其错误码
  if (err instanceof ValidationError) {
    errorCode = err.code;
    errorMessage = err.message;
  }

  // 根据错误码设置 HTTP 状态码
  const statusCode = ERROR_CODE_TO_STATUS[errorCode] || 500;

  // 记录错误日志
  logger.error(`API 错误: ${req.method} ${req.url}`, {
    errorCode,
    errorMessage,
    statusCode,
    stack: err.stack,
  });

  // 返回统一格式的错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
    timestamp: Date.now(),
  });
}

/**
 * 404 错误处理中间件
 *
 * 【功能说明】
 * 处理未找到的路由（404 错误）
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
function notFoundHandler(req, res, next) {
  logger.warn(`路由未找到: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `路由 ${req.method} ${req.url} 不存在`,
    },
    timestamp: Date.now(),
  });
}

/**
 * 请求日志中间件
 *
 * 【功能说明】
 * 记录所有 HTTP 请求的日志
 *
 * @param {Object} req - Express 请求对象
 * @param {Object} res - Express 响应对象
 * @param {Function} next - Express next 函数
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // 记录请求日志
  logger.logRequest(req);

  // 监听响应完成事件
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.logResponse(req, res, duration);
  });

  next();
}

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger,
};

