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
import { useAuth } from '../../context/AuthContext';
import MessageBubble from '../../components/MessageBubble/MessageBubble';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const Chat = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const messagesEndRef = useRef(null);
  
  // 状态管理
  const [agent, setAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // 获取数据（NPC 详情和对话历史）
  useEffect(() => {
    // 等待认证状态加载完成
    if (authLoading) {
      return;
    }

    // 如果用户未登录，显示错误
    if (!user) {
      setError('请先登录');
      setLoading(false);
      return;
    }

    // 如果没有 agentId，显示错误
    if (!agentId) {
      setError('NPC ID 不能为空');
      setLoading(false);
      return;
    }

    // 定义 fetchData 函数
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 调试日志
        console.log(`[DEBUG] Chat page: Fetching data for agentId=${agentId}, userId=${user.id}, apiMode=${api.mode}`);

        // 并行获取 NPC 详情和对话历史
        const [agentRes, historyRes] = await Promise.all([
          api.agents.getById(agentId, user.id),
          api.history.get(user.id, agentId)
        ]);

        // 调试日志
        console.log(`[DEBUG] Chat page: agentRes:`, agentRes);
        console.log(`[DEBUG] Chat page: historyRes:`, historyRes);

        if (agentRes.success) {
          // 调试日志：记录 agent 数据
          console.log(`[DEBUG] Chat page: Setting agent data:`, agentRes.data);
          setAgent(agentRes.data);
        } else {
          // 根据错误码提供更友好的错误提示
          const errorCode = agentRes.error?.code;
          if (errorCode === 'NOT_FOUND') {
            throw new Error('NPC 不存在或无权访问');
          } else {
            throw new Error(agentRes.error?.message || '获取 NPC 信息失败');
          }
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

    // 等待 API 适配器初始化完成
    if (!api.isInitialized) {
      console.log('[DEBUG] Chat page: Waiting for API adapter to initialize...');
      // 添加初始化完成监听器，初始化完成后直接调用 fetchData
      const handleInitialized = () => {
        console.log('[DEBUG] Chat page: API adapter initialized, fetching data...');
        fetchData();
      };
      api.onInitialized(handleInitialized);
      return;
    }

    // API 已初始化，直接获取数据
    fetchData();
  }, [agentId, user, authLoading]);

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
      if (!user) {
        message.warning('请先登录');
        return;
      }

      const response = await api.messages.send({
        agentId,
        userId: user.id,
        message: content
      });

      if (response.success) {
        // 发送成功后，更新消息列表
        // 后端已经保存了用户消息和 AI 回复，我们只需要：
        // 1. 移除临时用户消息
        // 2. 添加真实的用户消息（去掉临时标记）
        // 3. 添加 AI 回复消息
        setMessages(prev => {
          // 移除所有临时消息
          const filtered = prev.filter(m => !m.isTemp);
          // 添加真实的用户消息和 AI 回复
          const userMsg = { 
            ...tempUserMsg, 
            isTemp: false,
            id: `msg_user_${Date.now()}` // 使用时间戳生成 ID，避免与历史消息冲突
          };
          return [...filtered, userMsg, response.data];
        });
      } else {
        // 根据错误码提供更友好的错误提示
        let errorMessage = response.error?.message || '发送失败';
        if (response.error?.code === 'LLM_API_ERROR' || response.error?.code === 'LLM_API_TIMEOUT') {
          errorMessage = 'AI 回复生成失败，可能是 LLM API 配置问题或网络超时。请检查后端环境变量中的 API Key 配置。';
        } else if (response.error?.code === 'API_KEY_MISSING') {
          errorMessage = '缺少 LLM API Key，请在后端配置环境变量。';
        }
        throw new Error(errorMessage);
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
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>加载对话中...</div>
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

  // 调试日志：记录渲染时的 agent 状态
  console.log(`[DEBUG] Chat page render: agent=`, agent, `loading=`, loading, `error=`, error, `messages.length=`, messages.length);

  // 如果 agent 还没有加载完成，显示加载状态
  if (!agent && !loading && !error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>加载 NPC 信息中...</div>
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
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{agent?.name || '加载中...'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {agent?.model || '未知模型'} • {agent?.type === 'special' ? '特定角色' : '通用助手'}
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

