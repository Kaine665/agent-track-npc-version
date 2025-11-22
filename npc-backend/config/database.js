/**
 * ============================================
 * 数据库配置和连接管理 (database.js)
 * ============================================
 *
 * 【文件职责】
 * MySQL 数据库连接配置和连接池管理
 *
 * 【主要功能】
 * 1. 从环境变量读取数据库配置
 * 2. 创建 MySQL 连接池
 * 3. 提供数据库连接查询方法
 * 4. 处理数据库连接错误
 *
 * 【工作流程】
 * 加载环境变量 → 创建连接池 → 导出查询方法
 *
 * 【依赖】
 * - mysql2: MySQL 驱动
 * - config-loader: 配置加载器（优先 YAML，回退到 .env）
 *
 * 【被谁使用】
 * - Repository 层（AgentRepository、EventRepository 等）
 * - 数据库迁移脚本
 *
 * 【重要说明】
 * - 使用连接池提高性能
 * - 连接配置从环境变量读取
 * - 开发环境默认使用本地 MySQL
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

// 确保配置已加载（如果还没有加载的话）
try {
  const configLoader = require("./config-loader");
  if (!process.env.DB_PASSWORD && !process.env.DB_HOST) {
    // 如果环境变量未设置，尝试加载配置
    configLoader.init();
  }
} catch (error) {
  // 如果 config-loader 不存在，回退到 dotenv
  require("dotenv").config();
}

const mysql = require("mysql2/promise");

/**
 * 数据库配置
 *
 * 【功能说明】
 * 从环境变量读取数据库连接配置，提供默认值
 *
 * 【配置项说明】
 * - DB_HOST: 数据库主机地址（默认 localhost）
 * - DB_PORT: 数据库端口（默认 3306）
 * - DB_USER: 数据库用户名（默认 root）
 * - DB_PASSWORD: 数据库密码（必填）
 * - DB_NAME: 数据库名称（默认 npc_db）
 */
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "npc_db",
  // 连接池配置
  waitForConnections: true,
  connectionLimit: 10, // 最大连接数
  queueLimit: 0, // 无限制排队
  // 字符集配置
  charset: "utf8mb4",
};

/**
 * 创建数据库连接池
 *
 * 【功能说明】
 * 创建 MySQL 连接池，用于管理数据库连接
 *
 * 【工作流程】
 * 1. 使用配置创建连接池
 * 2. 监听连接错误事件
 * 3. 返回连接池实例
 *
 * 【错误处理】
 * - 连接失败 → 输出错误信息，但不抛出异常（允许后续重试）
 *
 * @returns {mysql.Pool} MySQL 连接池实例
 */
function createPool() {
  const pool = mysql.createPool(dbConfig);

  // 监听连接错误事件
  pool.on("error", (err) => {
    console.error("❌ MySQL Pool Error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("💡 Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("💡 Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("💡 Database connection was refused.");
      console.error("💡 Please check:");
      console.error("   1. MySQL service is running");
      console.error("   2. Database credentials are correct");
      console.error("   3. Database exists");
    }
  });

  return pool;
}

// 创建全局连接池实例
const pool = createPool();

/**
 * 执行 SQL 查询
 *
 * 【功能说明】
 * 执行 SQL 查询并返回结果（Promise）
 *
 * 【工作流程】
 * 1. 从连接池获取连接
 * 2. 执行 SQL 查询
 * 3. 释放连接回连接池
 * 4. 返回查询结果
 *
 * 【参数说明】
 * @param {string} sql - SQL 查询语句
 * @param {Array} params - 查询参数（可选）
 * @returns {Promise<Array>} 查询结果数组
 *
 * 【错误处理】
 * - SQL 语法错误 → 抛出异常
 * - 连接错误 → 抛出异常
 *
 * @example
 * // 查询所有 agents
 * const agents = await query('SELECT * FROM agents WHERE user_id = ?', ['user_123']);
 *
 * @example
 * // 插入数据
 * await query('INSERT INTO agents (id, user_id, name) VALUES (?, ?, ?)', ['agent_1', 'user_123', 'Test']);
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error("❌ Database Query Error:", error.message);
    console.error("SQL:", sql);
    console.error("Params:", params);
    throw error;
  }
}

/**
 * 执行事务
 *
 * 【功能说明】
 * 在事务中执行多个 SQL 查询，保证原子性
 *
 * 【工作流程】
 * 1. 获取连接
 * 2. 开始事务
 * 3. 执行所有查询
 * 4. 提交事务（成功）或回滚（失败）
 * 5. 释放连接
 *
 * 【参数说明】
 * @param {Function} callback - 事务回调函数，接收 connection 参数
 * @returns {Promise<any>} 事务执行结果
 *
 * 【错误处理】
 * - 任何查询失败 → 自动回滚事务
 * - 连接错误 → 抛出异常
 *
 * @example
 * await transaction(async (connection) => {
 *   await connection.execute('INSERT INTO agents ...', [...]);
 *   await connection.execute('INSERT INTO events ...', [...]);
 * });
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 测试数据库连接
 *
 * 【功能说明】
 * 测试数据库连接是否正常
 *
 * 【工作流程】
 * 1. 执行简单查询（SELECT 1）
 * 2. 返回连接状态
 *
 * 【返回值】
 * @returns {Promise<boolean>} 连接是否正常
 *
 * 【错误处理】
 * - 连接失败 → 返回 false
 */
async function testConnection() {
  try {
    await query("SELECT 1");
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 关闭数据库连接池
 *
 * 【功能说明】
 * 关闭所有数据库连接（通常在应用关闭时调用）
 *
 * 【工作流程】
 * 1. 等待所有查询完成
 * 2. 关闭连接池
 */
async function closePool() {
  await pool.end();
}

// 导出连接池和查询方法
module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  closePool,
  // 导出配置（用于迁移脚本等）
  dbConfig,
};

