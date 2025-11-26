/**
 * ============================================
 * Admin API 路由 (admin.js)
 * ============================================
 * 
 * 管理后台专用 API 路由
 * 
 * POST /api/admin/auth/login
 * GET  /api/admin/auth/me
 */

const express = require('express');
const router = express.Router();
const userService = require('../services/UserService');
const agentService = require('../services/AgentService');
const userRepository = require('../repositories/UserRepository');
const agentRepository = require('../repositories/AgentRepository');
const sessionRepository = require('../repositories/SessionRepository');
const { generateAccessToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const { query } = require('../config/database');

// 统一响应辅助函数
function sendSuccessResponse(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data: data,
    timestamp: Date.now(),
  });
}

function sendErrorResponse(res, statusCode, code, message) {
  res.status(statusCode).json({
    success: false,
    error: {
      code: code,
      message: message,
    },
    timestamp: Date.now(),
  });
}

/**
 * 管理后台登录
 * POST /api/admin/auth/login
 */
router.post('/auth/login', async (req, res) => {
  console.log('🔐 Admin login route called');
  console.log('   Method:', req.method);
  console.log('   URL:', req.url);
  console.log('   Original URL:', req.originalUrl);
  console.log('   Path:', req.path);
  console.log('   Body:', { ...req.body, password: req.body.password ? '***' : undefined });
  try {
    const { userId, password } = req.body;
    
    if (!userId) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'User ID is required');
    }

    if (!password) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Password is required');
    }

    console.log(`🔍 Attempting login for userId: ${userId}, password length: ${password?.length || 0}`);
    console.log(`   Password bytes (hex): ${password ? Buffer.from(password).toString('hex') : 'none'}`);

    // 验证用户密码
    const user = await userService.login(userId, password);

    console.log(`✅ Login successful for user: ${user.id} (${user.username})`);

    // 生成 Access Token
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
    });

    // 返回 Token 和用户信息
    sendSuccessResponse(res, 200, {
      user: {
        id: user.id,
        username: user.username,
      },
      accessToken,
      expiresIn: '7d', // Token 有效期
    });
  } catch (error) {
    console.error('❌ Login error:', error.code, error.message);
    const code = error.code || 'SYSTEM_ERROR';
    // 登录失败（用户不存在或密码错误）统一返回 401 Unauthorized
    const status = (code === 'USER_NOT_FOUND' || code === 'INVALID_PASSWORD') ? 401 : (code === 'VALIDATION_ERROR' ? 400 : 500);
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 获取当前登录的管理员信息
 * GET /api/admin/auth/me
 */
router.get('/auth/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 Admin getMe called, userId:', userId);
    
    // 获取用户信息
    const user = await userService.getUserById(userId);
    
    if (!user) {
      console.warn('⚠️  User not found:', userId);
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    console.log('✅ User found:', user.id, user.username);
    sendSuccessResponse(res, 200, {
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('❌ getMe error:', error);
    const code = error.code || 'SYSTEM_ERROR';
    sendErrorResponse(res, 500, code, error.message);
  }
});

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 * GET /api/admin/users
 */
router.get('/users', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search } = req.query;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let sql = 'SELECT id, username, created_at, updated_at FROM users WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (id LIKE ? OR username LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    // 获取总数
    const countSql = sql.replace('SELECT id, username, created_at, updated_at', 'SELECT COUNT(*) as total');
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // 获取分页数据
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const users = await query(sql, [...params, pageSizeNum, offset]);

    // 获取每个用户的统计信息
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // 获取用户的 Agent 数量
        const agentCountResult = await query(
          'SELECT COUNT(*) as count FROM agents WHERE user_id = ?',
          [user.id]
        );
        const agentCount = agentCountResult[0].count;

        // 获取用户的对话数量（使用 JSON_CONTAINS 查询 participants）
        const participantJson = JSON.stringify({ type: 'user', id: user.id });
        const sessionCountResult = await query(
          'SELECT COUNT(*) as count FROM sessions WHERE JSON_CONTAINS(participants, ?)',
          [participantJson]
        );
        const conversationCount = sessionCountResult[0].count;

        return {
          id: user.id,
          username: user.username,
          role: 'user', // 默认角色
          status: 'active', // 默认状态
          agentCount,
          conversationCount,
          createdAt: user.created_at,
          lastActiveAt: null, // TODO: 可以从 sessions 表获取
        };
      })
    );

    sendSuccessResponse(res, 200, {
      users: usersWithStats,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 获取用户详情
 * GET /api/admin/users/:userId
 */
router.get('/users/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);

    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    sendSuccessResponse(res, 200, { user });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 更新用户状态
 * PUT /api/admin/users/:userId/status
 */
router.put('/users/:userId/status', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'disabled'].includes(status)) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid status');
    }

    // TODO: 实现状态更新逻辑（需要在 UserRepository 中添加方法）
    // 目前先返回成功
    const user = await userService.getUserById(userId);
    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    sendSuccessResponse(res, 200, {
      user: { ...user, status },
      message: 'Status updated',
    });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 重置用户密码
 * POST /api/admin/users/:userId/reset-password
 */
router.post('/users/:userId/reset-password', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'New password is required');
    }

    await userService.forgotPassword(userId, newPassword);

    sendSuccessResponse(res, 200, {
      message: 'Password reset successfully',
    });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 删除用户
 * DELETE /api/admin/users/:userId
 */
