/**
 * ============================================
 * 登录页面 (Login.jsx)
 * ============================================
 *
 * 【文件职责】
 * 管理后台登录页面
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../../api';
import styles from './Login.module.css';

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 去除前后空格和换行符
      const userId = (values.userId?.trim() || '').replace(/\s+/g, '');
      const password = (values.password?.trim() || '').replace(/[\r\n]/g, '');
      
      console.log('🔐 Frontend login attempt:');
      console.log('   User ID:', userId);
      console.log('   Password (masked):', '*'.repeat(password.length));
      console.log('   Password length:', password.length);
      // 输出密码的十六进制表示（用于调试）
      const passwordHex = Array.from(password).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
      console.log('   Password bytes (hex):', passwordHex);
      console.log('   Password character codes:', Array.from(password).map(c => c.charCodeAt(0)).join(','));
      
      if (!userId || !password) {
        message.error('请输入用户 ID 和密码');
        setLoading(false);
        return;
      }
      
      const response = await api.admin.auth.login(userId, password);
      if (response.success) {
        console.log('✅ Login successful');
        console.log('🔑 Token saved:', response.data.accessToken ? 'Yes' : 'No');
        message.success('Welcome back');
        // 不立即 reload，让 React Router 处理导航
        // token 已经通过 httpAdapter 保存到 localStorage
        navigate('/admin/dashboard');
      } else {
        const errorMessage = response.error?.message || 'Login failed';
        console.error('❌ Login failed:', response.error);
        message.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = error.message || error.toString() || 'An error occurred';
      message.error(`登录失败: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
           {/* 这里可以放 Logo */}
           <div style={{ width: 48, height: 48, background: '#007aff', borderRadius: 12, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 24 }}>A</div>
        </div>
        <h1 className={styles.title}>Sign in</h1>
        <Form onFinish={handleSubmit} layout="vertical" size="large">
          <Form.Item
            name="userId"
            rules={[{ required: true, message: 'Please input User ID' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} 
              placeholder="User ID" 
              style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input Password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />} 
              placeholder="Password"
              style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44, fontSize: 16, borderRadius: 12, boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)' }}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
        <div className={styles.footer}>
          <p>Demo Account: admin_Kaine / j877413lxy</p>
          <p>Mode: {api.mode === 'mock' ? 'Mock Data' : 'HTTP API'}</p>
        </div>
      </Card>
    </div>
  );
}

export default Login;

