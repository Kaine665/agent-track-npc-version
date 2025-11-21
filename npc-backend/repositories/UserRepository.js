/**
 * ============================================
 * User Repository (UserRepository.js)
 * ============================================
 *
 * 【职责】
 * 处理用户数据的增删改查
 * 当前使用内存存储，后续可迁移至数据库
 */

// 内存存储
const users = new Map();

// 初始化一些测试数据
const testUser = {
  id: 'user_123',
  username: 'TestUser',
  password: 'password', // 实际项目应存储哈希
  createdAt: Date.now()
};
users.set(testUser.id, testUser);

/**
 * 创建用户
 * @param {Object} userData
 * @returns {Object} Created user
 */
async function create(userData) {
  const user = {
    ...userData,
    createdAt: Date.now()
  };
  users.set(user.id, user);
  return user;
}

/**
 * 根据 ID 查找用户
 * @param {string} id
 * @returns {Object|null}
 */
async function findById(id) {
  return users.get(id) || null;
}

/**
 * 根据用户名查找用户
 * @param {string} username
 * @returns {Object|null}
 */
async function findByUsername(username) {
  for (const user of users.values()) {
    if (user.username === username) {
      return user;
    }
  }
  return null;
}

module.exports = {
  create,
  findById,
  findByUsername
};

