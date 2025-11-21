/**
 * ============================================
 * Mock API 适配器 (mockAdapter.js)
 * ============================================
 *
 * 【文件职责】
 * 实现 Mock API 适配器，使用 Mock 数据模拟后端 API
 *
 * 【主要功能】
 * 1. 实现统一的 API 接口（继承 ApiAdapter）
 * 2. 调用 Mock API 服务获取数据
 * 3. 返回符合统一格式的数据
 *
 * 【工作流程】
 * 业务代码调用 → Mock适配器 → Mock API服务 → 返回Mock数据
 *
 * 【依赖】
 * - adapter.js: 适配器接口定义
 * - mocks/: Mock API 服务（后续实现）
 *
 * 【被谁使用】
 * - index.js: 创建 Mock 适配器实例
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import ApiAdapter from './adapter.js';
import mockAgents from '../mocks/data/agents.js';
import mockHistory from '../mocks/data/history.js';

/**
 * 模拟延迟函数
 * @param {number} ms - 延迟毫秒数
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock API 适配器
 *
 * 【功能说明】
 * 实现 Mock API 适配器，使用 Mock 数据模拟后端 API
 *
 * 【实现说明】
 * 当前为占位实现，方法抛出"未实现"错误
 * 后续在开发具体页面时，按需实现对应的 Mock 方法
 *
 * 【使用方式】
 * const adapter = new MockAdapter();
 * const result = await adapter.agents.getList('user_123');
 */
class MockAdapter extends ApiAdapter {
  /**
   * Agents API - Mock 实现
   */
  agents = {
    /**
     * 创建 NPC（Mock）
     *
     * @param {object} data - 创建数据
     * @returns {Promise<object>} 创建的 NPC 数据
     */
    create: async (data) => {
      await delay(1000); // 模拟网络延迟

      // 模拟名称重复检查
      const isDuplicate = mockAgents.some(
        agent => agent.userId === data.userId && agent.name.toLowerCase() === data.name.toLowerCase()
      );

      if (isDuplicate) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: '该名称已存在，请使用其他名称'
          },
          timestamp: Date.now()
        };
      }

      // 创建新 Agent
      const newAgent = {
        id: `agent_${Date.now()}`,
        ...data,
        avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
        createdAt: Date.now(),
        lastMessageAt: null,
        lastMessagePreview: null
      };

      // 添加到 Mock 数据列表
      mockAgents.unshift(newAgent);

      return {
        success: true,
        data: newAgent,
        timestamp: Date.now()
      };
    },

    /**
     * 获取 NPC 列表（Mock）
     *
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} NPC 列表数据
     */
    getList: async (userId) => {
      await delay(500); // 模拟网络延迟

      // 模拟排序：按 lastMessageAt 倒序，如果为 null 则按 createdAt 倒序
      const sortedAgents = [...mockAgents].sort((a, b) => {
        if (a.lastMessageAt && b.lastMessageAt) {
          return b.lastMessageAt - a.lastMessageAt;
        }
        if (a.lastMessageAt && !b.lastMessageAt) {
          return -1;
        }
        if (!a.lastMessageAt && b.lastMessageAt) {
          return 1;
        }
        return b.createdAt - a.createdAt;
      });

      return {
        success: true,
        data: {
          agents: sortedAgents,
          total: sortedAgents.length
        },
        timestamp: Date.now()
      };
    },

    /**
     * 获取 NPC 详情（Mock）
     *
     * @param {string} agentId - NPC ID
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} NPC 详情数据
     */
    getById: async (agentId, userId) => {
      await delay(300);
      const agent = mockAgents.find(a => a.id === agentId);
      if (!agent) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'NPC 不存在' },
          timestamp: Date.now()
        };
      }
      return {
        success: true,
        data: agent,
        timestamp: Date.now()
      };
    },
  };

  /**
   * Messages API - Mock 实现
   */
  messages = {
    /**
     * 发送消息（Mock）
     *
     * @param {object} data - 消息数据
     * @returns {Promise<object>} AI 回复数据
     */
    send: async (data) => {
      await delay(1500); // 模拟 AI 思考延迟

      const { agentId, message } = data;
      
      // 模拟 AI 回复内容
      const mockResponses = [
        '这是一个很有趣的观点！能详细展开说说吗？',
        '我明白了，这确实是一个值得思考的问题。',
        '收到你的消息了。根据我的理解，我们可以尝试从另一个角度来看待这件事。',
        '好的，我会记住这一点。还有其他需要我帮忙的吗？',
        '这让我想到了一些相关的知识，也许对你有帮助。'
      ];
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      // 构建 AI 回复消息
      const aiMessage = {
        id: `msg_${Date.now()}`,
        sessionId: data.sessionId || 'session_temp',
        role: 'assistant',
        content: randomResponse,
        createdAt: Date.now()
      };

      // 如果有 Mock 历史，添加进去（保持内存中的状态一致性）
      if (mockHistory[agentId]) {
        // 先添加用户消息
        mockHistory[agentId].push({
          id: `msg_user_${Date.now()}`,
          sessionId: data.sessionId || 'session_temp',
          role: 'user',
          content: message,
          createdAt: Date.now() - 1500 // 用户消息比 AI 回复早一点
        });
        // 再添加 AI 消息
        mockHistory[agentId].push(aiMessage);
      }

      return {
        success: true,
        data: aiMessage,
        timestamp: Date.now()
      };
    },
  };

  /**
   * History API - Mock 实现
   */
  history = {
    /**
     * 获取对话历史（Mock）
     *
     * @param {string} userId - 用户 ID
     * @param {string} agentId - NPC ID
     * @returns {Promise<object>} 对话历史数据
     */
    get: async (userId, agentId) => {
      await delay(500);
      
      const messages = mockHistory[agentId] || [];
      
      return {
        success: true,
        data: {
          messages: messages,
          total: messages.length
        },
        timestamp: Date.now()
      };
    },
  };

  /**
   * Sessions API - Mock 实现
   */
  sessions = {
    /**
     * 获取会话列表（Mock）
     *
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} 会话列表数据
     */
    getList: async (userId) => {
      // TODO: 后续需要时实现
      throw new Error('Not implemented: MockAdapter.sessions.getList');
    },
  };

  /**
   * Users API - Mock 实现
   */
  users = {
    /**
     * 用户登录（Mock）
     * @param {string} userId - 用户 ID
     * @param {string} [password] - 密码
     * @returns {Promise<object>} 用户信息
     */
    login: async (userId, password) => {
      await delay(500);
      if (userId === 'error_user') {
        return {
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          timestamp: Date.now(),
        };
      }
      return {
        success: true,
        data: {
          id: userId,
          username: `MockUser_${userId}`,
          createdAt: Date.now(),
        },
        timestamp: Date.now(),
      };
    },

    /**
     * 用户注册（Mock）
     * @param {string} userId - 用户 ID
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<object>} 用户信息
     */
    register: async (userId, username, password) => {
      await delay(500);
      if (userId === 'existing_user') {
        return {
          success: false,
          error: { code: 'DUPLICATE_USER_ID', message: 'User ID already exists' },
          timestamp: Date.now(),
        };
      }
      return {
        success: true,
        data: {
          id: userId,
          username: username,
          createdAt: Date.now(),
        },
        timestamp: Date.now(),
      };
    },
  };
}

export default MockAdapter;

