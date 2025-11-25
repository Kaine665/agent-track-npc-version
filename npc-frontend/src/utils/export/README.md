# 导出功能模块

本模块提供对话记录的多种格式导出功能。

## 安装依赖

在使用导出功能前，需要安装以下依赖：

```bash
npm install docx file-saver html2canvas html2pdf.js
```

## 支持格式

- **TXT**：纯文本格式，零依赖
- **Markdown**：Markdown 格式，零依赖
- **Word**：DOCX 格式，需要 `docx` 和 `file-saver`
- **PDF**：PDF 格式，需要 `html2pdf.js`
- **Image**：PNG 长图片，需要 `html2canvas`

## 使用方法

### 基本用法

```javascript
import { exportConversation } from '../../utils/export';

// 导出为文本
await exportConversation('txt', messages, agent, '文件名.txt');

// 导出为 Markdown
await exportConversation('markdown', messages, agent, '文件名.md');

// 导出为 Word
await exportConversation('word', messages, agent, '文件名.docx');

// 导出为 PDF
await exportConversation('pdf', messages, agent, '文件名.pdf');

// 导出为图片（支持进度回调）
await exportConversation('image', messages, agent, '文件名.png', (progress, text) => {
  console.log(`进度: ${progress * 100}%`, text);
});
```

### 单独使用

```javascript
import { 
  exportToTXT, 
  exportToMarkdown, 
  exportToWord, 
  exportToPDF, 
  exportToImage 
} from '../../utils/export';

// 文本导出
exportToTXT(messages, agent, '文件名.txt');

// Markdown 导出
exportToMarkdown(messages, agent, '文件名.md');

// Word 导出（异步）
await exportToWord(messages, agent, '文件名.docx');

// PDF 导出（异步）
await exportToPDF(messages, agent, '文件名.pdf');

// 图片导出（异步，支持进度回调）
await exportToImage(messages, agent, '文件名.png', (progress, text) => {
  console.log(`进度: ${progress * 100}%`, text);
});
```

## 参数说明

### messages
消息数组，格式：
```javascript
[
  {
    role: 'user' | 'assistant',
    content: '消息内容',
    createdAt: 1234567890 // 时间戳
  }
]
```

### agent
Agent 信息对象，格式：
```javascript
{
  name: 'Agent 名称',
  model: '模型名称',
  type: 'general' | 'special'
}
```

### filename（可选）
文件名，如果不提供会自动生成：`对话记录_${agentName}_${timestamp}.${扩展名}`

### onProgress（仅图片导出）
进度回调函数，参数：
- `progress`: 0-1 之间的进度值
- `text`: 进度描述文本

## 注意事项

1. **Word 和 PDF 导出**：需要动态导入库，首次使用可能稍慢
2. **图片导出**：对于超长对话，生成时间可能较长，建议显示进度提示
3. **文件大小**：图片格式文件可能较大（几 MB 到几十 MB），注意内存使用
4. **浏览器兼容性**：所有功能需要现代浏览器支持（Chrome、Firefox、Safari、Edge）

## 错误处理

所有导出函数都会抛出错误，建议使用 try-catch 处理：

```javascript
try {
  await exportConversation('pdf', messages, agent);
  message.success('导出成功');
} catch (error) {
  console.error('导出失败:', error);
  message.error(`导出失败: ${error.message}`);
}
```

