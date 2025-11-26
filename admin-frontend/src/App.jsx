/**
 * ============================================
 * 根组件 (App.jsx)
 * ============================================
 *
 * 【文件职责】
 * 管理后台应用的根组件
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import { useState, useEffect } from 'react';
import { RouterProvider, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './router';
import api from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查是否已登录
    const token = api.loadToken();
    console.log('🔍 App.jsx: Checking token:', token ? `${token.substring(0, 20)}...` : 'none');
    
    if (token) {
      // 验证 Token
      api.admin.auth
        .getMe()
        .then((response) => {
          console.log('🔍 App.jsx: getMe response:', response.success ? 'success' : 'failed', response.error?.code);
          if (response.success) {
            setUser(response.data.user);
            console.log('✅ App.jsx: User authenticated:', response.data.user.username);
          } else {
            console.warn('⚠️  App.jsx: getMe failed:', response.error);
            // 只有在明确是认证错误时才清除 token
            if (response.error?.code === 'UNAUTHORIZED' || response.error?.code === 'TOKEN_INVALID' || response.error?.code === 'TOKEN_EXPIRED') {
              console.warn('🔓 App.jsx: Clearing invalid token');
              api.setToken(null);
              // 如果不在登录页，重定向到登录页
              if (window.location.pathname !== '/admin/login') {
                window.location.href = '/admin/login';
              }
            }
          }
        })
        .catch((error) => {
          console.error('❌ App.jsx: getMe error:', error);
          // 网络错误或其他错误不自动清除 token
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      console.log('ℹ️  App.jsx: No token found');
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    api.setToken(null);
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <ConfigProvider locale={zhCN}>
        <div style={{ padding: 50, textAlign: 'center' }}>加载中...</div>
      </ConfigProvider>
    );
  }

  // 检查当前路径
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/admin/login';

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          colorPrimary: '#007aff',
          borderRadius: 8,
          wireframe: false,
          colorBgContainer: 'rgba(255, 255, 255, 0.8)',
          colorBgLayout: '#f5f5f7',
        },
        components: {
          Card: {
            borderRadiusLG: 16,
            boxShadowTertiary: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
            fontWeight: 500,
          },
          Input: {
            controlHeight: 36,
            borderRadius: 8,
          },
          Layout: {
            headerBg: 'rgba(255, 255, 255, 0.72)',
            siderBg: 'rgba(255, 255, 255, 0.5)',
          },
        },
      }}
    >
      <div className="app">
        {user && !isLoginPage ? (
          <div className="admin-layout">
            <header className="admin-header">
              <h1>Agent Track Admin</h1>
              <div className="admin-header-actions">
                <span className="user-welcome">Hello, {user.username}</span>
                <button onClick={handleLogout} className="logout-btn">
                  退出
                </button>
              </div>
            </header>
            <div className="admin-content">
              <RouterProvider router={router} />
            </div>
          </div>
        ) : (
          <RouterProvider router={router} />
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
