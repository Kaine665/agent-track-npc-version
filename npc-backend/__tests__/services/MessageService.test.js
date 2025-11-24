/**
 * MessageService 测试
 */

const messageService = require('../../services/MessageService');
const sessionService = require('../../services/SessionService');
const eventService = require('../../services/EventService');
const agentService = require('../../services/AgentService');
const llmService = require('../../services/LLMService');

// Mock 依赖
jest.mock('../../services/SessionService');
jest.mock('../../services/EventService');
jest.mock('../../services/AgentService');
jest.mock('../../services/LLMService');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    const validOptions = {
      userId: 'test_user_123',
      agentId: 'test_agent_123',
      text: 'Hello, AI!'
    };

    const mockAgent = {
      id: 'test_agent_123',
      name: 'Test Agent',
      systemPrompt: 'You are helpful',
      model: 'openai/gpt-3.5-turbo',
      provider: 'openrouter'
    };

    const mockSession = {
      sessionId: 'session_123',
      participants: [
        { type: 'user', id: 'test_user_123' },
        { type: 'agent', id: 'test_agent_123' }
      ]
    };

    const mockUserEvent = {
      id: 'event_user_123',
      sessionId: 'session_123',
      content: validOptions.text,
      createdAt: Date.now()
    };

    const mockAgentEvent = {
      id: 'event_agent_123',
      sessionId: 'session_123',
      content: 'AI Reply',
      createdAt: Date.now()
    };

    it('应该成功发送消息并返回 AI 回复', async () => {
      agentService.getAgentById.mockResolvedValue(mockAgent);
      sessionService.getOrCreateSession.mockResolvedValue(mockSession);
      eventService.createEvent.mockResolvedValueOnce(mockUserEvent).mockResolvedValueOnce(mockAgentEvent);
      eventService.getRecentEvents.mockResolvedValue([mockUserEvent]);
      llmService.generateReply.mockResolvedValue('AI Reply');

      const result = await messageService.sendMessage(validOptions);

      expect(result).toBeDefined();
      expect(result.content).toBe('AI Reply');
      expect(eventService.createEvent).toHaveBeenCalledTimes(2); // 用户消息 + AI 回复
      expect(llmService.generateReply).toHaveBeenCalled();
    });

    it('应该拒绝空 userId', async () => {
      await expect(messageService.sendMessage({
        ...validOptions,
        userId: ''
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '用户 ID 不能为空'
      });
    });

    it('应该拒绝空 agentId', async () => {
      await expect(messageService.sendMessage({
        ...validOptions,
        agentId: ''
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Agent ID 不能为空'
      });
    });

    it('应该拒绝空消息内容', async () => {
      await expect(messageService.sendMessage({
        ...validOptions,
        text: ''
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '消息内容不能为空'
      });
    });

    it('应该处理 Agent 不存在', async () => {
      agentService.getAgentById.mockResolvedValue(null);

      await expect(messageService.sendMessage(validOptions)).rejects.toMatchObject({
        code: 'AGENT_NOT_FOUND',
        message: 'Agent 不存在'
      });
    });

    it('应该处理 LLM API 错误', async () => {
      agentService.getAgentById.mockResolvedValue(mockAgent);
      sessionService.getOrCreateSession.mockResolvedValue(mockSession);
      eventService.createEvent.mockResolvedValue(mockUserEvent);
      eventService.getRecentEvents.mockResolvedValue([mockUserEvent]);
      
      const error = new Error('LLM API 调用失败');
      error.code = 'LLM_API_ERROR';
      llmService.generateReply.mockRejectedValue(error);

      await expect(messageService.sendMessage(validOptions)).rejects.toMatchObject({
        code: 'LLM_API_ERROR'
      });
    });

    it('应该使用自定义 contextLimit', async () => {
      agentService.getAgentById.mockResolvedValue(mockAgent);
      sessionService.getOrCreateSession.mockResolvedValue(mockSession);
      eventService.createEvent.mockResolvedValue(mockUserEvent);
      eventService.getRecentEvents.mockResolvedValue([mockUserEvent]);
      llmService.generateReply.mockResolvedValue('AI Reply');

      await messageService.sendMessage({
        ...validOptions,
        contextLimit: 50
      });

      expect(eventService.getRecentEvents).toHaveBeenCalledWith('session_123', 50);
    });
  });
});