router.delete('/users/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // TODO: 实现软删除逻辑
    // 目前先检查用户是否存在
    const user = await userService.getUserById(userId);
    if (!user) {
      return sendErrorResponse(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    sendSuccessResponse(res, 200, {
      message: 'User deleted successfully',
    });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'USER_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

// ==================== NPC 管理 ====================

/**
 * 获取 NPC 列表
 * GET /api/admin/agents
 */
router.get('/agents', authenticate, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search, userId, type } = req.query;
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);
    const offset = (pageNum - 1) * pageSizeNum;

    let sql = `
      SELECT a.id, a.user_id, a.name, a.type, a.model, a.created_at,
             u.username
      FROM agents a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ' AND (a.name LIKE ? OR u.username LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (userId) {
      sql += ' AND a.user_id = ?';
      params.push(userId);
    }

    if (type) {
      sql += ' AND a.type = ?';
      params.push(type);
    }

    // 获取总数
    const countSql = sql.replace(
      'SELECT a.id, a.user_id, a.name, a.type, a.model, a.created_at, u.username',
      'SELECT COUNT(*) as total'
    );
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // 获取分页数据
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    const agents = await query(sql, [...params, pageSizeNum, offset]);

    // 获取每个 Agent 的使用次数
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const sessionCountResult = await query(
          'SELECT COUNT(*) as count FROM sessions WHERE agent_id = ?',
          [agent.id]
        );
        const usageCount = sessionCountResult[0].count;

        return {
          id: agent.id,
          name: agent.name,
          username: agent.username,
          type: agent.type,
          model: agent.model,
          status: 'active',
          usageCount,
          createdAt: agent.created_at,
        };
      })
    );

    sendSuccessResponse(res, 200, {
      agents: agentsWithStats,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 获取 NPC 详情
 * GET /api/admin/agents/:agentId
 */
router.get('/agents/:agentId', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = await agentService.getAgentById(agentId);

    if (!agent) {
      return sendErrorResponse(res, 404, 'AGENT_NOT_FOUND', 'Agent not found');
    }

    sendSuccessResponse(res, 200, { agent });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'AGENT_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 更新 NPC
 * PUT /api/admin/agents/:agentId
 */
router.put('/agents/:agentId', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;
    const updateData = req.body;

    // TODO: 实现更新逻辑
    const agent = await agentService.getAgentById(agentId);
    if (!agent) {
      return sendErrorResponse(res, 404, 'AGENT_NOT_FOUND', 'Agent not found');
    }

    sendSuccessResponse(res, 200, {
      agent: { ...agent, ...updateData },
      message: 'Agent updated',
    });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'AGENT_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 删除 NPC
 * DELETE /api/admin/agents/:agentId
 */
router.delete('/agents/:agentId', authenticate, async (req, res) => {
  try {
    const { agentId } = req.params;

    // TODO: 实现软删除逻辑
    const agent = await agentService.getAgentById(agentId);
    if (!agent) {
      return sendErrorResponse(res, 404, 'AGENT_NOT_FOUND', 'Agent not found');
    }

    sendSuccessResponse(res, 200, {
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = code === 'AGENT_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

// ==================== 统计 ====================

/**
 * 获取仪表盘统计
 * GET /api/admin/statistics/dashboard
 */
router.get('/statistics/dashboard', authenticate, async (req, res) => {
  try {
    console.log('📊 Dashboard statistics requested');
    
    // 总用户数
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult[0].count;

    // 总 NPC 数
    const totalAgentsResult = await query('SELECT COUNT(*) as count FROM agents');
    const totalAgents = totalAgentsResult[0].count;

    // 总对话数
    const totalConversationsResult = await query('SELECT COUNT(*) as count FROM sessions');
    const totalConversations = totalConversationsResult[0].count;

    // 今日活跃用户（有对话记录的用户）
    // 注意：sessions 表使用 participants JSON 字段存储用户信息，需要解析 JSON
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    // 使用 JSON_EXTRACT 提取 participants 中的用户 ID
    const todayActiveUsersResult = await query(
      `SELECT COUNT(DISTINCT JSON_UNQUOTE(JSON_EXTRACT(participants, '$[*].id'))) as count 
       FROM sessions 
       WHERE created_at >= ? AND JSON_CONTAINS(participants, '{"type":"user"}')`,
      [todayTimestamp]
    );
    // 更简单的方法：统计今日有会话的用户数量
    // 由于 participants 是 JSON 数组，我们需要用不同的方法
    // 先获取所有今日的会话，然后在应用层统计
    const todaySessionsResult = await query(
      'SELECT participants FROM sessions WHERE created_at >= ?',
      [todayTimestamp]
    );
    const userIds = new Set();
    todaySessionsResult.forEach(session => {
      try {
        const participants = JSON.parse(session.participants);
        participants.forEach(p => {
          if (p.type === 'user') {
            userIds.add(p.id);
          }
        });
      } catch (e) {
        // 忽略解析错误
      }
    });
    const todayActiveUsers = userIds.size;

    console.log('✅ Dashboard statistics:', { totalUsers, totalAgents, totalConversations, todayActiveUsers });

    sendSuccessResponse(res, 200, {
      totalUsers,
      totalAgents,
      totalConversations,
      todayActiveUsers,
    });
  } catch (error) {
    console.error('❌ Dashboard statistics error:', error);
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 获取用户统计
 * GET /api/admin/statistics/users
 */
router.get('/statistics/users', authenticate, async (req, res) => {
  try {
    // TODO: 实现更详细的用户统计
    sendSuccessResponse(res, 200, {
      message: 'User statistics',
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 获取 NPC 统计
 * GET /api/admin/statistics/agents
 */
router.get('/statistics/agents', authenticate, async (req, res) => {
  try {
    // TODO: 实现更详细的 NPC 统计
    sendSuccessResponse(res, 200, {
      message: 'Agent statistics',
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

/**
 * 获取对话统计
 * GET /api/admin/statistics/conversations
 */
router.get('/statistics/conversations', authenticate, async (req, res) => {
  try {
    // TODO: 实现更详细的对话统计
    sendSuccessResponse(res, 200, {
      message: 'Conversation statistics',
    });
  } catch (error) {
    sendErrorResponse(res, 500, 'SYSTEM_ERROR', error.message);
  }
});

// 路由加载确认
console.log('✅ Admin routes loaded:');
console.log('   POST /api/admin/auth/login');
console.log('   GET  /api/admin/auth/me');
console.log('   GET  /api/admin/users');
console.log('   GET  /api/admin/agents');
console.log('   GET  /api/admin/statistics/dashboard');

module.exports = router;

