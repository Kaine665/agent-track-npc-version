/**
 * ============================================
 * API 入口文件 (index.js)
 * ============================================
 *
 * 【文件职责】
 * API 适配层的入口文件，负责创建适配器实例和模式切换
 *
 * 【主要功能】
 * 1. 自动检测后端可用性
 * 2. 根据检测结果或环境变量选择适配器（Mock/HTTP）
 * 3. 创建适配器实例
 * 4. 导出统一的 API 接口
 *
 * 【工作流程】
 * 导入模块 → 检测后端可用性 → 选择适配器 → 创建实例 → 导出统一接口
 *
 * 【自动切换策略】
 * - 如果环境变量 VITE_API_MODE 明确指定，则使用指定模式
 * - 否则自动检测后端健康检查端点
 * - 如果后端可用（2秒内响应），使用 HTTP 适配器
 * - 如果后端不可用，自动回退到 Mock 适配器
 *
 * 【依赖】
 * - adapter.js: 适配器接口定义
 * - mockAdapter.js: Mock 适配器实现
 * - httpAdapter.js: HTTP 适配器实现
 *
 * 【被谁使用】
 * - 所有业务代码：通过 import api from '@/api' 使用
 *
 * 【环境变量】
 * - VITE_API_MODE: 'mock' | 'http' | 'auto'（默认 'auto'，自动检测）
 * - VITE_API_BASE_URL: API 基础路径（默认 'http://localhost:8000'）
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import MockAdapter from "./mockAdapter.js";
import HttpAdapter from "./httpAdapter.js";

/**
 * 检测后端服务是否可用
 *
 * 【功能说明】
 * 通过健康检查端点检测后端服务是否可用
 *
 * 【工作流程】
 * 1. 发送 GET 请求到 /api/v1/health
 * 2. 设置超时时间（2秒）
 * 3. 如果成功响应，返回 true
 * 4. 如果超时或失败，返回 false
 *
 * @param {string} baseURL - API 基础路径
 * @returns {Promise<boolean>} 后端是否可用
 */
async function checkBackendAvailable(baseURL) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2秒超时

    // 如果 baseURL 为空字符串，使用相对路径（通过 Nginx 代理）
    // 如果 baseURL 是 /api，也需要使用相对路径
    const healthURL = (baseURL === "" || baseURL === "/api")
      ? "/api/v1/health" 
      : `${baseURL}/api/v1/health`;

    const response = await fetch(healthURL, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    return false;
  } catch (error) {
    // 网络错误、超时等，返回 false
    return false;
  }
}

/**
 * 创建 API 适配器实例
 *
 * 【功能说明】
 * 根据环境变量或自动检测结果选择适配器类型（Mock 或 HTTP）
 *
 * 【模式切换策略】
 * 1. 如果 VITE_API_MODE 明确指定为 'mock' 或 'http'，使用指定模式
 * 2. 如果 VITE_API_MODE 为 'auto' 或未设置，自动检测后端可用性
 * 3. 后端可用 → 使用 HTTP 适配器
 * 4. 后端不可用 → 使用 Mock 适配器
 *
 * 【使用方式】
 * const api = await createApi('mock');  // 强制使用 Mock 适配器
 * const api = await createApi('http');   // 强制使用 HTTP 适配器
 * const api = await createApi('auto');   // 自动检测（默认）
 * const api = await createApi();         // 使用环境变量配置或自动检测
 *
 * @param {string} [mode] - 适配器模式（'mock' | 'http' | 'auto'），不传则使用环境变量
 * @returns {Promise<ApiAdapter>} 适配器实例
 */
