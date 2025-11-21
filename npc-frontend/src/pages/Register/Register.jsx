import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, Alert } from 'antd';
import { UserOutlined, LockOutlined, IdcardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title } = Typography;

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const result = await register(values.userId, values.username, values.password);
      if (result.success) {
        navigate('/agents'); // 注册成功后跳转到列表页
      } else {
        setError(result.error?.message || '注册失败');
      }
    } catch (err) {
      setError('发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5' 
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>注册新用户</Title>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="userId"
            label="User ID"
            rules={[
              { required: true, message: '请输入 User ID' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: 'User ID 只能包含字母、数字和下划线' }
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="设置您的唯一 ID" />
          </Form.Item>

          <Form.Item
            name="username"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="设置您的显示昵称" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="设置密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/agents')}>
              返回首页
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;

