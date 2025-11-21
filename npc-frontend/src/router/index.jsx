/**
 * ============================================
 * 路由配置 (router/index.jsx)
 * ============================================
 *
 * 【文件职责】
 * 配置应用的路由系统，定义页面路由和导航
 *
 * 【主要功能】
 * 1. 定义所有页面路由
 * 2. 配置路由跳转
 * 3. 处理404页面
 *
 * 【工作流程】
 * 用户访问URL → 路由匹配 → 渲染对应页面组件
 *
 * 【依赖】
 * - react-router-dom: 路由库
 * - pages/: 页面组件
 *
 * 【被谁使用】
 * - main.jsx: 作为路由提供者包裹应用
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import AgentList from '../pages/AgentList/AgentList';
import CreateAgent from '../pages/CreateAgent/CreateAgent';
import Chat from '../pages/Chat/Chat';
import ApiTest from '../pages/ApiTest/ApiTest';
import Register from '../pages/Register/Register';

/**
 * 路由配置
 *
 * 【路由结构】
 * / - 首页（重定向到 /agents）
 * /agents - NPC 列表页
 * /agents/create - 创建 NPC 页
 * /chat/:agentId - 对话页
 * /test - API 测试页
 * /register - 注册页
 *
 * 【路由说明】
 * - 使用 createBrowserRouter 创建路由
 * - 支持嵌套路由和动态路由
 * - 404 页面处理
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/agents" replace />, // 首页重定向到 NPC 列表页
  },
  {
    path: '/test',
    element: <ApiTest />, // API 测试页
  },
  {
    path: '/register',
    element: <Register />, // 注册页
  },
  {
    path: '/agents',
    element: <AgentList />,
  },
  {
    path: '/agents/create',
    element: <CreateAgent />,
  },
  {
    path: '/chat/:agentId',
    element: <Chat />,
  },
  {
    path: '*',
    // 404 页面
    element: (
      <div>
        <h1>404</h1>
        <p>页面不存在</p>
      </div>
    ),
  },
]);

export default router;
