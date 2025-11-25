/**
 * ============================================
 * Agent 数据访问层 (AgentRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 管理 Agent 数据的 MySQL 数据库访问操作
 *
 * 【主要功能】
 * 1. 提供 Agent 的 CRUD 操作
 * 2. 查询用户的所有 Agent（按创建时间倒序）
 * 3. 检查名称唯一性（同一用户下）
 * 4. 生成 Agent ID
 *
 * 【工作流程】
 * 创建 Agent → 插入数据库 → 返回结果
 * 查询 Agent → 从数据库查询 → 返回结果
 *
 * 【存储结构】
 * - 使用 MySQL agents 表存储
 * - 通过索引优化查询性能（user_id, created_at）
 *
 * 【依赖】
 * - config/database.js: 数据库连接和查询方法
 *
 * 【被谁使用】
 * - services/AgentService.js: 调用数据访问方法
 *
 * 【重要说明】
 * - 使用 MySQL 数据库存储
 * - 支持用户数据隔离（通过 user_id 索引）
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-21
 */

const { query } = require("../config/database");

/**
 * 生成 Agent ID
 *
 * 【功能说明】
 * 生成唯一的 Agent ID，格式：agent_{timestamp}_{random}
 *
 * 【工作流程】
 * 1. 获取当前时间戳（毫秒）
 * 2. 生成随机字符串（6 位）
 * 3. 组合为 agent_{timestamp}_{random}
 *
 * 【ID 格式】
 * agent_1703001234567_abc123
 *
 * @returns {string} Agent ID
 */
function generateId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `agent_${timestamp}_${random}`;
}

/**
 * 创建 Agent
 *
 * 【功能说明】
 * 创建新的 Agent 并保存到数据库
 *
 * 【工作流程】
 * 1. 生成 Agent ID
 * 2. 创建 Agent 对象（添加时间戳）
 * 3. 插入数据库
 * 4. 返回 Agent 对象
 *
 * 【参数说明】
 * @param {Object} agentData - Agent 数据
 * @param {string} agentData.createdBy - 创建者用户 ID
 * @param {string} agentData.name - Agent 名称
 * @param {string} agentData.type - Agent 类型（general/special）
 * @param {string} agentData.model - LLM 模型名称
 * @param {string} [agentData.provider] - LLM 提供商（可选，预设模型会自动推断）
 * @param {string} agentData.systemPrompt - 人设描述
 * @param {string} [agentData.avatarUrl] - 头像 URL（可选）
 * @returns {Promise<Object>} 创建的 Agent 对象
 *
 * 【错误处理】
 * - 名称重复 → 抛出数据库错误（由 Service 层处理）
 * - 数据库错误 → 抛出异常
 */
