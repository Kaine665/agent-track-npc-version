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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Typography, Space, Button, Empty, message, Avatar, Dropdown, Alert, Input, Modal } from 'antd';
import { PlusOutlined, RobotOutlined, UserOutlined, LogoutOutlined, SearchOutlined, FileTextOutlined, MessageOutlined } from '@ant-design/icons';
import api from '../../api';
import AgentCard from '../../components/AgentCard/AgentCard';
import AgentEditModal from '../../components/AgentEditModal/AgentEditModal';
import Loading from '../../components/Loading/Loading';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../../components/LoginModal/LoginModal';
import styles from './AgentList.module.css';

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
  const [showBackendWarning, setShowBackendWarning] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(''); // 搜索关键词
  const pollingRef = useRef(null); // 轮询引用
  const lastFetchTimeRef = useRef(0); // 上次获取数据的时间戳
  const [editingAgent, setEditingAgent] = useState(null); // 正在编辑的Agent
  const [isEditModalVisible, setIsEditModalVisible] = useState(false); // 编辑模态框显示状态

  // 获取 NPC 列表
  const fetchAgents = async () => {
    if (!user) return; // 未登录不获取

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.agents.getList(user.id);
      
      if (response.success) {
        setAgents(response.data.agents);
        lastFetchTimeRef.current = Date.now(); // 更新上次获取时间
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

  // 监听 API 初始化状态，10秒后显示后端未连接警告
  useEffect(() => {
    const checkBackendStatus = () => {
      if (!api.isWaitingBackend && api.mode === 'mock') {
        setShowBackendWarning(true);
      } else {
        setShowBackendWarning(false);
      }
    };

    // 立即检查一次
    checkBackendStatus();

    // 如果正在等待，10秒后再次检查
    if (api.isWaitingBackend) {
      const timer = setTimeout(() => {
        checkBackendStatus();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [api.isWaitingBackend, api.mode]);

  // 用户状态改变或页面加载时获取数据
  useEffect(() => {
    if (!user) {
      // 未登录，清空列表和加载状态
      setAgents([]);
      setLoading(false);
      setError(null);
      return;
    }

    // 用户已登录，等待 API 适配器初始化完成后再获取数据
    if (!api.isInitialized) {
      console.log('[DEBUG] AgentList: Waiting for API adapter to initialize...');
      // 添加初始化完成监听器，初始化完成后获取数据
      const handleInitialized = () => {
        console.log('[DEBUG] AgentList: API adapter initialized, fetching agents...');
        setLoading(true);
        fetchAgents();
      };
      api.onInitialized(handleInitialized);
      return;
    }

    // API 已初始化，直接获取数据
    setLoading(true);
    fetchAgents();
  }, [user, api.isInitialized]);

  // 监听 API 模式变化，如果从 Mock 切换到 HTTP，重新获取数据
  useEffect(() => {
    if (user && api.isInitialized && api.mode === 'http' && agents.length === 0 && !loading && !error) {
      console.log('[DEBUG] AgentList: API mode changed to HTTP, refetching agents...');
      fetchAgents();
    }
  }, [api.mode, api.isInitialized]);

  // 监听路由变化，如果从创建页或聊天页跳转回来，刷新列表
  useEffect(() => {
    if (location.state?.refresh && user) {
      // 清除路由 state，避免重复刷新
      window.history.replaceState({}, '');
      fetchAgents();
    }
  }, [location.state, user]);

  // 监听路由路径变化，从聊天页返回时刷新列表
  useEffect(() => {
    const currentPath = location.pathname;
    const isFromChat = location.state?.fromChat;
    
    // 如果从聊天页返回，刷新列表
    if (currentPath === '/agents' && isFromChat && user) {
      // 清除路由 state
      window.history.replaceState({}, '');
      fetchAgents();
    }
  }, [location.pathname, location.state, user]);

  // 监听页面可见性变化，页面变为可见时刷新列表
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      // 页面变为可见时，如果距离上次刷新超过 5 秒，则刷新列表
      const now = Date.now();
      if (!document.hidden && now - lastFetchTimeRef.current > 5000) {
        console.log('[DEBUG] AgentList: Page visible, refreshing agent list...');
        fetchAgents();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // 添加轻量级轮询：每 30 秒刷新一次（只在页面可见时）
  useEffect(() => {
    if (!user) {
      // 用户未登录，清除轮询
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // 设置轮询：每 30 秒刷新一次
    pollingRef.current = setInterval(() => {
      // 只在页面可见时刷新
      if (!document.hidden) {
        console.log('[DEBUG] AgentList: Polling refresh agent list...');
        fetchAgents();
      }
    }, 30000); // 30 秒

    // 清理函数
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 处理编辑NPC
  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setIsEditModalVisible(true);
  };

  // 处理删除NPC
  const handleDelete = (agent) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 NPC "${agent.name}" 吗？删除后相关对话历史将保留。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await api.agents.delete(agent.id, agent.createdBy, false); // 软删除
          if (response.success) {
            message.success('NPC 已删除');
            // 刷新列表
            fetchAgents();
          } else {
            throw new Error(response.error?.message || '删除失败');
          }
        } catch (error) {
          console.error('Delete agent error:', error);
          message.error(error.message || '删除失败，请稍后重试');
        }
      },
    });
  };

  // 编辑成功回调
  const handleEditSuccess = () => {
    // 刷新列表
    fetchAgents();
  };

  // 根据搜索关键词过滤agents列表
  const filteredAgents = useMemo(() => {
    if (!searchKeyword.trim()) {
      return agents;
    }
    const keyword = searchKeyword.trim().toLowerCase();
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(keyword)
    );
  }, [agents, searchKeyword]);

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

    // 3. 检查 API 适配器初始化状态（用户已登录时）
    if (!api.isInitialized || api.isWaitingBackend) {
      return <Loading tip="正在初始化..." />;
    }

    // 4. 检查列表加载状态（用户已登录时）
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
      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {/* 搜索框 */}
        <Input
          placeholder="搜索"
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
          className={styles.searchInput}
          style={{ marginBottom: 16, height: 40 }}
        />

        {/* 创建按钮放在搜索框下方 */}
        <Button 
          type="dashed" 
          block 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          className={styles.createButton}
          style={{ marginBottom: 16, height: 48, fontSize: 16 }}
        >
          创建新 NPC
        </Button>

        {/* NPC 列表 - 显示过滤后的结果 */}
        {filteredAgents.length === 0 ? (
          <Empty
            image={<SearchOutlined style={{ fontSize: 60, color: '#d9d9d9' }} />}
            description={`未找到名称包含"${searchKeyword}"的 NPC`}
          />
        ) : (
          filteredAgents.map((agent) => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              onClick={handleChat}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        background: '#fff', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        zIndex: 1,
        height: 'auto',
        minHeight: 64,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <RobotOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 8, flexShrink: 0 }} />
          <Title level={3} style={{ margin: 0, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            我的 NPC
          </Title>
        </div>
        
        {/* 用户信息区域 */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* 反馈按钮 */}
          <Button 
            type="text" 
            icon={<MessageOutlined />}
            onClick={() => navigate('/feedback')}
            className={styles.feedbackButton}
            style={{ color: '#595959' }}
          >
            反馈
          </Button>
          
          {/* 更新日志按钮 */}
          <Button 
            type="text" 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/updates')}
            className={styles.updateLogButton}
            style={{ color: '#595959' }}
          >
            更新日志
          </Button>
          
          {user ? (
            <Dropdown menu={userMenuProps} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} size="small" />
                <Text strong className={styles.usernameText}>
                  {user.username}
                </Text>
              </Space>
            </Dropdown>
          ) : (
            <Space size="small">
              <Button type="primary" size="small" onClick={() => setIsLoginModalOpen(true)}>登录</Button>
              <Button size="small" onClick={() => navigate('/register')} className={styles.registerButton}>
                注册
              </Button>
            </Space>
          )}
        </div>
      </Header>

      {/* 内容区域 */}
      <Content style={{ padding: '16px', paddingBottom: '24px' }}>
        {/* API 模式提示 - 只在初始化完成后且为 Mock 模式时显示 */}
        {showBackendWarning && !api.isWaitingBackend && api.isInitialized && (
          <Alert
            message="后端服务未连接"
            description="后端服务未连接，当前使用 Mock 模式。数据仅保存在内存中，刷新页面后会丢失。请确保后端服务已启动（运行在 http://localhost:8000）。"
            type="warning"
            showIcon
            closable
            onClose={() => setShowBackendWarning(false)}
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

      {/* 编辑NPC模态框 */}
      <AgentEditModal
        agent={editingAgent}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingAgent(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </Layout>
  );
};

export default AgentList;

