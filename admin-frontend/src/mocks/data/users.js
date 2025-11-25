/**
 * ============================================
 * Mock 用户数据 (users.js)
 * ============================================
 *
 * 【文件职责】
 * 提供管理后台用户管理的 Mock 数据
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * Mock 用户列表数据
 */
const mockUsers = [
  {
    id: 'user_1',
    username: '张三',
    role: 'user',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30天前
    lastActiveAt: Date.now() - 1 * 60 * 60 * 1000,    // 1小时前
    status: 'active',
    agentCount: 5,
    conversationCount: 120,
  },
  {
    id: 'user_2',
    username: '李四',
    role: 'user',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000, // 25天前
    lastActiveAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2天前
    status: 'active',
    agentCount: 3,
    conversationCount: 89,
  },
  {
    id: 'user_3',
    username: '王五',
    role: 'user',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20天前
    lastActiveAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5天前
    status: 'active',
    agentCount: 8,
    conversationCount: 234,
  },
  {
    id: 'user_4',
    username: '赵六',
    role: 'user',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15天前
    lastActiveAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10天前
    status: 'disabled',
    agentCount: 2,
    conversationCount: 45,
  },
  {
    id: 'user_5',
    username: '钱七',
    role: 'user',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10天前
    lastActiveAt: Date.now() - 30 * 60 * 1000, // 30分钟前
    status: 'active',
    agentCount: 12,
    conversationCount: 567,
  },
  {
    id: 'user_6',
    username: '孙八',
    role: 'user',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5天前
    lastActiveAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1天前
    status: 'active',
    agentCount: 1,
    conversationCount: 12,
  },
  {
    id: 'user_7',
    username: '周九',
    role: 'user',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3天前
    lastActiveAt: Date.now() - 2 * 60 * 60 * 1000, // 2小时前
    status: 'active',
    agentCount: 6,
    conversationCount: 156,
  },
  {
    id: 'user_8',
    username: '吴十',
    role: 'user',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1天前
    lastActiveAt: Date.now() - 5 * 60 * 1000, // 5分钟前
    status: 'active',
    agentCount: 4,
    conversationCount: 78,
  },
];

export default mockUsers;

