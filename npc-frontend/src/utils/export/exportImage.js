/**
 * ============================================
 * 长图片导出工具 (exportImage.js)
 * ============================================
 *
 * 【功能说明】
 * 将对话记录导出为长图片格式（PNG）
 *
 * 【依赖】
 * npm install html2canvas
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 创建用于图片导出的 HTML 内容
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @returns {HTMLElement} DOM 元素
 */
function createImageHTML(messages, agent) {
  const agentName = agent?.name || 'AI助手';
  
  const container = document.createElement('div');
  container.style.cssText = `
    width: 800px;
    padding: 30px;
    background: #ffffff;
    font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `;

  // 标题
  const title = document.createElement('h1');
  title.textContent = `与 ${agentName} 的对话`;
  title.style.cssText = `
    color: #1890ff;
    border-bottom: 2px solid #1890ff;
    padding-bottom: 10px;
    margin-bottom: 20px;
    font-size: 24px;
  `;
  container.appendChild(title);

  // Agent 信息
  if (agent) {
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    `;
    infoDiv.innerHTML = `
      <p style="margin: 5px 0;"><strong>Agent 信息</strong></p>
      <p style="margin: 5px 0;">名称：${agent.name || '未知'}</p>
      <p style="margin: 5px 0;">模型：${agent.model || '未知'}</p>
      <p style="margin: 5px 0;">类型：${agent.type === 'special' ? '特定角色' : '通用助手'}</p>
    `;
    container.appendChild(infoDiv);
  }

  // 对话内容
  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '用户' : agentName;
    const time = msg.createdAt 
      ? new Date(msg.createdAt).toLocaleString('zh-CN')
      : '未知时间';
    const content = msg.content || '';

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin: 20px 0;
      padding: 15px;
      border-left: 3px solid ${msg.role === 'user' ? '#52c41a' : '#1890ff'};
      background: #fafafa;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      font-weight: bold;
      color: ${msg.role === 'user' ? '#52c41a' : '#1890ff'};
      margin-bottom: 10px;
      font-size: 16px;
    `;
    header.textContent = `${index + 1}. ${role}`;
    messageDiv.appendChild(header);

    const timeDiv = document.createElement('div');
    timeDiv.style.cssText = `
      font-size: 12px;
      color: #999;
      font-style: italic;
      margin-bottom: 10px;
    `;
    timeDiv.textContent = `时间：${time}`;
    messageDiv.appendChild(timeDiv);

    const contentDiv = document.createElement('div');
    contentDiv.style.cssText = `
      margin-top: 10px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 14px;
    `;
    contentDiv.textContent = content;
    messageDiv.appendChild(contentDiv);

    container.appendChild(messageDiv);

    // 分隔线（最后一个消息后不加）
    if (index < messages.length - 1) {
      const divider = document.createElement('div');
      divider.style.cssText = `
        border-top: 1px solid #e8e8e8;
        margin: 20px 0;
      `;
      container.appendChild(divider);
    }
  });

  return container;
}

/**
 * 导出对话为长图片格式
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @param {string} filename - 文件名（可选）
 * @param {Function} onProgress - 进度回调（可选）
 */
export async function exportToImage(messages, agent, filename, onProgress) {
  // 动态导入
  const html2canvas = (await import('html2canvas')).default;

  if (!messages || messages.length === 0) {
    throw new Error('没有可导出的消息');
  }

  // 创建临时容器
  const container = createImageHTML(messages, agent);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  document.body.appendChild(container);

  try {
    if (onProgress) {
      onProgress(0.3, '正在渲染图片...');
    }

    // 配置选项
    const options = {
      scale: 2,                    // 缩放比例（提高清晰度）
      useCORS: true,              // 允许跨域图片
      logging: false,             // 关闭日志
      backgroundColor: '#ffffff',  // 背景色
      width: container.scrollWidth,
      height: container.scrollHeight,
      windowWidth: container.scrollWidth,
      windowHeight: container.scrollHeight,
      onclone: (clonedDoc) => {
        // 确保克隆的文档中样式正确应用
        const clonedContainer = clonedDoc.querySelector('div');
        if (clonedContainer) {
          clonedContainer.style.position = 'static';
        }
      },
    };

    if (onProgress) {
      onProgress(0.6, '正在生成图片...');
    }

    // 生成 Canvas
    const canvas = await html2canvas(container, options);

    if (onProgress) {
      onProgress(0.9, '正在保存文件...');
    }

    // 转换为 Blob
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('图片生成失败'));
          return;
        }

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // 确保文件名有 .png 扩展名
        const finalFilename = filename 
          ? (filename.endsWith('.png') ? filename : `${filename}.png`)
          : `对话记录_${agent?.name || 'AI助手'}_${Date.now()}.png`;
        a.download = finalFilename;
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 清理 URL
        URL.revokeObjectURL(url);

        if (onProgress) {
          onProgress(1.0, '导出完成');
        }

        resolve();
      }, 'image/png', 0.95);
    });
  } finally {
    // 清理临时容器
    document.body.removeChild(container);
  }
}

