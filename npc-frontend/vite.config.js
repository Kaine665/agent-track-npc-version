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
    // SPA 路由支持：确保刷新页面时不会 404
    // Vite 默认支持，但显式配置更安全
    // 所有未匹配的路由都会返回 index.html，由 React Router 处理
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
    sourcemap: false, // 生产环境关闭 source map，加快构建速度
    minify: 'esbuild', // 使用 esbuild 压缩，比 terser 快很多
    target: 'es2015', // 目标浏览器版本
    cssCodeSplit: true, // CSS 代码分割
    rollupOptions: {
      output: {
        // 手动分包，减少重复打包
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd'],
          'markdown-vendor': ['react-markdown', 'react-syntax-highlighter', 'remark-gfm', 'rehype-raw'],
        },
      },
    },
  },
});

