/**
 * ============================================
 * Vite 配置文件 (vite.config.js)
 * ============================================
 *
 * 【文件职责】
 * Vite 构建工具配置文件，定义项目构建和开发服务器设置
 *
 * 【主要功能】
 * 1. 配置 React 插件
 * 2. 配置开发服务器端口和代理
 * 3. 配置构建选项
 *
 * 【工作流程】
 * Vite 启动时读取此配置 → 应用插件和设置 → 启动开发服务器
 *
 * 【依赖】
 * - @vitejs/plugin-react: React 支持插件
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite 配置
 *
 * 【功能说明】
 * 配置 Vite 开发服务器和构建选项
 *
 * 【配置项说明】
 * - plugins: React 插件，支持 JSX 和 HMR
 * - server.port: 开发服务器端口（默认 3000）
 * - server.proxy: API 代理配置（可选，用于解决跨域问题）
 *
 * @returns {import('vite').UserConfig} Vite 配置对象
 */
export default defineConfig({
  // React 插件配置
  plugins: [react()],

  // 开发服务器配置
  server: {
    port: 3000,
    open: true, // 自动打开浏览器
    // 代理配置（如果需要）
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8000',
    //     changeOrigin: true,
    //   },
    // },
  },

  // 构建配置
  build: {
    outDir: 'dist',
    sourcemap: true, // 生成 source map
  },
});

