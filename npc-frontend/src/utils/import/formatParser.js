/**
 * ============================================
 * 格式解析器 (formatParser.js)
 * ============================================
 *
 * 【功能说明】
 * 解析不同格式的对话文本，识别消息边界和格式
 *
 * 【支持的格式】
 * 1. ChatGPT: "You:" / "ChatGPT:"
 * 2. Claude: "Human:" / "Assistant:"
 * 3. 中文格式: "用户:" / "AI:" / "助手:"
 * 4. 时间戳格式: "[2025-01-22 14:30] 用户: ..."
 * 
 * 【不支持的格式】
 * - 左右位置格式：通过缩进或对齐方式区分（解析效果差，已移除）
 *   详见：实现问题记录.md - PROB-022
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 解析ChatGPT格式
 * 格式示例:
 * You: Hello
 * ChatGPT: Hi there!
 * 
 * @param {string} text - 文本内容
 * @returns {Array<{role: string, content: string, raw: string}>} 解析结果
 */
function parseChatGPTFormat(text) {
  const messages = [];
  // 匹配 "You:" 或 "ChatGPT:" 开头的行
  const pattern = /^(You|ChatGPT|User|Assistant):\s*(.*)$/gmi;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const role = match[1].toLowerCase();
    const content = match[2].trim();
    
    if (content) {
      messages.push({
        role: role === 'you' || role === 'user' ? 'user' : 'assistant',
        content: content,
        raw: match[0],
        format: 'chatgpt'
      });
    }
  }
  
  return messages;
}

/**
 * 解析Claude格式
 * 格式示例:
 * Human: Hello
 * Assistant: Hi there!
 * 
 * @param {string} text - 文本内容
 * @returns {Array<{role: string, content: string, raw: string}>} 解析结果
 */
function parseClaudeFormat(text) {
  const messages = [];
  // 匹配 "Human:" 或 "Assistant:" 开头的行
  const pattern = /^(Human|Assistant):\s*(.*)$/gmi;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const role = match[1].toLowerCase();
    const content = match[2].trim();
    
    if (content) {
      messages.push({
        role: role === 'human' ? 'user' : 'assistant',
        content: content,
        raw: match[0],
        format: 'claude'
      });
    }
  }
  
  return messages;
}

/**
 * 解析中文格式
 * 格式示例:
 * 用户: 你好
 * AI: 你好！
 * 助手: 有什么可以帮助你的吗？
 * 
 * @param {string} text - 文本内容
 * @returns {Array<{role: string, content: string, raw: string}>} 解析结果
 */
function parseChineseFormat(text) {
  const messages = [];
  // 匹配中文角色标识
  const pattern = /^(用户|我|提问者|提问|问题|User|我):\s*(.*)$|^(AI|助手|机器人|Bot|Assistant|ChatGPT|Claude|GPT|回答|回答者):\s*(.*)$/gmi;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const rolePart = match[1] || match[3]; // 第一个或第三个捕获组
    const content = (match[2] || match[4] || '').trim();
    
    if (content) {
      // 判断角色
      const roleKeywords = {
        user: ['用户', '我', '提问者', '提问', '问题', 'user'],
        assistant: ['ai', '助手', '机器人', 'bot', 'assistant', 'chatgpt', 'claude', 'gpt', '回答', '回答者']
      };
      
      const roleLower = rolePart.toLowerCase();
      let role = 'user';
      
      if (roleKeywords.assistant.some(keyword => roleLower.includes(keyword))) {
        role = 'assistant';
      }
      
      messages.push({
        role: role,
        content: content,
        raw: match[0],
        format: 'chinese'
      });
    }
  }
  
  return messages;
}

/**
 * 解析时间戳格式
 * 格式示例:
 * [2025-01-22 14:30:25] 用户: 你好
 * [2025-01-22 14:30:30] AI: 你好！
 * 
 * @param {string} text - 文本内容
 * @returns {Array<{role: string, content: string, timestamp: number, raw: string}>} 解析结果
 */
