import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化时从 localStorage 恢复登录状态和 Token
  useEffect(() => {
    const initializeAuth = async () => {
      // 恢复 Token
      const token = api.loadToken();
      
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

      // 如果有用户信息但没有 Token，尝试自动登录（老用户迁移）
      if (userData && userData.id && !token) {
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
      } else if (userData) {
        // 有用户信息和 Token，直接恢复
        setUser(userData);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

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

