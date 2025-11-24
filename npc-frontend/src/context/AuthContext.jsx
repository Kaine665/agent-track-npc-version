import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';
import { message } from 'antd';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化时从 localStorage 恢复登录状态和 Token
  useEffect(() => {
    // 恢复 Token
    api.loadToken();
    
    // 恢复用户信息
    const storedUser = localStorage.getItem('npc_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
        localStorage.removeItem('npc_user');
      }
    }
    setLoading(false);
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

