/**
 * ============================================
 * Agent API 路由 (agents.js)
 * ============================================
 *
 * 【文件职责】
 * 处理 Agent 相关的 HTTP 请求，调用服务层处理业务逻辑
 *
 * 【主要功能】
 * 1. POST /api/v1/agents - 创建 NPC
 * 2. GET /api/v1/agents - 获取 NPC 列表
 * 3. GET /api/v1/agents/:id - 获取 NPC 详情
 * 4. 统一响应格式处理
 * 5. 错误处理和状态码设置
 *
 * 【工作流程】
 * 接收请求 → 参数解析 → 调用服务层 → 格式化响应 → 返回结果
 *
 * 【依赖】
 * - express: Web 框架
 * - services/AgentService.js: 业务逻辑层
 *
 * 【被谁使用】
 * - server.js: 注册路由
 *
 * 【响应格式】
 * 成功：{ success: true, data: {...}, timestamp: ... }
 * 错误：{ success: false, error: { code, message }, timestamp: ... }
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const express = require("express");
const router = express.Router();
const agentService = require("../services/AgentService");
const { authenticate } = require("../middleware/auth");

/**
 * 统一响应格式
 *
 * 【功能说明】
 * 格式化成功响应，符合 API 设计规范
 *
 * @param {Object} res - Express 响应对象
 * @param {number} statusCode - HTTP 状态码
 * @param {Object} data - 响应数据
 */
function sendSuccessResponse(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data: data,
    timestamp: Date.now(),
  });
}

/**
 * 统一错误响应格式
 *
 * 【功能说明】
 * 格式化错误响应，符合 API 设计规范
 *
 * @param {Object} res - Express 响应对象
 * @param {number} statusCode - HTTP 状态码
 * @param {string} code - 错误码
 * @param {string} message - 错误消息
 */
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
 * 创建 NPC
 *
 * 【路由】
 * POST /api/v1/agents
 *
 * 【功能说明】
 * 创建新的 AI NPC
 *
 * 【请求体】
 * {
 *   "userId": "user_123",
 *   "name": "学习教练",
 *   "type": "special",
 *   "systemPrompt": "你是一位专业的学习教练...",
 *   "model": "gpt-4.1",
 *   "avatarUrl": "https://..." // 可选
 * }
 *
 * 【工作流程】
 * 1. 接收请求体
 * 2. 调用服务层创建 Agent
 * 3. 返回成功响应（HTTP 201）
 * 4. 捕获错误并返回错误响应
 *
 * 【错误处理】
 * - VALIDATION_ERROR → 400
 * - DUPLICATE_NAME → 409
 * - INVALID_MODEL → 400
 * - SYSTEM_ERROR → 500
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const agentData = req.body;
    
    // 从认证中间件获取 userId（优先），如果没有则从请求体获取（兼容旧代码）
    agentData.userId = req.user?.userId || agentData.userId || agentData.createdBy;

    // 调用服务层创建 Agent
    const agent = await agentService.createAgent(agentData);

    // 返回成功响应
    sendSuccessResponse(res, 201, agent);
  } catch (error) {
    // 错误处理
    const errorCode = error.code || "SYSTEM_ERROR";
    const errorMessage = error.message || "创建失败，请稍后重试";

    // 根据错误码设置 HTTP 状态码
    let statusCode = 500;
    if (errorCode === "VALIDATION_ERROR" || errorCode === "INVALID_MODEL") {
      statusCode = 400;
    } else if (errorCode === "DUPLICATE_NAME") {
      statusCode = 409;
    }

    sendErrorResponse(res, statusCode, errorCode, errorMessage);
  }
});

/**
 * 获取 NPC 列表
 *
 * 【路由】
 * GET /api/v1/agents?userId=xxx
 *
 * 【功能说明】
 * 获取指定用户创建的所有 NPC 列表，按创建时间倒序排列
 *
 * 【查询参数】
 * - userId: 用户 ID（必填）
 *
 * 【工作流程】
 * 1. 获取查询参数 userId
 * 2. 调用服务层查询用户的所有 Agent
 * 3. 返回列表
 *
 * 【响应格式】
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "agent_123",
 *       "createdBy": "user_1",
 *       "name": "学习教练",
 *       ...
 *     },
 *     ...
 *   ],
 *   "timestamp": 1703001234567
 * }
 */
