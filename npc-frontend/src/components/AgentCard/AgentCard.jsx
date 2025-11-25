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
import { Avatar, Tag, Typography, Space, Dropdown, Button } from 'antd';
import { UserOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import Card from '../Card/Card';
import styles from './AgentCard.module.css';

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

/**
 * 清理 Markdown 文本，提取纯文本预览
 * @param {string} markdown - Markdown 文本
 * @param {number} maxLength - 最大长度（默认 50）
 * @returns {string} 清理后的纯文本
 */
const cleanMarkdownPreview = (markdown, maxLength = 50) => {
  if (!markdown) return '';
  
  let text = markdown;
  
  // 移除代码块（```code```）
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // 移除行内代码（`code`）
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // 移除链接（[text](url) -> text）
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // 移除图片（![alt](url) -> alt）
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
  
  // 移除粗体和斜体标记（**text** -> text, *text* -> text）
  text = text.replace(/\*\*([^\*]+)\*\*/g, '$1');
  text = text.replace(/\*([^\*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  
  // 移除标题标记（# text -> text）
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // 移除引用标记（> text -> text）
  text = text.replace(/^>\s+/gm, '');
  
  // 移除列表标记（- item -> item, 1. item -> item）
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // 移除表格标记（|）
  text = text.replace(/\|/g, ' ');
  
  // 移除多余的空行和空白
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/^\s+|\s+$/g, '');
  
  // 限制长度
  if (text.length > maxLength) {
    text = text.substring(0, maxLength).trim() + '...';
  }
  
  return text;
};

const AgentCard = ({ agent, onClick, onEdit, onDelete }) => {
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

  // 操作菜单
  const menuItems = [
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: ({ domEvent }) => {
        if (domEvent) {
          domEvent.stopPropagation();
        }
        onEdit && onEdit(agent);
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: ({ domEvent }) => {
        if (domEvent) {
          domEvent.stopPropagation();
        }
        onDelete && onDelete(agent);
      },
    },
  ];

  return (
    <Card 
      hoverable 
      onClick={() => onClick && onClick(agent.id)}
      style={{ marginBottom: 12, cursor: 'pointer', position: 'relative' }}
      styles={{ 
        body: { 
          padding: 16 
        } 
      }}
      className={styles.cardBody}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* 头像区域 */}
        <div style={{ marginRight: 16, flexShrink: 0 }} className={styles.avatarContainer}>
          <Avatar 
            size={60} 
            src={avatarUrl} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#fde3cf', verticalAlign: 'middle' }}
            className={styles.avatar}
          />
        </div>

        {/* 信息区域 */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          {/* 顶部：名称、标签、时间 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
            <Space size={6} style={{ overflow: 'hidden', flex: 1, minWidth: 0 }} wrap={false}>
              <Title level={5} style={{ margin: 0 }} ellipsis className={styles.title}>
                {name}
              </Title>
              <Tag color={typeColors[type] || typeColors.default} className={styles.tag}>
                {typeNames[type] || typeNames.default}
              </Tag>
            </Space>
            <Text type="secondary" className={styles.timeText}>
              {formatTime(lastMessageAt)}
            </Text>
          </div>

          {/* 底部：最后消息预览 */}
          <div style={{ display: 'flex' }}>
            <Text type="secondary" ellipsis className={styles.previewText}>
              {lastMessagePreview ? cleanMarkdownPreview(lastMessagePreview, 60) : '暂无对话记录'}
            </Text>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div 
          style={{ marginLeft: 8, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown 
            menu={{ items: menuItems }} 
            trigger={['click']}
            placement="bottomRight"
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              style={{ color: '#8c8c8c' }}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
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
    createdBy: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default AgentCard;

