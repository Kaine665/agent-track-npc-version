/**
 * ============================================
 * Feedback Repository (FeedbackRepository.js)
 * ============================================
 *
 * 【文件职责】
 * 处理反馈数据的增删改查（MySQL 数据库）
 *
 * 【主要功能】
 * 1. 创建反馈
 * 2. 根据 ID 查询反馈
 * 3. 根据用户 ID 查询反馈列表
 * 4. 查询所有反馈（管理员）
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

const { query } = require("../config/database");

/**
 * 生成反馈 ID
 * 格式：feedback_时间戳_随机字符串
 */
function generateId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `feedback_${timestamp}_${random}`;
}

/**
 * 创建反馈
 *
 * @param {Object} feedbackData - 反馈数据
 * @param {string} feedbackData.userId - 用户 ID
 * @param {string} feedbackData.type - 反馈类型
 * @param {string} feedbackData.title - 反馈标题
 * @param {string} feedbackData.content - 反馈内容
 * @param {Object} [feedbackData.userAgent] - 用户环境信息
 * @param {Array} [feedbackData.screenshots] - 截图URL数组
 * @returns {Promise<Object>} 创建的反馈对象
 */
async function create(feedbackData) {
  const now = Date.now();
  const feedbackId = generateId();
  
  const sql = `
    INSERT INTO feedbacks (
      id, user_id, type, title, content, 
      status, user_agent, screenshots, 
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
  `;
  
  await query(sql, [
    feedbackId,
    feedbackData.userId,
    feedbackData.type,
    feedbackData.title,
    feedbackData.content,
    feedbackData.userAgent ? JSON.stringify(feedbackData.userAgent) : null,
    feedbackData.screenshots ? JSON.stringify(feedbackData.screenshots) : null,
    now,
    now,
  ]);
  
  return findById(feedbackId);
}

/**
 * 根据 ID 查询反馈
 *
 * @param {string} id - 反馈 ID
 * @returns {Promise<Object|null>} 反馈对象或 null
 */
async function findById(id) {
  const sql = `SELECT * FROM feedbacks WHERE id = ?`;
  const results = await query(sql, [id]);
  
  if (results.length === 0) {
    return null;
  }
  
  const feedback = results[0];
  
  // 解析 JSON 字段
  if (feedback.user_agent) {
    try {
      feedback.userAgent = JSON.parse(feedback.user_agent);
    } catch (e) {
      feedback.userAgent = null;
    }
  }
  
  if (feedback.screenshots) {
    try {
      feedback.screenshots = JSON.parse(feedback.screenshots);
    } catch (e) {
      feedback.screenshots = null;
    }
  }
  
  // 统一字段命名（下划线转驼峰）
  return {
    id: feedback.id,
    userId: feedback.user_id,
    type: feedback.type,
    title: feedback.title,
    content: feedback.content,
    status: feedback.status,
    userAgent: feedback.userAgent,
    screenshots: feedback.screenshots,
    createdAt: feedback.created_at,
    updatedAt: feedback.updated_at,
    resolvedAt: feedback.resolved_at,
  };
}

/**
 * 查询用户的反馈列表
 *
 * @param {string} userId - 用户 ID
 * @param {Object} [options] - 查询选项
 * @param {number} [options.page=1] - 页码
 * @param {number} [options.pageSize=20] - 每页数量
 * @param {string} [options.type] - 反馈类型筛选
 * @param {string} [options.status] - 状态筛选
 * @returns {Promise<Array>} 反馈列表
 */
async function findByUserId(userId, options = {}) {
  const { page = 1, pageSize = 20, type, status } = options;
  const offset = (page - 1) * pageSize;
  
  // 确保 LIMIT 和 OFFSET 是安全的整数
  const safeLimit = parseInt(pageSize, 10) || 20;
  const safeOffset = parseInt(offset, 10) || 0;
  
  let sql = 'SELECT * FROM feedbacks WHERE user_id = ?';
  const params = [userId];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  // LIMIT 和 OFFSET 不能使用参数化查询，需要直接拼接（但已确保是安全的整数）
  sql += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  
  const results = await query(sql, params);
  
  // 解析 JSON 字段并统一命名
  return results.map(feedback => {
    const parsed = {
      id: feedback.id,
      userId: feedback.user_id,
      type: feedback.type,
      title: feedback.title,
      content: feedback.content,
      status: feedback.status,
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
      resolvedAt: feedback.resolved_at,
    };
    
    if (feedback.user_agent) {
      try {
        parsed.userAgent = JSON.parse(feedback.user_agent);
      } catch (e) {
        parsed.userAgent = null;
      }
    }
    
    if (feedback.screenshots) {
      try {
        parsed.screenshots = JSON.parse(feedback.screenshots);
      } catch (e) {
        parsed.screenshots = null;
      }
    }
    
    return parsed;
  });
}

/**
 * 查询所有反馈（管理员）
 *
 * @param {Object} [options] - 查询选项
 * @param {number} [options.page=1] - 页码
 * @param {number} [options.pageSize=20] - 每页数量
 * @param {string} [options.type] - 反馈类型筛选
 * @param {string} [options.status] - 状态筛选
 * @returns {Promise<Array>} 反馈列表
 */
async function findAll(options = {}) {
  const { page = 1, pageSize = 20, type, status } = options;
  const offset = (page - 1) * pageSize;
  
  // 确保 LIMIT 和 OFFSET 是安全的整数
  const safeLimit = parseInt(pageSize, 10) || 20;
  const safeOffset = parseInt(offset, 10) || 0;
  
  let sql = 'SELECT * FROM feedbacks WHERE 1=1';
  const params = [];
  
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  // LIMIT 和 OFFSET 不能使用参数化查询，需要直接拼接（但已确保是安全的整数）
  sql += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  
  const results = await query(sql, params);
  
  // 解析 JSON 字段并统一命名
  return results.map(feedback => {
    const parsed = {
      id: feedback.id,
      userId: feedback.user_id,
      type: feedback.type,
      title: feedback.title,
      content: feedback.content,
      status: feedback.status,
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
      resolvedAt: feedback.resolved_at,
    };
    
    if (feedback.user_agent) {
      try {
        parsed.userAgent = JSON.parse(feedback.user_agent);
      } catch (e) {
        parsed.userAgent = null;
      }
    }
    
    if (feedback.screenshots) {
      try {
        parsed.screenshots = JSON.parse(feedback.screenshots);
      } catch (e) {
        parsed.screenshots = null;
      }
    }
    
    return parsed;
  });
}

module.exports = {
  create,
  findById,
  findByUserId,
  findAll,
};

