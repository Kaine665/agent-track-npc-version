/**
 * ============================================
 * Version Repository (VersionRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 处理版本更新日志数据的增删改查（MySQL 数据库）
 */

const { query } = require("../config/database");

/**
 * 获取当前激活的最新版本
 * @returns {Promise<Object|null>} 版本信息对象
 */
async function getCurrentVersion() {
  const sql = `
    SELECT * FROM version_changelogs 
    WHERE is_active = 1 
    ORDER BY version DESC 
    LIMIT 1
  `;
  
  const results = await query(sql);
  
  if (results.length === 0) {
    return null;
  }
  
  const version = results[0];
  return {
    id: version.id,
    version: version.version,
    title: version.title,
    content: version.content || '', // Markdown 内容
    releaseDate: version.release_date,
    isActive: version.is_active === 1,
    createdAt: version.created_at,
    updatedAt: version.updated_at,
  };
}

/**
 * 根据版本号获取更新日志
 * @param {string} version - 版本号
 * @returns {Promise<Object|null>} 版本信息对象
 */
async function getByVersion(version) {
  const sql = `SELECT * FROM version_changelogs WHERE version = ? AND is_active = 1`;
  const results = await query(sql, [version]);
  
  if (results.length === 0) {
    return null;
  }
  
  const versionData = results[0];
  return {
    id: versionData.id,
    version: versionData.version,
    title: versionData.title,
    content: versionData.content || '', // Markdown 内容
    releaseDate: versionData.release_date,
    isActive: versionData.is_active === 1,
    createdAt: versionData.created_at,
    updatedAt: versionData.updated_at,
  };
}

/**
 * 获取所有激活的版本更新日志（按版本号降序）
 * @param {number} limit - 限制返回数量（可选）
 * @returns {Promise<Array>} 版本信息数组
 */
async function getAllActiveVersions(limit = null) {
  let sql = `
    SELECT * FROM version_changelogs 
    WHERE is_active = 1 
    ORDER BY version DESC
  `;
  
  if (limit) {
    sql += ` LIMIT ${parseInt(limit)}`;
  }
  
  const results = await query(sql);
  
  return results.map(version => ({
    id: version.id,
    version: version.version,
    title: version.title,
    content: version.content || '', // Markdown 内容
    releaseDate: version.release_date,
    isActive: version.is_active === 1,
    createdAt: version.created_at,
    updatedAt: version.updated_at,
  }));
}

/**
 * 创建版本更新日志
 * @param {Object} data - 版本数据
 * @returns {Promise<Object>} 创建的版本信息对象
 */
async function create(data) {
  const now = Date.now();
  
  const sql = `
    INSERT INTO version_changelogs 
    (version, title, content, release_date, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  await query(sql, [
    data.version,
    data.title,
    data.content || '', // Markdown 内容
    data.releaseDate || null,
    data.isActive !== undefined ? (data.isActive ? 1 : 0) : 1,
    now,
    now,
  ]);
  
  return await getByVersion(data.version);
}

/**
 * 更新版本更新日志
 * @param {string} version - 版本号
 * @param {Object} data - 更新数据
 * @returns {Promise<Object|null>} 更新后的版本信息对象
 */
async function update(version, data) {
  const now = Date.now();
  
  const updateFields = [];
  const updateValues = [];
  
  if (data.title !== undefined) {
    updateFields.push('title = ?');
    updateValues.push(data.title);
  }
  if (data.content !== undefined) {
    updateFields.push('content = ?');
    updateValues.push(data.content);
  }
  if (data.releaseDate !== undefined) {
    updateFields.push('release_date = ?');
    updateValues.push(data.releaseDate);
  }
  if (data.isActive !== undefined) {
    updateFields.push('is_active = ?');
    updateValues.push(data.isActive ? 1 : 0);
  }
  
  updateFields.push('updated_at = ?');
  updateValues.push(now);
  updateValues.push(version);
  
  const sql = `
    UPDATE version_changelogs 
    SET ${updateFields.join(', ')}
    WHERE version = ?
  `;
  
  const result = await query(sql, updateValues);
  
  if (result.affectedRows === 0) {
    return null;
  }
  
  return await getByVersion(version);
}

module.exports = {
  getCurrentVersion,
  getByVersion,
  getAllActiveVersions,
  create,
  update,
};

