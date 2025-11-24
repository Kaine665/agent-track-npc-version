/**
 * ============================================
 * 文本（TXT）导出工具 (exportTXT.js)
 * ============================================
 *
 * 【功能说明】
 * 将对话记录导出为纯文本格式（TXT）
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 导出对话为文本格式
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @param {string} filename - 文件名（可选）
 */
export function exportToTXT(messages, agent, filename) {
  if (!messages || messages.length === 0) {
    throw new Error('没有可导出的消息');
  }

  const agentName = agent?.name || 'AI助手';
  const lines = [];

  // 添加标题
  lines.push(`=== 与 ${agentName} 的对话 ===`);
  lines.push('');
  
  // 添加 Agent 信息
  if (agent) {
    lines.push(`Agent 信息：`);
    lines.push(`  名称：${agent.name || '未知'}`);
    lines.push(`  模型：${agent.model || '未知'}`);
    lines.push(`  类型：${agent.type === 'special' ? '特定角色' : '通用助手'}`);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

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

  const textContent = lines.join('\n');

  // 创建 Blob 对象
  const blob = new Blob([textContent], { 
    type: 'text/plain;charset=utf-8' 
  });

  // 创建下载链接
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // 确保文件名有 .txt 扩展名
  const finalFilename = filename 
    ? (filename.endsWith('.txt') ? filename : `${filename}.txt`)
    : `对话记录_${agentName}_${Date.now()}.txt`;
  a.download = finalFilename;
  
  // 触发下载
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  // 清理 URL
  URL.revokeObjectURL(url);
}