async function createApi(mode = null) {
  // 确定使用的模式
  const apiMode = mode || import.meta.env.VITE_API_MODE || "auto";
  // 如果 VITE_API_BASE_URL 为空字符串，使用相对路径（通过 Nginx 代理）
  const baseURL = import.meta.env.VITE_API_BASE_URL === "" 
    ? "" 
    : (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000");

  // 如果明确指定模式，直接使用
  if (apiMode === "mock") {
    console.log("🔵 Using Mock API Adapter (forced)");
    return new MockAdapter();
  }

  if (apiMode === "http") {
    console.log("🟢 Using HTTP API Adapter (forced)");
    return new HttpAdapter();
  }

  // 自动检测模式：检测后端是否可用
  console.log("🔍 Auto-detecting backend availability...");
  const isBackendAvailable = await checkBackendAvailable(baseURL);

  if (isBackendAvailable) {
    console.log("✅ Backend is available, using HTTP API Adapter");
    return new HttpAdapter();
  } else {
    console.log("⚠️ Backend is not available, using Mock API Adapter");
    return new MockAdapter();
  }
}

// 创建默认适配器实例（同步创建 Mock 作为初始值，异步检测后替换）
let apiInstance = new MockAdapter();
let isInitialized = false;
let isWaitingBackend = true; // 是否正在等待后端连接（10秒内）
let currentMode = "mock"; // 当前模式：'mock' | 'http'
let initializationListeners = []; // 初始化完成监听器列表

/**
 * 添加初始化完成监听器
 * @param {Function} listener - 监听器函数
 */
function addInitializationListener(listener) {
  if (isInitialized) {
    // 如果已经初始化完成，立即调用监听器
    listener();
  } else {
    // 否则添加到监听器列表
    initializationListeners.push(listener);
  }
}

/**
 * 通知所有监听器初始化完成
 */
function notifyInitializationListeners() {
  initializationListeners.forEach((listener) => listener());
  initializationListeners = [];
}

// 异步初始化适配器（不阻塞应用启动）
// 策略：先立即检测一次，如果失败则等待 10 秒后再检测
// 如果 VITE_API_BASE_URL 为 /api 或空字符串，使用相对路径（通过 Nginx 代理）
const envBaseURL = import.meta.env.VITE_API_BASE_URL;
const baseURL = (envBaseURL === "/api" || envBaseURL === "") 
  ? "" 
  : (envBaseURL || "http://localhost:8000");

// 立即检测后端（快速路径）
checkBackendAvailable(baseURL)
  .then((available) => {
    if (available) {
      // 后端可用，立即使用 HTTP 适配器
      isWaitingBackend = false;
      apiInstance = new HttpAdapter();
      currentMode = "http";
      isInitialized = true;
      console.log("✅ API Adapter initialized: HTTP mode (immediate)");
      notifyInitializationListeners();
      return;
    }

    // 后端不可用，等待 10 秒后再检测
    setTimeout(() => {
      isWaitingBackend = false;
      checkBackendAvailable(baseURL)
        .then((availableAfterWait) => {
          if (availableAfterWait) {
            apiInstance = new HttpAdapter();
            currentMode = "http";
          } else {
            apiInstance = new MockAdapter();
            currentMode = "mock";
          }
          isInitialized = true;
          console.log(
            `✅ API Adapter initialized: ${currentMode.toUpperCase()} mode (after 10s wait)`
          );
          notifyInitializationListeners();
        })
        .catch((error) => {
          console.error("Failed to check backend after wait:", error);
          apiInstance = new MockAdapter();
          currentMode = "mock";
          isWaitingBackend = false;
          isInitialized = true;
          notifyInitializationListeners();
        });
    }, 10000); // 10 秒
  })
  .catch((error) => {
    // 立即检测失败，等待 10 秒后再检测
    console.warn("Initial backend check failed, waiting 10s:", error);
    setTimeout(() => {
      isWaitingBackend = false;
      checkBackendAvailable(baseURL)
        .then((availableAfterWait) => {
          if (availableAfterWait) {
            apiInstance = new HttpAdapter();
            currentMode = "http";
          } else {
            apiInstance = new MockAdapter();
            currentMode = "mock";
          }
          isInitialized = true;
          console.log(
            `✅ API Adapter initialized: ${currentMode.toUpperCase()} mode (after 10s wait)`
          );
          notifyInitializationListeners();
        })
        .catch((error) => {
          console.error("Failed to initialize API adapter:", error);
          apiInstance = new MockAdapter();
          currentMode = "mock";
          isWaitingBackend = false;
          isInitialized = true;
          notifyInitializationListeners();
        });
    }, 10000); // 10 秒
  });

/**
 * API 实例（代理对象）
 *
 * 【功能说明】
 * 导出的统一 API 接口，业务代码直接使用
 * 使用 Proxy 代理，确保返回最新的适配器实例
 *
 * 【使用示例】
 * import api from '@/api';
 *
 * // 获取 NPC 列表
 * const result = await api.agents.getList('user_123');
 *
 * // 创建 NPC
 * const newAgent = await api.agents.create({
 *   userId: 'user_123',
 *   name: '学习教练',
 *   type: 'special',
 *   systemPrompt: '你是一位专业的学习教练...',
 *   model: 'gpt-4.1'
 * });
 *
 * // 发送消息
 * const reply = await api.messages.send({
 *   userId: 'user_123',
 *   agentId: 'agent_456',
 *   message: '你好'
 * });
 *
 * // 查看当前模式
 * console.log(api.mode); // 'mock' 或 'http'
 */
const api = new Proxy(
  {},
  {
    get(target, prop) {
      // 返回模式信息
      if (prop === "mode") {
        return currentMode;
      }
      if (prop === "baseURL") {
        return apiInstance.baseURL || "http://localhost:8000";
      }
      if (prop === "isInitialized") {
        return isInitialized;
      }
      if (prop === "isWaitingBackend") {
        return isWaitingBackend;
      }
      if (prop === "onInitialized") {
        // 返回一个函数，用于添加初始化完成监听器
        return addInitializationListener;
      }
      // Token 管理方法
      if (prop === "setToken") {
        return (token) => {
          if (apiInstance.setToken) {
            apiInstance.setToken(token);
          }
        };
      }
      if (prop === "loadToken") {
        return () => {
          if (apiInstance.loadToken) {
            return apiInstance.loadToken();
          }
          return null;
        };
      }
      // 如果访问的是适配器的方法（agents, messages, history, sessions, users, import, feedbacks）
      if (
        prop === "agents" ||
        prop === "messages" ||
        prop === "history" ||
        prop === "sessions" ||
        prop === "users" ||
        prop === "import" ||
        prop === "feedbacks"
      ) {
        return apiInstance[prop];
      }
      // 其他属性直接返回
      return apiInstance[prop];
    },
  }
);

export default api;

// 同时导出 createApi 函数和 checkBackendAvailable，方便测试和特殊场景使用
export { createApi, checkBackendAvailable };
