/**
 * Jest 测试环境设置文件
 * 在每个测试文件运行前执行
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_NAME = 'npc_db_test';

// 设置较短的超时时间（避免测试挂起）
jest.setTimeout(10000);

// 全局测试辅助函数
global.createTestUser = () => ({
  id: `test_user_${Date.now()}`,
  username: `testuser_${Date.now()}`,
  password: '123456'
});

global.createTestAgent = (userId) => ({
  userId: userId || `test_user_${Date.now()}`,
  name: `Test Agent ${Date.now()}`,
  type: 'general',
  model: 'openai/gpt-3.5-turbo',
  systemPrompt: 'You are a helpful assistant.',
  avatarUrl: null
});

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
});

