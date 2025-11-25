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
 * @param {string} userId - 用户 ID
 * @param {string} password - 密码 (必填)
 * @returns {Promise<Object>} 用户信息
 */
async function login(userId, password) {
  // 验证必填参数
  if (!userId) {
    const error = new Error('用户 ID 不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!password) {
    const error = new Error('密码不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const user = await userRepository.findById(userId);
  
  if (!user) {
    const error = new Error('用户不存在');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // 验证密码（账号密码双重匹配）
  if (user.password !== password) {
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
 * @param {string} data.userId - 用户 ID
 * @param {string} data.username - 用户名
 * @param {string} [data.password] - 密码（可选，不填则使用默认密码123456）
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

  // 3. 如果密码为空或未提供，使用默认密码123456
  const finalPassword = password && password.trim() !== '' ? password : '123456';

  // 4. 创建用户
  const newUser = await userRepository.create({
    id: userId, // 这里允许前端传入自定义 ID，或者后端生成
    username,
    password: finalPassword
  });

  const { password: _, ...userInfo } = newUser;
  return userInfo;
}

/**
 * 忘记密码 - 重置密码
 * @param {string} userId - 用户 ID
 * @param {string} newPassword - 新密码
 * @returns {Promise<Object>} 更新后的用户信息
 */
async function forgotPassword(userId, newPassword) {
  // 验证必填参数
  if (!userId) {
    const error = new Error('用户 ID 不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  if (!newPassword || newPassword.trim() === '') {
    const error = new Error('新密码不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // 检查用户是否存在
  const user = await userRepository.findById(userId);
  if (!user) {
    const error = new Error('账号不存在');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // 更新密码
  const updatedUser = await userRepository.updatePassword(userId, newPassword.trim());
  
  if (!updatedUser) {
    const error = new Error('更新密码失败');
    error.code = 'UPDATE_FAILED';
    throw error;
  }

  // 返回用户信息（不含密码）
  const { password: _, ...userInfo } = updatedUser;
  return userInfo;
}

/**
 * 自动登录（用于老用户迁移）
 * 对于在 2025-11-25 之前注册的用户，允许自动登录
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} 用户信息
 */
async function autoLogin(userId) {
  // 验证必填参数
  if (!userId) {
    const error = new Error('用户 ID 不能为空');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  // 查找用户
  const user = await userRepository.findById(userId);
  
  if (!user) {
    const error = new Error('用户不存在');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  // 检查注册日期：2025-11-25 00:00:00 的时间戳（毫秒）
  // 注意：使用 UTC 时间，确保时区一致
  const migrationDate = new Date('2025-11-25T00:00:00.000Z').getTime();
  
  // 如果用户注册日期在迁移日期之后（包括等于），不允许自动登录
  // 只有注册日期在 2025-11-25 00:00:00 之前的用户才能自动登录
  if (user.createdAt >= migrationDate) {
    const error = new Error('该用户需要密码登录');
    error.code = 'AUTO_LOGIN_NOT_ALLOWED';
    throw error;
  }

  // 如果用户密码为空或等于默认密码，自动设置为默认密码（确保后续可以正常登录）
  let finalUser = user;
  if (!user.password || user.password === '') {
    // 为老用户设置默认密码（如果还没有）
    const updatedUser = await userRepository.updatePassword(userId, '123456');
    if (updatedUser) {
      finalUser = updatedUser; // 使用更新后的用户信息
    }
  }

  // 返回用户信息（不含密码）
  const { password: _, ...userInfo } = finalUser;
  return userInfo;
}

module.exports = {
  login,
  register,
  forgotPassword,
  autoLogin
};

