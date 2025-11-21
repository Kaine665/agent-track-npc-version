/**
 * ============================================
 * 创建 NPC 页面 (CreateAgent.jsx)
 * ============================================
 *
 * 【功能说明】
 * 提供创建 NPC 的表单页面，支持基本信息配置
 *
 * 【工作流程】
 * 1. 填写表单（名称、类型、人设、模型）
 * 2. 实时验证
 * 3. 提交表单
 * 4. 创建成功跳转列表页
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Form, 
  Radio, 
  Select, 
  Space, 
  message,
  Alert
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Card from '../../components/Card/Card';

const { Header, Content } = Layout;
const { Title } = Typography;
const { Option } = Select;

const CreateAgent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 检查登录状态
  useEffect(() => {
    if (!user) {
      message.warning('请先登录');
      navigate('/agents');
    }
  }, [user, navigate]);

  // 支持的模型列表（统一使用 OpenRouter）
  const modelOptions = [
    { value: 'anthropic/claude-sonnet-4.5', label: 'Claude Sonnet 4.5 (推荐)' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4' },
    { value: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet' },
    { value: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro Preview' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'openai/gpt-5', label: 'GPT-5' },
    { value: 'openai/gpt-4.1', label: 'GPT-4.1' },
    { value: 'tngtech/deepseek-r1t2-chimera:free', label: 'DeepSeek R1 T2 Chimera (免费)' },
  ];

  // 提交表单
  const handleSubmit = async (values) => {
    if (!user) {
      message.warning('请先登录');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        userId: user.id,
        ...values,
        // 如果未提供头像，API 会生成默认头像
      };

      const response = await api.agents.create(payload);

      if (response.success) {
        message.success('创建成功！');
        // 跳转时传递刷新标志，让列表页知道需要刷新
        navigate('/agents', { state: { refresh: true } });
      } else {
        throw new Error(response.error?.message || '创建失败');
      }
    } catch (err) {
      console.error('Create agent error:', err);
      setError(err.message);
      message.error(`创建失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const handleCancel = () => {
    navigate('/agents');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        zIndex: 1
      }}>
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={handleCancel}
          style={{ marginRight: 16 }}
        />
        <Title level={4} style={{ margin: 0 }}>创建新 NPC</Title>
      </Header>

      {/* 内容区域 */}
      <Content style={{ padding: '24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <Card variant="borderless">
          {/* API 模式提示 */}
          {api.mode === 'mock' && (
            <Alert
              message="当前使用 Mock 模式"
              description="后端服务未连接，数据仅保存在内存中，刷新页面后会丢失。请确保后端服务已启动（运行在 http://localhost:8000）。"
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}
          
          {error && (
            <Alert
              message="创建失败"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              type: 'general',
              model: 'anthropic/claude-sonnet-4.5'
            }}
          >
            <Form.Item
              label="名称"
              name="name"
              rules={[
                { required: true, message: '请输入 NPC 名称' },
                { max: 50, message: '名称不能超过 50 个字符' }
              ]}
            >
              <Input placeholder="给你的 NPC 起个名字，例如：学习教练" maxLength={50} showCount />
            </Form.Item>

            <Form.Item
              label="类型"
              name="type"
              rules={[{ required: true, message: '请选择 NPC 类型' }]}
            >
              <Radio.Group>
                <Radio value="general">通用助手</Radio>
                <Radio value="special">特定角色</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              label="人设描述 (System Prompt)"
              name="systemPrompt"
              rules={[
                { required: true, message: '请输入人设描述' },
                { min: 10, message: '描述至少需要 10 个字符' },
                { max: 5000, message: '描述不能超过 5000 个字符' }
              ]}
              help="详细描述 NPC 的性格、能力和行为方式"
            >
              <Input 
                type="textarea" 
                rows={6} 
                placeholder="你是一位专业的学习教练，擅长..." 
                maxLength={5000} 
                showCount 
              />
            </Form.Item>

            <Form.Item
              label="使用模型"
              name="model"
              rules={[{ required: true, message: '请选择模型' }]}
            >
              <Select placeholder="选择 LLM 模型">
                {modelOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="头像 URL (可选)"
              name="avatarUrl"
              rules={[{ type: 'url', message: '请输入有效的 URL' }]}
            >
              <Input placeholder="https://example.com/avatar.png" />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Space size="middle" style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleCancel} disabled={loading}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  创建 NPC
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default CreateAgent;

