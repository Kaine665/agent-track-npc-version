/**
 * ============================================
 * 剪贴板工具函数 (clipboard.js)
 * ============================================
 *
 * 【功能说明】
 * 提供复制文本到剪贴板的功能
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
export async function copyToClipboard(text) {
  try {
    // 优先使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案：使用 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

/**
 * 格式化对话内容为文本
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @returns {string} 格式化后的文本
 */
export function formatConversation(messages, agent) {
  if (!messages || messages.length === 0) {
    return '';
  }

  const agentName = agent?.name || 'AI助手';
  const lines = [];

  // 添加标题
  lines.push(`=== 与 ${agentName} 的对话 ===`);
  lines.push('');

  // 遍历消息
  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '用户' : agentName;
    const content = msg.content || '';
    
    // 添加时间戳（如果有）
    if (msg.createdAt) {
      const date = new Date(msg.createdAt);
      const timeStr = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      lines.push(`[${timeStr}]`);
    }

    // 添加角色和内容
    lines.push(`${role}:`);
    lines.push(content);
    lines.push(''); // 空行分隔
  });

  return lines.join('\n');
}

