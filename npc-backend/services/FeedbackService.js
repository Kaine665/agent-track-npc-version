/**
 * ============================================
 * Feedback Service (FeedbackService.js)
 * ============================================
 *
 * 【文件职责】
 * 处理反馈相关的业务逻辑
 *
 * 【主要功能】
 * 1. 提交反馈
 * 2. 查询用户的反馈列表
 * 3. 查询反馈详情
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

const feedbackRepository = require('../repositories/FeedbackRepository');

/**
 * 提交反馈
 *
 * @param {string} userId - 用户 ID
 * @param {Object} feedbackData - 反馈数据
 * @param {string} feedbackData.type - 反馈类型
 * @param {string} feedbackData.title - 反馈标题
 * @param {string} feedbackData.content - 反馈内容
 * @param {Object} [feedbackData.userAgent] - 用户环境信息
 * @param {Array} [feedbackData.screenshots] - 截图URL数组
 * @returns {Promise<Object>} 创建的反馈对象
 */
async function submitFeedback(userId, feedbackData) {
  const { type, title, content, userAgent, screenshots } = feedbackData;
  
  // 验证必填字段
  if (!type || !title || !content) {
    const error = new Error('反馈类型、标题和内容不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  
  // 验证反馈类型
  const validTypes = ['bug', 'feature', 'question'];
  if (!validTypes.includes(type)) {
    const error = new Error('无效的反馈类型');
    error.code = 'INVALID_TYPE';
    throw error;
  }
  
  // 验证标题长度
  if (title.length > 500) {
    const error = new Error('反馈标题不能超过500个字符');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  
  // 创建反馈
  const feedback = await feedbackRepository.create({
    userId,
    type,
    title,
    content,
    userAgent,
    screenshots,
  });
  
  return feedback;
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
async function getUserFeedbacks(userId, options = {}) {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    const error = new Error('用户 ID 不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  
  return await feedbackRepository.findByUserId(userId.trim(), options);
}

/**
 * 查询反馈详情
 *
 * @param {string} feedbackId - 反馈 ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @returns {Promise<Object>} 反馈对象
 */
async function getFeedbackById(feedbackId, userId) {
  if (!feedbackId || typeof feedbackId !== 'string' || !feedbackId.trim()) {
    const error = new Error('反馈 ID 不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  
  const feedback = await feedbackRepository.findById(feedbackId.trim());
  
  if (!feedback) {
    const error = new Error('反馈不存在');
    error.code = 'FEEDBACK_NOT_FOUND';
    throw error;
  }
  
  // 验证权限（用户只能查看自己的反馈）
  if (userId && feedback.userId !== userId.trim()) {
    const error = new Error('无权查看此反馈');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }
  
  return feedback;
}

module.exports = {
  submitFeedback,
  getUserFeedbacks,
  getFeedbackById,
};

