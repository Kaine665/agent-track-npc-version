/**
 * 测试数据生成器
 * 提供常用的测试数据生成函数
 */

/**
 * 生成测试用户数据
 */
function createTestUser(overrides = {}) {
  const timestamp = Date.now();
  return {
    id: `test_user_${timestamp}`,
    username: `testuser_${timestamp}`,
    password: '123456',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

/**
 * 生成测试 Agent 数据
 */
function createTestAgent(overrides = {}) {
  const timestamp = Date.now();
  return {
    id: `test_agent_${timestamp}`,
    createdBy: `test_user_${timestamp}`,
    name: `Test Agent ${timestamp}`,
    type: 'general',
    model: 'openai/gpt-3.5-turbo',
    provider: 'openrouter',
    systemPrompt: 'You are a helpful assistant.',
    avatarUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deleted: false,
    deletedAt: null,
    ...overrides
  };
}

/**
 * 生成测试 Session 数据
 */
function createTestSession(overrides = {}) {
  const timestamp = Date.now();
  return {
    sessionId: `test_session_${timestamp}`,
    userId: `test_user_${timestamp}`,
    agentId: `test_agent_${timestamp}`,
    participants: [
      { id: `test_user_${timestamp}`, type: 'user' },
      { id: `test_agent_${timestamp}`, type: 'agent' }
    ],
    createdAt: timestamp,
    lastActiveAt: timestamp,
    ...overrides
  };
}

/**
 * 生成测试 Event 数据
 */
function createTestEvent(overrides = {}) {
  const timestamp = Date.now();
  return {
    id: `test_event_${timestamp}`,
    sessionId: `test_session_${timestamp}`,
    userId: `test_user_${timestamp}`,
    agentId: `test_agent_${timestamp}`,
    type: 'user_message',
    content: 'Test message',
    createdAt: timestamp,
    ...overrides
  };
}

/**
 * 生成测试反馈数据
 */
function createTestFeedback(overrides = {}) {
  const timestamp = Date.now();
  return {
    id: `test_feedback_${timestamp}`,
    userId: `test_user_${timestamp}`,
    type: 'bug',
    title: 'Test Feedback',
    content: 'This is a test feedback',
    status: 'pending',
    browser: 'Chrome',
    platform: 'Windows',
    language: 'zh-CN',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

module.exports = {
  createTestUser,
  createTestAgent,
  createTestSession,
  createTestEvent,
  createTestFeedback
};

