/**
 * ============================================
 * 角色识别工具 (roleIdentifier.js)
 * ============================================
 *
 * 【功能说明】
 * 识别消息的角色（用户或AI），使用多种策略提高准确度
 *
 * 【识别策略】
 * 1. 关键词匹配
 * 2. 位置推断（交替出现模式）
 * 3. 内容特征分析（AI回复通常更长、更结构化）
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 用户角色关键词
 */
const USER_KEYWORDS = [
  '用户', '我', '提问者', '提问', '问题', 'user', 'you', 'human', '我', '提问'
];

/**
 * AI角色关键词
 */
const AI_KEYWORDS = [
  'ai', '助手', '机器人', 'bot', 'assistant', 'chatgpt', 'claude', 'gpt', '回答', '回答者',
  'ai助手', '智能助手', '人工智能'
];

/**
 * 通过关键词识别角色
 * 
 * @param {string} text - 消息内容
 * @param {string} rawLine - 原始行（可能包含角色标识）
 * @returns {string|null} 'user' | 'assistant' | null
 */
function identifyByKeywords(text, rawLine = '') {
  const combined = (rawLine + ' ' + text).toLowerCase();
  
  // 检查AI关键词
  if (AI_KEYWORDS.some(keyword => combined.includes(keyword))) {
    return 'assistant';
  }
  
  // 检查用户关键词
  if (USER_KEYWORDS.some(keyword => combined.includes(keyword))) {
    return 'user';
  }
  
  return null;
}

/**
 * 通过位置推断角色
 * 
 * 【规则】
 * - 第一条消息通常是用户
 * - 消息通常交替出现（用户-AI-用户-AI）
 * 
 * @param {number} index - 消息索引（从0开始）
 * @param {Array} allMessages - 所有消息数组
 * @returns {string} 'user' | 'assistant'
 */
function identifyByPosition(index, allMessages) {
  // 第一条消息通常是用户
  if (index === 0) {
    return 'user';
  }
  
  // 如果前一条消息已确定角色，交替推断
  if (index > 0 && allMessages[index - 1] && allMessages[index - 1].role) {
    return allMessages[index - 1].role === 'user' ? 'assistant' : 'user';
  }
  
  // 默认：偶数索引为用户，奇数索引为AI
  return index % 2 === 0 ? 'user' : 'assistant';
}

/**
 * 通过内容特征识别角色
 * 
 * 【特征】
 * - AI回复通常更长（>50字符）
 * - AI回复可能包含Markdown格式（代码块、列表等）
 * - AI回复可能包含结构化内容
 * - 用户消息通常较短且直接
 * 
 * @param {string} content - 消息内容
 * @returns {string} 'user' | 'assistant'
 */
function identifyByContent(content) {
  if (!content || content.length === 0) {
    return 'user'; // 默认
  }
  
  const length = content.length;
  const hasMarkdown = /```|`|\[.*\]\(.*\)|^\s*[-*+]\s|^\s*\d+\.\s/.test(content);
  const hasCode = /```|`|function|const|let|var|class|import|export/.test(content);
  const hasStructuredContent = /^#{1,6}\s|^\s*[-*+]\s|^\s*\d+\.\s|^\s*>\s/.test(content);
  
  // AI特征
  if (length > 100 || hasMarkdown || hasCode || hasStructuredContent) {
    return 'assistant';
  }
  
  // 用户特征（短且直接）
  if (length < 50 && !hasMarkdown && !hasCode) {
    return 'user';
  }
  
  // 默认：根据长度判断
  return length > 50 ? 'assistant' : 'user';
}

/**
 * 识别消息角色
 * 
 * 【功能说明】
 * 综合使用多种策略识别消息角色，提高准确度
 * 
 * 【优先级】
 * 1. 关键词匹配（最可靠）
 * 2. 位置推断（如果前一条消息已确定）
 * 3. 内容特征分析（最后手段）
 * 
 * @param {Object} message - 消息对象
 * @param {string} message.content - 消息内容
 * @param {string} [message.raw] - 原始行
 * @param {number} index - 消息索引
 * @param {Array} allMessages - 所有消息数组
 * @returns {string} 'user' | 'assistant'
 */
export function identifyRole(message, index, allMessages) {
  // 如果消息已经有role字段，直接返回
  if (message.role && (message.role === 'user' || message.role === 'assistant')) {
    return message.role;
  }
  
  // 策略1: 关键词匹配
  const keywordRole = identifyByKeywords(message.content, message.raw || '');
  if (keywordRole) {
    return keywordRole;
  }
  
  // 策略2: 位置推断
  const positionRole = identifyByPosition(index, allMessages);
  
  // 策略3: 内容特征分析
  const contentRole = identifyByContent(message.content);
  
  // 如果位置推断和内容分析一致，使用该结果
  if (positionRole === contentRole) {
    return positionRole;
  }
  
  // 如果不一致，优先使用位置推断（更可靠）
  return positionRole;
}

/**
 * 批量识别角色
 * 
 * @param {Array<Object>} messages - 消息数组
 * @returns {Array<Object>} 带角色标识的消息数组
 */
export function identifyRoles(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  
  return messages.map((message, index) => {
    const role = identifyRole(message, index, messages);
    return {
      ...message,
      role: role
    };
  });
}

/**
 * 计算角色识别置信度
 * 
 * @param {Array<Object>} messages - 消息数组
 * @returns {number} 置信度（0-1）
 */
export function calculateConfidence(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 0;
  }
  
  let confidence = 0;
  let totalScore = 0;
  
  messages.forEach((message, index) => {
    let score = 0.5; // 基础分数
    
    // 如果有关键词匹配，增加分数
    if (message.raw) {
      const keywordRole = identifyByKeywords(message.content, message.raw);
      if (keywordRole) {
        score += 0.3;
      }
    }
    
    // 如果位置推断和内容分析一致，增加分数
    const positionRole = identifyByPosition(index, messages);
    const contentRole = identifyByContent(message.content);
    if (positionRole === contentRole) {
      score += 0.2;
    }
    
    totalScore += score;
  });
  
  confidence = totalScore / messages.length;
  
  // 确保置信度在0-1之间
  return Math.min(1, Math.max(0, confidence));
}

