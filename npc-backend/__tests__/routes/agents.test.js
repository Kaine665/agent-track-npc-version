/**
 * Agents API 路由测试
 */

const request = require('supertest');
const express = require('express');
const agentsRouter = require('../../routes/agents');
const agentService = require('../../services/AgentService');
const { authenticate } = require('../../middleware/auth');

// Mock 依赖
jest.mock('../../services/AgentService');
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    // Mock 认证中间件：直接通过，设置 req.user
    req.user = {
      userId: 'test_user_123',
      username: 'testuser'
    };
    next();
  })
}));

const app = express();
app.use(express.json());
app.use('/api/v1/agents', agentsRouter);

describe('Agents API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/agents', () => {
    it('应该成功创建 Agent', async () => {
      const agentData = {
        userId: 'test_user_123',
        name: 'Test Agent',
        type: 'general',
        model: 'openai/gpt-3.5-turbo',
        systemPrompt: 'You are helpful'
      };

      const mockAgent = {
        id: 'agent_123',
        ...agentData,
        createdAt: Date.now()
      };

      agentService.createAgent.mockResolvedValue(mockAgent);

      const response = await request(app)
        .post('/api/v1/agents')
        .send(agentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('agent_123');
      expect(response.body.data.name).toBe(agentData.name);
      expect(agentService.createAgent).toHaveBeenCalled();
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'NPC 类型必须是 general 或 special'
      };
      agentService.createAgent.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/agents')
        .send({
          name: 'Test Agent'
          // 缺少其他必填字段
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该处理验证错误', async () => {
      const error = {
        code: 'VALIDATION_ERROR',
        message: 'NPC 名称不能为空'
      };
      agentService.createAgent.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/agents')
        .send({
          userId: 'test_user_123',
          name: '',
          type: 'general',
          model: 'openai/gpt-3.5-turbo'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该处理重复名称错误', async () => {
      const error = {
        code: 'DUPLICATE_NAME',
        message: '该名称已存在，请使用其他名称'
      };
      agentService.createAgent.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/agents')
        .send({
          userId: 'test_user_123',
          name: 'Existing Agent',
          type: 'general',
          model: 'openai/gpt-3.5-turbo'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_NAME');
    });
  });

  describe('GET /api/v1/agents', () => {
    it('应该返回用户的 Agent 列表', async () => {
      const mockAgents = [
        {
          id: 'agent_1',
          name: 'Agent 1',
          type: 'general',
          model: 'openai/gpt-3.5-turbo'
        },
        {
          id: 'agent_2',
          name: 'Agent 2',
          type: 'special',
          model: 'openai/gpt-4'
        }
      ];

      agentService.getAgentList.mockResolvedValue(mockAgents);

      const response = await request(app)
        .get('/api/v1/agents')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.agents)).toBe(true);
      expect(response.body.data.agents.length).toBe(2);
      expect(response.body.data.total).toBe(2);
      expect(agentService.getAgentList).toHaveBeenCalledWith('test_user_123');
    });
  });

  describe('GET /api/v1/agents/:id', () => {
    it('应该返回 Agent 详情', async () => {
      const agentId = 'agent_123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent',
        type: 'general',
        model: 'openai/gpt-3.5-turbo',
        createdBy: 'test_user_123' // 必须匹配认证中间件中的userId
      };

      agentService.getAgentById.mockResolvedValue(mockAgent);

      const response = await request(app)
        .get(`/api/v1/agents/${agentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(agentId);
      expect(agentService.getAgentById).toHaveBeenCalledWith(agentId);
    });

    it('应该处理 Agent 不存在', async () => {
      agentService.getAgentById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/agents/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/agents/:id', () => {
    it('应该成功更新 Agent', async () => {
      const agentId = 'agent_123';
      const updateData = {
        name: 'Updated Name',
        systemPrompt: 'Updated prompt'
      };

      const mockUpdatedAgent = {
        id: agentId,
        name: 'Updated Name',
        systemPrompt: 'Updated prompt'
      };

      agentService.updateAgent.mockResolvedValue(mockUpdatedAgent);

      const response = await request(app)
        .put(`/api/v1/agents/${agentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(agentService.updateAgent).toHaveBeenCalledWith(
        agentId,
        'test_user_123',
        updateData
      );
    });

    it('应该处理权限错误', async () => {
      const error = new Error('无权修改此 NPC');
      error.code = 'PERMISSION_DENIED';
      agentService.updateAgent.mockRejectedValue(error);

      const response = await request(app)
        .put('/api/v1/agents/other_user_agent')
        .send({ name: 'New Name' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('DELETE /api/v1/agents/:id', () => {
    it('应该成功删除 Agent（软删除）', async () => {
      const agentId = 'agent_123';
      const mockResult = {
        success: true,
        message: 'NPC 已删除',
        deletedAt: Date.now()
      };

      agentService.deleteAgent.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete(`/api/v1/agents/${agentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success).toBe(true);
      expect(agentService.deleteAgent).toHaveBeenCalledWith(
        agentId,
        'test_user_123',
        { hardDelete: false }
      );
    });

    it('应该支持硬删除', async () => {
      const agentId = 'agent_123';
      const mockResult = {
        success: true,
        message: 'NPC 已永久删除',
        deletedAt: Date.now()
      };

      agentService.deleteAgent.mockResolvedValue(mockResult);

      const response = await request(app)
        .delete(`/api/v1/agents/${agentId}?hardDelete=true`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(agentService.deleteAgent).toHaveBeenCalledWith(
        agentId,
        'test_user_123',
        { hardDelete: true }
      );
    });

    it('应该处理权限错误', async () => {
      const error = new Error('无权删除此 NPC');
      error.code = 'PERMISSION_DENIED';
      agentService.deleteAgent.mockRejectedValue(error);

      const response = await request(app)
        .delete('/api/v1/agents/other_user_agent')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PERMISSION_DENIED');
    });
  });
});

