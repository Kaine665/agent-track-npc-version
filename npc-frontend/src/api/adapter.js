/**
 * ============================================
 * API 适配器接口定义 (adapter.js)
 * ============================================
 *
 * 【文件职责】
 * 定义统一的 API 适配器接口规范，所有适配器必须实现此接口
 *
 * 【主要功能】
 * 1. 定义适配器接口规范
 * 2. 确保所有适配器实现统一的接口
 *
 * 【设计模式】
 * 适配器模式（Adapter Pattern）
 *
 * 【工作流程】
 * 业务代码调用统一接口 → 适配器实现具体逻辑 → 返回统一格式数据
 *
 * 【依赖】
 * 无（纯接口定义）
 *
 * 【被谁使用】
 * - mockAdapter.js: Mock适配器实现
 * - httpAdapter.js: HTTP适配器实现
 * - index.js: 创建适配器实例
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

/**
 * API 适配器接口
 *
 * 【功能说明】
 * 定义所有适配器必须实现的统一接口
 *
 * 【接口规范】
 * 所有适配器必须实现以下方法：
 * - agents.create(data)
 * - agents.getList(userId)
 * - agents.getById(agentId, userId)
 * - messages.send(data)
 * - history.get(userId, agentId)
 * - sessions.getList(userId)
 *
 * 【返回值规范】
 * 所有方法返回 Promise，resolve 的数据格式：
 * {
 *   success: true,
 *   data: {...},
 *   timestamp: number
 * }
 *
 * reject 的错误格式：
 * {
 *   success: false,
 *   error: {
 *     code: string,
 *     message: string,
 *     details?: object
 *   },
 *   timestamp: number
 * }
 */
class ApiAdapter {
  /**
   * Agents API
   */
  agents = {
    /**
     * 创建 NPC
     *
     * @param {object} data - 创建数据
     * @param {string} data.userId - 用户 ID
     * @param {string} data.name - NPC 名称
     * @param {string} data.type - NPC 类型（general/special）
     * @param {string} data.systemPrompt - NPC 人设描述
     * @param {string} data.model - LLM 模型名称
     * @param {string} [data.avatarUrl] - 头像 URL（可选）
     * @returns {Promise<object>} 创建的 NPC 数据
     */
    create: async (data) => {
      throw new Error('Not implemented: agents.create');
    },

    /**
     * 获取 NPC 列表
     *
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} NPC 列表数据 { agents: [], total: number }
     */
    getList: async (userId) => {
      throw new Error('Not implemented: agents.getList');
    },

    /**
     * 获取 NPC 详情
     *
     * @param {string} agentId - NPC ID
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} NPC 详情数据
     */
    getById: async (agentId, userId) => {
      throw new Error('Not implemented: agents.getById');
    },

    /**
     * 更新 NPC
     *
     * @param {string} agentId - NPC ID
     * @param {string} userId - 用户 ID
     * @param {object} data - 更新数据
     * @param {string} [data.name] - NPC 名称
     * @param {string} [data.systemPrompt] - NPC 人设描述
     * @param {string} [data.model] - LLM 模型名称
     * @returns {Promise<object>} 更新后的 NPC 数据
     */
    update: async (agentId, userId, data) => {
      throw new Error('Not implemented: agents.update');
    },

    /**
     * 删除 NPC
     *
     * @param {string} agentId - NPC ID
     * @param {string} userId - 用户 ID
     * @param {boolean} [hardDelete=false] - 是否硬删除（默认 false，软删除）
     * @returns {Promise<object>} 删除结果
     */
    delete: async (agentId, userId, hardDelete = false) => {
      throw new Error('Not implemented: agents.delete');
    },
  };

  /**
   * Messages API
   */
  messages = {
    /**
     * 发送消息
     *
     * @param {object} data - 消息数据
     * @param {string} data.userId - 用户 ID
     * @param {string} data.agentId - NPC ID
     * @param {string} data.content - 消息内容
     * @returns {Promise<object>} AI 回复数据
     */
    send: async (data) => {
      throw new Error('Not implemented: messages.send');
    },
  };

  /**
   * History API
   */
  history = {
    /**
     * 获取对话历史
     *
     * @param {string} userId - 用户 ID
     * @param {string} agentId - NPC ID
     * @returns {Promise<object>} 对话历史数据 { messages: [] }
     */
    get: async (userId, agentId) => {
      throw new Error('Not implemented: history.get');
    },
  };

  /**
   * Sessions API
   */
  sessions = {
    /**
     * 获取会话列表
     *
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} 会话列表数据 { sessions: [] }
     */
    getList: async (userId) => {
      throw new Error('Not implemented: sessions.getList');
    },
  };

  /**
   * Users API
   */
  users = {
    /**
     * 用户登录
     * @param {string} userId - 用户 ID
     * @param {string} [password] - 密码
     * @returns {Promise<object>} 用户信息
     */
    login: async (userId, password) => {
      throw new Error('Not implemented: users.login');
    },

    /**
     * 用户注册
     * @param {string} userId - 用户 ID
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<object>} 用户信息
     */
    register: async (userId, username, password) => {
      throw new Error('Not implemented: users.register');
    },

    /**
     * 忘记密码 - 重置密码
     * @param {string} userId - 用户 ID
     * @param {string} newPassword - 新密码
     * @returns {Promise<object>} 用户信息
     */
    forgotPassword: async (userId, newPassword) => {
      throw new Error('Not implemented: users.forgotPassword');
    },
  };

  /**
   * Import API
   */
  import = {
    /**
     * 导入对话历史
     * @param {object} data - 导入数据
     * @param {string} data.agentName - Agent名称
     * @param {Array} data.messages - 消息数组
     * @returns {Promise<object>} 导入结果
     */
    conversations: async (data) => {
      throw new Error('Not implemented: import.conversations');
    },
  };
}

export default ApiAdapter;

