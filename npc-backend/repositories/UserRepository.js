/**
 * ============================================
 * User Repository (UserRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 处理用户数据的增删改查（MySQL 数据库）
 *
 * 【主要功能】
 * 1. 用户创建（注册）
 * 2. 根据 ID 查询用户
 * 3. 根据用户名查询用户
 *
 * 【工作流程】
 * 创建用户 → 插入数据库 → 返回用户对象
 * 查询用户 → 从数据库查询 → 返回用户对象或 null
 *
 * 【依赖】
 * - config/database.js: 数据库连接和查询方法
 *
 * 【被谁使用】
 * - services/UserService.js: 调用数据访问方法
 *
 * 【重要说明】
 * - 使用 MySQL 数据库存储
 * - 密码当前明文存储（V1 版本），后续版本改为哈希
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

const { query } = require("../config/database");

/**
 * 创建用户
 *
 * 【功能说明】
 * 创建新用户并保存到数据库
 *
 * 【工作流程】
 * 1. 准备用户数据（添加时间戳）
 * 2. 插入数据库
 * 3. 返回用户对象
 *
 * 【参数说明】
 * @param {Object} userData - 用户数据
 * @param {string} userData.id - 用户 ID
 * @param {string} userData.username - 用户名
 * @param {string} userData.password - 密码（明文）
 * @returns {Promise<Object>} 创建的用户对象
 *
 * 【错误处理】
 * - 用户名重复 → 抛出数据库错误（由 Service 层处理）
 * - 数据库错误 → 抛出异常
 */
async function create(userData) {
  const now = Date.now();
  
  const sql = `
    INSERT INTO users (id, username, password, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  await query(sql, [
    userData.id,
    userData.username,
    userData.password,
    now,
    now,
  ]);
  
  return {
    id: userData.id,
    username: userData.username,
    password: userData.password,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 根据 ID 查找用户
 *
 * 【功能说明】
 * 根据用户 ID 从数据库查询用户
 *
 * 【工作流程】
 * 1. 执行 SQL 查询
 * 2. 返回用户对象或 null
 *
 * 【参数说明】
 * @param {string} id - 用户 ID
 * @returns {Promise<Object|null>} 用户对象，如果不存在则返回 null
 */
async function findById(id) {
  const sql = `SELECT * FROM users WHERE id = ?`;
  const results = await query(sql, [id]);
  
  if (results.length === 0) {
    return null;
  }
  
  const user = results[0];
  return {
    id: user.id,
    username: user.username,
    password: user.password,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * 根据用户名查找用户
 *
 * 【功能说明】
 * 根据用户名从数据库查询用户（用于登录）
 *
 * 【工作流程】
 * 1. 执行 SQL 查询（使用用户名唯一索引）
 * 2. 返回用户对象或 null
 *
 * 【参数说明】
 * @param {string} username - 用户名
 * @returns {Promise<Object|null>} 用户对象，如果不存在则返回 null
 */
async function findByUsername(username) {
  const sql = `SELECT * FROM users WHERE username = ?`;
  const results = await query(sql, [username]);
  
  if (results.length === 0) {
    return null;
  }
  
  const user = results[0];
  return {
    id: user.id,
    username: user.username,
    password: user.password,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

module.exports = {
  create,
  findById,
  findByUsername,
};
