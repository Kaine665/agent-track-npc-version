/**
 * SessionService 测试
 */

const sessionService = require('../../services/SessionService');
const sessionRepository = require('../../repositories/SessionRepository');

// Mock Repository
jest.mock('../../repositories/SessionRepository');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateSession', () => {
    const validParticipants = [
      { type: 'user', id: 'test_user_123' },
      { type: 'agent', id: 'test_agent_123' }
    ];

    it('应该成功获取或创建会话', async () => {
      const mockSession = {
        sessionId: 'session_123',
        participants: validParticipants,
        createdAt: Date.now(),
        lastActiveAt: Date.now()
      };

      sessionRepository.getOrCreateSession.mockResolvedValue(mockSession);

      const result = await sessionService.getOrCreateSession(validParticipants);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session_123');
      expect(sessionRepository.getOrCreateSession).toHaveBeenCalledWith(validParticipants);
    });

    it('应该拒绝空的参与者列表', async () => {
      await expect(sessionService.getOrCreateSession([])).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '参与者列表不能为空'
      });
    });

    it('应该拒绝非数组的参与者', async () => {
      await expect(sessionService.getOrCreateSession(null)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '参与者列表不能为空'
      });
    });

    it('应该拒绝缺少 type 的参与者', async () => {
      await expect(sessionService.getOrCreateSession([
        { id: 'test_user_123' }
      ])).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '参与者必须包含 type 和 id 字段'
      });
    });

    it('应该拒绝缺少 id 的参与者', async () => {
      await expect(sessionService.getOrCreateSession([
        { type: 'user' }
      ])).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '参与者必须包含 type 和 id 字段'
      });
    });

    it('应该拒绝无效的参与者类型', async () => {
      await expect(sessionService.getOrCreateSession([
        { type: 'invalid', id: 'test_123' }
      ])).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '参与者类型必须是 user 或 agent'
      });
    });

    it('应该处理 Repository 错误', async () => {
      sessionRepository.getOrCreateSession.mockRejectedValue(new Error('Database error'));

      await expect(sessionService.getOrCreateSession(validParticipants)).rejects.toMatchObject({
        code: 'SYSTEM_ERROR',
        message: '获取或创建会话失败，请稍后重试'
      });
    });
  });

  describe('findSessionByParticipants', () => {
    const validParticipants = [
      { type: 'user', id: 'test_user_123' },
      { type: 'agent', id: 'test_agent_123' }
    ];

    it('应该返回会话当存在', async () => {
      const mockSession = {
        sessionId: 'session_123',
        participants: validParticipants
      };

      sessionRepository.findSessionByParticipants.mockResolvedValue(mockSession);

      const result = await sessionService.findSessionByParticipants(validParticipants);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session_123');
    });

    it('应该返回 null 当不存在', async () => {
      sessionRepository.findSessionByParticipants.mockResolvedValue(null);

      const result = await sessionService.findSessionByParticipants(validParticipants);

      expect(result).toBeNull();
    });

    it('应该返回 null 当参与者列表为空', async () => {
      const result = await sessionService.findSessionByParticipants([]);
      expect(result).toBeNull();
    });
  });

  describe('getSessionsByUser', () => {
    it('应该返回用户的所有会话', async () => {
      const userId = 'test_user_123';
      const mockSessions = [
        {
          sessionId: 'session_1',
          participants: [
            { type: 'user', id: userId },
            { type: 'agent', id: 'agent_1' }
          ]
        },
        {
          sessionId: 'session_2',
          participants: [
            { type: 'user', id: userId },
            { type: 'agent', id: 'agent_2' }
          ]
        }
      ];

      sessionRepository.findSessionsByUser.mockResolvedValue(mockSessions);

      const result = await sessionService.getSessionsByUser(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(sessionRepository.findSessionsByUser).toHaveBeenCalledWith(userId);
    });

    it('应该返回空数组当用户没有会话', async () => {
      sessionRepository.findSessionsByUser.mockResolvedValue([]);

      const result = await sessionService.getSessionsByUser('test_user_123');

      expect(result).toEqual([]);
    });
  });

  describe('updateSessionActivity', () => {
    it('应该成功更新会话活动时间', async () => {
      const sessionId = 'session_123';

      sessionRepository.updateSessionActivity.mockResolvedValue(true);

      await sessionService.updateSessionActivity(sessionId);

      expect(sessionRepository.updateSessionActivity).toHaveBeenCalledWith(sessionId);
    });
  });
});

