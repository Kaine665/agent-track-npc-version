/**
 * ============================================
 * API 入口文件 (index.js)
 * ============================================
 *
 * 【文件职责】
 * 管理后台 API 适配层的入口文件，负责创建适配器实例和模式切换
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import MockAdapter from './mockAdapter.js';
import HttpAdapter from './httpAdapter.js';

/**
 * 检测后端服务是否可用
 */
async function checkBackendAvailable(baseURL) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const healthURL = baseURL === '' || baseURL === '/api' ? '/api/v1/health' : `${baseURL}/api/v1/health`;

    const response = await fetch(healthURL, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.success === true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 创建 API 适配器实例
 */
async function createApi(mode = null) {
  const apiMode = mode || import.meta.env.VITE_API_MODE || 'auto';
  const baseURL =
    import.meta.env.VITE_API_BASE_URL === '' ? '' : import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  if (apiMode === 'mock') {
    console.log('🔵 Using Mock API Adapter (forced)');
    return new MockAdapter();
  }

  if (apiMode === 'http') {
    console.log('🟢 Using HTTP API Adapter (forced)');
    return new HttpAdapter();
  }

  // 自动检测模式
  console.log('🔍 Auto-detecting backend availability...');
  const isBackendAvailable = await checkBackendAvailable(baseURL);

  if (isBackendAvailable) {
    console.log('✅ Backend is available, using HTTP API Adapter');
    return new HttpAdapter();
  } else {
    console.log('⚠️ Backend is not available, using Mock API Adapter');
    return new MockAdapter();
  }
}

// 创建默认适配器实例
let apiInstance = new MockAdapter();
let isInitialized = false;
let isWaitingBackend = true;
let currentMode = 'mock';

// 异步初始化适配器
const envBaseURL = import.meta.env.VITE_API_BASE_URL;
const baseURL = envBaseURL === '/api' || envBaseURL === '' ? '' : envBaseURL || 'http://localhost:8000';

checkBackendAvailable(baseURL)
  .then((available) => {
    if (available) {
      isWaitingBackend = false;
      apiInstance = new HttpAdapter();
      currentMode = 'http';
      isInitialized = true;
      console.log('✅ API Adapter initialized: HTTP mode (immediate)');
      return;
    }

    setTimeout(() => {
      isWaitingBackend = false;
      checkBackendAvailable(baseURL)
        .then((availableAfterWait) => {
          if (availableAfterWait) {
            apiInstance = new HttpAdapter();
            currentMode = 'http';
          } else {
            apiInstance = new MockAdapter();
            currentMode = 'mock';
          }
          isInitialized = true;
          console.log(`✅ API Adapter initialized: ${currentMode.toUpperCase()} mode (after 10s wait)`);
        })
        .catch(() => {
          apiInstance = new MockAdapter();
          currentMode = 'mock';
          isWaitingBackend = false;
          isInitialized = true;
        });
    }, 10000);
  })
  .catch(() => {
    setTimeout(() => {
      isWaitingBackend = false;
      checkBackendAvailable(baseURL)
        .then((availableAfterWait) => {
          if (availableAfterWait) {
            apiInstance = new HttpAdapter();
            currentMode = 'http';
          } else {
            apiInstance = new MockAdapter();
            currentMode = 'mock';
          }
          isInitialized = true;
          console.log(`✅ API Adapter initialized: ${currentMode.toUpperCase()} mode (after 10s wait)`);
        })
        .catch(() => {
          apiInstance = new MockAdapter();
          currentMode = 'mock';
          isWaitingBackend = false;
          isInitialized = true;
        });
    }, 10000);
  });

/**
 * API 实例（代理对象）
 */
const api = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === 'mode') {
        return currentMode;
      }
      if (prop === 'baseURL') {
        return apiInstance.baseURL || 'http://localhost:8000';
      }
      if (prop === 'isInitialized') {
        return isInitialized;
      }
      if (prop === 'isWaitingBackend') {
        return isWaitingBackend;
      }
      if (prop === 'setToken') {
        return (token) => {
          if (apiInstance.setToken) {
            apiInstance.setToken(token);
          }
        };
      }
      if (prop === 'loadToken') {
        return () => {
          if (apiInstance.loadToken) {
            return apiInstance.loadToken();
          }
          return null;
        };
      }
      if (prop === 'admin') {
        return apiInstance.admin;
      }
      return apiInstance[prop];
    },
  }
);

export default api;
export { createApi, checkBackendAvailable };

