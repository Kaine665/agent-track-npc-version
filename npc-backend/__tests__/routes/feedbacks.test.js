/**
 * Feedbacks API 路由测试
 */

const request = require('supertest');
const express = require('express');
const feedbacksRouter = require('../../routes/feedbacks');
const feedbackService = require('../../services/FeedbackService');
const { authenticate } = require('../../middleware/auth');

// Mock 依赖
jest.mock('../../services/FeedbackService');
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
app.use('/api/v1/feedbacks', feedbacksRouter);

describe('Feedbacks API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/feedbacks', () => {
    const validFeedbackData = {
      type: 'bug',
      title: 'Test Feedback',
      content: 'This is a test feedback'
    };

    it('应该成功提交反馈', async () => {
      const mockFeedback = {
        id: 'feedback_123',
        userId: 'test_user_123',
        ...validFeedbackData,
        status: 'pending',
        createdAt: Date.now()
      };

      feedbackService.submitFeedback.mockResolvedValue(mockFeedback);

      const response = await request(app)
        .post('/api/v1/feedbacks')
        .send({
          userId: 'test_user_123',
          ...validFeedbackData
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('feedback_123');
      expect(feedbackService.submitFeedback).toHaveBeenCalledWith(
        'test_user_123',
        expect.objectContaining(validFeedbackData)
      );
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const response = await request(app)
        .post('/api/v1/feedbacks')
        .send({
          type: 'bug'
          // 缺少 title 和 content
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该处理无效的反馈类型', async () => {
      const error = new Error('无效的反馈类型');
      error.code = 'INVALID_TYPE';
      feedbackService.submitFeedback.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/feedbacks')
        .send({
          userId: 'test_user_123',
          ...validFeedbackData,
          type: 'invalid_type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TYPE');
    });
  });

  describe('GET /api/v1/feedbacks', () => {
    it('应该返回用户的反馈列表', async () => {
      const mockFeedbacks = [
        {
          id: 'feedback_1',
          userId: 'test_user_123',
          type: 'bug',
          title: 'Bug 1',
          status: 'pending'
        },
        {
          id: 'feedback_2',
          userId: 'test_user_123',
          type: 'feature',
          title: 'Feature 1',
          status: 'resolved'
        }
      ];

      feedbackService.getUserFeedbacks.mockResolvedValue(mockFeedbacks);

      const response = await request(app)
        .get('/api/v1/feedbacks?userId=test_user_123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
      expect(feedbackService.getUserFeedbacks).toHaveBeenCalledWith('test_user_123', {
        page: 1,
        pageSize: 20,
        type: undefined,
        status: undefined
      });
    });

    it('应该支持分页参数', async () => {
      feedbackService.getUserFeedbacks.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/feedbacks?userId=test_user_123&page=2&pageSize=10')
        .expect(200);

      expect(feedbackService.getUserFeedbacks).toHaveBeenCalledWith('test_user_123', {
        page: 2,
        pageSize: 10,
        type: undefined,
        status: undefined
      });
    });

    it('应该支持类型筛选', async () => {
      feedbackService.getUserFeedbacks.mockResolvedValue([]);

      await request(app)
        .get('/api/v1/feedbacks?userId=test_user_123&type=bug')
        .expect(200);

      expect(feedbackService.getUserFeedbacks).toHaveBeenCalledWith('test_user_123', {
        page: 1,
        pageSize: 20,
        type: 'bug',
        status: undefined
      });
    });
  });

  describe('GET /api/v1/feedbacks/:id', () => {
    it('应该返回反馈详情', async () => {
      const feedbackId = 'feedback_123';
      const mockFeedback = {
        id: feedbackId,
        userId: 'test_user_123',
        type: 'bug',
        title: 'Test Feedback',
        content: 'Test content'
      };

      feedbackService.getFeedbackById.mockResolvedValue(mockFeedback);

      const response = await request(app)
        .get(`/api/v1/feedbacks/${feedbackId}?userId=test_user_123`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(feedbackId);
      expect(feedbackService.getFeedbackById).toHaveBeenCalledWith(feedbackId, 'test_user_123');
    });

    it('应该处理反馈不存在', async () => {
      const error = new Error('反馈不存在');
      error.code = 'FEEDBACK_NOT_FOUND';
      feedbackService.getFeedbackById.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/v1/feedbacks/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FEEDBACK_NOT_FOUND');
    });

    it('应该处理权限错误', async () => {
      const error = new Error('无权访问此反馈');
      error.code = 'PERMISSION_DENIED';
      feedbackService.getFeedbackById.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/v1/feedbacks/other_user_feedback')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PERMISSION_DENIED');
    });
  });
});

