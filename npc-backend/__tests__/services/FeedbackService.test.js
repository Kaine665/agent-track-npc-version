/**
 * FeedbackService 测试
 */

const feedbackService = require('../../services/FeedbackService');
const feedbackRepository = require('../../repositories/FeedbackRepository');

// Mock Repository
jest.mock('../../repositories/FeedbackRepository');

describe('FeedbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitFeedback', () => {
    const validFeedbackData = {
      type: 'bug',
      title: 'Test Feedback',
      content: 'This is a test feedback',
      userAgent: {
        browser: 'Chrome',
        platform: 'Windows'
      }
    };

    it('应该成功提交反馈', async () => {
      const userId = 'test_user_123';
      const mockFeedback = {
        id: 'feedback_123',
        userId,
        ...validFeedbackData,
        status: 'pending',
        createdAt: Date.now()
      };

      feedbackRepository.create.mockResolvedValue(mockFeedback);

      const result = await feedbackService.submitFeedback(userId, validFeedbackData);

      expect(result).toBeDefined();
      expect(result.id).toBe('feedback_123');
      expect(result.type).toBe(validFeedbackData.type);
      expect(feedbackRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: validFeedbackData.type,
          title: validFeedbackData.title,
          content: validFeedbackData.content
        })
      );
    });

    it('应该拒绝缺少必填字段', async () => {
      await expect(feedbackService.submitFeedback('user123', {
        type: 'bug'
        // 缺少 title 和 content
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '反馈类型、标题和内容不能为空'
      });
    });

    it('应该拒绝无效的反馈类型', async () => {
      await expect(feedbackService.submitFeedback('user123', {
        ...validFeedbackData,
        type: 'invalid_type'
      })).rejects.toMatchObject({
        code: 'INVALID_TYPE',
        message: '无效的反馈类型'
      });
    });

    it('应该拒绝标题超过500字符', async () => {
      await expect(feedbackService.submitFeedback('user123', {
        ...validFeedbackData,
        title: 'a'.repeat(501)
      })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '反馈标题不能超过500个字符'
      });
    });

    it('应该支持所有有效的反馈类型', async () => {
      const types = ['bug', 'feature', 'question'];
      
      for (const type of types) {
        feedbackRepository.create.mockResolvedValue({
          id: 'feedback_123',
          type,
          title: 'Test',
          content: 'Test content'
        });

        const result = await feedbackService.submitFeedback('user123', {
          type,
          title: 'Test',
          content: 'Test content'
        });

        expect(result.type).toBe(type);
      }
    });
  });

  describe('getUserFeedbacks', () => {
    it('应该返回用户的反馈列表', async () => {
      const userId = 'test_user_123';
      const mockFeedbacks = [
        {
          id: 'feedback_1',
          userId,
          type: 'bug',
          title: 'Bug 1',
          status: 'pending'
        },
        {
          id: 'feedback_2',
          userId,
          type: 'feature',
          title: 'Feature 1',
          status: 'resolved'
        }
      ];

      feedbackRepository.findByUserId.mockResolvedValue(mockFeedbacks);

      const result = await feedbackService.getUserFeedbacks(userId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(feedbackRepository.findByUserId).toHaveBeenCalledWith(userId, {});
    });

    it('应该支持分页', async () => {
      const userId = 'test_user_123';
      feedbackRepository.findByUserId.mockResolvedValue([]);

      await feedbackService.getUserFeedbacks(userId, {
        page: 2,
        pageSize: 10
      });

      expect(feedbackRepository.findByUserId).toHaveBeenCalledWith(userId, {
        page: 2,
        pageSize: 10
      });
    });

    it('应该支持类型筛选', async () => {
      const userId = 'test_user_123';
      feedbackRepository.findByUserId.mockResolvedValue([]);

      await feedbackService.getUserFeedbacks(userId, {
        type: 'bug'
      });

      expect(feedbackRepository.findByUserId).toHaveBeenCalledWith(userId, {
        type: 'bug'
      });
    });

    it('应该拒绝空 userId', async () => {
      await expect(feedbackService.getUserFeedbacks('')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '用户 ID 不能为空'
      });
    });
  });

  describe('getFeedbackById', () => {
    it('应该返回反馈详情', async () => {
      const feedbackId = 'feedback_123';
      const userId = 'test_user_123';
      const mockFeedback = {
        id: feedbackId,
        userId,
        type: 'bug',
        title: 'Test Feedback',
        content: 'Test content'
      };

      feedbackRepository.findById.mockResolvedValue(mockFeedback);

      const result = await feedbackService.getFeedbackById(feedbackId, userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(feedbackId);
      expect(feedbackRepository.findById).toHaveBeenCalledWith(feedbackId);
    });

    it('应该拒绝空 feedbackId', async () => {
      await expect(feedbackService.getFeedbackById('', 'user123')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '反馈 ID 不能为空'
      });
    });

    it('应该处理反馈不存在', async () => {
      feedbackRepository.findById.mockResolvedValue(null);

      await expect(feedbackService.getFeedbackById('nonexistent', 'user123')).rejects.toMatchObject({
        code: 'FEEDBACK_NOT_FOUND',
        message: '反馈不存在'
      });
    });

    it('应该拒绝访问其他用户的反馈', async () => {
      const mockFeedback = {
        id: 'feedback_123',
        userId: 'other_user',
        type: 'bug',
        title: 'Test'
      };

      feedbackRepository.findById.mockResolvedValue(mockFeedback);

      await expect(feedbackService.getFeedbackById('feedback_123', 'test_user_123')).rejects.toMatchObject({
        code: 'PERMISSION_DENIED',
        message: '无权访问此反馈'
      });
    });
  });
});

