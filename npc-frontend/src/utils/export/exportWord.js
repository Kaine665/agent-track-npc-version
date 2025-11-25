/**
 * ============================================
 * Word（DOCX）导出工具 (exportWord.js)
 * ============================================
 *
 * 【功能说明】
 * 将对话记录导出为 Word 文档格式（DOCX）
 *
 * 【依赖】
 * npm install docx file-saver
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 导出对话为 Word 格式
 * @param {Array} messages - 消息数组
 * @param {Object} agent - Agent 信息
 * @param {string} filename - 文件名（可选）
 */
export async function exportToWord(messages, agent, filename) {
  // 动态导入，避免打包时包含未使用的库
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
  const { saveAs } = await import('file-saver');

  if (!messages || messages.length === 0) {
    throw new Error('没有可导出的消息');
  }

  const agentName = agent?.name || 'AI助手';
  const children = [];

  // 标题
  children.push(
    new Paragraph({
      text: `与 ${agentName} 的对话`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    })
  );

  // Agent 信息
  if (agent) {
    children.push(
      new Paragraph({
        text: 'Agent 信息',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '名称：', bold: true }),
          new TextRun({ text: agent.name || '未知' }),
        ],
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '模型：', bold: true }),
          new TextRun({ text: agent.model || '未知' }),
        ],
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '类型：', bold: true }),
          new TextRun({ text: agent.type === 'special' ? '特定角色' : '通用助手' }),
        ],
      })
    );
    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 200 },
      })
    );
  }

  // 对话内容
  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '用户' : agentName;
    const time = msg.createdAt 
      ? new Date(msg.createdAt).toLocaleString('zh-CN')
      : '未知时间';

    // 消息标题
    children.push(
      new Paragraph({
        text: `${index + 1}. ${role}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    // 时间戳
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `时间：${time}`,
            italics: true,
            color: '666666',
            size: 20, // 10pt
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // 消息内容
    const content = msg.content || '';
    // 处理换行：将 \n 分割成多个段落
    const contentLines = content.split('\n');
    contentLines.forEach((line, lineIndex) => {
      children.push(
        new Paragraph({
          text: line || ' ', // 空行用空格代替
          spacing: { 
            after: lineIndex === contentLines.length - 1 ? 200 : 100 
          },
        })
      );
    });

    // 分隔线（最后一个消息后不加）
    if (index < messages.length - 1) {
      children.push(
        new Paragraph({
          text: '─────────────────────────────────',
          spacing: { before: 100, after: 100 },
        })
      );
    }
  });

  // 创建文档
  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  // 生成 Blob
  const blob = await Packer.toBlob(doc);

  // 确保文件名有 .docx 扩展名
  const finalFilename = filename 
    ? (filename.endsWith('.docx') ? filename : `${filename}.docx`)
    : `对话记录_${agentName}_${Date.now()}.docx`;
  
  // 下载文件
  saveAs(blob, finalFilename);
}

