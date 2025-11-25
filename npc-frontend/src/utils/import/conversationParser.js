/**
 * ============================================
 * 对话解析器主函数 (conversationParser.js)
 * ============================================
 *
 * 【功能说明】
 * 整合文本清洗、格式解析、角色识别，解析对话文本
 *
 * 【工作流程】
 * 1. 清洗文本（移除HTML、网页元素等）
 * 2. 解析格式（识别消息边界）
 *    - 支持多种格式：ChatGPT、Claude、中文、时间戳等
 *    - 不支持左右位置格式（解析效果差，详见实现问题记录.md - PROB-022）
 * 3. 识别角色（用户/AI）
 * 4. 提取Agent名称（如果有）
 * 5. 计算置信度
 *
 * 【状态说明】
 * 当前版本：功能已实现，但未在前端UI中启用
 * 未来计划：将通过AI实现更智能的解析功能，特别是左右位置格式的识别
 * 相关记录：实现问题记录.md - PROB-022
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import { cleanText } from './textCleaner.js';
import { parseFormat, detectFormat } from './formatParser.js';
import { identifyRoles, calculateConfidence } from './roleIdentifier.js';

/**
 * 从对话中提取Agent名称
 * 
 * @param {Array<Object>} messages - 消息数组
 * @param {string} originalText - 原始文本
 * @returns {string} Agent名称
 */
function extractAgentName(messages, originalText) {
  // 尝试从原始文本中提取Agent名称
  const agentNamePatterns = [
    /与\s*([^\s的]+)\s*的对话/i,
    /对话对象[：:]\s*([^\s\n]+)/i,
    /Agent[：:]\s*([^\s\n]+)/i,
    /NPC[：:]\s*([^\s\n]+)/i,
    /助手[：:]\s*([^\s\n]+)/i,
  ];
  
  for (const pattern of agentNamePatterns) {
    const match = originalText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // 尝试从AI消息的raw字段中提取
  for (const message of messages) {
    if (message.role === 'assistant' && message.raw) {
      // 匹配 "ChatGPT:"、"AI:"、"助手:" 等
      const nameMatch = message.raw.match(/^(ChatGPT|Claude|GPT|AI|助手|机器人|Bot|Assistant)[：:]/i);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1];
      }
    }
  }
  
  // 默认名称
  return 'AI助手';
}

/**
 * 解析对话文本
 * 
 * 【功能说明】
 * 完整的对话解析流程，返回标准化的消息数组
 * 
 * 【返回值格式】
 * {
 *   messages: [
 *     { role: 'user', content: '...', timestamp: 1234567890 },
 *     { role: 'assistant', content: '...', timestamp: 1234567891 }
 *   ],
 *   agentName: 'AI助手',
 *   confidence: 0.8,
 *   format: 'chatgpt'
 * }
 * 
 * @param {string} text - 原始文本（可能包含HTML、网页元素等）
 * @returns {Object} 解析结果
 */
export function parseConversation(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      messages: [],
      agentName: 'AI助手',
      confidence: 0,
      format: 'unknown',
      error: '文本为空'
    };
  }
  
  try {
    // 步骤1: 清洗文本
    const cleanedText = cleanText(text);
    
    if (!cleanedText || cleanedText.trim().length === 0) {
      return {
        messages: [],
        agentName: 'AI助手',
        confidence: 0,
        format: 'unknown',
        error: '清洗后文本为空'
      };
    }
    
    // 步骤2: 检测格式
    const format = detectFormat(cleanedText);
    
    // 步骤3: 解析格式
    let messages = parseFormat(cleanedText);
    
    if (!messages || messages.length === 0) {
      return {
        messages: [],
        agentName: 'AI助手',
        confidence: 0,
        format: format,
        error: '未能解析出消息'
      };
    }
    
    // 步骤4: 识别角色
    messages = identifyRoles(messages);
    
    // 步骤5: 提取Agent名称
    const agentName = extractAgentName(messages, text);
    
    // 步骤6: 计算置信度
    const confidence = calculateConfidence(messages);
    
    // 步骤7: 标准化消息格式（移除raw等临时字段）
    const normalizedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content.trim(),
      timestamp: msg.timestamp || null
    }));
    
    return {
      messages: normalizedMessages,
      agentName: agentName,
      confidence: confidence,
      format: format,
      error: null
    };
  } catch (error) {
    console.error('解析对话失败:', error);
    return {
      messages: [],
      agentName: 'AI助手',
      confidence: 0,
      format: 'unknown',
      error: error.message || '解析失败'
    };
  }
}

/**
 * 验证解析结果
 * 
 * @param {Object} result - 解析结果
 * @returns {Object} { valid: boolean, errors: Array<string> }
 */
export function validateParseResult(result) {
  const errors = [];
  
  if (!result.messages || result.messages.length === 0) {
    errors.push('没有解析出任何消息');
  }
  
  if (result.messages && result.messages.length > 0) {
    // 检查是否有用户消息和AI消息
    const hasUser = result.messages.some(msg => msg.role === 'user');
    const hasAssistant = result.messages.some(msg => msg.role === 'assistant');
    
    if (!hasUser) {
      errors.push('没有识别出用户消息');
    }
    if (!hasAssistant) {
      errors.push('没有识别出AI消息');
    }
    
    // 检查消息内容是否为空
    const emptyMessages = result.messages.filter(msg => !msg.content || msg.content.trim().length === 0);
    if (emptyMessages.length > 0) {
      errors.push(`有${emptyMessages.length}条消息内容为空`);
    }
  }
  
  if (!result.agentName || result.agentName.trim().length === 0) {
    errors.push('Agent名称为空');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

