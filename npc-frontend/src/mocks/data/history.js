/**
 * ============================================
 * 对话历史 Mock 数据 (history.js)
 * ============================================
 *
 * 【文件职责】
 * 提供对话历史的 Mock 数据
 *
 * 【数据结构】
 * 符合 API 设计文档中的 Message 数据模型
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

const history = {
  'agent_001': [
    {
      id: 'msg_001',
      sessionId: 'session_001',
      role: 'user',
      content: '你好，我想学习编程，有什么建议吗？',
      createdAt: 1703001900000
    },
    {
      id: 'msg_002',
      sessionId: 'session_001',
      role: 'assistant',
      content: '你好！学习编程是一个很棒的决定。为了给你提供更具体的建议，我想先了解一下：\n\n1. 你的学习目的是什么？（例如：找工作、兴趣爱好、自动化办公等）\n2. 你之前有接触过编程吗？如果有，学过什么语言？\n3. 你对哪个领域比较感兴趣？（例如：Web开发、数据分析、人工智能、游戏开发等）',
      createdAt: 1703001905000
    },
    {
      id: 'msg_003',
      sessionId: 'session_001',
      role: 'user',
      content: '我是为了找工作，之前自学过一点 Python，对人工智能比较感兴趣。',
      createdAt: 1703001950000
    },
    {
      id: 'msg_004',
      sessionId: 'session_001',
      role: 'assistant',
      content: '了解了。既然你有 Python 基础并且对人工智能感兴趣，这是一个非常热门且有前景的方向。以下是我的建议路径：\n\n### 1. 巩固 Python 基础\nAI 领域对 Python 的要求比较高，建议你深入学习 Python 的高级特性（如装饰器、生成器、多线程等）以及数据处理库（NumPy, Pandas）。\n\n### 2. 学习机器学习基础\n从经典的机器学习算法开始，推荐学习 Scikit-learn 库。理解回归、分类、聚类等基本概念。\n\n### 3. 深度学习入门\n学习 PyTorch 或 TensorFlow（推荐 PyTorch，目前学术界和工业界使用更广泛）。从神经网络的基本原理开始，动手实现简单的网络。\n\n### 4. 实践项目\n找一些经典的数据集（如 Kaggle 上的 Titanic, MNIST）进行练习。做一个完整的项目，从数据清洗到模型训练再到部署。\n\n你可以先从巩固 Python 基础开始，需要我为你制定一个详细的第一阶段学习计划吗？',
      createdAt: 1703002000000
    }
  ],
  'agent_002': [
    {
      id: 'msg_011',
      sessionId: 'session_002',
      role: 'user',
      content: '我最近感觉压力好大，工作总是做不完。',
      createdAt: 1703004900000
    },
    {
      id: 'msg_012',
      sessionId: 'session_002',
      role: 'assistant',
      content: '听起来你现在很辛苦，抱抱你。这种工作永远做不完的感觉确实会让人感到焦虑和无助。能跟我具体说说，是工作量太大了，还是因为其他什么原因让你感到压力大呢？',
      createdAt: 1703004905000
    },
    {
      id: 'msg_013',
      sessionId: 'session_002',
      role: 'user',
      content: '主要是老板要求太高了，总是临时加需求，而且期限很紧。',
      createdAt: 1703004950000
    },
    {
      id: 'msg_014',
      sessionId: 'session_002',
      role: 'assistant',
      content: '面对临时增加且期限紧迫的需求，确实很难保持平静，这种不可控感是很大的压力源。你已经很努力在应对了。在这种情况下，你通常会怎么处理这些突发的需求呢？',
      createdAt: 1703005000000
    }
  ]
};

export default history;