router.get("/", authenticate, async (req, res) => {
  try {
    // 从认证中间件获取 userId（优先），如果没有则从查询参数获取（兼容旧代码）
    const userId = req.user?.userId || req.query.userId;

    // 验证 userId 参数
    if (!userId) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "userId 参数不能为空"
      );
    }

    // 调用服务层获取列表
    const agents = await agentService.getAgentList(userId);

    // 返回成功响应（符合 API 设计文档格式）
    sendSuccessResponse(res, 200, {
      agents: agents,
      total: agents.length,
    });
  } catch (error) {
    // 错误处理
    sendErrorResponse(
      res,
      500,
      "SYSTEM_ERROR",
      error.message || "获取列表失败，请稍后重试"
    );
  }
});

/**
 * 获取 NPC 详情
 *
 * 【路由】
 * GET /api/v1/agents/:id?userId=xxx
 *
 * 【功能说明】
 * 获取指定 NPC 的详细信息
 *
 * 【路径参数】
 * - id: NPC ID（必填）
 *
 * 【查询参数】
 * - userId: 用户 ID（必填，用于权限验证）
 *
 * 【工作流程】
 * 1. 获取路径参数 id 和查询参数 userId
 * 2. 调用服务层查询 Agent
 * 3. 验证 Agent 是否属于该用户
 * 4. 返回 Agent 详情
 *
 * 【错误处理】
 * - VALIDATION_ERROR → 400（参数缺失）
 * - NOT_FOUND → 404（Agent 不存在或不属于该用户）
 * - SYSTEM_ERROR → 500
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const agentId = req.params.id;
    // 从认证中间件获取 userId（优先），如果没有则从查询参数获取（兼容旧代码）
    const userId = req.user?.userId || req.query.userId;

    // 调试日志：记录请求参数
    console.log(`[DEBUG] GET /api/v1/agents/:id - agentId: ${agentId}, userId: ${userId}`);

    // 验证参数
    if (!agentId) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "Agent ID 不能为空"
      );
    }

    if (!userId) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "userId 参数不能为空"
      );
    }

    // 调用服务层获取 Agent
    const agent = await agentService.getAgentById(agentId);

    // 调试日志：记录 Agent 查询结果
    console.log(`[DEBUG] Agent found: ${agent ? 'yes' : 'no'}, agentId: ${agentId}`);
    if (agent) {
      console.log(`[DEBUG] Agent createdBy: ${agent.createdBy}, requested userId: ${userId}`);
    }

    // 检查 Agent 是否存在
    if (!agent) {
      console.log(`[DEBUG] Agent not found: ${agentId}`);
      return sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "NPC 不存在"
      );
    }

    // 验证 Agent 是否属于该用户
    // 注意：Agent 对象使用 createdBy 字段存储用户 ID
    if (agent.createdBy !== userId) {
      console.log(`[DEBUG] Permission denied: agent.createdBy (${agent.createdBy}) !== userId (${userId})`);
      return sendErrorResponse(
        res,
        404,
        "NOT_FOUND",
        "NPC 不存在"
      );
    }

    // 返回成功响应
    console.log(`[DEBUG] Returning agent: ${agentId}`);
    console.log(`[DEBUG] Agent data:`, JSON.stringify(agent, null, 2));
    const responseData = {
      success: true,
      data: agent,
      timestamp: Date.now(),
    };
    console.log(`[DEBUG] Response data:`, JSON.stringify(responseData, null, 2));
    sendSuccessResponse(res, 200, agent);
  } catch (error) {
    // 错误处理
    sendErrorResponse(
      res,
      500,
      "SYSTEM_ERROR",
      error.message || "获取 NPC 详情失败，请稍后重试"
    );
  }
});

/**
 * 更新 NPC
 *
 * 【路由】
 * PUT /api/v1/agents/:id?userId=xxx
 *
 * 【功能说明】
 * 更新指定 NPC 的信息
 *
 * 【路径参数】
 * - id: NPC ID（必填）
 *
 * 【查询参数】
 * - userId: 用户 ID（必填，用于权限验证）
 *
 * 【请求体】
 * {
 *   "name": "新的名称",
 *   "systemPrompt": "新的人设描述",
 *   "model": "gpt-4",
 *   ...
 * }
 *
 * 【工作流程】
 * 1. 获取路径参数 id 和查询参数 userId
 * 2. 获取请求体中的更新数据
 * 3. 调用服务层更新 Agent
 * 4. 返回更新后的 Agent
 *
 * 【错误处理】
 * - VALIDATION_ERROR → 400（参数缺失或验证失败）
 * - AGENT_NOT_FOUND → 404（Agent 不存在）
 * - PERMISSION_DENIED → 403（无权修改此 Agent）
 * - DUPLICATE_NAME → 409（名称已存在）
 * - INVALID_MODEL → 400（不支持的模型）
 * - SYSTEM_ERROR → 500
 */
