/**
 * EventService 测试
 */

const eventService = require('../../services/EventService');
const eventRepository = require('../../repositories/EventRepository');
const sessionService = require('../../services/SessionService');
const agentService = require('../../services/AgentService');

// Mock 依赖
jest.mock('../../repositories/EventRepository');
jest.mock('../../services/SessionService');
jest.mock('../../services/AgentService');

describe('EventService', () => {
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
      const mockEvent = {
        id: 'event_123',
        ...validEventData,
        createdAt: Date.now()
      };

      agentService.getAgentById.mockResolvedValue({ id: 'test_agent_123' });
      eventRepository.create.mockResolvedValue(mockEvent);
      sessionService.updateLastActiveAt.mockResolvedValue(true);

      const result = await eventService.createEvent(validEventData);

      expect(result).toBeDefined();
      expect(result.id).toBe('event_123');
      expect(eventRepository.create).toHaveBeenCalled();
      expect(sessionService.updateLastActiveAt).toHaveBeenCalled();
    });

    it('应该拒绝空 sessionId', async () => {
      await expect(eventService.createEvent({
        ...validEventData,
        sessionId: ''
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '会话 ID 不能为空'
      });
    });

    it('应该拒绝空 content', async () => {
      await expect(eventService.createEvent({
        ...validEventData,
        content: ''
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '消息内容不能为空'
      });
    });

    it('应该拒绝 content 超过50000字符', async () => {
      await expect(eventService.createEvent({
        ...validEventData,
        content: 'a'.repeat(50001)
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '消息内容不能超过 50000 字符'
      });
    });

    it('应该拒绝无效的 fromType', async () => {
      await expect(eventService.createEvent({
        ...validEventData,
        fromType: 'invalid'
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '发送者类型必须是 user 或 agent'
      });
    });

    it('应该拒绝无效的 toType', async () => {
      await expect(eventService.createEvent({
        ...validEventData,
        toType: 'invalid'
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '接收者类型必须是 user 或 agent'
      });
    });

    it('应该拒绝不存在的 Agent', async () => {
      agentService.getAgentById.mockResolvedValue(null);

      await expect(eventService.createEvent(validEventData)).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
        message: 'Agent 不存在'
      });
    });
  });

  describe('getRecentEvents', () => {
    it('应该返回最近的事件', async () => {
      const sessionId = 'session_123';
      const limit = 20;
      const mockEvents = [
        {
          id: 'event_1',
          sessionId,
          content: 'Message 1',
          createdAt: 1000
        },
        {
          id: 'event_2',
          sessionId,
          content: 'Message 2',
          createdAt: 2000
        }
      ];

      eventRepository.findRecentBySessionId.mockResolvedValue(mockEvents);

      const result = await eventService.getRecentEvents(sessionId, limit);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(eventRepository.findRecentBySessionId).toHaveBeenCalledWith(sessionId, limit);
    });

    it('应该使用默认 limit', async () => {
      eventRepository.findRecentBySessionId.mockResolvedValue([]);

      await eventService.getRecentEvents('session_123');

      expect(eventRepository.findRecentBySessionId).toHaveBeenCalledWith('session_123', 20);
    });
  });

  describe('getEventsBySessionId', () => {
    it('应该返回会话的所有事件', async () => {
      const sessionId = 'session_123';
      const mockEvents = [
        { id: 'event_1', sessionId, content: 'Message 1' },
        { id: 'event_2', sessionId, content: 'Message 2' }
      ];

      eventRepository.findBySessionId.mockResolvedValue(mockEvents);

      const result = await eventService.getEventsBySessionId(sessionId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(eventRepository.findBySessionId).toHaveBeenCalledWith(sessionId);
    });
  });
});

