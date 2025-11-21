/**
 * ============================================
 * 日志工具 (logger.js)
 * ============================================
 *
 * 【文件职责】
 * 提供统一的日志记录功能，支持不同级别的日志输出
 *
 * 【主要功能】
 * 1. 日志级别：debug, info, warn, error
 * 2. 格式化输出：时间戳 + 级别 + 消息
 * 3. 请求日志：记录 HTTP 请求信息
 * 4. 错误日志：记录错误堆栈信息
 *
 * 【工作流程】
 * 调用日志方法 → 格式化日志 → 输出到控制台
 *
 * 【依赖】
 * - 无外部依赖（使用 Node.js 内置模块）
 *
 * 【被谁使用】
 * - middleware/errorHandler.js: 记录错误日志
 * - routes/*.js: 记录请求和响应日志
 * - services/*.js: 记录业务逻辑日志
 *
 * 【日志级别】
 * - debug: 调试信息（开发环境）
 * - info: 一般信息（请求、响应等）
 * - warn: 警告信息（参数验证失败等）
 * - error: 错误信息（异常、系统错误等）
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

/**
 * 格式化时间戳
 *
 * 【功能说明】
 * 将时间戳格式化为可读的日期时间字符串
 *
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} 格式化的时间字符串（YYYY-MM-DD HH:mm:ss）
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 日志级别枚举
 */
const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
};

/**
 * 日志工具对象
 */
const logger = {
  /**
   * 输出调试日志
   *
   * 【功能说明】
   * 记录调试信息，仅在开发环境使用
   *
   * @param {string} message - 日志消息
   * @param {Object} [data] - 附加数据（可选）
   */
  debug(message, data = null) {
    const timestamp = formatTimestamp(Date.now());
    const logData = data ? ` ${JSON.stringify(data)}` : "";
    console.log(`[${timestamp}] [DEBUG] ${message}${logData}`);
  },

  /**
   * 输出信息日志
   *
   * 【功能说明】
   * 记录一般信息，如请求、响应等
   *
   * @param {string} message - 日志消息
   * @param {Object} [data] - 附加数据（可选）
   */
  info(message, data = null) {
    const timestamp = formatTimestamp(Date.now());
    const logData = data ? ` ${JSON.stringify(data)}` : "";
    console.log(`[${timestamp}] [INFO] ${message}${logData}`);
  },

  /**
   * 输出警告日志
   *
   * 【功能说明】
   * 记录警告信息，如参数验证失败等
   *
   * @param {string} message - 日志消息
   * @param {Object} [data] - 附加数据（可选）
   */
  warn(message, data = null) {
    const timestamp = formatTimestamp(Date.now());
    const logData = data ? ` ${JSON.stringify(data)}` : "";
    console.warn(`[${timestamp}] [WARN] ${message}${logData}`);
  },

  /**
   * 输出错误日志
   *
   * 【功能说明】
   * 记录错误信息，包括错误堆栈
   *
   * @param {string} message - 日志消息
   * @param {Error|Object} [error] - 错误对象或附加数据（可选）
   */
  error(message, error = null) {
    const timestamp = formatTimestamp(Date.now());
    if (error instanceof Error) {
      console.error(
        `[${timestamp}] [ERROR] ${message}`,
        "\n错误堆栈:",
        error.stack
      );
    } else if (error) {
      console.error(
        `[${timestamp}] [ERROR] ${message} ${JSON.stringify(error)}`
      );
    } else {
      console.error(`[${timestamp}] [ERROR] ${message}`);
    }
  },

  /**
   * 记录 HTTP 请求
   *
   * 【功能说明】
   * 记录 HTTP 请求的详细信息
   *
   * @param {Object} req - Express 请求对象
   */
  logRequest(req) {
    const { method, url, ip, headers } = req;
    const userAgent = headers["user-agent"] || "Unknown";
    logger.info(`请求: ${method} ${url}`, {
      ip,
      userAgent,
      timestamp: Date.now(),
    });
  },

  /**
   * 记录 HTTP 响应
   *
   * 【功能说明】
   * 记录 HTTP 响应的详细信息
   *
   * @param {Object} req - Express 请求对象
   * @param {Object} res - Express 响应对象
   * @param {number} duration - 请求处理时长（毫秒）
   */
  logResponse(req, res, duration) {
    const { method, url } = req;
    const statusCode = res.statusCode;
    const logLevel = statusCode >= 400 ? "warn" : "info";
    logger[logLevel](`响应: ${method} ${url} ${statusCode}`, {
      duration: `${duration}ms`,
      timestamp: Date.now(),
    });
  },
};

module.exports = logger;
module.exports.LogLevel = LogLevel;
