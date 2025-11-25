/**
 * ============================================
 * 文本工具函数 (textUtils.js)
 * ============================================
 *
 * 【文件职责】
 * 提供文本处理相关的工具函数
 *
 * @author AI Assistant
 * @created 2025-01-22
 */

/**
 * 计算文本的最长行宽度（字符数）
 * 
 * 【功能说明】
 * 计算文本中最长的一行的字符数，用于前端气泡宽度计算
 * 
 * 【策略】
 * 1. 按换行符分割文本
 * 2. 去除Markdown标记（简单处理）
 * 3. 找到最长行的字符数
 * 4. 返回字符数（前端可以根据字体大小转换为像素）
 * 
 * 【注意事项】
 * - 这是一个估算值，主要用于判断是否接近屏幕宽度的80%
 * - 不追求像素级精确，避免过度复杂的计算
 * 
 * @param {string} text - 文本内容
 * @returns {number} 最长行的字符数
 */
function calculateMaxLineWidth(text) {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // 按换行符分割
  const lines = text.split(/\r?\n/);
  
  let maxWidth = 0;
  
  for (const line of lines) {
    // 简单去除Markdown标记（代码块、链接、粗体等）
    // 这里只做基本处理，复杂Markdown可以在前端处理
    const cleanedLine = line
      .replace(/```[\s\S]*?```/g, '') // 代码块
      .replace(/`[^`]+`/g, '') // 行内代码
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 链接 [text](url) -> text
      .replace(/\*\*([^\*]+)\*\*/g, '$1') // 粗体
      .replace(/\*([^\*]+)\*/g, '$1') // 斜体
      .replace(/#+\s+/g, '') // 标题标记
      .replace(/^\s*[-*+]\s+/, '') // 列表标记
      .replace(/^\s*\d+\.\s+/, '') // 有序列表标记
      .trim();
    
    const lineWidth = cleanedLine.length;
    if (lineWidth > maxWidth) {
      maxWidth = lineWidth;
    }
  }
  
  return maxWidth;
}

module.exports = {
  calculateMaxLineWidth,
};

