/**
 * AgentRepository 测试
 */

const agentRepository = require('../../repositories/AgentRepository');
const { query } = require('../../config/database');

// Mock 数据库
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('AgentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建 Agent', async () => {
      const agentData = {
        createdBy: 'test_user_123',
        name: 'Test Agent',
        type: 'general',
        model: 'openai/gpt-3.5-turbo',
        provider: 'openrouter',
        systemPrompt: 'You are helpful',
        avatarUrl: null
      };

      query.mockResolvedValue([]);

      const result = await agentRepository.create(agentData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(agentData.name);
      expect(result.createdBy).toBe(agentData.createdBy);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO agents'),
        expect.any(Array)
      );
    });

    it('应该生成唯一的 Agent ID', async () => {
      const agentData = {
        createdBy: 'test_user_123',
        name: 'Test Agent',
        type: 'general',
        model: 'openai/gpt-3.5-turbo',
        systemPrompt: 'You are helpful'
      };

      query.mockResolvedValue([]);

      const result1 = await agentRepository.create(agentData);
      const result2 = await agentRepository.create(agentData);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^agent_\d+_[a-z0-9]+$/);
    });
  });

  describe('findById', () => {
    it('应该返回 Agent 当 ID 存在', async () => {
      const agentId = 'agent_123';
      const mockAgent = {
        id: agentId,
        user_id: 'test_user_123',
        name: 'Test Agent',
        type: 'general',
        model: 'openai/gpt-3.5-turbo',
        provider: 'openrouter',
        system_prompt: 'You are helpful',
        avatar_url: null,
        created_at: 1000,
        updated_at: 1000,
        deleted: false,
        deleted_at: null
      };

      query.mockResolvedValue([mockAgent]);

      const result = await agentRepository.findById(agentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(agentId);
      expect(result.name).toBe('Test Agent');
      expect(result.createdBy).toBe('test_user_123'); // 字段名转换
      expect(result.systemPrompt).toBe('You are helpful'); // 字段名转换
    });

    it('应该返回 null 当 ID 不存在', async () => {
      query.mockResolvedValue([]);

      const result = await agentRepository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('应该返回用户的 Agent 列表', async () => {
      const userId = 'test_user_123';
      const mockAgents = [
        {
          id: 'agent_1',
          user_id: userId,
          name: 'Agent 1',
          type: 'general',
          model: 'openai/gpt-3.5-turbo',
          provider: 'openrouter',
          system_prompt: 'Prompt 1',
          created_at: 1000,
          updated_at: 1000,
          deleted: false,
          deleted_at: null
        },
        {
          id: 'agent_2',
          user_id: userId,
          name: 'Agent 2',
          type: 'special',
          model: 'openai/gpt-4',
          provider: 'openrouter',
          system_prompt: 'Prompt 2',
          created_at: 2000,
          updated_at: 2000,
          deleted: false,
          deleted_at: null
        }
      ];

      query.mockResolvedValue(mockAgents);

      const result = await agentRepository.findByUserId(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM agents'),
        expect.arrayContaining([userId])
      );
    });

    it('应该排除已删除的 Agent', async () => {
      const userId = 'test_user_123';
      const mockAgents = [
        {
          id: 'agent_1',
          user_id: userId,
          name: 'Active Agent',
          deleted: false,
          deleted_at: null
        }
      ];

      query.mockResolvedValue(mockAgents);

      const result = await agentRepository.findByUserId(userId);

      expect(result.length).toBe(1);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('deleted IS NULL OR deleted = FALSE'),
        expect.any(Array)
      );
    });
  });

  describe('checkNameExists', () => {
    it('应该返回 true 当名称已存在', async () => {
      const userId = 'test_user_123';
      const name = 'Existing Agent';

      query.mockResolvedValue([{ count: 1 }]);

      const result = await agentRepository.checkNameExists(userId, name);

      expect(result).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        expect.arrayContaining([userId, name])
      );
    });

    it('应该返回 false 当名称不存在', async () => {
      query.mockResolvedValue([{ count: 0 }]);

      const result = await agentRepository.checkNameExists('test_user_123', 'New Agent');

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    it('应该成功更新 Agent', async () => {
      const agentId = 'agent_123';
      const updateData = {
        name: 'Updated Name',
        systemPrompt: 'Updated prompt'
      };

      query.mockResolvedValue([{
        affectedRows: 1
      }]);

      query.mockResolvedValueOnce([{
        affectedRows: 1
      }]).mockResolvedValueOnce([{
        id: agentId,
        user_id: 'test_user_123',
        name: 'Updated Name',
        system_prompt: 'Updated prompt',
        created_at: 1000,
        updated_at: 2000
      }]);

      const result = await agentRepository.update(agentId, updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE agents'),
        expect.any(Array)
      );
    });

    it('应该转换字段名（驼峰到下划线）', async () => {
      const agentId = 'agent_123';
      const updateData = {
        systemPrompt: 'Updated prompt'
      };

      query.mockResolvedValue([{ affectedRows: 1 }]);
      query.mockResolvedValueOnce([{ affectedRows: 1 }]).mockResolvedValueOnce([{
        id: agentId,
        system_prompt: 'Updated prompt'
      }]);

      await agentRepository.update(agentId, updateData);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('system_prompt'),
        expect.any(Array)
      );
    });
  });

  describe('remove', () => {
    it('应该成功删除 Agent', async () => {
      const agentId = 'agent_123';

      query.mockResolvedValue([{ affectedRows: 1 }]);

      await agentRepository.remove(agentId);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM agents'),
        [agentId]
      );
    });
  });
});

