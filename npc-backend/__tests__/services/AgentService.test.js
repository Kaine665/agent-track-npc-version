/**
 * AgentService 测试
 */

const agentService = require('../../services/AgentService');
const agentRepository = require('../../repositories/AgentRepository');
const sessionService = require('../../services/SessionService');
const eventService = require('../../services/EventService');

// Mock 依赖
jest.mock('../../repositories/AgentRepository');
jest.mock('../../services/SessionService');
jest.mock('../../services/EventService');
jest.mock('../../config/models', () => ({
  isValidModel: jest.fn((model) => {
    const validModels = ['openai/gpt-3.5-turbo', 'openai/gpt-4', 'anthropic/claude-3-sonnet'];
    return validModels.includes(model);
  }),
  isValidModelProvider: jest.fn(() => true),
  getModelProvider: jest.fn(() => 'openrouter'),
  isProviderEnabled: jest.fn(() => true)
}));

describe('AgentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAgent', () => {
    const validAgentData = {
      userId: 'test_user_123',
      name: 'Test Agent',
      type: 'general',
      model: 'openai/gpt-3.5-turbo',
      systemPrompt: 'You are a helpful assistant.'
    };

    it('应该成功创建 Agent', async () => {
      agentRepository.checkNameExists.mockResolvedValue(false);
      agentRepository.create.mockResolvedValue({
        id: 'agent_123',
        ...validAgentData,
        createdAt: Date.now()
      });

      const result = await agentService.createAgent(validAgentData);

      expect(result).toBeDefined();
      expect(result.name).toBe(validAgentData.name);
      expect(agentRepository.create).toHaveBeenCalled();
    });

    it('应该拒绝空 userId', async () => {
      await expect(agentService.createAgent({
        ...validAgentData,
        userId: ''
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '用户 ID 不能为空'
      });
    });

    it('应该拒绝空名称', async () => {
      await expect(agentService.createAgent({
        ...validAgentData,
        name: ''
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'NPC 名称不能为空'
      });
    });

    it('应该拒绝名称超过50字符', async () => {
      await expect(agentService.createAgent({
        ...validAgentData,
        name: 'a'.repeat(51)
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'NPC 名称不能超过 50 字符'
      });
    });

    it('应该拒绝无效的类型', async () => {
      await expect(agentService.createAgent({
        ...validAgentData,
        type: 'invalid_type'
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'NPC 类型必须是 general 或 special'
      });
    });

    it('应该拒绝无效的模型', async () => {
      await expect(agentService.createAgent({
        ...validAgentData,
        model: 'invalid-model'
      })).rejects.toMatchObject({
        code: 'INVALID_MODEL'
      });
    });

    it('应该拒绝 systemPrompt 超过5000字符', async () => {
      await expect(agentService.createAgent({
        ...validAgentData,
        systemPrompt: 'a'.repeat(5001)
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '人设描述不能超过 5000 字符'
      });
    });

    it('应该拒绝重复的名称', async () => {
      agentRepository.checkNameExists.mockResolvedValue(true);

      await expect(agentService.createAgent(validAgentData)).rejects.toMatchObject({
        code: 'DUPLICATE_NAME',
        message: '该名称已存在，请使用其他名称'
      });
    });

    it('应该支持 createdBy 字段（向后兼容）', async () => {
      agentRepository.checkNameExists.mockResolvedValue(false);
      agentRepository.create.mockResolvedValue({
        id: 'agent_123',
        createdBy: 'test_user_123',
        ...validAgentData,
        createdAt: Date.now()
      });

      const result = await agentService.createAgent({
        ...validAgentData,
        createdBy: 'test_user_123',
        userId: undefined
      });

      expect(result).toBeDefined();
      expect(agentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdBy: 'test_user_123'
        })
      );
    });
  });

  describe('getAgentList', () => {
    it('应该返回用户的 Agent 列表', async () => {
      const userId = 'test_user_123';
      const mockAgents = [
        {
          id: 'agent_1',
          createdBy: userId,
          name: 'Agent 1',
          createdAt: 1000
        },
        {
          id: 'agent_2',
          createdBy: userId,
          name: 'Agent 2',
          createdAt: 2000
        }
      ];

      agentRepository.findByUserId.mockResolvedValue(mockAgents);
      sessionService.getSessionsByUser.mockResolvedValue([]);

      const result = await agentService.getAgentList(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('应该返回空数组当 userId 为空', async () => {
      const result = await agentService.getAgentList('');
      expect(result).toEqual([]);
    });

    it('应该按 lastMessageAt 排序', async () => {
      const userId = 'test_user_123';
      const mockAgents = [
        { id: 'agent_1', createdBy: userId, name: 'Agent 1', createdAt: 1000 },
        { id: 'agent_2', createdBy: userId, name: 'Agent 2', createdAt: 2000 }
      ];

      const mockSessions = [
        {
          sessionId: 'session_1',
          agentId: 'agent_1',
          lastActiveAt: 3000,
          participants: [
            { id: userId, type: 'user' },
            { id: 'agent_1', type: 'agent' }
          ]
        }
      ];

      agentRepository.findByUserId.mockResolvedValue(mockAgents);
      sessionService.getSessionsByUser.mockResolvedValue(mockSessions);
      eventService.getRecentEvents.mockResolvedValue([
        { content: 'Last message', createdAt: 3000 }
      ]);

      const result = await agentService.getAgentList(userId);

      expect(result.length).toBe(2);
      // agent_1 有 lastMessageAt，应该排在前面
      expect(result[0].id).toBe('agent_1');
      expect(result[0].lastMessageAt).toBe(3000);
    });
  });

  describe('getAgentById', () => {
    it('应该返回 Agent 当 ID 存在', async () => {
      const agentId = 'agent_123';
      const mockAgent = {
        id: agentId,
        name: 'Test Agent'
      };

      agentRepository.findById.mockResolvedValue(mockAgent);

      const result = await agentService.getAgentById(agentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(agentId);
      expect(agentRepository.findById).toHaveBeenCalledWith(agentId);
    });

    it('应该返回 null 当 ID 不存在', async () => {
      agentRepository.findById.mockResolvedValue(null);

      const result = await agentService.getAgentById('nonexistent');

      expect(result).toBeNull();
    });

    it('应该返回 null 当 ID 为空', async () => {
      const result = await agentService.getAgentById('');
      expect(result).toBeNull();
    });
  });

  describe('updateAgent', () => {
    const agentId = 'agent_123';
    const userId = 'test_user_123';
    const existingAgent = {
      id: agentId,
      createdBy: userId,
      name: 'Old Name',
      type: 'general',
      model: 'openai/gpt-3.5-turbo',
      systemPrompt: 'Old prompt'
    };

    it('应该成功更新 Agent', async () => {
      agentRepository.findById.mockResolvedValue(existingAgent);
      agentRepository.checkNameExists.mockResolvedValue(false);
      agentRepository.update.mockResolvedValue({
        ...existingAgent,
        name: 'New Name'
      });

      const result = await agentService.updateAgent(agentId, userId, {
        name: 'New Name'
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('New Name');
      expect(agentRepository.update).toHaveBeenCalled();
    });

    it('应该拒绝更新不存在的 Agent', async () => {
      agentRepository.findById.mockResolvedValue(null);

      await expect(agentService.updateAgent(agentId, userId, {
        name: 'New Name'
      })).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
        message: 'NPC 不存在'
      });
    });

    it('应该拒绝更新其他用户的 Agent', async () => {
      agentRepository.findById.mockResolvedValue({
        ...existingAgent,
        createdBy: 'other_user'
      });

      await expect(agentService.updateAgent(agentId, userId, {
        name: 'New Name'
      })).rejects.toMatchObject({
        code: 'PERMISSION_DENIED',
        message: '无权修改此 NPC'
      });
    });

    it('应该拒绝更新为重复的名称', async () => {
      agentRepository.findById.mockResolvedValue(existingAgent);
      agentRepository.checkNameExists.mockResolvedValue(true);
      agentRepository.getExistingAgentIdByName.mockResolvedValue('other_agent');

      await expect(agentService.updateAgent(agentId, userId, {
        name: 'Duplicate Name'
      })).rejects.toMatchObject({
        code: 'DUPLICATE_NAME',
        message: '该名称已存在，请使用其他名称'
      });
    });

    it('应该允许更新为当前 Agent 的名称', async () => {
      agentRepository.findById.mockResolvedValue(existingAgent);
      agentRepository.checkNameExists.mockResolvedValue(true);
      agentRepository.getExistingAgentIdByName.mockResolvedValue(agentId);
      agentRepository.update.mockResolvedValue(existingAgent);

      const result = await agentService.updateAgent(agentId, userId, {
        name: existingAgent.name
      });

      expect(result).toBeDefined();
    });
  });

  describe('deleteAgent', () => {
    const agentId = 'agent_123';
    const userId = 'test_user_123';
    const existingAgent = {
      id: agentId,
      createdBy: userId,
      name: 'Test Agent'
    };

    it('应该成功软删除 Agent', async () => {
      agentRepository.findById.mockResolvedValue(existingAgent);
      agentRepository.update.mockResolvedValue({
        ...existingAgent,
        deleted: true,
        deletedAt: Date.now()
      });

      const result = await agentService.deleteAgent(agentId, userId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('NPC 已删除');
      expect(agentRepository.update).toHaveBeenCalledWith(
        agentId,
        expect.objectContaining({
          deleted: true
        })
      );
    });

    it('应该成功硬删除 Agent', async () => {
      agentRepository.findById.mockResolvedValue(existingAgent);
      agentRepository.remove.mockResolvedValue(true);

      const result = await agentService.deleteAgent(agentId, userId, {
        hardDelete: true
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('NPC 已永久删除');
      expect(agentRepository.remove).toHaveBeenCalledWith(agentId);
    });

    it('应该拒绝删除不存在的 Agent', async () => {
      agentRepository.findById.mockResolvedValue(null);

      await expect(agentService.deleteAgent(agentId, userId)).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
        message: 'NPC 不存在'
      });
    });

    it('应该拒绝删除其他用户的 Agent', async () => {
      agentRepository.findById.mockResolvedValue({
        ...existingAgent,
        createdBy: 'other_user'
      });

      await expect(agentService.deleteAgent(agentId, userId)).rejects.toMatchObject({
        code: 'PERMISSION_DENIED',
        message: '无权删除此 NPC'
      });
    });
  });
});

