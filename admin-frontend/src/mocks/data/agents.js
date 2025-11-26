/**
 * ============================================
 * Mock NPC 数据 (agents.js)
 * ============================================
 *
 * 【文件职责】
 * 提供管理后台 NPC 管理的 Mock 数据
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

/**
 * Mock NPC 列表数据
 */
const mockAgents = [
  {
    id: 'agent_1',
    name: '学习教练',
    userId: 'user_1',
    username: '张三',
    type: 'special',
    model: 'gpt-4.1',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    usageCount: 45,
    status: 'active',
    systemPrompt: '你是一位专业的学习教练，擅长帮助用户制定学习计划。',
  },
  {
    id: 'agent_2',
    name: '编程助手',
    userId: 'user_2',
    username: '李四',
    type: 'special',
    model: 'anthropic/claude-sonnet-4.5',
    createdAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
    usageCount: 89,
    status: 'active',
    systemPrompt: '你是一位经验丰富的编程助手，可以帮助用户解决编程问题。',
  },
  {
    id: 'agent_3',
    name: '心理咨询师',
    userId: 'user_3',
    username: '王五',
    type: 'special',
    model: 'google/gemini-3-pro-preview',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    usageCount: 234,
    status: 'active',
    systemPrompt: '你是一位专业的心理咨询师，擅长倾听和提供心理支持。',
  },
  {
    id: 'agent_4',
    name: '通用助手',
    userId: 'user_4',
    username: '赵六',
    type: 'general',
    model: 'gpt-4.1',
    createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    usageCount: 23,
    status: 'disabled',
    systemPrompt: null,
  },
  {
    id: 'agent_5',
    name: '写作助手',
    userId: 'user_5',
    username: '钱七',
    type: 'special',
    model: 'anthropic/claude-sonnet-4.5',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    usageCount: 567,
    status: 'active',
    systemPrompt: '你是一位专业的写作助手，可以帮助用户改进文章和创作内容。',
  },
  {
    id: 'agent_6',
    name: '翻译助手',
    userId: 'user_6',
    username: '孙八',
    type: 'special',
    model: 'google/gemini-2.5-pro',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    usageCount: 12,
    status: 'active',
    systemPrompt: '你是一位专业的翻译助手，可以帮助用户翻译各种语言。',
  },
  {
    id: 'agent_7',
    name: '数据分析师',
    userId: 'user_7',
    username: '周九',
    type: 'special',
    model: 'gpt-4.1',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    usageCount: 156,
    status: 'active',
    systemPrompt: '你是一位专业的数据分析师，擅长数据分析和可视化。',
  },
  {
    id: 'agent_8',
    name: '产品经理',
    userId: 'user_8',
    username: '吴十',
    type: 'special',
    model: 'anthropic/claude-sonnet-4.5',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    usageCount: 78,
    status: 'active',
    systemPrompt: '你是一位经验丰富的产品经理，可以帮助用户规划产品功能。',
  },
];

export default mockAgents;

