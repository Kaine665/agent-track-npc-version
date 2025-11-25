import React, { useState } from 'react';
import { Modal, Input, Form, Button, message, Alert } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from './ForgotPasswordModal';

const LoginModal = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login(values.userId, values.password);
      if (result.success) {
        onClose();
        form.resetFields();
      } else {
        // 如果用户不存在，提示去注册
        if (result.error && result.error.code === 'USER_NOT_FOUND') {
          setError(
            <div>
              用户不存在，<Button type="link" style={{padding: 0}} onClick={() => {
                onClose();
                navigate('/register');
              }}>去注册</Button>
            </div>
          );
        } else {
          setError(result.error?.message || '登录失败');
        }
      }
    } catch (err) {
      setError('发生未知错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="用户登录"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
    >
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="userId"
          label="User ID"
          rules={[{ required: true, message: '请输入 User ID' }]}
        >
          <Input placeholder="例如: user_123" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password placeholder="请输入密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            确认登录
          </Button>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
          <Button 
            type="link" 
            onClick={() => {
              setForgotPasswordVisible(true);
            }}
            style={{ padding: 0 }}
          >
            忘记密码？
          </Button>
        </Form.Item>
      </Form>

      <ForgotPasswordModal
        open={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
      />
    </Modal>
  );
};

export default LoginModal;

