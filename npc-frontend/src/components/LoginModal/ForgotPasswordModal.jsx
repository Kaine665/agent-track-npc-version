import React, { useState } from 'react';
import { Modal, Input, Form, Button, Alert, message } from 'antd';
import api from '../../api';

const ForgotPasswordModal = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.users.forgotPassword(values.userId, values.newPassword);
      if (response.success) {
        message.success('密码重置成功，请使用新密码登录');
        form.resetFields();
        onClose();
      } else {
        if (response.error?.code === 'USER_NOT_FOUND') {
          setError('账号不存在');
        } else {
          setError(response.error?.message || '重置密码失败');
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
      title="忘记密码"
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
          label="账号（User ID）"
          rules={[{ required: true, message: '请输入账号' }]}
        >
          <Input placeholder="请输入您的账号（User ID）" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 1, message: '密码不能为空' }
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            重置密码
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ForgotPasswordModal;




