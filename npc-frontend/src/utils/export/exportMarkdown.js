/**
 * ============================================
 * Markdown（MD）导出工具 (exportMarkdown.js)
 * ============================================
 *
 * 【功能说明】
 * 将对话记录导出为 Markdown 格式
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 转义 Markdown 特殊字符（仅在非代码块中）
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeMarkdown(text) {
  // 简单的转义处理，实际使用时可能需要更复杂的逻辑
  // 注意：这里不处理代码块内的内容
  return text
    .replace(/\*\*/g, '\\*\\*')  // 转义粗体
    .replace(/\*/g, '\\*')        // 转义斜体
    .replace(/#/g, '\\#')         // 转义标题
    .replace(/\[/g, '\\[')        // 转义链接开始
    .replace(/\]/g, '\\]')        // 转义链接结束
    .replace(/\(/g, '\\(')        // 转义链接括号
    .replace(/\)/g, '\\)');       // 转义链接括号
}

/**
 * 导出对话为 Markdown 格式
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @param {string} filename - 文件名（可选）
 */
export function exportToMarkdown(messages, agent, filename) {
  if (!messages || messages.length === 0) {
    throw new Error('没有可导出的消息');
  }

  const agentName = agent?.name || 'AI助手';
  const lines = [];

  // 标题
  lines.push(`# 与 ${agentName} 的对话`);
  lines.push('');

  // Agent 信息
  if (agent) {
    lines.push(`**Agent 信息**`);
    lines.push('');
    lines.push(`- **名称**：${agent.name || '未知'}`);
    lines.push(`- **模型**：${agent.model || '未知'}`);
    lines.push(`- **类型**：${agent.type === 'special' ? '特定角色' : '通用助手'}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // 对话内容
  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '**用户**' : `**${agentName}**`;
    const time = msg.createdAt 
      ? new Date(msg.createdAt).toLocaleString('zh-CN')
      : '未知时间';

    // 消息标题
    lines.push(`## ${index + 1}. ${role}`);
    lines.push('');
    lines.push(`*时间：${time}*`);
    lines.push('');

    // 消息内容
    // 注意：如果消息内容本身已经是 Markdown 格式（如代码块），
    // 这里直接使用，不做转义
    const content = msg.content || '';
    lines.push(content);
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  const markdownContent = lines.join('\n');

  // 创建 Blob 对象
  const blob = new Blob([markdownContent], { 
    type: 'text/markdown;charset=utf-8' 
  });

  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // 确保文件名有 .md 扩展名
  const finalFilename = filename 
    ? (filename.endsWith('.md') ? filename : `${filename}.md`)
    : `对话记录_${agentName}_${Date.now()}.md`;
  a.download = finalFilename;
  
  // 触发下载
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // 清理 URL
  URL.revokeObjectURL(url);
}

