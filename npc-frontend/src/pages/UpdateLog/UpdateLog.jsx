/**
 * ============================================
 * 更新日志页面 (UpdateLog.jsx)
 * ============================================
 *
 * 【功能说明】
 * 展示项目更新日志，从 public/updateRecord.md 读取并渲染
 *
 * 【工作流程】
 * 1. 页面加载时读取 public/updateRecord.md 文件
 * 2. 使用 react-markdown 渲染 markdown 内容
 * 3. 显示更新日志内容
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Typography, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import styles from './UpdateLog.module.css';

const { Header, Content } = Layout;
const { Title } = Typography;

/**
 * 代码块组件（带复制功能）
 */
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

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
    <SyntaxHighlighter
      style={vscDarkPlus}
      language={language}
      PreTag="div"
      customStyle={{
        margin: '12px 0',
        borderRadius: 6,
        padding: '16px',
        fontSize: '14px'
      }}
    >
      {codeString}
    </SyntaxHighlighter>
  );
};

const UpdateLog = () => {
  const navigate = useNavigate();
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 读取 markdown 文件
  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 从 public 目录读取文件
        const response = await fetch('/updateRecord.md');
        
        if (!response.ok) {
          throw new Error('无法加载更新日志文件');
        }
        
        const text = await response.text();
        setMarkdownContent(text);
      } catch (err) {
        console.error('读取更新日志失败:', err);
        setError(err.message);
        message.error(`加载更新日志失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, []);

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        background: '#fff', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        zIndex: 1,
        height: 64
      }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginRight: 16 }}
          >
            返回
          </Button>
          <FileTextOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 8 }} />
          <Title level={3} style={{ margin: 0, fontSize: 18 }}>
            更新日志
          </Title>
        </div>
      </Header>

      {/* 内容区域 */}
      <Content style={{ padding: '24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="加载更新日志中..." />
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#ff4d4f', fontSize: 16 }}>{error}</p>
            <Button type="primary" onClick={() => window.location.reload()}>
              重试
            </Button>
          </div>
        ) : (
          <div className={styles.markdownContainer}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code: CodeBlock,
                h1: ({ node, ...props }) => <h1 className={styles.markdownH1} {...props} />,
                h2: ({ node, ...props }) => <h2 className={styles.markdownH2} {...props} />,
                h3: ({ node, ...props }) => <h3 className={styles.markdownH3} {...props} />,
                p: ({ node, ...props }) => <p className={styles.markdownP} {...props} />,
                ul: ({ node, ...props }) => <ul className={styles.markdownUl} {...props} />,
                ol: ({ node, ...props }) => <ol className={styles.markdownOl} {...props} />,
                li: ({ node, ...props }) => <li className={styles.markdownLi} {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className={styles.markdownBlockquote} {...props} />,
                hr: ({ node, ...props }) => <hr className={styles.markdownHr} {...props} />,
                table: ({ node, ...props }) => <table className={styles.markdownTable} {...props} />,
                a: ({ node, ...props }) => <a className={styles.markdownLink} {...props} />,
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default UpdateLog;

