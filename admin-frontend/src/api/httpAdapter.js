/**
 * ============================================
 * HTTP API 适配器 (httpAdapter.js)
 * ============================================
 *
 * 【文件职责】
 * 实现管理后台 HTTP API 适配器，调用真实后端 API
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import AdminApiAdapter from './adapter.js';

/**
 * HTTP API 适配器
 */
class HttpAdapter extends AdminApiAdapter {
  baseURL = (() => {
    const envBaseURL = import.meta.env.VITE_API_BASE_URL;
    const baseURL = envBaseURL === '/api' || envBaseURL === ''
      ? ''
      : envBaseURL || 'http://localhost:8000';
    console.log('🔧 HttpAdapter baseURL:', baseURL);
    console.log('🔧 VITE_API_BASE_URL:', envBaseURL);
    return baseURL;
  })();

  token = null;

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('admin_access_token', token);
    } else {
      localStorage.removeItem('admin_access_token');
    }
  }

  loadToken() {
    // 先从 localStorage 读取
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      this.token = token;
      return token;
    }
    // 如果 localStorage 没有，返回内存中的 token
    return this.token || null;
  }

  /**
   * 发送 HTTP 请求
   */
  async request(method, path, params = null, data = null, skipAuth = false) {
    let url; // 在外部定义，确保 catch 块可以访问
    try {
      url = `${this.baseURL}${path}`;

      if (params) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // 确保 token 是最新的（从 localStorage 读取）
      // skipAuth 为 true 时跳过 token（用于登录等不需要认证的请求）
      if (!skipAuth) {
        const token = this.loadToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('🔑 Using token for request:', token.substring(0, 20) + '...');
        } else {
          console.warn('⚠️  No token available for request');
        }
      }

      const options = {
        method: method.toUpperCase(),
        headers,
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      console.log('🌐 Fetching URL:', url);
      console.log('🌐 Options:', { method: options.method, headers: options.headers });
      
      const response = await fetch(url, options);
      const responseText = await response.text();
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response text:', responseText.substring(0, 200));

      let responseData;
      try {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          return {
            success: false,
            error: {
              code: 'INVALID_RESPONSE',
              message: `服务器返回了非 JSON 格式的响应: ${responseText.substring(0, 100)}`,
            },
            timestamp: Date.now(),
          };
        }
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        return {
          success: false,
          error: {
            code: 'PARSE_ERROR',
            message: `响应解析失败: ${parseError.message}`,
          },
          timestamp: Date.now(),
        };
      }

      // Token 过期处理
      if (response.status === 401) {
        const errorCode = responseData.error?.code;
        if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID' || errorCode === 'UNAUTHORIZED') {
          this.setToken(null);
          localStorage.removeItem('admin_user');
          setTimeout(() => {
            if (window.location.pathname !== '/admin/login') {
              window.location.href = '/admin/login';
            }
          }, 100);
        }
      }

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: responseData.error?.code || 'HTTP_ERROR',
            message: responseData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          },
          timestamp: responseData.timestamp || Date.now(),
        };
      }

      if (!responseData.success) {
        return {
          success: false,
          error: {
            code: responseData.error?.code || 'API_ERROR',
            message: responseData.error?.message || '请求失败',
          },
          timestamp: responseData.timestamp || Date.now(),
        };
      }

      return {
        success: true,
        data: responseData.data,
        timestamp: responseData.timestamp || Date.now(),
      };
    } catch (error) {
      console.error('❌ Network error:', error);
      console.error('   URL:', url || 'unknown');
      console.error('   Error type:', error.name);
      console.error('   Error message:', error.message);
      
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || '网络请求失败，请检查网络连接',
          details: {
            url: url || 'unknown',
            errorType: error.name,
            errorMessage: error.message,
          },
        },
        timestamp: Date.now(),
      };
    }
  }

  admin = {
    auth: {
      login: async (userId, password) => {
        // 登录请求不需要 token，使用 skipAuth=true
        const response = await this.request('POST', '/api/admin/auth/login', null, {
          userId,
          password,
        }, true); // skipAuth = true
        if (response.success && response.data.accessToken) {
          this.setToken(response.data.accessToken);
        }
        return response;
      },

      getMe: async () => {
        return await this.request('GET', '/api/admin/auth/me');
      },
    },

    users: {
      getList: async (options = {}) => {
        return await this.request('GET', '/api/admin/users', options);
      },

      getById: async (userId) => {
        return await this.request('GET', `/api/admin/users/${userId}`);
      },

      updateStatus: async (userId, status) => {
        return await this.request('PUT', `/api/admin/users/${userId}/status`, null, { status });
      },

      resetPassword: async (userId, newPassword) => {
        return await this.request('POST', `/api/admin/users/${userId}/reset-password`, null, {
          newPassword,
        });
      },

      delete: async (userId) => {
        return await this.request('DELETE', `/api/admin/users/${userId}`);
      },
    },

    agents: {
      getList: async (options = {}) => {
        return await this.request('GET', '/api/admin/agents', options);
      },

      getById: async (agentId) => {
        return await this.request('GET', `/api/admin/agents/${agentId}`);
      },

      update: async (agentId, data) => {
        return await this.request('PUT', `/api/admin/agents/${agentId}`, null, data);
      },

      delete: async (agentId) => {
        return await this.request('DELETE', `/api/admin/agents/${agentId}`);
      },
    },

    statistics: {
      getDashboard: async () => {
        return await this.request('GET', '/api/admin/statistics/dashboard');
      },

      getUsers: async (options = {}) => {
        return await this.request('GET', '/api/admin/statistics/users', options);
      },

      getAgents: async () => {
        return await this.request('GET', '/api/admin/statistics/agents');
      },

      getConversations: async (options = {}) => {
        return await this.request('GET', '/api/admin/statistics/conversations', options);
      },
    },
  };
}

export default HttpAdapter;

