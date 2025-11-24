/**
 * ============================================
 * 导入预览组件 (ImportPreview.jsx)
 * ============================================
 *
 * 【功能说明】
 * 显示解析后的消息列表，支持编辑消息内容和角色
 *
 * 【主要功能】
 * 1. 显示解析后的消息列表
 * 2. 每条消息可编辑（角色、内容）
 * 3. 显示解析置信度提示
 * 4. 支持添加/删除消息
 * 5. 显示 Agent 名称输入框（可编辑）
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Space, Typography, Tag, message, Popconfirm } from 'antd';
import { UserOutlined, RobotOutlined, DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import styles from './ImportPreview.module.css';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

const ImportPreview = ({ 
  parsedData, 
  onDataChange,
  onAgentNameChange 
}) => {
  const [messages, setMessages] = useState([]);
  const [agentName, setAgentName] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);

  // 初始化数据
  useEffect(() => {
    if (parsedData) {
      setMessages(parsedData.messages || []);
      setAgentName(parsedData.agentName || 'AI助手');
    }
  }, [parsedData]);

  // 通知父组件数据变化
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        messages: messages,
        agentName: agentName
      });
    }
  }, [messages, agentName, onDataChange]);

  // 更新Agent名称
  const handleAgentNameChange = (value) => {
    setAgentName(value);
    if (onAgentNameChange) {
      onAgentNameChange(value);
    }
  };

  // 更新消息角色
  const handleRoleChange = (index, role) => {
    const newMessages = [...messages];
    newMessages[index] = {
      ...newMessages[index],
      role: role
    };
    setMessages(newMessages);
  };

  // 更新消息内容
  const handleContentChange = (index, content) => {
    const newMessages = [...messages];
    newMessages[index] = {
      ...newMessages[index],
      content: content
    };
    setMessages(newMessages);
  };

  // 删除消息
  const handleDeleteMessage = (index) => {
    const newMessages = messages.filter((_, i) => i !== index);
    setMessages(newMessages);
    message.success('已删除消息');
  };

  // 添加消息
  const handleAddMessage = () => {
    const newMessage = {
      role: messages.length % 2 === 0 ? 'user' : 'assistant',
      content: '',
      timestamp: null
    };
    setMessages([...messages, newMessage]);
    setEditingIndex(messages.length);
    message.info('已添加新消息，请编辑内容');
  };

  // 开始编辑
  const handleStartEdit = (index) => {
    setEditingIndex(index);
  };

  // 完成编辑
  const handleFinishEdit = () => {
    setEditingIndex(null);
  };

  // 获取置信度标签颜色
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'orange';
    return 'red';
  };

  // 获取置信度文本
  const getConfidenceText = (confidence) => {
    if (confidence >= 0.8) return '高';
    if (confidence >= 0.6) return '中';
    return '低';
  };

  if (!parsedData || !parsedData.messages || parsedData.messages.length === 0) {
    return (
      <div className={styles.empty}>
        <Text type="secondary">暂无解析结果</Text>
      </div>
    );
  }

  return (
    <div className={styles.preview}>
      {/* Agent名称输入 */}
      <div className={styles.agentNameSection}>
        <Title level={5}>Agent 名称</Title>
        <Input
          value={agentName}
          onChange={(e) => handleAgentNameChange(e.target.value)}
          placeholder="输入Agent名称"
          maxLength={50}
        />
      </div>

      {/* 解析信息提示 */}
      {parsedData.confidence !== undefined && (
        <div className={styles.infoSection}>
          <Space>
            <Text type="secondary">解析格式：</Text>
            <Tag>{parsedData.format || 'unknown'}</Tag>
            <Text type="secondary">置信度：</Text>
            <Tag color={getConfidenceColor(parsedData.confidence)}>
              {getConfidenceText(parsedData.confidence)} ({Math.round(parsedData.confidence * 100)}%)
            </Tag>
            <Text type="secondary">消息数量：</Text>
            <Tag>{messages.length}</Tag>
          </Space>
        </div>
      )}

      {/* 错误提示 */}
      {parsedData.error && (
        <div className={styles.errorSection}>
          <Text type="danger">解析警告：{parsedData.error}</Text>
        </div>
      )}

      {/* 消息列表 */}
      <div className={styles.messagesList}>
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isEditing = editingIndex === index;

          return (
            <Card
              key={index}
              className={`${styles.messageCard} ${isUser ? styles.userMessage : styles.assistantMessage}`}
              size="small"
            >
              <div className={styles.messageHeader}>
                <Space>
                  {isUser ? (
                    <UserOutlined className={styles.userIcon} />
                  ) : (
                    <RobotOutlined className={styles.assistantIcon} />
                  )}
                  <Select
                    value={msg.role}
                    onChange={(value) => handleRoleChange(index, value)}
                    size="small"
                    style={{ width: 100 }}
                  >
                    <Option value="user">用户</Option>
                    <Option value="assistant">AI</Option>
                  </Select>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{index + 1}
                  </Text>
                </Space>
                <Space>
                  {isEditing ? (
                    <Button
                      size="small"
                      type="primary"
                      onClick={handleFinishEdit}
                    >
                      完成
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleStartEdit(index)}
                    >
                      编辑
                    </Button>
                  )}
                  <Popconfirm
                    title="确定删除这条消息吗？"
                    onConfirm={() => handleDeleteMessage(index)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              </div>

              <div className={styles.messageContent}>
                {isEditing ? (
                  <TextArea
                    value={msg.content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    autoSize={{ minRows: 2, maxRows: 10 }}
                    placeholder="输入消息内容"
                  />
                ) : (
                  <Text style={{ whiteSpace: 'pre-wrap' }}>
                    {msg.content || <Text type="secondary">（空内容）</Text>}
                  </Text>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 添加消息按钮 */}
      <div className={styles.addButtonSection}>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddMessage}
          block
        >
          添加消息
        </Button>
      </div>
    </div>
  );
};

export default ImportPreview;

