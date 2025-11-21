/**
 * ============================================
 * React 应用入口文件 (main.jsx)
 * ============================================
 *
 * 【文件职责】
 * React 应用的入口文件，负责渲染根组件到 DOM
 *
 * 【主要功能】
 * 1. 导入 React 和 ReactDOM
 * 2. 导入根组件 App
 * 3. 导入全局样式
 * 4. 将根组件渲染到 #root 元素
 *
 * 【工作流程】
 * 加载依赖 → 渲染根组件 → 挂载到 DOM
 *
 * 【依赖】
 * - react: React 库
 * - react-dom: React DOM 渲染库
 * - App.jsx: 根组件
 * - index.css: 全局样式
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import router from './router/index.jsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';

/**
 * 渲染 React 应用到 DOM
 *
 * 【功能说明】
 * 创建 React 根节点并渲染应用，使用路由提供者包裹
 *
 * 【工作流程】
 * 1. 获取 #root DOM 元素
 * 2. 创建 React 根节点
 * 3. 使用 AuthProvider 包裹应用以提供用户认证状态
 * 4. 使用 RouterProvider 渲染路由
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

