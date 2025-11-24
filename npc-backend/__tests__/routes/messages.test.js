/**
 * Messages API 路由测试
 */

const request = require('supertest');
const express = require('express');
const messagesRouter = require('../../routes/messages');
const messageService = require('../../services/MessageService');
const { authenticate } = require('../../middleware/auth');

// Mock 依赖
jest.mock('../../services/MessageService');
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      userId: 'test_user_123',
      username: 'testuser'
    };
    next();
  })
}));

const app = express();
app.use(express.json());
app.use('/api/v1/messages', messagesRouter);

describe('Messages API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/messages', () => {
    const validMessageData = {
      userId: 'test_user_123',
      agentId: 'test_agent_123',
      text: 'Hello, AI!'
    };

    it('应该成功发送消息并返回 AI 回复', async () => {
      const mockReply = {
        eventId: 'event_123',
        content: 'AI Reply',
        timestamp: Date.now()
      };

      messageService.sendMessage.mockResolvedValue(mockReply);

      const response = await request(app)
        .post('/api/v1/messages')
        .send(validMessageData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('AI Reply');
      expect(messageService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: validMessageData.userId,
          agentId: validMessageData.agentId,
          text: validMessageData.text
        })
      );
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const response = await request(app)
        .post('/api/v1/messages')
        .send({
          userId: 'test_user_123'
          // 缺少 agentId 和 text
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该处理 Agent 不存在错误', async () => {
      const error = {
        code: 'AGENT_NOT_FOUND',
        message: 'Agent 不存在'
      };
      messageService.sendMessage.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/messages')
        .send(validMessageData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AGENT_NOT_FOUND');
    });

    it('应该处理 LLM API 错误', async () => {
      const error = {
        code: 'LLM_API_ERROR',
        message: 'LLM API 调用失败'
      };
      messageService.sendMessage.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/messages')
        .send(validMessageData)
        .expect(502);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('LLM_API_ERROR');
    });

    it('应该支持自定义 contextLimit', async () => {
      const mockReply = {
        eventId: 'event_123',
        content: 'AI Reply',
        timestamp: Date.now()
      };

      messageService.sendMessage.mockResolvedValue(mockReply);

      await request(app)
        .post('/api/v1/messages')
        .send({
          ...validMessageData,
          contextLimit: 50
        })
        .expect(200);

      expect(messageService.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          contextLimit: 50
        })
      );
    });
  });
});

