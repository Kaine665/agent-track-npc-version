/**
 * ============================================
 * User Service (UserService.js)
 * ============================================
 *
 * 【职责】
 * 处理用户相关的业务逻辑：注册、登录验证
 */

const userRepository = require('../repositories/UserRepository');

/**
 * 用户登录
 * @param {string} userId - 用户 ID (这里简化逻辑，直接用 ID 登录作为演示，或者用用户名密码)
 * @param {string} [password] - 密码 (可选验证)
 * @returns {Promise<Object>} 用户信息
 */
async function login(userId, password) {
  const user = await userRepository.findById(userId);
  
  if (!user) {
    const error = new Error('用户不存在');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // 简单验证密码 (如果传了的话)
  if (password && user.password !== password) {
    const error = new Error('密码错误');
    error.code = 'INVALID_PASSWORD';
    throw error;
  }

  // 返回用户信息（不含密码）
  const { password: _, ...userInfo } = user;
  return userInfo;
}

/**
 * 用户注册
 * @param {Object} data
 * @returns {Promise<Object>} 新用户信息
 */
async function register(data) {
  const { userId, username, password } = data;

  // 1. 检查 ID 是否存在
  const existingUserById = await userRepository.findById(userId);
  if (existingUserById) {
    const error = new Error('用户 ID 已存在');
    error.code = 'DUPLICATE_USER_ID';
    throw error;
  }

  // 2. 检查用户名是否存在
  const existingUserByName = await userRepository.findByUsername(username);
  if (existingUserByName) {
    const error = new Error('用户名已存在');
    error.code = 'DUPLICATE_USERNAME';
    throw error;
  }

  // 3. 创建用户
  const newUser = await userRepository.create({
    id: userId, // 这里允许前端传入自定义 ID，或者后端生成
    username,
    password
  });

  const { password: _, ...userInfo } = newUser;
  return userInfo;
}

module.exports = {
  login,
  register
};