function parseTimestampFormat(text) {
  const messages = [];
  // 匹配时间戳格式: [日期 时间] 角色: 内容
  const pattern = /\[(\d{4}[-/]\d{1,2}[-/]\d{1,2}[ \t]+\d{1,2}:\d{2}(?::\d{2})?)\]\s*(用户|我|AI|助手|机器人|You|ChatGPT|Human|Assistant|User|Bot):\s*(.*)$/gmi;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const timestampStr = match[1];
    const rolePart = match[2];
    const content = match[3].trim();
    
    if (content) {
      // 解析时间戳
      let timestamp = null;
      try {
        const date = new Date(timestampStr.replace(/\//g, '-'));
        if (!isNaN(date.getTime())) {
          timestamp = date.getTime();
        }
      } catch (e) {
        // 时间戳解析失败，忽略
      }
      
      // 判断角色
      const roleLower = rolePart.toLowerCase();
      let role = 'user';
      if (['ai', '助手', '机器人', 'chatgpt', 'assistant', 'bot', 'claude', 'gpt'].some(keyword => roleLower.includes(keyword))) {
        role = 'assistant';
      }
      
      messages.push({
        role: role,
        content: content,
        timestamp: timestamp,
        raw: match[0],
        format: 'timestamp'
      });
    }
  }
  
  return messages;
}

/**
 * 解析简单分隔格式（按空行分隔）
 * 当其他格式都失败时，尝试按空行分隔消息
 * 
 * @param {string} text - 文本内容
 * @returns {Array<{role: string, content: string}>} 解析结果
 */
function parseSimpleFormat(text) {
  const messages = [];
  // 按双换行符分隔
  const blocks = text.split(/\n\n+/);
  
  blocks.forEach((block, index) => {
    const trimmed = block.trim();
    if (trimmed.length > 0) {
      // 简单规则：奇数索引为用户，偶数索引为AI（从0开始，所以0是用户）
      messages.push({
        role: index % 2 === 0 ? 'user' : 'assistant',
        content: trimmed,
        raw: trimmed,
        format: 'simple'
      });
    }
  });
  
  return messages;
}

/**
 * 解析对话文本
 * 
 * 【功能说明】
 * 尝试多种格式解析，返回最佳匹配结果
 * 
 * 【工作流程】
 * 1. 尝试时间戳格式
 * 2. 尝试ChatGPT格式
 * 3. 尝试Claude格式
 * 4. 尝试中文格式
 * 5. 降级到简单格式
 * 
 * @param {string} text - 清洗后的文本
 * @returns {Array<{role: string, content: string, timestamp?: number, format: string}>} 解析结果
 */
export function parseFormat(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // 按优先级尝试不同格式
  const parsers = [
    { name: 'timestamp', fn: parseTimestampFormat },
    { name: 'chatgpt', fn: parseChatGPTFormat },
    { name: 'claude', fn: parseClaudeFormat },
    { name: 'chinese', fn: parseChineseFormat },
  ];
  
  for (const parser of parsers) {
    const messages = parser.fn(text);
    if (messages.length > 0) {
      // 如果解析到至少2条消息，认为解析成功
      if (messages.length >= 2) {
        return messages;
      }
      // 如果只有1条消息，但内容较长，也可能是有效的
      if (messages.length === 1 && messages[0].content.length > 20) {
        return messages;
      }
    }
  }
  
  // 所有格式都失败，使用简单格式
  return parseSimpleFormat(text);
}

/**
 * 检测文本格式类型
 * 
 * @param {string} text - 文本内容
 * @returns {string} 格式类型
 */
export function detectFormat(text) {
  if (!text) return 'unknown';
  
  const parsers = [
    { name: 'timestamp', fn: parseTimestampFormat },
    { name: 'chatgpt', fn: parseChatGPTFormat },
    { name: 'claude', fn: parseClaudeFormat },
    { name: 'chinese', fn: parseChineseFormat },
  ];
  
  for (const parser of parsers) {
    const messages = parser.fn(text);
    if (messages.length >= 2) {
      return parser.name;
    }
  }
  
  return 'simple';
}

