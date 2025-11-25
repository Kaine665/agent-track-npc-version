/**
 * ============================================
 * 版本更新提示组件 (VersionUpdateModal.jsx)
 * ============================================
 *
 * 【文件职责】
 * 显示版本更新提示弹窗
 *
 * 【主要功能】
 * 1. 显示版本更新信息
 * 2. 用户关闭后标记已读
 * 3. 支持点击外部区域关闭
 */

import React from 'react';
import { Modal, Typography, Tag, Button } from 'antd';
import { CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const { Title, Text } = Typography;

/**
 * 版本更新提示弹窗组件
 *
 * @param {Object} props
 * @param {boolean} props.open - 是否显示弹窗
 * @param {Object} props.changelog - 更新日志对象
 * @param {string} props.version - 版本号
 * @param {Function} props.onClose - 关闭回调（会标记已读）
 * @param {Function} props.onMarkRead - 标记已读回调
 */
const VersionUpdateModal = ({ open, changelog, version, onClose, onMarkRead }) => {
  const handleClose = () => {
    // 标记已读
    if (onMarkRead) {
      onMarkRead(version);
    }
    // 关闭弹窗
    if (onClose) {
      onClose();
    }
  };

  // 点击遮罩层也关闭
  const handleMaskClick = () => {
    handleClose();
  };

  if (!changelog) {
    return null;
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      maskClosable={true}
      onOk={handleClose}
      okText="知道了"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={600}
      centered
      closeIcon={<CloseOutlined />}
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div style={{ padding: '8px 0' }}>
        <Title level={3} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
          <span>{changelog.title || `版本 ${version} 更新`}</span>
          <Tag color="blue" style={{ marginLeft: 'auto' }}>v{version}</Tag>
        </Title>

        {changelog.releaseDate && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            发布日期：{changelog.releaseDate}
          </Text>
        )}

        {changelog.content && (
          <div 
            style={{ 
              maxHeight: '60vh', 
              overflowY: 'auto',
              padding: '8px 0',
              marginBottom: 16,
            }}
            className="version-update-content"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code: ({ node, inline, className, children, ...props }) => {
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
                      {...props}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  );
                },
                h1: ({ node, ...props }) => <h1 {...props} style={{ margin: '0.8em 0 0.4em 0', fontWeight: 600, fontSize: '1.5em' }} />,
                h2: ({ node, ...props }) => <h2 {...props} style={{ margin: '0.8em 0 0.4em 0', fontWeight: 600, fontSize: '1.3em' }} />,
                h3: ({ node, ...props }) => <h3 {...props} style={{ margin: '0.8em 0 0.4em 0', fontWeight: 600, fontSize: '1.1em' }} />,
                p: ({ node, ...props }) => <p {...props} style={{ margin: '0.5em 0' }} />,
                ul: ({ node, ...props }) => <ul {...props} style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} />,
                ol: ({ node, ...props }) => <ol {...props} style={{ margin: '0.5em 0', paddingLeft: '1.5em' }} />,
                li: ({ node, ...props }) => <li {...props} style={{ margin: '0.25em 0' }} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote {...props} style={{ 
                    borderLeft: '3px solid #ddd', 
                    paddingLeft: '1em', 
                    margin: '0.5em 0', 
                    color: '#666', 
                    fontStyle: 'italic' 
                  }} />
                ),
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
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff', textDecoration: 'underline' }} />
                ),
                hr: ({ node, ...props }) => (
                  <hr {...props} style={{ 
                    border: 'none', 
                    borderTop: '1px solid #ddd', 
                    margin: '1em 0' 
                  }} />
                ),
              }}
            >
              {changelog.content}
            </ReactMarkdown>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type="primary" size="large" onClick={handleClose}>
            知道了
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VersionUpdateModal;

