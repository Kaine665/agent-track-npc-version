/**
 * UserService 测试
 */

const userService = require('../../services/UserService');
const userRepository = require('../../repositories/UserRepository');

// Mock Repository
jest.mock('../../repositories/UserRepository');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('应该成功登录有效用户', async () => {
      const userId = 'test_user_123';
      const password = '123456';
      const mockUser = {
        id: userId,
        username: 'testuser',
        password: password
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.login(userId, password);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.username).toBe('testuser');
      expect(result.password).toBeUndefined(); // 密码不应该返回
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('应该拒绝空 userId', async () => {
      await expect(userService.login('', 'password')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '用户 ID 不能为空'
      });
    });

    it('应该拒绝空密码', async () => {
      await expect(userService.login('user123', '')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '密码不能为空'
      });
    });

    it('应该拒绝不存在的用户', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.login('nonexistent', 'password')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        message: '用户不存在'
      });
    });

    it('应该拒绝错误的密码', async () => {
      const mockUser = {
        id: 'test_user_123',
        username: 'testuser',
        password: 'correct_password'
      };

      userRepository.findById.mockResolvedValue(mockUser);

      await expect(userService.login('test_user_123', 'wrong_password')).rejects.toMatchObject({
        code: 'INVALID_PASSWORD',
        message: '密码错误'
      });
    });
  });

  describe('register', () => {
    it('应该成功注册新用户', async () => {
      const userData = {
        userId: 'new_user_123',
        username: 'newuser',
        password: 'password123'
      };

      userRepository.findById.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: userData.userId,
        username: userData.username,
        password: userData.password,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      const result = await userService.register(userData);

      expect(result).toBeDefined();
      expect(result.id).toBe(userData.userId);
      expect(result.username).toBe(userData.username);
      expect(result.password).toBeUndefined(); // 密码不应该返回
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('应该使用默认密码当密码为空', async () => {
      const userData = {
        userId: 'new_user_123',
        username: 'newuser',
        password: ''
      };

      userRepository.findById.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        id: userData.userId,
        username: userData.username,
        password: '123456', // 默认密码
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      const result = await userService.register(userData);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: '123456'
        })
      );
    });

    it('应该拒绝重复的 userId', async () => {
      const userData = {
        userId: 'existing_user',
        username: 'newuser',
        password: 'password123'
      };

      userRepository.findById.mockResolvedValue({
        id: 'existing_user',
        username: 'existinguser'
      });

      await expect(userService.register(userData)).rejects.toMatchObject({
        code: 'DUPLICATE_USER_ID',
        message: '用户 ID 已存在'
      });
    });

    it('应该拒绝重复的用户名', async () => {
      const userData = {
        userId: 'new_user_123',
        username: 'existinguser',
        password: 'password123'
      };

      userRepository.findById.mockResolvedValue(null);
      userRepository.findByUsername.mockResolvedValue({
        id: 'other_user',
        username: 'existinguser'
      });

      await expect(userService.register(userData)).rejects.toMatchObject({
        code: 'DUPLICATE_USERNAME',
        message: '用户名已存在'
      });
    });
  });

  describe('forgotPassword', () => {
    it('应该成功重置密码', async () => {
      const userId = 'test_user_123';
      const newPassword = 'newpassword123';
      const mockUser = {
        id: userId,
        username: 'testuser',
        password: 'oldpassword'
      };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updatePassword.mockResolvedValue({
        ...mockUser,
        password: newPassword
      });

      const result = await userService.forgotPassword(userId, newPassword);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.password).toBeUndefined(); // 密码不应该返回
      expect(userRepository.updatePassword).toHaveBeenCalledWith(userId, newPassword.trim());
    });

    it('应该拒绝空 userId', async () => {
      await expect(userService.forgotPassword('', 'newpassword')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '用户 ID 不能为空'
      });
    });

    it('应该拒绝空新密码', async () => {
      await expect(userService.forgotPassword('user123', '')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: '新密码不能为空'
      });
    });

    it('应该拒绝不存在的用户', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.forgotPassword('nonexistent', 'newpassword')).rejects.toMatchObject({
        code: 'USER_NOT_FOUND',
        message: '账号不存在'
      });
    });

    it('应该处理密码更新失败', async () => {
      const userId = 'test_user_123';
      const mockUser = {
        id: userId,
        username: 'testuser'
      };

      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.updatePassword.mockResolvedValue(null);

      await expect(userService.forgotPassword(userId, 'newpassword')).rejects.toMatchObject({
        code: 'UPDATE_FAILED',
        message: '更新密码失败'
      });
    });
  });
});

