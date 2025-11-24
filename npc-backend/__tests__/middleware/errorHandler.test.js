/**
 * Error Handler Middleware 测试
 */

const { errorHandler, notFoundHandler, requestLogger } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');
const { ValidationError } = require('../../utils/validator');

// Mock Logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  logRequest: jest.fn(),
  logResponse: jest.fn()
}));

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      url: '/api/v1/test',
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('应该处理带错误码的错误', () => {
      const error = new Error('测试错误');
      error.code = 'VALIDATION_ERROR';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '测试错误'
        },
        timestamp: expect.any(Number)
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('应该处理 ValidationError', () => {
      const error = new ValidationError('验证失败');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '验证失败'
        },
        timestamp: expect.any(Number)
      });
    });

    it('应该处理 AGENT_NOT_FOUND 错误', () => {
      const error = new Error('Agent 不存在');
      error.code = 'AGENT_NOT_FOUND';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('应该处理 DUPLICATE_NAME 错误', () => {
      const error = new Error('名称重复');
      error.code = 'DUPLICATE_NAME';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('应该处理 LLM_API_ERROR 错误', () => {
      const error = new Error('LLM API 调用失败');
      error.code = 'LLM_API_ERROR';

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
    });

    it('应该处理未知错误（默认 SYSTEM_ERROR）', () => {
      const error = new Error('未知错误');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: '未知错误'
        },
        timestamp: expect.any(Number)
      });
    });

    it('应该记录错误堆栈', () => {
      const error = new Error('测试错误');
      error.code = 'SYSTEM_ERROR';
      error.stack = 'Error stack trace';

      errorHandler(error, req, res, next);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('API 错误'),
        expect.objectContaining({
          stack: 'Error stack trace'
        })
      );
    });
  });

  describe('notFoundHandler', () => {
    it('应该返回 404 错误', () => {
      notFoundHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '路由 GET /api/v1/test 不存在'
        },
        timestamp: expect.any(Number)
      });
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('requestLogger', () => {
    it('应该记录请求日志', () => {
      requestLogger(req, res, next);

      expect(logger.logRequest).toHaveBeenCalledWith(req);
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(next).toHaveBeenCalled();
    });

    it('应该在响应完成时记录响应日志', () => {
      requestLogger(req, res, next);

      // 模拟响应完成
      const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      finishCallback();

      expect(logger.logResponse).toHaveBeenCalledWith(req, res, expect.any(Number));
    });
  });
});

