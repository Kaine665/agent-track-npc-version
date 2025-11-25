import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';
import { message } from 'antd';
import VersionUpdateModal from '../components/VersionUpdateModal/VersionUpdateModal';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [versionUpdateModal, setVersionUpdateModal] = useState({
    open: false,
    changelog: null,
    version: null,
  });

  // 初始化时从 localStorage 恢复登录状态和 Token
  useEffect(() => {
    const initializeAuth = async () => {
      // 直接从 localStorage 恢复 Token（不依赖 API 适配器初始化）
      const token = localStorage.getItem('npc_access_token');
      
      // 恢复用户信息
      const storedUser = localStorage.getItem('npc_user');
      let userData = null;
      
      if (storedUser) {
        try {
          userData = JSON.parse(storedUser);
        } catch (e) {
          console.error('Failed to parse user from local storage', e);
          localStorage.removeItem('npc_user');
        }
      }

      // 如果有 Token，先设置到 API 适配器（如果已初始化）
      if (token && api.setToken) {
        api.setToken(token);
      }

      // 如果有用户信息但没有 Token，尝试自动登录（老用户迁移）
      if (userData && userData.id && !token) {
        // 等待 API 适配器初始化完成
        if (!api.isInitialized) {
          await new Promise((resolve) => {
            if (api.isInitialized) {
              resolve();
            } else {
              api.onInitialized(() => resolve());
            }
          });
        }

        try {
          console.log('尝试自动登录（老用户迁移）:', userData.id);
          const response = await api.users.autoLogin(userData.id);
          
          if (response.success) {
            const { user: updatedUser, accessToken } = response.data;
            
            // 保存 Token
            if (accessToken) {
              api.setToken(accessToken);
            }
            
            // 更新用户信息
            setUser(updatedUser);
            localStorage.setItem('npc_user', JSON.stringify(updatedUser));
            
            console.log('自动登录成功:', updatedUser.username);
          } else {
            // 自动登录失败（可能是新用户，需要密码登录）
            console.log('自动登录失败:', response.error?.message);
            // 清除用户信息，让用户重新登录
            setUser(null);
            localStorage.removeItem('npc_user');
          }
        } catch (error) {
          console.error('自动登录发生错误:', error);
          // 清除用户信息，让用户重新登录
          setUser(null);
          localStorage.removeItem('npc_user');
        }
      } else if (userData && token) {
        // 有用户信息和 Token，直接恢复
        setUser(userData);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // 检查版本更新（用户登录后）
  useEffect(() => {
    const checkVersionUpdate = async () => {
      // 只有在用户已登录且有 Token 时才检查
      if (!user || !api.loadToken()) {
        return;
      }

      try {
        const response = await api.users.getVersionInfo();
        
        if (response.success && response.data.shouldShowUpdate && response.data.changelog) {
          // 显示版本更新提示
          setVersionUpdateModal({
            open: true,
            changelog: response.data.changelog,
            version: response.data.currentVersion,
          });
        }
      } catch (error) {
        console.error('检查版本更新失败:', error);
        // 静默失败，不影响用户体验
      }
    };

    // 用户登录后延迟检查（给页面一些加载时间）
    if (user) {
      const timer = setTimeout(() => {
        checkVersionUpdate();
      }, 1000); // 延迟1秒检查

      return () => clearTimeout(timer);
    }
  }, [user]);

  // 标记版本已读
  const handleMarkVersionRead = async (version) => {
    try {
      await api.users.markVersionRead(version);
      setVersionUpdateModal({
        open: false,
        changelog: null,
        version: null,
      });
    } catch (error) {
      console.error('标记版本已读失败:', error);
      // 即使失败也关闭弹窗
      setVersionUpdateModal({
        open: false,
        changelog: null,
        version: null,
      });
    }
  };

  const login = async (userId, password) => {
    try {
      const response = await api.users.login(userId, password);
      if (response.success) {
        const { user, accessToken } = response.data;
        
        // 保存 Token
        if (accessToken) {
          api.setToken(accessToken);
        }
        
        // 保存用户信息
        setUser(user);
        localStorage.setItem('npc_user', JSON.stringify(user));
        
        message.success(`欢迎回来，${user.username}`);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: { message: '登录发生错误' } };
    }
  };

  const register = async (userId, username, password) => {
    try {
      const response = await api.users.register(userId, username, password);
      if (response.success) {
        const userData = response.data;
        setUser(userData);
        localStorage.setItem('npc_user', JSON.stringify(userData));
        message.success(`注册成功，欢迎 ${userData.username}`);
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: { message: '注册发生错误' } };
    }
  };

  const logout = () => {
    // 清除 Token
    api.setToken(null);
    
    // 清除用户信息
    setUser(null);
    localStorage.removeItem('npc_user');
    localStorage.removeItem('npc_access_token');
    
    message.info('已退出登录');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
      <VersionUpdateModal
        open={versionUpdateModal.open}
        changelog={versionUpdateModal.changelog}
        version={versionUpdateModal.version}
        onClose={() => setVersionUpdateModal({ open: false, changelog: null, version: null })}
        onMarkRead={handleMarkVersionRead}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

