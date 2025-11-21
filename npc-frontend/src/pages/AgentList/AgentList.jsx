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
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Typography, Space, Button, Empty, message, Avatar, Dropdown, Alert } from 'antd';
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
  const location = useLocation();
  const { user, logout, loading: authLoading } = useAuth();
  const [agents, setAgents] = useState([]);
  // 初始加载状态：如果用户已登录，应该显示加载状态（避免闪烁）
  const [loading, setLoading] = useState(() => {
    // 如果用户已登录，初始状态应该是加载中
    // 这样在 fetchAgents 执行前不会显示空状态
    return false; // 初始为 false，在 useEffect 中会根据 user 状态设置
  });
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
      // 用户已登录，立即设置加载状态，然后获取数据
      // 这样可以避免在 fetchAgents 执行前显示空状态
      setLoading(true);
      fetchAgents();
    } else {
      // 未登录，清空列表和加载状态
      setAgents([]);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  // 监听路由变化，如果从创建页跳转回来，刷新列表
  useEffect(() => {
    if (location.state?.refresh && user) {
      // 清除路由 state，避免重复刷新
      window.history.replaceState({}, '');
      fetchAgents();
    }
  }, [location.state, user]);

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
    // 1. 优先检查认证加载状态
    if (authLoading) {
       return <Loading tip="正在检查登录状态..." />;
    }

    // 2. 检查用户登录状态
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

    // 3. 检查列表加载状态（用户已登录时）
    // 注意：只有在用户已登录且不在加载中时，才判断是否为空列表
    if (loading) {
      return <Loading tip="加载 NPC 列表中..." />;
    }

    // 4. 检查错误状态
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

    // 5. 检查空列表（只有在加载完成且无错误时才显示）
    // 确保只有在确实没有数据时才显示空状态
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
        {/* API 模式提示 */}
        {api.mode === 'mock' && (
          <Alert
            message="当前使用 Mock 模式"
            description="后端服务未连接，数据仅保存在内存中。请确保后端服务已启动（运行在 http://localhost:8000）。"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
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

