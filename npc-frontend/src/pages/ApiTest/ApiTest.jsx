/**
 * ============================================
 * API 对接测试页面 (ApiTest.jsx)
 * ============================================
 *
 * 【功能说明】
 * 用于测试 HTTP 适配器与后端 API 的对接
 *
 * 【测试内容】
 * 1. agents.create - 创建 NPC
 * 2. agents.getList - 获取 NPC 列表
 * 3. agents.getById - 获取 NPC 详情
 * 4. messages.send - 发送消息
 * 5. history.get - 获取对话历史
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React, { useState } from 'react';
import { Card, Button, Space, Typography, Divider, Alert, Spin } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title, Text, Paragraph } = Typography;

const ApiTest = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [testUserId] = useState('test_user_' + Date.now());
  const [createdAgentId, setCreatedAgentId] = useState(null);

  // 更新测试结果
  const updateResult = (testName, success, data, error) => {
    setResults(prev => ({
      ...prev,
      [testName]: { success, data, error, timestamp: Date.now() }
    }));
    setLoading(prev => ({ ...prev, [testName]: false }));
  };

  // 设置加载状态
  const setTestLoading = (testName, isLoading) => {
    setLoading(prev => ({ ...prev, [testName]: isLoading }));
  };

  // 测试 1: 创建 NPC
  const testCreateAgent = async () => {
    setTestLoading('createAgent', true);
    try {
      const response = await api.agents.create({
        userId: testUserId,
        name: `测试NPC_${Date.now()}`,
        type: 'special',
        systemPrompt: '你是一位测试助手，用于验证 API 对接是否正常。',
        model: 'gpt-4.1'
      });

      if (response.success) {
        setCreatedAgentId(response.data.id);
        updateResult('createAgent', true, response.data);
      } else {
        updateResult('createAgent', false, null, response.error);
      }
    } catch (error) {
      updateResult('createAgent', false, null, { message: error.message });
    }
  };

  // 测试 2: 获取 NPC 列表
  const testGetList = async () => {
    setTestLoading('getList', true);
    try {
      const response = await api.agents.getList(testUserId);

      if (response.success) {
        updateResult('getList', true, response.data);
      } else {
        updateResult('getList', false, null, response.error);
      }
    } catch (error) {
      updateResult('getList', false, null, { message: error.message });
    }
  };

  // 测试 3: 获取 NPC 详情
  const testGetById = async () => {
    if (!createdAgentId) {
      updateResult('getById', false, null, { message: '请先创建 NPC' });
      return;
    }

    setTestLoading('getById', true);
    try {
      const response = await api.agents.getById(createdAgentId, testUserId);

      if (response.success) {
        updateResult('getById', true, response.data);
      } else {
        updateResult('getById', false, null, response.error);
      }
    } catch (error) {
      updateResult('getById', false, null, { message: error.message });
    }
  };

  // 测试 4: 发送消息
  const testSendMessage = async () => {
    if (!createdAgentId) {
      updateResult('sendMessage', false, null, { message: '请先创建 NPC' });
      return;
    }

    setTestLoading('sendMessage', true);
    try {
      const response = await api.messages.send({
        userId: testUserId,
        agentId: createdAgentId,
        message: '你好，这是一条测试消息'
      });

      if (response.success) {
        updateResult('sendMessage', true, response.data);
      } else {
        updateResult('sendMessage', false, null, response.error);
      }
    } catch (error) {
      updateResult('sendMessage', false, null, { message: error.message });
    }
  };

  // 测试 5: 获取对话历史
  const testGetHistory = async () => {
    if (!createdAgentId) {
      updateResult('getHistory', false, null, { message: '请先创建 NPC 并发送消息' });
      return;
    }

    setTestLoading('getHistory', true);
    try {
      const response = await api.history.get(testUserId, createdAgentId);

      if (response.success) {
        updateResult('getHistory', true, response.data);
      } else {
        updateResult('getHistory', false, null, response.error);
      }
    } catch (error) {
      updateResult('getHistory', false, null, { message: error.message });
    }
  };

  // 渲染测试结果
  const renderResult = (testName, label) => {
    const result = results[testName];
    const isLoading = loading[testName];

    return (
      <Card 
        title={
          <Space>
            {isLoading && <LoadingOutlined />}
            {result && (result.success ? 
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            <span>{label}</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        {isLoading && <Spin tip="测试中..." />}
        {result && (
          <div>
            {result.success ? (
              <Alert
                message="测试通过"
                description={
                  <div>
                    <Text strong>返回数据：</Text>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, marginTop: 8 }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                }
                type="success"
                showIcon
              />
            ) : (
              <Alert
                message="测试失败"
                description={
                  <div>
                    <Text strong>错误信息：</Text>
                    <pre style={{ background: '#fff1f0', padding: 8, borderRadius: 4, marginTop: 8 }}>
                      {JSON.stringify(result.error, null, 2)}
                    </pre>
                  </div>
                }
                type="error"
                showIcon
              />
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>API 对接测试</Title>
      <Paragraph>
        <Text strong>当前模式：</Text>
        <Text code>{import.meta.env.VITE_API_MODE || 'mock'}</Text>
        <br />
        <Text strong>API 基础路径：</Text>
        <Text code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</Text>
        <br />
        <Text strong>测试用户 ID：</Text>
        <Text code>{testUserId}</Text>
      </Paragraph>

      <Divider />

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card>
          <Space wrap>
            <Button type="primary" onClick={testCreateAgent} loading={loading.createAgent}>
              1. 测试创建 NPC
            </Button>
            <Button onClick={testGetList} loading={loading.getList}>
              2. 测试获取列表
            </Button>
            <Button onClick={testGetById} loading={loading.getById} disabled={!createdAgentId}>
              3. 测试获取详情
            </Button>
            <Button onClick={testSendMessage} loading={loading.sendMessage} disabled={!createdAgentId}>
              4. 测试发送消息
            </Button>
            <Button onClick={testGetHistory} loading={loading.getHistory} disabled={!createdAgentId}>
              5. 测试获取历史
            </Button>
          </Space>
        </Card>

        {renderResult('createAgent', '创建 NPC')}
        {renderResult('getList', '获取 NPC 列表')}
        {renderResult('getById', '获取 NPC 详情')}
        {renderResult('sendMessage', '发送消息')}
        {renderResult('getHistory', '获取对话历史')}
      </Space>
    </div>
  );
};

export default ApiTest;

