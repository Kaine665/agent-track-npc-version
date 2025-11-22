/**
 * ============================================
 * HTTP API 适配器 (httpAdapter.js)
 * ============================================
 *
 * 【文件职责】
 * 实现 HTTP API 适配器，调用真实后端 API
 *
 * 【主要功能】
 * 1. 实现统一的 API 接口（继承 ApiAdapter）
 * 2. 调用真实后端 HTTP API
 * 3. 处理错误和响应格式化
 * 4. 适配后端数据格式到前端 API 格式
 *
 * 【工作流程】
 * 业务代码调用 → HTTP适配器 → 后端API → 适配数据格式 → 返回统一格式
 *
 * 【依赖】
 * - adapter.js: 适配器接口定义
 * - 后端 API 服务（http://localhost:8000）
 *
 * 【被谁使用】
 * - index.js: 创建 HTTP 适配器实例
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import ApiAdapter from "./adapter.js";

/**
 * HTTP API 适配器
 *
 * 【功能说明】
 * 实现 HTTP API 适配器，调用真实后端 API，并将后端数据格式适配为前端 API 格式
 *
 * 【核心职责】
 * 1. 调用后端 HTTP API
 * 2. 适配后端数据格式到前端 API 格式（统一接口规范）
 * 3. 处理错误和响应格式化
 *
 * 【适配说明】
 * - 后端 API 返回格式可能与前端 API 格式不同
 * - HTTP 适配器负责数据格式转换，确保返回前端 API 统一格式
 * - 业务代码无需关心后端 API 的具体格式
 *
 * 【API 基础路径】
 * 从环境变量 VITE_API_BASE_URL 获取，默认 http://localhost:8000
 *
 * 【使用方式】
 * const adapter = new HttpAdapter();
 * const result = await adapter.agents.getList('user_123');
 */
