/**
 * Auth Middleware 测试
 */

const { authenticate, optionalAuthenticate } = require('../../middleware/auth');
const { verifyToken } = require('../../utils/jwt');

// Mock JWT 工具
jest.mock('../../utils/jwt', () => ({
  verifyToken: jest.fn()
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('应该通过认证当 Token 有效', () => {
      const token = 'valid.token.here';
      req.headers.authorization = `Bearer ${token}`;
      
      verifyToken.mockReturnValue({
        userId: 'test_user_123',
        username: 'testuser',
        type: 'access'
      });

      authenticate(req, res, next);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(req.user).toEqual({
        userId: 'test_user_123',
        username: 'testuser'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该拒绝缺少 Token 的请求', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '缺少认证 Token'
        },
        timestamp: expect.any(Number)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝格式错误的 Token', () => {
      req.headers.authorization = 'InvalidFormat token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝无效的 Token', () => {
      const token = 'invalid.token.here';
      req.headers.authorization = `Bearer ${token}`;
      
      const error = new Error('Token 无效');
      error.code = 'TOKEN_INVALID';
      verifyToken.mockImplementation(() => {
        throw error;
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token 无效'
        },
        timestamp: expect.any(Number)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该拒绝非 Access Token', () => {
      const token = 'refresh.token.here';
      req.headers.authorization = `Bearer ${token}`;
      
      verifyToken.mockReturnValue({
        userId: 'test_user_123',
        type: 'refresh' // 不是 access token
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_INVALID',
          message: 'Token 类型错误'
        },
        timestamp: expect.any(Number)
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('应该处理过期的 Token', () => {
      const token = 'expired.token.here';
      req.headers.authorization = `Bearer ${token}`;
      
      const error = new Error('Token 已过期');
      error.code = 'TOKEN_EXPIRED';
      verifyToken.mockImplementation(() => {
        throw error;
      });

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token 已过期'
        },
        timestamp: expect.any(Number)
      });
    });
  });

  describe('optionalAuthenticate', () => {
    it('应该通过认证当 Token 有效', () => {
      const token = 'valid.token.here';
      req.headers.authorization = `Bearer ${token}`;
      
      verifyToken.mockReturnValue({
        userId: 'test_user_123',
        username: 'testuser',
        type: 'access'
      });

      optionalAuthenticate(req, res, next);

      expect(req.user).toEqual({
        userId: 'test_user_123',
        username: 'testuser'
      });
      expect(next).toHaveBeenCalled();
    });

    it('应该允许无 Token 的请求', () => {
      optionalAuthenticate(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('应该设置 user 为 null 当 Token 无效', () => {
      const token = 'invalid.token.here';
      req.headers.authorization = `Bearer ${token}`;
      
      verifyToken.mockImplementation(() => {
        throw new Error('Token 无效');
      });

      optionalAuthenticate(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('应该设置 user 为 null 当 Token 类型错误', () => {
      const token = 'refresh.token.here';
      req.headers.authorization = `Bearer ${token}`;
      
      verifyToken.mockReturnValue({
        userId: 'test_user_123',
        type: 'refresh'
      });

      optionalAuthenticate(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
});

