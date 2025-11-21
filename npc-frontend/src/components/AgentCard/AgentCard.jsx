/**
 * ============================================
 * NPC 卡片组件 (AgentCard.jsx)
 * ============================================
 *
 * 【功能说明】
 * 展示 NPC 信息的卡片组件，采用横行布局
 *
 * 【Props】
 * - agent: object (NPC 数据)
 *   - id: string
 *   - name: string
 *   - type: string
 *   - avatarUrl: string
 *   - lastMessageAt: number
 *   - lastMessagePreview: string
 * - onClick: function (点击事件)
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Tag, Typography, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import Card from '../Card/Card';

const { Text, Title } = Typography;

/**
 * 格式化时间
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 小于 1 分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于 1 小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  
  // 小于 24 小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  
  // 大于 24 小时，显示日期
  return date.toLocaleDateString();
};

const AgentCard = ({ agent, onClick }) => {
  const { name, type, avatarUrl, lastMessageAt, lastMessagePreview } = agent;

  // 类型标签颜色映射
  const typeColors = {
    special: 'blue',
    general: 'green',
    default: 'default'
  };

  // 类型名称映射
  const typeNames = {
    special: '特定',
    general: '通用',
    default: '未知'
  };

  return (
    <Card 
      hoverable 
      onClick={() => onClick && onClick(agent.id)}
      style={{ marginBottom: 12, cursor: 'pointer' }}
      styles={{ body: { padding: 16 } }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* 头像区域 */}
        <div style={{ marginRight: 16 }}>
          <Avatar 
            size={60} 
            src={avatarUrl} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#fde3cf', verticalAlign: 'middle' }}
          />
        </div>

        {/* 信息区域 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* 顶部：名称、标签、时间 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Space size={8} style={{ overflow: 'hidden', flex: 1 }}>
              <Title level={5} style={{ margin: 0 }} ellipsis>
                {name}
              </Title>
              <Tag color={typeColors[type] || typeColors.default}>
                {typeNames[type] || typeNames.default}
              </Tag>
            </Space>
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8, flexShrink: 0 }}>
              {formatTime(lastMessageAt)}
            </Text>
          </div>

          {/* 底部：最后消息预览 */}
          <div style={{ display: 'flex' }}>
            <Text type="secondary" style={{ fontSize: 13 }} ellipsis>
              {lastMessagePreview || '暂无对话记录'}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );
};

AgentCard.propTypes = {
  agent: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    lastMessageAt: PropTypes.number,
    lastMessagePreview: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
};

export default AgentCard;

