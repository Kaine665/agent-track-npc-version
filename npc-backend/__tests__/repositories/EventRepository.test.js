/**
 * EventRepository 测试
 */

const eventRepository = require('../../repositories/EventRepository');
const { query } = require('../../config/database');

// Mock 数据库
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('EventRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    const validEventData = {
      sessionId: 'session_123',
      userId: 'test_user_123',
      agentId: 'test_agent_123',
      fromType: 'user',
      fromId: 'test_user_123',
      toType: 'agent',
      toId: 'test_agent_123',
      content: 'Test message'
    };

    it('应该成功创建事件', async () => {
      query.mockResolvedValue([]);

      const result = await eventRepository.createEvent(validEventData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.content).toBe(validEventData.content);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO events'),
        expect.any(Array)
      );
    });

    it('应该生成唯一的事件 ID', async () => {
      query.mockResolvedValue([]);

      const result1 = await eventRepository.createEvent(validEventData);
      const result2 = await eventRepository.createEvent(validEventData);

      expect(result1.id).not.toBe(result2.id);
      expect(result1.id).toMatch(/^event_\d+_[a-z0-9]+$/);
    });
  });

  describe('getEventsBySession', () => {
    it('应该返回会话的所有事件', async () => {
      const sessionId = 'session_123';
      const mockEvents = [
        {
          id: 'event_1',
          session_id: sessionId,
          content: 'Message 1',
          timestamp: 1000
        },
        {
          id: 'event_2',
          session_id: sessionId,
          content: 'Message 2',
          timestamp: 2000
        }
      ];

      query.mockResolvedValue(mockEvents);

      const result = await eventRepository.getEventsBySession(sessionId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT[\s\S]*FROM events[\s\S]*WHERE session_id/),
        [sessionId]
      );
    });

    it('应该按时间升序排序', async () => {
      const sessionId = 'session_123';
      query.mockResolvedValue([]);

      await eventRepository.getEventsBySession(sessionId);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp ASC'),
        expect.any(Array)
      );
    });
  });

  describe('getRecentEvents', () => {
    it('应该返回最近 N 条事件', async () => {
      const sessionId = 'session_123';
      const limit = 20;
      const mockEvents = [
        { id: 'event_1', session_id: sessionId, content: 'Message 1' },
        { id: 'event_2', session_id: sessionId, content: 'Message 2' }
      ];

      query.mockResolvedValue(mockEvents);

      const result = await eventRepository.getRecentEvents(sessionId, limit);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.any(Array)
      );
    });

    it('应该按时间倒序排序（最新的在前）', async () => {
      query.mockResolvedValue([]);

      await eventRepository.getRecentEvents('session_123', 20);

      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY timestamp DESC'),
        expect.any(Array)
      );
    });
  });

  // 注意：EventRepository 目前没有 findByUserId 和 findByAgentId 方法
  // 这些功能可能在未来添加，或者通过其他方式实现
});

