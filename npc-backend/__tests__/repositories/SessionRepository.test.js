/**
 * SessionRepository 测试
 */

const sessionRepository = require('../../repositories/SessionRepository');
const { query } = require('../../config/database');

// Mock 数据库
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('SessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeParticipants', () => {
    it('应该对参与者列表进行排序', () => {
      const participants = [
        { type: 'agent', id: 'agent_2' },
        { type: 'user', id: 'user_1' },
        { type: 'agent', id: 'agent_1' }
      ];

      const normalized = sessionRepository.normalizeParticipants(participants);

      expect(normalized[0].type).toBe('user');
      expect(normalized[1].type).toBe('agent');
      expect(normalized[1].id).toBe('agent_1'); // agent_1 应该在 agent_2 之前
    });
  });

  describe('getOrCreateSession', () => {
    const participants = [
      { type: 'user', id: 'test_user_123' },
      { type: 'agent', id: 'test_agent_123' }
    ];

    it('应该返回现有会话当存在', async () => {
      const mockSession = {
        session_id: 'session_123',
        participants: JSON.stringify(participants),
        created_at: 1000,
        last_active_at: 2000
      };

      query.mockResolvedValueOnce([mockSession]); // 查找会话

      const result = await sessionRepository.getOrCreateSession(participants);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe('session_123');
    });

    it('应该创建新会话当不存在', async () => {
      query.mockResolvedValueOnce([]) // 查找会话（不存在）
        .mockResolvedValueOnce([]); // 插入会话

      const result = await sessionRepository.getOrCreateSession(participants);

      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(query).toHaveBeenCalledTimes(2);
    });
  });

  describe('findBySessionId', () => {
    it('应该返回会话当存在', async () => {
      const sessionId = 'session_123';
      const mockSession = {
        session_id: sessionId,
        participants: JSON.stringify([
          { type: 'user', id: 'test_user_123' },
          { type: 'agent', id: 'test_agent_123' }
        ]),
        created_at: 1000,
        last_active_at: 2000
      };

      query.mockResolvedValue([mockSession]);

      const result = await sessionRepository.findBySessionId(sessionId);

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(sessionId);
    });

    it('应该返回 null 当不存在', async () => {
      query.mockResolvedValue([]);

      const result = await sessionRepository.findBySessionId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('应该返回用户的所有会话', async () => {
      const userId = 'test_user_123';
      const mockSessions = [
        {
          session_id: 'session_1',
          participants: JSON.stringify([
            { type: 'user', id: userId },
            { type: 'agent', id: 'agent_1' }
          ])
        },
        {
          session_id: 'session_2',
          participants: JSON.stringify([
            { type: 'user', id: userId },
            { type: 'agent', id: 'agent_2' }
          ])
        }
      ];

      query.mockResolvedValue(mockSessions);

      const result = await sessionRepository.findByUserId(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('updateLastActiveAt', () => {
    it('应该成功更新活动时间', async () => {
      const sessionId = 'session_123';
      const timestamp = Date.now();

      query.mockResolvedValue([{ affectedRows: 1 }]);

      await sessionRepository.updateLastActiveAt(sessionId, timestamp);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions SET last_active_at'),
        expect.arrayContaining([timestamp, sessionId])
      );
    });
  });
});

