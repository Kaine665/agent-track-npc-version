/**
 * ============================================
 * API 适配器接口定义 (adapter.js)
 * ============================================
 *
 * 【文件职责】
 * 定义管理后台统一的 API 适配器接口规范
 *
 * 【主要功能】
 * 1. 定义适配器接口规范
 * 2. 确保所有适配器实现统一的接口
 *
 * 【设计模式】
 * 适配器模式（Adapter Pattern）
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * API 适配器接口
 *
 * 【接口规范】
 * 所有适配器必须实现以下方法：
 * - admin.auth.login(userId, password)
 * - admin.users.getList(options)
 * - admin.users.getById(userId)
 * - admin.agents.getList(options)
 * - admin.agents.getById(agentId)
 * - admin.statistics.getDashboard()
 */
class AdminApiAdapter {
  /**
   * 管理员认证 API
   */
  admin = {
    auth: {
      /**
       * 管理员登录
       * @param {string} userId - 用户 ID
       * @param {string} password - 密码
       * @returns {Promise<object>} 用户信息和 Token
       */
      login: async (userId, password) => {
        throw new Error('Not implemented: admin.auth.login');
      },

      /**
       * 获取当前管理员信息
       * @returns {Promise<object>} 管理员信息
       */
      getMe: async () => {
        throw new Error('Not implemented: admin.auth.getMe');
      },
    },

    /**
     * 用户管理 API
     */
    users: {
      /**
       * 获取所有用户列表
       * @param {object} options - 查询选项
       * @param {number} [options.page=1] - 页码
       * @param {number} [options.pageSize=20] - 每页数量
       * @param {string} [options.search] - 搜索关键词（ID、用户名）
       * @param {string} [options.startDate] - 开始日期
       * @param {string} [options.endDate] - 结束日期
       * @returns {Promise<object>} 用户列表数据 { users: [], total: number }
       */
      getList: async (options = {}) => {
        throw new Error('Not implemented: admin.users.getList');
      },

      /**
       * 获取用户详情
       * @param {string} userId - 用户 ID
       * @returns {Promise<object>} 用户详情数据
       */
      getById: async (userId) => {
        throw new Error('Not implemented: admin.users.getById');
      },

      /**
       * 禁用/启用用户
       * @param {string} userId - 用户 ID
       * @param {string} status - 状态（'active' | 'disabled'）
       * @returns {Promise<object>} 更新后的用户数据
       */
      updateStatus: async (userId, status) => {
        throw new Error('Not implemented: admin.users.updateStatus');
      },

      /**
       * 重置用户密码
       * @param {string} userId - 用户 ID
       * @param {string} newPassword - 新密码
       * @returns {Promise<object>} 操作结果
       */
      resetPassword: async (userId, newPassword) => {
        throw new Error('Not implemented: admin.users.resetPassword');
      },

      /**
       * 删除用户（软删除）
       * @param {string} userId - 用户 ID
       * @returns {Promise<object>} 操作结果
       */
      delete: async (userId) => {
        throw new Error('Not implemented: admin.users.delete');
      },
    },

    /**
     * NPC 管理 API
     */
    agents: {
      /**
       * 获取所有 NPC 列表
       * @param {object} options - 查询选项
       * @param {number} [options.page=1] - 页码
       * @param {number} [options.pageSize=20] - 每页数量
       * @param {string} [options.search] - 搜索关键词（名称、创建者）
       * @param {string} [options.userId] - 创建者 ID
       * @param {string} [options.type] - NPC 类型
       * @returns {Promise<object>} NPC 列表数据 { agents: [], total: number }
       */
      getList: async (options = {}) => {
        throw new Error('Not implemented: admin.agents.getList');
      },

      /**
       * 获取 NPC 详情
       * @param {string} agentId - NPC ID
       * @returns {Promise<object>} NPC 详情数据
       */
      getById: async (agentId) => {
        throw new Error('Not implemented: admin.agents.getById');
      },

      /**
       * 编辑 NPC（管理员可以编辑任何 NPC）
       * @param {string} agentId - NPC ID
       * @param {object} data - 更新数据
       * @returns {Promise<object>} 更新后的 NPC 数据
       */
      update: async (agentId, data) => {
        throw new Error('Not implemented: admin.agents.update');
      },

      /**
       * 删除 NPC（软删除）
       * @param {string} agentId - NPC ID
       * @returns {Promise<object>} 操作结果
       */
      delete: async (agentId) => {
        throw new Error('Not implemented: admin.agents.delete');
      },
    },

    /**
     * 数据统计 API
     */
    statistics: {
      /**
       * 获取仪表盘数据
       * @returns {Promise<object>} 仪表盘数据
       */
      getDashboard: async () => {
        throw new Error('Not implemented: admin.statistics.getDashboard');
      },

      /**
       * 获取用户统计
       * @param {object} options - 查询选项
       * @param {string} [options.startDate] - 开始日期
       * @param {string} [options.endDate] - 结束日期
       * @returns {Promise<object>} 用户统计数据
       */
      getUsers: async (options = {}) => {
        throw new Error('Not implemented: admin.statistics.getUsers');
      },

      /**
       * 获取 NPC 统计
       * @returns {Promise<object>} NPC 统计数据
       */
      getAgents: async () => {
        throw new Error('Not implemented: admin.statistics.getAgents');
      },

      /**
       * 获取对话统计
       * @param {object} options - 查询选项
       * @param {string} [options.startDate] - 开始日期
       * @param {string} [options.endDate] - 结束日期
       * @returns {Promise<object>} 对话统计数据
       */
      getConversations: async (options = {}) => {
        throw new Error('Not implemented: admin.statistics.getConversations');
      },
    },
  };

  /**
   * Token 管理方法
   */
  setToken(token) {
    throw new Error('Not implemented: setToken');
  }

  loadToken() {
    throw new Error('Not implemented: loadToken');
  }
}

export default AdminApiAdapter;

