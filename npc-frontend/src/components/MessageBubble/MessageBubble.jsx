/**
 * ============================================
 * 消息气泡组件 (MessageBubble.jsx)
 * ============================================
 *
 * 【功能说明】
 * 展示单条聊天消息，支持用户和 AI 两种样式
 * - 用户消息：纯文本显示
 * - AI 消息：Markdown 渲染（支持代码高亮、列表、链接、表格等）
 *
 * 【Props】
 * - message: object (消息对象)
 *   - role: 'user' | 'assistant'
 *   - content: string
 *   - createdAt: number
 * - avatarUrl: string (AI 头像 URL)
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-01-22
 */

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Typography, Button, message, Input } from 'antd';
import { UserOutlined, RobotOutlined, CopyOutlined, CheckOutlined, ReloadOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { copyToClipboard } from '../../utils/clipboard';
import styles from './MessageBubble.module.css';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * 代码块组件（带复制功能）
 */
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString);
      setCopied(true);
      message.success('代码已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      message.error('复制失败');
    }
  };

  if (inline) {
    return (
      <code className={className} {...props} style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '2px 6px', 
        borderRadius: 4,
        fontSize: '0.9em',
        fontFamily: 'Monaco, Consolas, "Courier New", monospace'
      }}>
        {children}
      </code>
    );
  }

  return (
    <div style={{ position: 'relative', margin: '12px 0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        borderBottom: '1px solid #333'
      }}>
        <span style={{ color: '#888', fontSize: 12 }}>{language || 'code'}</span>
        <Button
          type="text"
          size="small"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
          style={{ color: '#888', fontSize: 12 }}
        >
          {copied ? '已复制' : '复制'}
        </Button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0 0 6px 6px',
          fontSize: '0.9em',
          lineHeight: 1.5,
        }}
        {...props}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const MessageBubble = ({ 
  message, 
  avatarUrl, 
  onRegenerate, 
  onEdit, 
  isRegenerating = false,
  isEditing = false,
  autoCollapse = false // 是否自动压缩（用于历史消息）
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!autoCollapse); // 如果autoCollapse为true，默认收起
  const [showToggle, setShowToggle] = useState(false); // 是否显示收起/展开按钮
  const [editingContent, setEditingContent] = useState(message.content);
  const [isEditMode, setIsEditMode] = useState(false);
  const contentRef = useRef(null);

  // 复制单条AI消息
  const handleCopyMessage = async () => {
    if (!message.content) {
      message.warning('没有内容可复制');
      return;
    }

    try {
      const success = await copyToClipboard(message.content);
      if (success) {
        setCopied(true);
        message.success('已复制');
        setTimeout(() => setCopied(false), 2000);
      } else {
        message.error('复制失败');
      }
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败');
    }
  };

  // 检测内容是否超过2行（仅用于AI消息）
  useEffect(() => {
    if (isUser || !contentRef.current) return;

    const checkContentHeight = () => {
      const element = contentRef.current;
      if (!element) return;

      // 临时移除收起样式，测量实际高度
      const wasCollapsed = element.classList.contains(styles.collapsed);
      if (wasCollapsed) {
        element.classList.remove(styles.collapsed);
      }

      // 强制重排以获取准确高度
      void element.offsetHeight;

      // 获取行高（使用计算后的样式）
      const computedStyle = window.getComputedStyle(element);
      const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.6;
      const maxHeight = lineHeight * 2; // 2行高度
      const actualHeight = element.scrollHeight;

      // 恢复收起状态（如果需要）
      if (wasCollapsed && !isExpanded) {
        element.classList.add(styles.collapsed);
      }

      // 如果实际高度超过2行，显示收起/展开按钮
      // 对于自动压缩的消息，即使超过2行也要显示按钮（允许用户展开）
      const exceedsTwoLines = actualHeight > maxHeight;
      setShowToggle(exceedsTwoLines);
    };

    // 延迟检查，确保内容已渲染（Markdown 渲染可能需要时间）
    const timer1 = setTimeout(checkContentHeight, 100);
    const timer2 = setTimeout(checkContentHeight, 500); // 二次检查，确保 Markdown 完全渲染

    // 使用 MutationObserver 监听 DOM 变化（Markdown 渲染）
    const observer = new MutationObserver(() => {
      checkContentHeight();
    });

    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    // 监听窗口大小变化
    window.addEventListener('resize', checkContentHeight);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      observer.disconnect();
      window.removeEventListener('resize', checkContentHeight);
    };
  }, [message.content, isUser, isExpanded, autoCollapse]);

  // 切换展开/收起状态
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 处理重新生成
  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate(message);
    }
  };

  // 处理编辑
  const handleEdit = () => {
    setIsEditMode(true);
    setEditingContent(message.content);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingContent.trim()) {
      message.warning('消息内容不能为空');
      return;
    }
    if (onEdit && editingContent !== message.content) {
      onEdit(message, editingContent.trim());
    }
    setIsEditMode(false);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingContent(message.content);
  };

  // 容器样式
  const containerStyle = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: 16,
    padding: '0 12px',
  };

  // 计算气泡宽度（基于后端返回的maxLineWidth，避免动态计算导致屏幕抖动）
  const calculateBubbleWidth = () => {
    if (isUser) {
      // 用户消息：根据后端返回的maxLineWidth计算宽度
      // 如果没有maxLineWidth或内容很短，不设置maxWidth限制，让气泡自适应内容
      if (!message.maxLineWidth || message.maxLineWidth === 0) {
        return undefined; // 不设置maxWidth，让气泡自适应
      }
      
      // 使用平均字符宽度估算（中英文混合，约12px）
      // 15px字体大小，中文字符约16px，英文字符约8px，混合平均约12px
      const avgCharWidth = 12;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920; // 默认1920px
      const maxScreenWidth = screenWidth * 0.7; // 用户消息最大70%屏幕宽度
      
      // 计算文本宽度（加上padding左右各14px = 28px）
      const textWidth = message.maxLineWidth * avgCharWidth + 28;
      
      // 只有当文本宽度超过一定阈值（比如100px，约8个字符）时才设置maxWidth
      // 对于很短的文本（如2个字），不设置maxWidth，让它自然显示在一行
      if (textWidth < 100) {
        return undefined; // 内容很短，不设置maxWidth限制
      }
      
      // 如果文本宽度接近70%屏幕宽度（阈值75%），就设置为70%
      if (textWidth >= maxScreenWidth * 0.75) {
        return `${maxScreenWidth}px`;
      }
      
      // 否则使用文本宽度，但不超过70%
      return `${Math.min(textWidth, maxScreenWidth)}px`;
    }
    
    // AI消息：如果没有maxLineWidth数据，使用默认80%
    if (!message.maxLineWidth || message.maxLineWidth === 0) {
      return '80%';
    }
    
    // 使用平均字符宽度估算（中英文混合，约12px）
    const avgCharWidth = 12;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920; // 默认1920px
    const targetWidth = screenWidth * 0.8; // 80%屏幕宽度
    
    // 计算文本宽度（加上padding左右各14px = 28px）
    const textWidth = message.maxLineWidth * avgCharWidth + 28;
    
    // 如果文本宽度接近80%屏幕宽度（阈值75%），就设置为80%
    if (textWidth >= targetWidth * 0.75) {
      return `${targetWidth}px`;
    }
    
    // 否则使用文本宽度，但不超过80%
    return `${Math.min(textWidth, targetWidth)}px`;
  };

  // 气泡样式
  const calculatedWidth = calculateBubbleWidth();
  const bubbleStyle = {
    ...(calculatedWidth && { maxWidth: calculatedWidth }), // 只有当计算出宽度时才设置maxWidth
    width: isUser ? 'fit-content' : 'fit-content', // 用户和AI消息都使用fit-content，让内容自然适应
    padding: '10px 14px',
    borderRadius: 12,
    backgroundColor: isUser ? '#1890ff' : '#f0f0f0',
    color: isUser ? '#fff' : '#333',
    borderTopRightRadius: isUser ? 2 : 12,
    borderTopLeftRadius: isUser ? 12 : 2,
    position: 'relative',
    // 用户消息：正常换行，只在必要时换行（当达到maxWidth时）
    // AI消息：允许在单词内断行（处理长URL等）
    wordBreak: isUser ? 'normal' : 'break-word',
    wordWrap: isUser ? 'normal' : 'break-word',
    overflowWrap: isUser ? 'normal' : 'break-word',
    whiteSpace: isUser ? 'normal' : 'normal', // 用户消息正常换行，不强制保留空白
    fontSize: 15,
    lineHeight: 1.6,
  };

  // Markdown 内容容器样式（仅用于 AI 消息）
  const markdownContainerStyle = {
    // 使用 CSS 类名而不是内联样式对象，因为 ReactMarkdown 会生成 DOM 元素
  };

  // 头像样式
  const avatarStyle = {
    backgroundColor: isUser ? '#87d068' : '#fde3cf',
    marginRight: isUser ? 0 : 8,
    marginLeft: isUser ? 8 : 0,
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      {/* AI 头像 (左侧) */}
      {!isUser && (
        <Avatar 
          src={avatarUrl} 
          icon={<RobotOutlined />} 
          style={avatarStyle}
          className={styles.avatar}
        />
      )}

      {/* 消息内容 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={bubbleStyle} className={styles.bubble}>
          {isUser ? (
            // 用户消息：纯文本显示（支持编辑）
            isEditMode ? (
              <div style={{ width: '100%' }}>
                <TextArea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 6 }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    marginBottom: 8
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleCancelEdit}
                    style={{ color: '#fff', fontSize: 12 }}
                  >
                    取消
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={handleSaveEdit}
                    style={{ color: '#fff', fontSize: 12 }}
                    loading={isEditing}
                  >
                    保存
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ whiteSpace: 'normal', wordBreak: 'normal' }}>
                {message.content}
              </div>
            )
          ) : (
            // AI 消息：Markdown 渲染
            <div 
              ref={contentRef}
              style={markdownContainerStyle} 
              className={`markdown-content ${styles.markdownContent} ${!isExpanded ? styles.collapsed : ''}`}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  code: CodeBlock,
                  // 自定义链接样式
                  a: ({ node, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff', textDecoration: 'underline' }} />
                  ),
                  // 自定义段落样式
                  p: ({ node, ...props }) => <p {...props} style={{ margin: '0.5em 0' }} />,
                  // 自定义列表样式
                  ul: ({ node, ...props }) => <ul {...props} style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} />,
                  ol: ({ node, ...props }) => <ol {...props} style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} />,
                  li: ({ node, ...props }) => <li {...props} style={{ margin: '0.25em 0' }} />,
                  // 自定义标题样式
                  h1: ({ node, ...props }) => <h1 {...props} style={{ margin: '0.8em 0 0.4em 0', fontWeight: 600, fontSize: '1.5em' }} />,
                  h2: ({ node, ...props }) => <h2 {...props} style={{ margin: '0.8em 0 0.4em 0', fontWeight: 600, fontSize: '1.3em' }} />,
                  h3: ({ node, ...props }) => <h3 {...props} style={{ margin: '0.8em 0 0.4em 0', fontWeight: 600, fontSize: '1.1em' }} />,
                  // 自定义引用样式
                  blockquote: ({ node, ...props }) => (
                    <blockquote {...props} style={{ 
                      borderLeft: '3px solid #ddd', 
                      paddingLeft: '1em', 
                      margin: '0.5em 0', 
                      color: '#666', 
                      fontStyle: 'italic' 
                    }} />
                  ),
                  // 自定义表格样式
                  table: ({ node, ...props }) => (
                    <table {...props} style={{ 
                      borderCollapse: 'collapse', 
                      width: '100%', 
                      margin: '0.5em 0' 
                    }} />
                  ),
                  th: ({ node, ...props }) => (
                    <th {...props} style={{ 
                      border: '1px solid #ddd', 
                      padding: '6px 12px', 
                      textAlign: 'left',
                      backgroundColor: '#f5f5f5',
                      fontWeight: 600
                    }} />
                  ),
                  td: ({ node, ...props }) => (
                    <td {...props} style={{ 
                      border: '1px solid #ddd', 
                      padding: '6px 12px', 
                      textAlign: 'left' 
                    }} />
                  ),
                  // 自定义分隔线
                  hr: ({ node, ...props }) => (
                    <hr {...props} style={{ 
                      border: 'none', 
                      borderTop: '1px solid #ddd', 
                      margin: '1em 0' 
                    }} />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* AI消息的操作按钮（收起/展开、复制、重新生成） */}
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {/* 收起/展开按钮 */}
            {showToggle && (
              <Button
                type="text"
                size="small"
                onClick={toggleExpand}
                style={{
                  padding: '0 4px',
                  height: 'auto',
                  fontSize: 12,
                  color: '#1890ff'
                }}
                className={styles.toggleButton}
              >
                {isExpanded ? '收起' : '展开'}
              </Button>
            )}
            {/* 重新生成按钮 */}
            {onRegenerate && (
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={handleRegenerate}
                loading={isRegenerating}
                style={{
                  padding: '0 4px',
                  height: 'auto',
                  fontSize: 12,
                  color: '#1890ff'
                }}
                className={styles.actionButton}
              >
                重新生成
              </Button>
            )}
            {/* 复制按钮 */}
            <Button
              type="text"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopyMessage}
              style={{
                padding: '0 4px',
                height: 'auto',
                fontSize: 12,
                color: '#999'
              }}
              className={styles.copyButton}
            >
              {copied ? '已复制' : '复制'}
            </Button>
          </div>
        )}
        
        {/* 用户消息的操作按钮（编辑） */}
        {isUser && !isEditMode && onEdit && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={handleEdit}
              style={{
                padding: '0 4px',
                height: 'auto',
                fontSize: 12,
                color: '#999'
              }}
              className={styles.actionButton}
            >
              编辑
            </Button>
          </div>
        )}
      </div>

      {/* 用户头像 (右侧) */}
      {isUser && (
        <Avatar 
          icon={<UserOutlined />} 
          style={avatarStyle}
          className={styles.avatar}
        />
      )}
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.shape({
    role: PropTypes.oneOf(['user', 'assistant']).isRequired,
    content: PropTypes.string.isRequired,
    createdAt: PropTypes.number,
    id: PropTypes.string,
  }).isRequired,
  avatarUrl: PropTypes.string,
  onRegenerate: PropTypes.func, // 重新生成回调函数
  onEdit: PropTypes.func, // 编辑回调函数
  isRegenerating: PropTypes.bool, // 是否正在重新生成
  isEditing: PropTypes.bool, // 是否正在编辑
  autoCollapse: PropTypes.bool, // 是否自动压缩（用于历史消息）
};

export default MessageBubble;