async function create(agentData) {
  const agentId = generateId();
  const now = Date.now();

  const sql = `
    INSERT INTO agents (
      id, user_id, name, type, model, provider, system_prompt, avatar_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await query(sql, [
    agentId,
    agentData.createdBy,
    agentData.name,
    agentData.type,
    agentData.model,
    agentData.provider || null,
    agentData.systemPrompt,
    agentData.avatarUrl || null,
    now,
    now,
  ]);

  return {
    id: agentId,
    createdBy: agentData.createdBy,
    name: agentData.name,
    type: agentData.type,
    model: agentData.model,
    provider: agentData.provider || null,
    systemPrompt: agentData.systemPrompt,
    avatarUrl: agentData.avatarUrl || null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 通过 ID 查询 Agent
 *
 * 【功能说明】
 * 根据 agentId 从数据库查询 Agent（包括已删除的）
 *
 * 【工作流程】
 * 1. 执行 SQL 查询
 * 2. 返回 Agent 对象或 null
 *
 * 【参数说明】
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object|null>} Agent 对象，如果不存在则返回 null
 */
async function findById(agentId) {
  const sql = `SELECT * FROM agents WHERE id = ?`;
  const results = await query(sql, [agentId]);

  if (results.length === 0) {
    return null;
  }

  const agent = results[0];
  return {
    id: agent.id,
    createdBy: agent.user_id,
    name: agent.name,
    type: agent.type,
    model: agent.model,
    provider: agent.provider || null, // 从数据库读取 provider
    systemPrompt: agent.system_prompt,
    avatarUrl: agent.avatar_url,
    createdAt: agent.created_at,
    updatedAt: agent.updated_at,
    deleted: agent.deleted || false,
    deletedAt: agent.deleted_at || null,
  };
}

/**
 * 查询用户的所有 Agent
 *
 * 【功能说明】
 * 根据 userId 查询该用户创建的所有 Agent，按创建时间倒序排列
 * 默认排除已删除的 Agent（软删除）
 *
 * 【工作流程】
 * 1. 执行 SQL 查询（使用 user_id 索引）
 * 2. 排除已删除的 Agent（deleted = FALSE 或 NULL）
 * 3. 按创建时间倒序排序
 * 4. 返回 Agent 对象数组
 *
 * 【参数说明】
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array<Object>>} Agent 对象数组，按创建时间倒序
 */
async function findByUserId(userId) {
  // 检查deleted字段是否存在（向后兼容）
  // 如果字段不存在，使用简单的查询；如果存在，使用软删除过滤
  let sql;
  try {
    // 先尝试查询表结构，检查deleted字段是否存在
    const [columns] = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'agents' 
      AND COLUMN_NAME = 'deleted'
    `);
    
    if (columns && columns.length > 0) {
      // deleted字段存在，使用软删除过滤
      sql = `
        SELECT * FROM agents 
        WHERE user_id = ? AND (deleted IS NULL OR deleted = FALSE)
        ORDER BY created_at DESC
      `;
    } else {
      // deleted字段不存在，不使用软删除过滤（向后兼容）
      sql = `
        SELECT * FROM agents 
        WHERE user_id = ?
        ORDER BY created_at DESC
      `;
    }
  } catch (error) {
    // 如果查询表结构失败，使用简单查询（向后兼容）
    sql = `
      SELECT * FROM agents 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;
  }
  
  const results = await query(sql, [userId]);

  return results.map((agent) => ({
    id: agent.id,
    createdBy: agent.user_id,
    name: agent.name,
    type: agent.type,
    model: agent.model,
    provider: agent.provider || null, // 从数据库读取 provider
    systemPrompt: agent.system_prompt,
    avatarUrl: agent.avatar_url,
    createdAt: agent.created_at,
    updatedAt: agent.updated_at,
    deleted: agent.deleted || false,
    deletedAt: agent.deleted_at || null,
  }));
}

/**
 * 检查名称唯一性
 *
 * 【功能说明】
 * 检查指定用户是否已存在相同名称的 Agent（不区分大小写）
 *
 * 【工作流程】
 * 1. 执行 SQL 查询（使用 LOWER 函数进行大小写不敏感比较）
 * 2. 返回是否存在
 *
 * 【参数说明】
 * @param {string} userId - 用户 ID
 * @param {string} name - Agent 名称
 * @returns {Promise<boolean>} 名称是否已存在
 */
async function checkNameExists(userId, name) {
  const sql = `
    SELECT COUNT(*) as count 
    FROM agents 
    WHERE user_id = ? AND LOWER(name) = LOWER(?)
  `;
  const results = await query(sql, [userId, name]);

  return results[0].count > 0;
}

/**
 * 获取名称冲突的 Agent ID
 *
 * 【功能说明】
 * 如果名称已存在，返回已存在的 Agent ID（用于错误提示）
 *
 * 【工作流程】
 * 1. 执行 SQL 查询（使用 LOWER 函数进行大小写不敏感比较）
 * 2. 返回第一个匹配的 Agent ID 或 null
 *
 * 【参数说明】
 * @param {string} userId - 用户 ID
 * @param {string} name - Agent 名称
 * @returns {Promise<string|null>} 已存在的 Agent ID，如果不存在则返回 null
 */
async function getExistingAgentIdByName(userId, name) {
  const sql = `
    SELECT id 
    FROM agents 
    WHERE user_id = ? AND LOWER(name) = LOWER(?)
    LIMIT 1
  `;
  const results = await query(sql, [userId, name]);

  if (results.length === 0) {
    return null;
  }

  return results[0].id;
}

/**
 * 更新 Agent
 *
 * 【功能说明】
 * 更新指定 Agent 的字段
 *
 * 【工作流程】
 * 1. 构建更新 SQL（只更新提供的字段）
 * 2. 执行更新操作
 * 3. 返回更新后的 Agent 对象
 *
 * 【参数说明】
 * @param {string} agentId - Agent ID
 * @param {Object} updateData - 要更新的字段
 * @returns {Promise<Object>} 更新后的 Agent 对象
 */
async function update(agentId, updateData) {
  const allowedFields = ['name', 'type', 'model', 'provider', 'system_prompt', 'avatar_url', 'deleted', 'deleted_at'];
  const fields = [];
  const values = [];

  // 构建更新字段
  for (const [key, value] of Object.entries(updateData)) {
    // 将驼峰命名转换为下划线命名
    let dbKey = key;
    if (key === 'systemPrompt') dbKey = 'system_prompt';
    else if (key === 'avatarUrl') dbKey = 'avatar_url';
    else if (key === 'deletedAt') dbKey = 'deleted_at';
    
    if (allowedFields.includes(dbKey)) {
      fields.push(`${dbKey} = ?`);
      values.push(value);
    }
  }

  // 添加 updated_at
  fields.push('updated_at = ?');
  values.push(Date.now());

  if (fields.length === 0) {
    // 如果没有要更新的字段，直接返回原对象
    return await findById(agentId);
  }

  values.push(agentId);

  const sql = `UPDATE agents SET ${fields.join(', ')} WHERE id = ?`;
  await query(sql, values);

  // 返回更新后的对象
  return await findById(agentId);
}

/**
 * 删除 Agent（硬删除）
 *
 * 【功能说明】
 * 物理删除指定的 Agent（永久删除）
 *
 * 【注意】
 * 硬删除会永久删除数据，谨慎使用
 *
 * 【参数说明】
 * @param {string} agentId - Agent ID
 * @returns {Promise<boolean>} 是否删除成功
 */
async function remove(agentId) {
  const sql = `DELETE FROM agents WHERE id = ?`;
  const results = await query(sql, [agentId]);

  return results.affectedRows > 0;
}

/**
 * 清空所有数据（用于测试或重置）
 *
 * 【功能说明】
 * 清空所有 Agent 数据
 *
 * 【注意】
 * 主要用于测试，生产环境慎用
 */
async function clearAll() {
  await query("DELETE FROM agents");
}

module.exports = {
  create,
  findById,
  findByUserId,
  checkNameExists,
  getExistingAgentIdByName,
  update,
  remove,
  clearAll,
};
