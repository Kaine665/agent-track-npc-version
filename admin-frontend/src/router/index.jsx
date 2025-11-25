/**
 * ============================================
 * 路由配置 (router/index.jsx)
 * ============================================
 *
 * 【文件职责】
 * 配置管理后台的路由系统
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import Dashboard from '../pages/Dashboard/Dashboard';
import UserList from '../pages/Users/UserList';
import AgentList from '../pages/Agents/AgentList';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: '/admin/login',
    element: <Login />,
  },
  {
    path: '/admin',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '/admin/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/admin/users',
    element: <UserList />,
  },
  {
    path: '/admin/agents',
    element: <AgentList />,
  },
  {
    path: '*',
    element: (
      <div>
        <h1>404</h1>
        <p>页面不存在</p>
      </div>
    ),
  },
]);

export default router;

