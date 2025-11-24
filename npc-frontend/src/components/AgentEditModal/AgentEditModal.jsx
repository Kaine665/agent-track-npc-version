/**
 * ============================================
 * NPC 编辑模态框组件 (AgentEditModal.jsx)
 * ============================================
 *
 * 【功能说明】
 * 提供编辑 NPC 信息的模态框，支持修改名称、人设、模型等
 *
 * 【工作流程】
 * 1. 接收 Agent 数据并初始化表单
 * 2. 用户修改表单字段
 * 3. 提交更新
 * 4. 调用更新 API
 * 5. 触发成功回调
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import React, { useEffect } from 'react';
import { Modal, Form, Select, Input, message } from 'antd';
import api from '../../api';
import CustomInput from '../Input/Input';
import styles from './AgentEditModal.module.css';

const { Option } = Select;
const { TextArea } = Input;

/**
 * NPC 编辑模态框组件
 *
 * @param {Object} props - 组件属性
 * @param {Object} props.agent - 要编辑的 Agent 对象
 * @param {boolean} props.open - 是否显示模态框
 * @param {Function} props.onCancel - 取消回调
 * @param {Function} props.onSuccess - 成功回调
 */
const AgentEditModal = ({ agent, open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

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

  // 当 Agent 数据变化时，更新表单初始值
  useEffect(() => {
    if (agent && open) {
      form.setFieldsValue({
        name: agent.name,
        systemPrompt: agent.systemPrompt || '',
        model: agent.model,
      });
    }
  }, [agent, open, form]);

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await api.agents.update(agent.id, agent.createdBy, values);
      
      if (response.success) {
        message.success('NPC 更新成功');
        form.resetFields();
        onSuccess && onSuccess(response.data);
        onCancel && onCancel();
      } else {
        throw new Error(response.error?.message || '更新失败');
      }
    } catch (error) {
      console.error('Update agent error:', error);
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error(error.message || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 取消操作
  const handleCancel = () => {
    form.resetFields();
    onCancel && onCancel();
  };

  return (
    <Modal
      title="编辑 NPC"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="保存"
      cancelText="取消"
      width={600}
      className={styles.modal}
    >
      <Form
        form={form}
        layout="vertical"
        className={styles.form}
      >
        <Form.Item
          name="name"
          label="NPC 名称"
          rules={[
            { required: true, message: '请输入 NPC 名称' },
            { max: 50, message: '名称不能超过 50 个字符' },
          ]}
        >
          <CustomInput placeholder="请输入 NPC 名称" />
        </Form.Item>

        <Form.Item
          name="systemPrompt"
          label="人设描述"
          rules={[
            { max: 5000, message: '人设描述不能超过 5000 个字符' },
          ]}
        >
          <TextArea
            rows={6}
            placeholder="请输入 NPC 的人设描述（可选）"
            showCount
            maxLength={5000}
          />
        </Form.Item>

        <Form.Item
          name="model"
          label="AI 模型"
          rules={[{ required: true, message: '请选择 AI 模型' }]}
        >
          <Select placeholder="请选择 AI 模型" size="large">
            {modelOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AgentEditModal;

