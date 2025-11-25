/**
 * Users API 路由测试
 */

const request = require('supertest');
const express = require('express');
const usersRouter = require('../../routes/users');
const userService = require('../../services/UserService');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');

// Mock 依赖
jest.mock('../../services/UserService');
jest.mock('../../utils/jwt');

const app = express();
app.use(express.json());
app.use('/api/v1/users', usersRouter);

describe('Users API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/users/login', () => {
    it('应该成功登录并返回 Token', async () => {
      const loginData = {
        userId: 'test_user_123',
        password: '123456'
      };

      const mockUser = {
        id: loginData.userId,
        username: 'testuser'
      };

      userService.login.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue('access_token_123');
      generateRefreshToken.mockReturnValue('refresh_token_123');

      const response = await request(app)
        .post('/api/v1/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(loginData.userId);
      expect(response.body.data.accessToken).toBe('access_token_123');
      expect(response.body.data.refreshToken).toBe('refresh_token_123');
      expect(userService.login).toHaveBeenCalledWith(loginData.userId, loginData.password);
    });

    it('应该拒绝缺少 userId 的请求', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({ password: '123456' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该拒绝缺少密码的请求', async () => {
      const response = await request(app)
        .post('/api/v1/users/login')
        .send({ userId: 'test_user_123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该处理用户不存在错误', async () => {
      const error = new Error('用户不存在');
      error.code = 'USER_NOT_FOUND';
      userService.login.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          userId: 'nonexistent',
          password: '123456'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('应该处理密码错误', async () => {
      const error = new Error('密码错误');
      error.code = 'INVALID_PASSWORD';
      userService.login.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/users/login')
        .send({
          userId: 'test_user_123',
          password: 'wrong_password'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });
  });

  describe('POST /api/v1/users/register', () => {
    it('应该成功注册新用户', async () => {
      const registerData = {
        userId: 'new_user_123',
        username: 'newuser',
        password: 'password123'
      };

      const mockUser = {
        id: registerData.userId,
        username: registerData.username
      };

      userService.register.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/users/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(registerData.userId);
      expect(response.body.data.username).toBe(registerData.username);
      expect(userService.register).toHaveBeenCalledWith(registerData);
    });

    it('应该拒绝缺少必填字段的请求', async () => {
      const response = await request(app)
        .post('/api/v1/users/register')
        .send({ username: 'newuser' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该处理重复的 userId', async () => {
      const error = new Error('用户 ID 已存在');
      error.code = 'DUPLICATE_USER_ID';
      userService.register.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          userId: 'existing_user',
          username: 'newuser',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_USER_ID');
    });

    it('应该处理重复的用户名', async () => {
      const error = new Error('用户名已存在');
      error.code = 'DUPLICATE_USERNAME';
      userService.register.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/users/register')
        .send({
          userId: 'new_user_123',
          username: 'existinguser',
          password: 'password123'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DUPLICATE_USERNAME');
    });
  });

  describe('POST /api/v1/users/forgot-password', () => {
    it('应该成功重置密码', async () => {
      const resetData = {
        userId: 'test_user_123',
        newPassword: 'newpassword123'
      };

      const mockUser = {
        id: resetData.userId,
        username: 'testuser'
      };

      userService.forgotPassword.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send(resetData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(resetData.userId);
      expect(userService.forgotPassword).toHaveBeenCalledWith(
        resetData.userId,
        resetData.newPassword
      );
    });

    it('应该拒绝缺少 userId 的请求', async () => {
      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({ newPassword: 'newpassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该拒绝缺少新密码的请求', async () => {
      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({ userId: 'test_user_123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('应该处理用户不存在错误', async () => {
      const error = new Error('账号不存在');
      error.code = 'USER_NOT_FOUND';
      userService.forgotPassword.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/v1/users/forgot-password')
        .send({
          userId: 'nonexistent',
          newPassword: 'newpassword123'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});