router.put("/:id", authenticate, async (req, res) => {
  try {
    const agentId = req.params.id;
    // 从认证中间件获取 userId（优先），如果没有则从查询参数获取（兼容旧代码）
    const userId = req.user?.userId || req.query.userId;
    const updateData = req.body;

    // 验证参数
    if (!agentId) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "NPC ID 不能为空"
      );
    }

    if (!userId) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "userId 参数不能为空"
      );
    }

    // 调用服务层更新 Agent
    const updatedAgent = await agentService.updateAgent(agentId, userId, updateData);

    // 返回成功响应
    sendSuccessResponse(res, 200, updatedAgent);
  } catch (error) {
    // 错误处理
    const code = error.code || "SYSTEM_ERROR";
    const status =
      code === "AGENT_NOT_FOUND"
        ? 404
        : code === "PERMISSION_DENIED"
        ? 403
        : code === "VALIDATION_ERROR" || code === "INVALID_MODEL"
        ? 400
        : code === "DUPLICATE_NAME"
        ? 409
        : 500;
    sendErrorResponse(res, status, code, error.message || "更新失败，请稍后重试");
  }
});

/**
 * 删除 NPC
 *
 * 【路由】
 * DELETE /api/v1/agents/:id?userId=xxx&hardDelete=false
 *
 * 【功能说明】
 * 删除指定 NPC，支持软删除和硬删除
 *
 * 【路径参数】
 * - id: NPC ID（必填）
 *
 * 【查询参数】
 * - userId: 用户 ID（必填，用于权限验证）
 * - hardDelete: 是否硬删除（可选，默认 false，软删除）
 *
 * 【工作流程】
 * 1. 获取路径参数 id 和查询参数 userId、hardDelete
 * 2. 调用服务层删除 Agent
 * 3. 返回删除结果
 *
 * 【错误处理】
 * - VALIDATION_ERROR → 400（参数缺失）
 * - AGENT_NOT_FOUND → 404（Agent 不存在）
 * - PERMISSION_DENIED → 403（无权删除此 Agent）
 * - SYSTEM_ERROR → 500
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const agentId = req.params.id;
    // 从认证中间件获取 userId（优先），如果没有则从查询参数获取（兼容旧代码）
    const userId = req.user?.userId || req.query.userId;
    const hardDelete = req.query.hardDelete === "true"; // 字符串转布尔值

    // 验证参数
    if (!agentId) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "NPC ID 不能为空"
      );
    }

    if (!userId) {
      return sendErrorResponse(
        res,
        400,
        "VALIDATION_ERROR",
        "userId 参数不能为空"
      );
    }

    // 调用服务层删除 Agent
    const result = await agentService.deleteAgent(agentId, userId, {
      hardDelete: hardDelete,
    });

    // 返回成功响应
    sendSuccessResponse(res, 200, result);
  } catch (error) {
    // 错误处理
    const code = error.code || "SYSTEM_ERROR";
    const status =
      code === "AGENT_NOT_FOUND"
        ? 404
        : code === "PERMISSION_DENIED"
        ? 403
        : 500;
    sendErrorResponse(res, status, code, error.message || "删除失败，请稍后重试");
  }
});

module.exports = router;
