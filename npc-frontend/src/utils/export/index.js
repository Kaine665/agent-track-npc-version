/**
 * ============================================
 * 导出工具统一入口 (index.js)
 * ============================================
 *
 * 【功能说明】
 * 统一导出所有格式的导出函数
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

// 导入所有导出函数
import { exportToTXT } from './exportTXT';
import { exportToMarkdown } from './exportMarkdown';
import { exportToWord } from './exportWord';
import { exportToPDF } from './exportPDF';
import { exportToImage } from './exportImage';

// 重新导出，供外部使用
export { exportToTXT } from './exportTXT';
export { exportToMarkdown } from './exportMarkdown';
export { exportToWord } from './exportWord';
export { exportToPDF } from './exportPDF';
export { exportToImage } from './exportImage';

/**
 * 导出对话为指定格式
 * @param {string} format - 导出格式：'txt' | 'markdown' | 'word' | 'pdf' | 'image'
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @param {string} filename - 文件名（可选）
 * @param {Function} onProgress - 进度回调（仅图片导出支持，可选）
 * @returns {Promise<void>}
 */
export async function exportConversation(format, messages, agent, filename, onProgress) {
  switch (format) {
    case 'txt':
      exportToTXT(messages, agent, filename);
      break;
    case 'markdown':
      exportToMarkdown(messages, agent, filename);
      break;
    case 'word':
      await exportToWord(messages, agent, filename);
      break;
    case 'pdf':
      await exportToPDF(messages, agent, filename);
      break;
    case 'image':
      await exportToImage(messages, agent, filename, onProgress);
      break;
    default:
      throw new Error(`不支持的导出格式: ${format}`);
  }
}