class HttpAdapter extends ApiAdapter {
  /**
   * API 基础路径
   *
   * 【功能说明】
   * 从环境变量获取 API 基础路径，默认使用本地开发服务器
   */
  // API 基础路径
  // 如果 VITE_API_BASE_URL 为空字符串，使用相对路径（通过 Nginx 代理）
  // 否则使用指定的 URL
  baseURL = import.meta.env.VITE_API_BASE_URL === "" 
    ? "" 
    : (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000");

  /**
   * 发送 HTTP 请求
   *
   * 【功能说明】
   * 统一的 HTTP 请求方法，处理请求和响应
   *
   * 【工作流程】
   * 1. 构建请求 URL
   * 2. 发送 HTTP 请求到后端 API
   * 3. 处理响应（成功/错误）
   * 4. 返回统一格式数据
   *
   * @param {string} method - HTTP 方法（GET, POST, PUT, DELETE）
   * @param {string} path - API 路径（如 /api/v1/agents）
   * @param {object} [params] - 查询参数（GET 请求）
   * @param {object} [data] - 请求体数据（POST/PUT 请求）
   * @returns {Promise<object>} 前端 API 统一格式的响应数据
   */
  async request(method, path, params = null, data = null) {
    try {
      // 构建 URL
      let url = `${this.baseURL}${path}`;

      // 添加查询参数
      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }

      // 调试日志：记录请求 URL
      console.log(`[DEBUG] HTTP Request: ${method} ${url}`);

      // 构建请求选项
      const options = {
        method: method.toUpperCase(),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      // 添加请求体
      if (data && (method === "POST" || method === "PUT")) {
        options.body = JSON.stringify(data);
      }

      // 发送请求
      const response = await fetch(url, options);

      // 获取响应文本（Response 只能读取一次）
      const responseText = await response.text();

      // 解析响应 JSON
      let responseData;
      try {
        // 检查响应内容类型
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // 如果不是 JSON 响应，返回错误
          return {
            success: false,
            error: {
              code: "INVALID_RESPONSE",
              message: `服务器返回了非 JSON 格式的响应: ${responseText.substring(
                0,
                100
              )}`,
            },
            timestamp: Date.now(),
          };
        }

        // 解析 JSON
        responseData = responseText ? JSON.parse(responseText) : {};

        // 调试日志：记录解析后的响应数据
        console.log(`[DEBUG] HTTP Response parsed:`, {
          url,
          status: response.status,
          ok: response.ok,
          responseData,
        });
      } catch (parseError) {
        // JSON 解析失败
        console.error(
          `[DEBUG] JSON parse error:`,
          parseError,
          `Response text:`,
          responseText
        );
        return {
          success: false,
          error: {
            code: "PARSE_ERROR",
            message: `响应解析失败: ${parseError.message}`,
            details: responseText.substring(0, 200), // 包含部分响应内容用于调试
          },
          timestamp: Date.now(),
        };
      }

      // 检查 HTTP 状态码
      if (!response.ok) {
        // HTTP 错误（4xx, 5xx）
        return {
          success: false,
          error: {
            code: responseData.error?.code || "HTTP_ERROR",
            message:
              responseData.error?.message ||
              `HTTP ${response.status}: ${response.statusText}`,
            details: responseData.error?.details,
          },
          timestamp: responseData.timestamp || Date.now(),
        };
      }

      // 检查业务逻辑错误（后端返回 success: false）
      if (!responseData.success) {
        return {
          success: false,
          error: {
            code: responseData.error?.code || "API_ERROR",
            message: responseData.error?.message || "请求失败",
            details: responseData.error?.details,
          },
          timestamp: responseData.timestamp || Date.now(),
        };
      }

      // 成功响应
      return {
        success: true,
        data: responseData.data,
        timestamp: responseData.timestamp || Date.now(),
      };
    } catch (error) {
      // 网络错误或其他异常
      console.error("HTTP request error:", error);
      return {
        success: false,
        error: {
          code: "NETWORK_ERROR",
          message: error.message || "网络请求失败，请检查网络连接",
        },
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Agents API - HTTP 实现
   */
  agents = {
    /**
     * 创建 NPC（HTTP）
     *
     * @param {object} data - 创建数据
     * @returns {Promise<object>} 创建的 NPC 数据
     */
    create: async (data) => {
      const response = await this.request("POST", "/api/v1/agents", null, data);

      if (!response.success) {
        return response;
      }

      // 后端返回的数据格式已经符合前端 API 格式，直接返回
      return {
        success: true,
        data: response.data,
        timestamp: response.timestamp,
      };
    },

    /**
     * 获取 NPC 列表（HTTP）
     *
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} NPC 列表数据
     */
    getList: async (userId) => {
      const response = await this.request("GET", "/api/v1/agents", { userId });

      if (!response.success) {
        return response;
      }

      // 适配数据格式：后端返回的 agents 可能不包含 lastMessagePreview
      // 前端需要这个字段，如果没有则设为 null
      const agents = (response.data.agents || []).map((agent) => ({
        ...agent,
        lastMessagePreview: agent.lastMessagePreview || null,
      }));

      return {
        success: true,
        data: {
          agents: agents,
          total: response.data.total || agents.length,
        },
        timestamp: response.timestamp,
      };
    },

    /**
     * 获取 NPC 详情（HTTP）
     *
     * @param {string} agentId - NPC ID
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} NPC 详情数据
     */
    getById: async (agentId, userId) => {
      // 调试日志
      console.log(
        `[DEBUG] Frontend: Calling agents.getById with agentId=${agentId}, userId=${userId}`
      );

      const response = await this.request("GET", `/api/v1/agents/${agentId}`, {
        userId,
      });

      // 调试日志
      console.log(`[DEBUG] Frontend: agents.getById response:`, response);

      if (!response.success) {
        return response;
      }

      // 后端返回的数据格式已经符合前端 API 格式，直接返回
      return {
        success: true,
        data: response.data,
        timestamp: response.timestamp,
      };
    },
  };

  /**
   * Messages API - HTTP 实现
   */
  messages = {
    /**
     * 发送消息（HTTP - 异步模式）
     *
     * @param {object} data - 消息数据
     * @param {string} data.userId - 用户 ID
     * @param {string} data.agentId - NPC ID
     * @param {string} data.message - 消息内容（前端使用 message，后端使用 text）
     * @returns {Promise<object>} 用户消息数据（包含 sessionId，用于轮询）
     */
    send: async (data) => {
      // 适配请求格式：前端使用 message，后端使用 text
      const requestData = {
        userId: data.userId,
        agentId: data.agentId,
        text: data.message || data.text, // 兼容两种字段名
      };

      const response = await this.request(
        "POST",
        "/api/v1/messages",
        null,
        requestData
      );

      if (!response.success) {
        return response;
      }

      // 后端现在返回：{ userEventId, sessionId, timestamp, status: "pending" }
      // 前端需要：{ id, sessionId, role: "user", content, createdAt, status }
      const userMessage = {
        id: response.data.userEventId || `msg_${Date.now()}`,
        sessionId: response.data.sessionId || null,
        role: "user",
        content: data.message || data.text,
        createdAt: response.data.timestamp || Date.now(),
        status: response.data.status || "pending", // pending 表示 Agent 回复正在处理
      };

      return {
        success: true,
        data: userMessage,
        timestamp: response.timestamp,
      };
    },

    /**
     * 检查新消息（用于轮询）
     *
     * @param {string} sessionId - 会话 ID
     * @param {string} [lastEventId] - 最后已知的事件 ID（可选）
     * @returns {Promise<object>} 新消息数据 { hasNew: boolean, messages: [] }
     */
    checkNew: async (sessionId, lastEventId = null) => {
      const params = { sessionId };
      if (lastEventId) {
        params.lastEventId = lastEventId;
      }

      const response = await this.request("GET", "/api/v1/messages/check", params);

      if (!response.success) {
        return response;
      }

      // 适配数据格式：后端返回 events 数组，前端需要 messages 数组
      const events = response.data.events || [];
      const messages = events.map((event) => ({
        id: event.id || `msg_${event.timestamp}`,
        sessionId: event.sessionId,
        role: event.fromType === "user" ? "user" : "assistant",
        content: event.content || "",
        createdAt: event.timestamp || Date.now(),
      }));

      return {
        success: true,
        data: {
          hasNew: response.data.hasNew || messages.length > 0,
          messages: messages,
        },
        timestamp: response.timestamp,
      };
    },
  };

  /**
   * History API - HTTP 实现
   */
  history = {
    /**
     * 获取对话历史（HTTP）
     *
     * @param {string} userId - 用户 ID
     * @param {string} agentId - NPC ID
     * @returns {Promise<object>} 对话历史数据
     */
    get: async (userId, agentId) => {
      const response = await this.request("GET", "/api/v1/history", {
        userId,
        agentId,
      });

      // 调试日志
      console.log(`[DEBUG] Frontend: history.get response:`, response);
      console.log(`[DEBUG] Frontend: response.data:`, response.data);

      if (!response.success) {
        return response;
      }

      // 适配数据格式：后端返回 events 数组，前端需要 messages 数组
      // 后端格式：{ fromType: 'user'|'agent', content, timestamp, ... }
      // 前端格式：{ role: 'user'|'assistant', content, createdAt, ... }
      const events = response.data.events || [];
      console.log(`[DEBUG] Frontend: events count:`, events.length);
      console.log(`[DEBUG] Frontend: events:`, events);
      
      const messages = events.map((event) => ({
        id: event.id || `msg_${event.timestamp}`,
        sessionId: event.sessionId,
        role: event.fromType === "user" ? "user" : "assistant",
        content: event.content || "",
        createdAt: event.timestamp || Date.now(),
      }));

      console.log(`[DEBUG] Frontend: converted messages count:`, messages.length);
      console.log(`[DEBUG] Frontend: converted messages:`, messages);

      return {
        success: true,
        data: {
          messages: messages,
          total: response.data.total || messages.length,
        },
        timestamp: response.timestamp,
      };
    },
  };

  /**
   * Sessions API - HTTP 实现
   */
  sessions = {
    /**
     * 获取会话列表（HTTP）
     *
     * @param {string} userId - 用户 ID
     * @returns {Promise<object>} 会话列表数据
     */
    getList: async (userId) => {
      const response = await this.request("GET", "/api/v1/sessions", {
        userId,
      });

      if (!response.success) {
        return response;
      }

      // 后端返回的数据格式已经符合前端 API 格式，直接返回
      return {
        success: true,
        data: {
          sessions: response.data.sessions || [],
        },
        timestamp: response.timestamp,
      };
    },
  };

  /**
   * Users API - HTTP 实现
   */
  users = {
    /**
     * 用户登录
     * @param {string} userId - 用户 ID
     * @param {string} [password] - 密码
     * @returns {Promise<object>} 用户信息
     */
    login: async (userId, password) => {
      const response = await this.request("POST", "/api/v1/users/login", null, {
        userId,
        password,
      });
      return response;
    },

    /**
     * 用户注册
     * @param {string} userId - 用户 ID
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<object>} 用户信息
     */
    register: async (userId, username, password) => {
      const response = await this.request(
        "POST",
        "/api/v1/users/register",
        null,
        { userId, username, password }
      );
      return response;
    },
  };
}

export default HttpAdapter;
