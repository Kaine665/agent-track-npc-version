/**
 * ============================================
 * 导入服务 (ImportService.js)
 * ============================================
 *
 * 【功能说明】
 * 处理对话历史导入，自动创建Agent和Events
 *
 * 【主要功能】
 * 1. 验证导入数据格式
 * 2. 自动创建Agent（如果不存在）
 * 3. 创建Session和Events
 * 4. 返回导入结果（成功数、失败数、错误列表）
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

const agentRepository = require('../repositories/AgentRepository');
const sessionRepository = require('../repositories/SessionRepository');
const eventRepository = require('../repositories/EventRepository');
const { getDefaultModel } = require('../config/models');

/**
 * 导入对话历史
 *
 * 【功能说明】
 * 导入用户粘贴的对话记录，自动创建Agent和对话历史
 *
 * 【工作流程】
 * 1. 验证导入数据格式
 * 2. 创建或查找Agent
 * 3. 创建Session
 * 4. 创建Events（按顺序）
 * 5. 返回导入结果
 *
 * @param {string} userId - 用户ID
 * @param {Object} importData - 导入数据
 * @param {string} importData.agentName - Agent名称
 * @param {Array} importData.messages - 消息数组
 * @param {Object} [options] - 导入选项
 * @returns {Promise<Object>} 导入结果
 */
async function importConversations(userId, importData, options = {}) {
  // 验证导入数据格式
  if (!importData || typeof importData !== 'object') {
    const error = new Error('无效的导入数据格式');
    error.code = 'INVALID_FORMAT';
    throw error;
  }

  if (!importData.agentName || typeof importData.agentName !== 'string' || importData.agentName.trim().length === 0) {
    const error = new Error('Agent名称不能为空');
    error.code = 'INVALID_FORMAT';
    throw error;
  }

  if (!importData.messages || !Array.isArray(importData.messages) || importData.messages.length === 0) {
    const error = new Error('消息列表不能为空');
    error.code = 'INVALID_FORMAT';
    throw error;
  }

  const results = {
    agentId: null,
    sessionId: null,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // 步骤1: 创建或查找Agent
    const agentName = importData.agentName.trim();
    
    // 检查是否已存在同名Agent
    const existingAgents = await agentRepository.findByUserId(userId);
    let agent = existingAgents.find(a => a.name === agentName);

    if (!agent) {
      // 创建新Agent
      // 获取默认模型
      const defaultModel = getDefaultModel();
      
      agent = await agentRepository.create({
        createdBy: userId,
        name: agentName,
        type: 'general', // 默认为通用类型
        model: defaultModel.model,
        provider: defaultModel.provider,
        systemPrompt: `这是一个从外部导入的对话记录。Agent名称：${agentName}`,
      });
    }

    results.agentId = agent.id;

    // 步骤2: 创建或查找Session
    // 单会话模式：同一用户和Agent只有一个Session
    const participants = [
      { type: 'user', id: userId },
      { type: 'agent', id: agent.id }
    ];

    let session = await sessionRepository.findByParticipants(participants);

    if (!session) {
      // 创建新Session
      session = await sessionRepository.create({
        userId: userId,
        agentId: agent.id,
        participants: participants,
      });
    }

    results.sessionId = session.id;

    // 步骤3: 创建Events（按顺序）
    for (let i = 0; i < importData.messages.length; i++) {
      const msg = importData.messages[i];
      
      try {
        // 验证消息格式
        if (!msg.role || (msg.role !== 'user' && msg.role !== 'assistant')) {
          results.skipped++;
          results.errors.push({
            index: i,
            message: `消息 #${i + 1} 角色无效: ${msg.role}`,
          });
          continue;
        }

        if (!msg.content || typeof msg.content !== 'string' || msg.content.trim().length === 0) {
          results.skipped++;
          results.errors.push({
            index: i,
            message: `消息 #${i + 1} 内容为空`,
          });
          continue;
        }

        // 确定from和to
        const fromType = msg.role === 'user' ? 'user' : 'agent';
        const fromId = msg.role === 'user' ? userId : agent.id;
        const toType = msg.role === 'user' ? 'agent' : 'user';
        const toId = msg.role === 'user' ? agent.id : userId;

        // 使用消息中的时间戳，如果没有则使用当前时间
        const timestamp = msg.timestamp && typeof msg.timestamp === 'number' && msg.timestamp > 0
          ? msg.timestamp
          : Date.now() + i; // 确保时间戳递增

        // 创建Event
        await eventRepository.createEvent({
          sessionId: session.id,
          userId: userId,
          agentId: agent.id,
          fromType: fromType,
          fromId: fromId,
          toType: toType,
          toId: toId,
          content: msg.content.trim(),
        });

        results.imported++;
      } catch (error) {
        results.skipped++;
        results.errors.push({
          index: i,
          message: `消息 #${i + 1} 创建失败: ${error.message}`,
        });
      }
    }

    return results;
  } catch (error) {
    // 如果是已知错误，直接抛出
    if (error.code) {
      throw error;
    }
    
    // 其他错误包装后抛出
    const wrappedError = new Error(`导入失败: ${error.message}`);
    wrappedError.code = 'IMPORT_ERROR';
    throw wrappedError;
  }
}

module.exports = {
  importConversations,
};

