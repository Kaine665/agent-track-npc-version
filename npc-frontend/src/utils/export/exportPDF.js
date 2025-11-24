/**
 * ============================================
 * PDF 导出工具 (exportPDF.js)
 * ============================================
 *
 * 【功能说明】
 * 将对话记录导出为 PDF 格式
 *
 * 【依赖】
 * npm install html2pdf.js
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 创建用于 PDF 导出的 HTML 内容
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @returns {string} HTML 字符串
 */
function createPDFHTML(messages, agent) {
  const agentName = agent?.name || 'AI助手';
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: #1890ff;
          border-bottom: 2px solid #1890ff;
          padding-bottom: 10px;
        }
        h2 {
          color: #666;
          margin-top: 20px;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .agent-info {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .agent-info p {
          margin: 5px 0;
        }
        .message {
          margin: 20px 0;
          padding: 15px;
          border-left: 3px solid #1890ff;
          background: #fafafa;
        }
        .message.user {
          border-left-color: #52c41a;
        }
        .message-header {
          font-weight: bold;
          color: #1890ff;
          margin-bottom: 10px;
        }
        .message.user .message-header {
          color: #52c41a;
        }
        .message-time {
          font-size: 12px;
          color: #999;
          font-style: italic;
        }
        .message-content {
          margin-top: 10px;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .divider {
          border-top: 1px solid #e8e8e8;
          margin: 20px 0;
        }
        code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        pre {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 5px;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <h1>与 ${agentName} 的对话</h1>
  `;

  // Agent 信息
  if (agent) {
    html += `
      <div class="agent-info">
        <p><strong>Agent 信息</strong></p>
        <p>名称：${agent.name || '未知'}</p>
        <p>模型：${agent.model || '未知'}</p>
        <p>类型：${agent.type === 'special' ? '特定角色' : '通用助手'}</p>
      </div>
    `;
  }

  // 对话内容
  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '用户' : agentName;
    const time = msg.createdAt 
      ? new Date(msg.createdAt).toLocaleString('zh-CN')
      : '未知时间';
    const content = (msg.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const messageClass = msg.role === 'user' ? 'user' : '';

    html += `
      <div class="message ${messageClass}">
        <div class="message-header">${index + 1}. ${role}</div>
        <div class="message-time">时间：${time}</div>
        <div class="message-content">${content}</div>
      </div>
    `;

    if (index < messages.length - 1) {
      html += '<div class="divider"></div>';
    }
  });

  html += `
    </body>
    </html>
  `;

  return html;
}

/**
 * 导出对话为 PDF 格式
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @param {string} filename - 文件名（可选）
 */
export async function exportToPDF(messages, agent, filename) {
  if (!messages || messages.length === 0) {
    throw new Error('没有可导出的消息');
  }

  // 动态导入 html2pdf.js
  let html2pdf;
  try {
    const html2pdfModule = await import('html2pdf.js');
    // 兼容不同的导出方式
    html2pdf = html2pdfModule.default || html2pdfModule.html2pdf || html2pdfModule;
    
    // 如果仍然不是函数，尝试从 window 对象获取（某些构建配置下）
    if (typeof html2pdf !== 'function') {
      html2pdf = window.html2pdf;
    }
    
    if (typeof html2pdf !== 'function') {
      throw new Error('无法加载 html2pdf.js 库');
    }
  } catch (error) {
    console.error('html2pdf.js 导入失败:', error);
    throw new Error(`PDF导出库加载失败: ${error.message || '请确保已安装 html2pdf.js'}`);
  }

  // 创建临时容器
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '20px';
  container.innerHTML = createPDFHTML(messages, agent);
  document.body.appendChild(container);

  try {
    // 等待DOM渲染和样式应用
    await new Promise(resolve => {
      // 使用 requestAnimationFrame 确保渲染完成
      requestAnimationFrame(() => {
        setTimeout(resolve, 200);
      });
    });

    // 确保文件名有 .pdf 扩展名
    const finalFilename = filename 
      ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
      : `对话记录_${agent?.name || 'AI助手'}_${Date.now()}.pdf`;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: finalFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff',
        allowTaint: true,
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };

    // 使用 html2pdf 生成 PDF
    return new Promise((resolve, reject) => {
      try {
        const worker = html2pdf()
          .set(opt)
          .from(container)
          .save()
          .then(() => {
            resolve();
          })
          .catch((err) => {
            console.error('PDF生成失败:', err);
            reject(new Error(`PDF生成失败: ${err.message || '未知错误'}`));
          });
      } catch (err) {
        console.error('PDF导出异常:', err);
        reject(new Error(`PDF导出失败: ${err.message || '未知错误'}`));
      }
    });
  } catch (error) {
    console.error('PDF导出错误:', error);
    throw new Error(`PDF导出失败: ${error.message || '未知错误'}`);
  } finally {
    // 清理临时容器
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

