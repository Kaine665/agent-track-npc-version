/**
 * ============================================
 * NPC 列表页面 (AgentList.jsx)
 * ============================================
 *
 * 【功能说明】
 * 展示用户创建的所有 NPC，支持跳转到对话页或创建页
 *
 * 【工作流程】
 * 1. 页面加载时调用 API 获取 NPC 列表
 * 2. 显示加载状态
 * 3. 渲染 NPC 列表（使用 AgentCard）
 * 4. 处理空状态和错误状态
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Typography, Space, Button, Empty, message, Avatar, Dropdown } from 'antd';
import { PlusOutlined, RobotOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import api from '../../api';
import AgentCard from '../../components/AgentCard/AgentCard';
import Loading from '../../components/Loading/Loading';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../../components/LoginModal/LoginModal';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const AgentList = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false); // 列表加载状态
  const [error, setError] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 获取 NPC 列表
  const fetchAgents = async () => {
    if (!user) return; // 未登录不获取

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.agents.getList(user.id);
      
      if (response.success) {
        setAgents(response.data.agents);
      } else {
        throw new Error(response.error?.message || '获取列表失败');
      }
    } catch (err) {
      console.error('Fetch agents error:', err);
      setError(err.message);
      message.error(`获取列表失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 用户状态改变或页面加载时获取数据
  useEffect(() => {
    if (user) {
      fetchAgents();
    } else {
      setAgents([]); // 未登录清空列表
    }
  }, [user]);

  // 跳转到创建页面
  const handleCreate = () => {
    if (!user) {
      message.warning('请先登录');
      setIsLoginModalOpen(true);
      return;
    }
    navigate('/agents/create');
  };

  // 跳转到对话页面
  const handleChat = (agentId) => {
    navigate(`/chat/${agentId}`);
  };

  // 用户菜单
  const userMenuProps = {
    items: [
      {
        key: 'logout',
        label: '退出登录',
        icon: <LogoutOutlined />,
        onClick: logout,
      },
    ],
  };

  // 渲染内容区域
  const renderContent = () => {
    if (authLoading) {
       return <Loading tip="正在检查登录状态..." />;
    }

    if (!user) {
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <Empty
            image={<UserOutlined style={{ fontSize: 60, color: '#d9d9d9' }} />}
            description="请先登录以查看您的 NPC"
          >
            <Button type="primary" onClick={() => setIsLoginModalOpen(true)}>
              立即登录
            </Button>
          </Empty>
        </div>
      );
    }

    if (loading) {
      return <Loading tip="加载 NPC 列表中..." />;
    }

    if (error) {
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: '#ff4d4f' }}>{error}</span>}
          >
            <Button type="primary" onClick={fetchAgents}>
              重试
            </Button>
          </Empty>
        </div>
      );
    }

    if (agents.length === 0) {
      return (
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <Empty
            image={<RobotOutlined style={{ fontSize: 60, color: '#d9d9d9' }} />}
            description="创建你的第一个 NPC"
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建新 NPC
            </Button>
          </Empty>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* 创建按钮放在列表顶部 */}
        <Button 
          type="dashed" 
          block 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          style={{ marginBottom: 16, height: 48, fontSize: 16 }}
        >
          创建新 NPC
        </Button>

        {/* NPC 列表 */}
        {agents.map((agent) => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            onClick={handleChat}
          />
        ))}
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        zIndex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <RobotOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 12 }} />
          <Title level={3} style={{ margin: 0 }}>我的 NPC</Title>
        </div>
        
        {/* 用户信息区域 */}
        <div>
          {user ? (
            <Dropdown menu={userMenuProps} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <Text strong>{user.username}</Text>
              </Space>
            </Dropdown>
          ) : (
            <Space>
              <Button type="primary" onClick={() => setIsLoginModalOpen(true)}>登录</Button>
              <Button onClick={() => navigate('/register')}>注册</Button>
            </Space>
          )}
        </div>
      </Header>

      {/* 内容区域 */}
      <Content style={{ padding: '24px' }}>
        {renderContent()}
      </Content>

      {/* 登录弹窗 */}
      <LoginModal 
        open={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </Layout>
  );
};

export default AgentList;

