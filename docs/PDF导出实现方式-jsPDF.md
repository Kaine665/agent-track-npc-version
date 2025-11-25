# PDF导出实现方式 - jsPDF

**实现方式**：jsPDF（文本流式）  
**当前状态**：❌ 未实现  
**推荐度**：⭐⭐⭐（适合简单文本）

## 方案概述

使用 `jsPDF` 库直接生成 PDF。通过文本流式添加内容，适合纯文本和简单布局。

## 优点

- ✅ **体积小**：库文件约 100KB
- ✅ **性能好**：生成速度快
- ✅ **API 简单**：使用简单直接

## 缺点

- ❌ **样式支持有限**：不支持复杂 HTML 样式
- ❌ **中文需配置**：需要加载中文字体文件
- ❌ **布局限制**：不适合复杂布局

## 实现代码示例

```javascript
import jsPDF from 'jspdf';

export function exportToPDF_jsPDF(messages, agent, filename) {
  const doc = new jsPDF();
  let y = 20;
  
  // 标题
  doc.setFontSize(16);
  doc.text(`与 ${agent.name} 的对话`, 20, y);
  y += 10;
  
  // 对话内容
  doc.setFontSize(12);
  messages.forEach(msg => {
    const role = msg.role === 'user' ? '用户' : agent.name;
    const time = new Date(msg.createdAt).toLocaleString('zh-CN');
    
    // 检查是否需要新页面
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    
    // 时间戳和角色
    doc.setFont(undefined, 'bold');
    doc.text(`[${time}] ${role}:`, 20, y);
    y += 7;
    
    // 消息内容（处理换行）
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(msg.content, 170);
    doc.text(lines, 20, y);
    y += lines.length * 7 + 5;
  });
  
  // 保存文件
  doc.save(filename || `对话记录_${agent.name}_${Date.now()}.pdf`);
}
```

## 中文支持配置

如果需要支持中文，需要加载中文字体：

```javascript
// 需要先加载中文字体文件
doc.addFileToVFS('SimHei-normal.ttf', fontBase64);
doc.addFont('SimHei-normal.ttf', 'SimHei', 'normal');
doc.setFont('SimHei');
```

## 依赖

```json
{
  "jspdf": "^2.5.1"
}
```

## 适用场景

- 纯文本导出
- 简单布局
- 对文件体积敏感
- 不需要复杂样式

## 实现建议

如果需要实现此方案，可以：
1. 创建新文件：`npc-frontend/src/utils/export/exportPDF_jsPDF.js`
2. 安装依赖：`npm install jspdf`
3. 在 `index.js` 中导出：`export { exportToPDF_jsPDF } from './exportPDF_jsPDF';`

