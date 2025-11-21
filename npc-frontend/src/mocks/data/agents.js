/**
 * ============================================
 * NPC Mock 数据 (agents.js)
 * ============================================
 *
 * 【文件职责】
 * 提供 NPC 列表和详情的 Mock 数据
 *
 * 【数据结构】
 * 符合 API 设计文档中的 Agent 数据模型
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

const agents = [
  {
    id: 'agent_001',
    userId: 'user_123',
    name: '学习教练',
    type: 'special',
    model: 'gpt-4.1',
    systemPrompt: '你是一位专业的学习教练，擅长制定学习计划、解答学习问题，帮助学生提高学习效率。',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    createdAt: 1703001234567,
    lastMessageAt: 1703002000000,
    lastMessagePreview: '你好，我想学习编程，有什么建议吗？'
  },
  {
    id: 'agent_002',
    userId: 'user_123',
    name: '心理导师',
    type: 'special',
    model: 'claude-3-opus',
    systemPrompt: '你是一位富有同理心的心理导师，倾听用户的烦恼，提供心理支持和建议。',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    createdAt: 1703001000000,
    lastMessageAt: 1703005000000,
    lastMessagePreview: '今天心情怎么样？有没有发生什么特别的事情？'
  },
  {
    id: 'agent_003',
    userId: 'user_123',
    name: '英语陪练',
    type: 'general',
    model: 'gpt-3.5-turbo',
    systemPrompt: 'You are an English tutor. You help users practice English conversation and correct their grammar.',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack',
    createdAt: 1702900000000,
    lastMessageAt: null,
    lastMessagePreview: null
  },
  {
    id: 'agent_004',
    userId: 'user_123',
    name: '创意写作助手',
    type: 'special',
    model: 'claude-3-sonnet',
    systemPrompt: '你是一位创意写作助手，帮助用户构思故事、润色文章、激发灵感。',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
    createdAt: 1702800000000,
    lastMessageAt: 1702800500000,
    lastMessagePreview: '这个故事的开头非常有吸引力，我们可以尝试增加一些冲突...'
  }
];

export default agents;

