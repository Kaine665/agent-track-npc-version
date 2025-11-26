/**
 * ============================================
 * Mock API 适配器 (mockAdapter.js)
 * ============================================
 *
 * 【文件职责】
 * 实现管理后台 Mock API 适配器，使用 Mock 数据模拟后端 API
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import AdminApiAdapter from './adapter.js';
import mockUsers from '../mocks/data/users.js';
import mockAgents from '../mocks/data/agents.js';
import {
  mockDashboard,
  mockUserStatistics,
  mockAgentStatistics,
  mockConversationStatistics,
} from '../mocks/data/statistics.js';

/**
 * 模拟延迟函数
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API 适配器
 */
class MockAdapter extends AdminApiAdapter {
  token = null;

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_access_token', token);
    } else {
      localStorage.removeItem('admin_access_token');
    }
  }

  loadToken() {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      this.token = token;
    }
    return token;
  }

  admin = {
    auth: {
      login: async (userId, password) => {
        await delay(500);

        // Mock 管理员账号
        if (userId === 'admin' && password === 'admin123') {
          const adminUser = {
            id: 'admin',
            username: '管理员',
            role: 'admin',
            createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
          };

          const token = `mock_admin_token_${Date.now()}`;
          this.setToken(token);

          return {
            success: true,
            data: {
              user: adminUser,
              accessToken: token,
            },
            timestamp: Date.now(),
          };
        }

        return {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: '用户名或密码错误',
          },
          timestamp: Date.now(),
        };
      },

      getMe: async () => {
        await delay(300);

        if (!this.token) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: '未登录',
            },
            timestamp: Date.now(),
          };
        }

        return {
          success: true,
          data: {
            user: {
              id: 'admin',
              username: '管理员',
              role: 'admin',
            },
          },
          timestamp: Date.now(),
        };
      },
    },

    users: {
      getList: async (options = {}) => {
        await delay(500);

        const { page = 1, pageSize = 20, search, startDate, endDate } = options;

        // 搜索过滤
        let filtered = [...mockUsers];
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (user) =>
              user.id.toLowerCase().includes(searchLower) ||
              user.username.toLowerCase().includes(searchLower)
          );
        }

        // 日期过滤
        if (startDate) {
          filtered = filtered.filter((user) => user.createdAt >= new Date(startDate).getTime());
        }
        if (endDate) {
          filtered = filtered.filter((user) => user.createdAt <= new Date(endDate).getTime());
        }

        // 分页
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const users = filtered.slice(start, end);

        return {
          success: true,
          data: {
            users,
            total,
            page,
            pageSize,
          },
          timestamp: Date.now(),
        };
      },

      getById: async (userId) => {
        await delay(300);

        const user = mockUsers.find((u) => u.id === userId);
        if (!user) {
          return {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: '用户不存在',
            },
            timestamp: Date.now(),
          };
        }

        // 获取用户的 NPC 列表
        const userAgents = mockAgents.filter((agent) => agent.userId === userId);

        return {
          success: true,
          data: {
            user,
            agents: userAgents,
            statistics: {
              agentCount: userAgents.length,
              conversationCount: user.conversationCount,
            },
          },
          timestamp: Date.now(),
        };
      },

      updateStatus: async (userId, status) => {
        await delay(300);

        const userIndex = mockUsers.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
          return {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: '用户不存在',
            },
            timestamp: Date.now(),
          };
        }

        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          status,
        };

        return {
          success: true,
          data: {
            user: mockUsers[userIndex],
          },
          timestamp: Date.now(),
        };
      },

      resetPassword: async (userId, newPassword) => {
        await delay(300);

        const user = mockUsers.find((u) => u.id === userId);
        if (!user) {
          return {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: '用户不存在',
            },
            timestamp: Date.now(),
          };
        }

        return {
          success: true,
          data: {
            message: '密码重置成功',
          },
          timestamp: Date.now(),
        };
      },

      delete: async (userId) => {
        await delay(300);

        const userIndex = mockUsers.findIndex((u) => u.id === userId);
        if (userIndex === -1) {
          return {
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: '用户不存在',
            },
            timestamp: Date.now(),
          };
        }

        // 软删除：标记为已删除
        mockUsers[userIndex] = {
          ...mockUsers[userIndex],
          status: 'deleted',
          deletedAt: Date.now(),
        };

        return {
          success: true,
          data: {
            message: '用户已删除',
          },
          timestamp: Date.now(),
        };
      },
    },

    agents: {
      getList: async (options = {}) => {
        await delay(500);

        const { page = 1, pageSize = 20, search, userId, type } = options;

        // 过滤
        let filtered = [...mockAgents];
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (agent) =>
              agent.name.toLowerCase().includes(searchLower) ||
              agent.username.toLowerCase().includes(searchLower)
          );
        }
        if (userId) {
          filtered = filtered.filter((agent) => agent.userId === userId);
        }
        if (type) {
          filtered = filtered.filter((agent) => agent.type === type);
        }

        // 分页
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const agents = filtered.slice(start, end);

        return {
          success: true,
          data: {
            agents,
            total,
            page,
            pageSize,
          },
          timestamp: Date.now(),
        };
      },

      getById: async (agentId) => {
        await delay(300);

        const agent = mockAgents.find((a) => a.id === agentId);
        if (!agent) {
          return {
            success: false,
            error: {
              code: 'AGENT_NOT_FOUND',
              message: 'NPC 不存在',
            },
            timestamp: Date.now(),
          };
        }

        return {
          success: true,
          data: {
            agent,
            statistics: {
              usageCount: agent.usageCount,
            },
          },
          timestamp: Date.now(),
        };
      },

      update: async (agentId, data) => {
        await delay(500);

        const agentIndex = mockAgents.findIndex((a) => a.id === agentId);
        if (agentIndex === -1) {
          return {
            success: false,
            error: {
              code: 'AGENT_NOT_FOUND',
              message: 'NPC 不存在',
            },
            timestamp: Date.now(),
          };
        }

        mockAgents[agentIndex] = {
          ...mockAgents[agentIndex],
          ...data,
          updatedAt: Date.now(),
        };

        return {
          success: true,
          data: {
            agent: mockAgents[agentIndex],
          },
          timestamp: Date.now(),
        };
      },

      delete: async (agentId) => {
        await delay(300);

        const agentIndex = mockAgents.findIndex((a) => a.id === agentId);
        if (agentIndex === -1) {
          return {
            success: false,
            error: {
              code: 'AGENT_NOT_FOUND',
              message: 'NPC 不存在',
            },
            timestamp: Date.now(),
          };
        }

        // 软删除：标记为已删除
        mockAgents[agentIndex] = {
          ...mockAgents[agentIndex],
          status: 'deleted',
          deletedAt: Date.now(),
        };

        return {
          success: true,
          data: {
            message: 'NPC 已删除',
          },
          timestamp: Date.now(),
        };
      },
    },

    statistics: {
      getDashboard: async () => {
        await delay(500);

        return {
          success: true,
          data: mockDashboard,
          timestamp: Date.now(),
        };
      },

      getUsers: async (options = {}) => {
        await delay(500);

        return {
          success: true,
          data: mockUserStatistics,
          timestamp: Date.now(),
        };
      },

      getAgents: async () => {
        await delay(500);

        return {
          success: true,
          data: mockAgentStatistics,
          timestamp: Date.now(),
        };
      },

      getConversations: async (options = {}) => {
        await delay(500);

        return {
          success: true,
          data: mockConversationStatistics,
          timestamp: Date.now(),
        };
      },
    },
  };
}

export default MockAdapter;

