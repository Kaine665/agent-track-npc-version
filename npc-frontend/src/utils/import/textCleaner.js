/**
 * ============================================
 * 文本清洗工具 (textCleaner.js)
 * ============================================
 *
 * 【功能说明】
 * 清洗从网页复制的文本内容，移除HTML标签、网页元素等无关内容
 *
 * 【主要功能】
 * 1. 移除HTML标签
 * 2. 移除常见的网页元素（导航、按钮、广告等）
 * 3. 标准化空白字符和换行
 * 4. 移除特殊字符和多余空行
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 移除HTML标签
 * 
 * @param {string} text - 原始文本
 * @returns {string} 清洗后的文本
 */
function removeHTMLTags(text) {
  if (!text) return '';
  
  // 使用DOMParser解析HTML（如果可用）
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      return doc.body.textContent || doc.body.innerText || '';
    } catch (e) {
      // 如果解析失败，使用正则表达式
    }
  }
  
  // 降级方案：使用正则表达式移除HTML标签
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除script标签
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除style标签
    .replace(/<[^>]+>/g, '') // 移除所有HTML标签
    .replace(/&nbsp;/g, ' ') // 替换&nbsp;
    .replace(/&lt;/g, '<') // 替换&lt;
    .replace(/&gt;/g, '>') // 替换&gt;
    .replace(/&amp;/g, '&') // 替换&amp;
    .replace(/&quot;/g, '"') // 替换&quot;
    .replace(/&#39;/g, "'") // 替换&#39;
    .replace(/&apos;/g, "'"); // 替换&apos;
}

/**
 * 移除常见的网页元素关键词
 * 
 * @param {string} text - 文本内容
 * @returns {string} 清洗后的文本
 */
function removeWebElements(text) {
  if (!text) return '';
  
  // 常见的网页元素关键词（中英文）
  const webElementPatterns = [
    /^(首页|主页|Home|首页|返回|Back|返回首页|返回主页)/i,
    /^(登录|注册|Login|Register|Sign in|Sign up)/i,
    /^(搜索|Search|查找)/i,
    /^(菜单|Menu|导航|Navigation)/i,
    /^(设置|Settings|配置|Config)/i,
    /^(帮助|Help|关于|About)/i,
    /^(分享|Share|收藏|Favorite|收藏夹)/i,
    /^(复制|Copy|粘贴|Paste)/i,
    /^(下载|Download|上传|Upload)/i,
    /^(关闭|Close|取消|Cancel|确定|OK|确认|Confirm)/i,
    /^(上一页|下一页|Previous|Next|上一页|下一页)/i,
    /^(广告|Advertisement|AD|推广)/i,
    /^(Cookie|隐私政策|Privacy Policy|使用条款|Terms)/i,
  ];
  
  let cleaned = text;
  
  // 按行处理，移除匹配的行
  const lines = cleaned.split('\n');
  cleaned = lines
    .filter(line => {
      const trimmed = line.trim();
      // 如果行太短（少于3个字符），可能是按钮文字，跳过
      if (trimmed.length < 3) return false;
      // 检查是否匹配网页元素模式
      return !webElementPatterns.some(pattern => pattern.test(trimmed));
    })
    .join('\n');
  
  return cleaned;
}

/**
 * 标准化空白字符
 * 
 * @param {string} text - 文本内容
 * @returns {string} 标准化后的文本
 */
function normalizeWhitespace(text) {
  if (!text) return '';
  
  return text
    .replace(/\r\n/g, '\n') // 统一换行符
    .replace(/\r/g, '\n') // 统一换行符
    .replace(/[ \t]+/g, ' ') // 多个空格/制表符合并为一个空格
    .replace(/[ \t]*\n[ \t]*/g, '\n') // 移除行首行尾空白
    .replace(/\n{3,}/g, '\n\n') // 多个空行合并为两个
    .trim(); // 移除首尾空白
}

/**
 * 移除特殊字符和多余空行
 * 
 * @param {string} text - 文本内容
 * @returns {string} 清洗后的文本
 */
function removeSpecialChars(text) {
  if (!text) return '';
  
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // 移除零宽字符
    .replace(/[\u2028\u2029]/g, '\n') // 统一换行符
    .replace(/\u00A0/g, ' ') // 替换不间断空格
    .replace(/\n{4,}/g, '\n\n\n') // 限制最多3个连续空行
    .trim();
}

/**
 * 清洗文本内容
 * 
 * 【功能说明】
 * 综合应用所有清洗步骤，移除HTML、网页元素、标准化格式
 * 
 * 【工作流程】
 * 1. 移除HTML标签
 * 2. 移除网页元素
 * 3. 标准化空白字符
 * 4. 移除特殊字符
 * 
 * @param {string} text - 原始文本
 * @returns {string} 清洗后的文本
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  let cleaned = text;
  
  // 步骤1: 移除HTML标签
  cleaned = removeHTMLTags(cleaned);
  
  // 步骤2: 移除网页元素
  cleaned = removeWebElements(cleaned);
  
  // 步骤3: 标准化空白字符
  cleaned = normalizeWhitespace(cleaned);
  
  // 步骤4: 移除特殊字符
  cleaned = removeSpecialChars(cleaned);
  
  return cleaned;
}

/**
 * 提取纯文本（用于预览）
 * 
 * @param {string} text - 文本内容
 * @returns {string} 纯文本
 */
export function extractPlainText(text) {
  return cleanText(text);
}

