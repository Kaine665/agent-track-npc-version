/**
 * ============================================
 * Mock 统计数据 (statistics.js)
 * ============================================
 *
 * 【文件职责】
 * 提供管理后台数据统计的 Mock 数据
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * 生成日期范围数据（最近30天）
 */
function generateDateRange(days = 30) {
  const data = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    data.push({
      date: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
    });
  }
  return data;
}

/**
 * Mock 仪表盘数据
 */
const mockDashboard = {
  totalUsers: 1250,
  totalAgents: 3420,
  totalConversations: 15680,
  todayActiveUsers: 89,
  userGrowth: generateDateRange(30).map((item, index) => ({
    ...item,
    count: 100 + index * 5 + Math.floor(Math.random() * 20),
  })),
  agentGrowth: generateDateRange(30).map((item, index) => ({
    ...item,
    count: 50 + index * 3 + Math.floor(Math.random() * 15),
  })),
  conversationStats: generateDateRange(7).map((item, index) => ({
    ...item,
    count: 200 + index * 10 + Math.floor(Math.random() * 50),
  })),
};

/**
 * Mock 用户统计数据
 */
const mockUserStatistics = {
  trends: generateDateRange(30).map((item, index) => ({
    ...item,
    newUsers: Math.floor(Math.random() * 20) + 5,
    activeUsers: Math.floor(Math.random() * 50) + 30,
  })),
  retention: {
    day1: 0.65,
    day7: 0.45,
    day30: 0.25,
  },
};

/**
 * Mock NPC 统计数据
 */
const mockAgentStatistics = {
  trends: generateDateRange(30).map((item, index) => ({
    ...item,
    newAgents: Math.floor(Math.random() * 15) + 3,
  })),
  popular: [
    { id: 'agent_5', name: '写作助手', usageCount: 567 },
    { id: 'agent_3', name: '心理咨询师', usageCount: 234 },
    { id: 'agent_7', name: '数据分析师', usageCount: 156 },
    { id: 'agent_2', name: '编程助手', usageCount: 89 },
    { id: 'agent_8', name: '产品经理', usageCount: 78 },
  ],
  distribution: {
    general: 120,
    special: 3300,
  },
};

/**
 * Mock 对话统计数据
 */
const mockConversationStatistics = {
  trends: generateDateRange(30).map((item, index) => ({
    ...item,
    count: Math.floor(Math.random() * 200) + 100,
  })),
  averageRounds: 8.5,
  topTopics: [
    { topic: '学习计划', count: 1234 },
    { topic: '编程问题', count: 987 },
    { topic: '心理支持', count: 756 },
    { topic: '写作建议', count: 654 },
    { topic: '数据分析', count: 432 },
  ],
};

export {
  mockDashboard,
  mockUserStatistics,
  mockAgentStatistics,
  mockConversationStatistics,
};

