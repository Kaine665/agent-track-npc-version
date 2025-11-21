/**
 * ============================================
 * 消息气泡组件 (MessageBubble.jsx)
 * ============================================
 *
 * 【功能说明】
 * 展示单条聊天消息，支持用户和 AI 两种样式
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
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

const MessageBubble = ({ message, avatarUrl }) => {
  const isUser = message.role === 'user';

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
    wordBreak: 'break-word', // 允许在单词内换行（处理长单词）
    wordWrap: 'break-word', // 兼容性写法
    overflowWrap: 'break-word', // 现代标准写法
    whiteSpace: 'pre-wrap', // 保留换行符，但允许自动换行
    fontSize: 15,
    lineHeight: 1.6,
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
        />
      )}

      {/* 消息内容 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={bubbleStyle}>
          {/* 直接渲染内容，使用 whiteSpace: 'pre-wrap' 处理换行 */}
          {message.content}
        </div>
        
        {/* 时间戳 (可选，这里暂不显示具体时间，保持界面简洁) */}
        {/* <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text> */}
      </div>

      {/* 用户头像 (右侧) */}
      {isUser && (
        <Avatar 
          icon={<UserOutlined />} 
          style={avatarStyle} 
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

