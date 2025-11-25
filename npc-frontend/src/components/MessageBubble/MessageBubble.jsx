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
import { Avatar, Typography, Button, message } from 'antd';
import { UserOutlined, RobotOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { copyToClipboard } from '../../utils/clipboard';
import styles from './MessageBubble.module.css';

const { Text } = Typography;

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

const MessageBubble = ({ message, avatarUrl }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // 默认展开
  const [showToggle, setShowToggle] = useState(false); // 是否显示收起/展开按钮
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
      setShowToggle(actualHeight > maxHeight);
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
  }, [message.content, isUser, isExpanded]);

  // 切换展开/收起状态
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // 容器样式
  const containerStyle = {
    display: 'flex',
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    marginBottom: 16,
    padding: '0 12px',
  };

  // 气泡样式
  const bubbleStyle = {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: 12,
    backgroundColor: isUser ? '#1890ff' : '#f0f0f0',
    color: isUser ? '#fff' : '#333',
    borderTopRightRadius: isUser ? 2 : 12,
    borderTopLeftRadius: isUser ? 12 : 2,
    position: 'relative',
    wordBreak: 'break-word',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
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
            // 用户消息：纯文本显示
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </div>
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
        
        {/* AI消息的操作按钮（收起/展开和复制） */}
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
  }).isRequired,
  avatarUrl: PropTypes.string,
};

export default MessageBubble;

