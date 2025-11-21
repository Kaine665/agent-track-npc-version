/**
 * ============================================
 * 对话页面 (Chat.jsx)
 * ============================================
 *
 * 【功能说明】
 * 提供与 NPC 对话的界面，支持查看历史消息和发送新消息
 *
 * 【工作流程】
 * 1. 页面加载时获取 NPC 详情和对话历史
 * 2. 显示消息列表，自动滚动到底部
 * 3. 用户输入消息并发送
 * 4. 显示发送状态和 AI 回复
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Typography, Input, Button, Space, message, Avatar, Empty, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined, UserOutlined, RobotOutlined, LoadingOutlined } from '@ant-design/icons';
import api from '../../api';
import MessageBubble from '../../components/MessageBubble/MessageBubble';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const Chat = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  // 状态管理
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // 模拟当前用户 ID
  const currentUserId = 'user_123';

  // 获取数据（NPC 详情和对话历史）
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 并行获取 NPC 详情和对话历史
        const [agentRes, historyRes] = await Promise.all([
          api.agents.getById(agentId, currentUserId),
          api.history.get(currentUserId, agentId)
        ]);

        if (agentRes.success) {
          setAgent(agentRes.data);
        } else {
          throw new Error(agentRes.error?.message || '获取 NPC 信息失败');
        }

        if (historyRes.success) {
          setMessages(historyRes.data.messages);
        } else {
          // 历史获取失败不阻止页面显示，只是没有历史记录
          console.warn('获取对话历史失败:', historyRes.error);
        }

      } catch (err) {
        console.error('Chat page load error:', err);
        setError(err.message);
        message.error(`加载失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (agentId) {
      fetchData();
    }
  }, [agentId]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const content = inputValue.trim();
    setInputValue(''); // 清空输入框
    setSending(true);

    // 乐观更新：立即显示用户消息
    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: content,
      createdAt: Date.now(),
      isTemp: true
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      // 调用 API 发送消息
      const response = await api.messages.send({
        agentId,
        userId: currentUserId,
        message: content
      });

      if (response.success) {
        // 替换临时消息为真实消息（如果有 ID 变化），并添加 AI 回复
        // 这里简化处理，直接添加 AI 回复，因为 Mock 数据已经包含了用户消息
        // 但为了避免 Mock 数据的重复添加逻辑影响前端展示，我们只追加 AI 回复
        // 注意：MockAdapter.messages.send 在内存中添加了用户消息和 AI 消息
        // 但前端状态为了流畅性，这里手动更新
        
        setMessages(prev => {
          // 移除临时用户消息（如果需要严格对应 ID，这里可以优化）
          const filtered = prev.filter(m => !m.isTemp);
          // 重新添加这一轮的对话（从 API 返回的数据中获取，或者手动构建）
          // 由于 API 只返回 AI 消息，我们保留之前的用户消息（去掉 isTemp 标记）
          const userMsg = { ...tempUserMsg, isTemp: false };
          return [...filtered, userMsg, response.data];
        });
      } else {
        throw new Error(response.error?.message || '发送失败');
      }
    } catch (err) {
      console.error('Send message error:', err);
      message.error(`发送失败: ${err.message}`);
      // 发送失败，移除临时消息并恢复输入
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      setInputValue(content);
    } finally {
      setSending(false);
    }
  };

  // 处理键盘事件（Enter 发送，Shift+Enter 换行）
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 返回列表页
  const handleBack = () => {
    navigate('/agents');
  };

  // 渲染内容
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin tip="加载对话中..." size="large" />
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Empty description={error}>
          <Button type="primary" onClick={handleBack}>返回列表</Button>
        </Empty>
      </div>
    );
  }

  return (
    <Layout style={{ height: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航 */}
      <Header style={{ 
        background: '#fff', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center', 
        borderBottom: '1px solid #f0f0f0',
        zIndex: 10
      }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginRight: 8 }}
        />
        
        <Avatar 
          src={agent?.avatarUrl} 
          icon={<RobotOutlined />} 
          style={{ backgroundColor: '#fde3cf', marginRight: 12 }}
        />
        
        <div style={{ lineHeight: 1.5 }}>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{agent?.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {agent?.model} • {agent?.type === 'special' ? '特定角色' : '通用助手'}
          </div>
        </div>
      </Header>

      {/* 消息列表区域 */}
      <Content style={{ 
        padding: '20px 16px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60, color: '#999' }}>
            <RobotOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
            <p>开始和 {agent?.name} 聊天吧！</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              avatarUrl={agent?.avatarUrl} 
            />
          ))
        )}
        
        {/* AI 正在输入提示 */}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', marginLeft: 12, marginBottom: 16 }}>
             <Avatar 
              src={agent?.avatarUrl} 
              icon={<RobotOutlined />} 
              style={{ backgroundColor: '#fde3cf', marginRight: 8 }}
              size="small"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <LoadingOutlined style={{ marginRight: 4 }} /> 对方正在输入...
            </Text>
          </div>
        )}
        
        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </Content>

      {/* 底部输入区域 */}
      <Footer style={{ 
        background: '#fff', 
        padding: '12px 16px', 
        borderTop: '1px solid #f0f0f0' 
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'flex-end' }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ 
              borderRadius: 18, 
              resize: 'none', 
              padding: '8px 16px',
              marginRight: 12
            }}
            disabled={sending}
          />
          <Button 
            type="primary" 
            shape="circle" 
            icon={<SendOutlined />} 
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            style={{ marginBottom: 2 }} // 对齐
          />
        </div>
      </Footer>
    </Layout>
  );
};

export default Chat;

