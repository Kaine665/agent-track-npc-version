/**
 * ============================================
 * 根组件 (App.jsx)
 * ============================================
 *
 * 【文件职责】
 * React 应用的根组件，定义应用的基础结构和布局
 *
 * 【主要功能】
 * 1. 定义应用的基础布局
 * 2. 显示欢迎信息（初始版本）
 * 3. 后续阶段将添加路由和页面组件
 *
 * 【工作流程】
 * 组件挂载 → 渲染基础布局 → 显示内容
 *
 * 【依赖】
 * - index.css: 全局样式
 *
 * 【被谁使用】
 * - main.jsx: 作为根组件被渲染
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

import { useState, useEffect } from 'react';
import './index.css';
import { AuthProvider } from './context/AuthContext';

/**
 * 根组件 App
 *
 * 【功能说明】
 * 应用的主组件，包含基础布局和欢迎信息
 *
 * 【工作流程】
 * 1. 组件挂载时检查后端 API 连接
 * 2. 显示欢迎信息和连接状态
 *
 * @returns {JSX.Element} App 组件
 */
function App() {
  const [apiStatus, setApiStatus] = useState('checking');

  /**
   * 检查后端 API 连接状态
   *
   * 【功能说明】
   * 在组件挂载时调用后端健康检查接口，验证 API 是否可用
   *
   * 【工作流程】
   * 1. 调用 /api/v1/health 接口
   * 2. 根据响应更新状态
   * 3. 错误时显示错误状态
   */
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/v1/health`);
        
        if (response.ok) {
          setApiStatus('connected');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        setApiStatus('error');
      }
    };

    checkApiStatus();
  }, []);

  return (
    <AuthProvider>
      <div className="app">
        <header className="app-header">
          <h1>AI NPC 单人世界</h1>
          <p className="subtitle">前端应用已启动</p>
        </header>
        
        <main className="app-main">
          <div className="status-card">
            <h2>系统状态</h2>
            <div className="status-info">
              <div className="status-item">
                <span className="status-label">前端服务：</span>
                <span className="status-value status-success">运行中</span>
              </div>
              <div className="status-item">
                <span className="status-label">后端 API：</span>
                <span className={`status-value ${
                  apiStatus === 'connected' ? 'status-success' :
                  apiStatus === 'checking' ? 'status-checking' :
                  'status-error'
                }`}>
                  {apiStatus === 'connected' ? '已连接' :
                   apiStatus === 'checking' ? '检查中...' :
                   '连接失败'}
                </span>
              </div>
            </div>
            
            {apiStatus === 'error' && (
              <div className="error-message">
                <p>⚠️ 无法连接到后端 API</p>
                <p className="error-hint">
                  请确保后端服务已启动（运行在 http://localhost:8000）
                </p>
              </div>
            )}
          </div>

          <div className="info-card">
            <h2>下一步</h2>
            <ul>
              <li>✅ 前端项目初始化完成</li>
              <li>✅ 基础组件和路由已就绪</li>
              <li>✅ NPC 列表和对话功能已实现</li>
              <li>✅ 用户登录/注册功能已集成</li>
            </ul>
          </div>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;

