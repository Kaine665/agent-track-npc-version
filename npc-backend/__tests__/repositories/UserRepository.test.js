/**
 * UserRepository 测试
 */

const userRepository = require('../../repositories/UserRepository');
const { query } = require('../../config/database');

// Mock 数据库
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

describe('UserRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('应该成功创建用户', async () => {
      const userData = {
        id: 'test_user_123',
        username: 'testuser',
        password: '123456'
      };

      query.mockResolvedValue([]);

      const result = await userRepository.create(userData);

      expect(result).toBeDefined();
      expect(result.id).toBe(userData.id);
      expect(result.username).toBe(userData.username);
      expect(result.password).toBe(userData.password);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining([userData.id, userData.username, userData.password])
      );
    });

    it('应该添加时间戳', async () => {
      const userData = {
        id: 'test_user_123',
        username: 'testuser',
        password: '123456'
      };

      query.mockResolvedValue([]);

      const result = await userRepository.create(userData);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(typeof result.createdAt).toBe('number');
    });
  });

  describe('findById', () => {
    it('应该返回用户当 ID 存在', async () => {
      const userId = 'test_user_123';
      const mockUser = {
        id: userId,
        username: 'testuser',
        password: '123456',
        created_at: 1000,
        updated_at: 1000
      };

      query.mockResolvedValue([mockUser]);

      const result = await userRepository.findById(userId);

      expect(result).toBeDefined();
      expect(result.id).toBe(userId);
      expect(result.username).toBe('testuser');
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE id = ?'),
        [userId]
      );
    });

    it('应该返回 null 当 ID 不存在', async () => {
      query.mockResolvedValue([]);

      const result = await userRepository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('应该转换数据库字段名', async () => {
      const mockUser = {
        id: 'test_user_123',
        username: 'testuser',
        created_at: 1000,
        updated_at: 1000
      };

      query.mockResolvedValue([mockUser]);

      const result = await userRepository.findById('test_user_123');

      expect(result.createdAt).toBe(1000);
      expect(result.updatedAt).toBe(1000);
    });
  });

  describe('findByUsername', () => {
    it('应该返回用户当用户名存在', async () => {
      const username = 'testuser';
      const mockUser = {
        id: 'test_user_123',
        username: username,
        password: '123456',
        created_at: 1000,
        updated_at: 1000
      };

      query.mockResolvedValue([mockUser]);

      const result = await userRepository.findByUsername(username);

      expect(result).toBeDefined();
      expect(result.username).toBe(username);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE username = ?'),
        [username]
      );
    });

    it('应该返回 null 当用户名不存在', async () => {
      query.mockResolvedValue([]);

      const result = await userRepository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('应该成功更新密码', async () => {
      const userId = 'test_user_123';
      const newPassword = 'newpassword123';

      query.mockResolvedValue([{
        affectedRows: 1
      }]);

      query.mockResolvedValueOnce([{
        affectedRows: 1
      }]).mockResolvedValueOnce([{
        id: userId,
        username: 'testuser',
        password: newPassword,
        created_at: 1000,
        updated_at: 2000
      }]);

      const result = await userRepository.updatePassword(userId, newPassword);

      expect(result).toBeDefined();
      expect(result.password).toBe(newPassword);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET password = ?'),
        expect.arrayContaining([newPassword])
      );
    });
  });
});

