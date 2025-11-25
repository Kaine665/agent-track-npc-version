# PDF导出实现方式 - html2pdf.js

**实现方式**：html2pdf.js（HTML转PDF）  
**当前状态**：✅ 已实现  
**文件位置**：`npc-frontend/src/utils/export/exportPDF.js`

## 方案概述

使用 `html2pdf.js` 库将 HTML 内容转换为 PDF。该库基于 `html2canvas` 和 `jsPDF`，可以保留 HTML 样式和布局。

## 优点

- ✅ **样式保留**：可以保留完整的 HTML 样式和布局
- ✅ **中文支持好**：对中文支持良好，无需额外配置
- ✅ **使用简单**：API 简洁，易于使用
- ✅ **布局灵活**：支持复杂的 HTML 布局

## 缺点

- ❌ **体积较大**：库文件约 500KB
- ❌ **性能一般**：长文档生成可能较慢
- ❌ **依赖多**：依赖 html2canvas 和 jsPDF

## 实现代码

```javascript
// 当前实现：npc-frontend/src/utils/export/exportPDF.js
export async function exportToPDF(messages, agent, filename) {
  const html2pdf = (await import('html2pdf.js')).default;
  
  // 创建 HTML 内容
  const container = document.createElement('div');
  container.innerHTML = createPDFHTML(messages, agent);
  
  // 配置选项
  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename || `对话记录_${agent?.name}_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      logging: false,
    },
    jsPDF: { 
      unit: 'mm', 
      format: 'a4', 
      orientation: 'portrait',
    },
  };
  
  await html2pdf().set(opt).from(container).save();
}
```

## 依赖

```json
{
  "html2pdf.js": "^0.10.1"
}
```

## 适用场景

- 需要保留复杂样式和布局
- 需要中文支持
- 对文件体积不敏感

