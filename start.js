/**
 * ============================================
 * 一键启动脚本 (start.js)
 * ============================================
 *
 * 【文件职责】
 * 同时启动前端和后端开发服务器
 *
 * 【主要功能】
 * 1. 检查前端和后端目录是否存在
 * 2. 同时启动前端和后端服务
 * 3. 统一管理进程输出和错误处理
 *
 * 【工作流程】
 * 检查环境 → 启动后端服务 → 启动前端服务 → 监听进程退出
 *
 * 【依赖】
 * - child_process: Node.js 内置模块，用于启动子进程
 * - path: Node.js 内置模块，用于路径处理
 *
 * 【使用方式】
 * node start.js
 * 或
 * npm run dev
 *
 * @author AI Assistant
 * @created 2025-11-20
 * @lastModified 2025-11-20
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * 检查目录是否存在
 *
 * 【功能说明】
 * 检查指定目录是否存在
 *
 * @param {string} dirPath - 目录路径
 * @returns {boolean} 目录是否存在
 */
function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * 启动服务
 *
 * 【功能说明】
 * 在指定目录中启动 npm 命令
 *
 * 【工作流程】
 * 1. 切换到指定目录
 * 2. 执行 npm 命令
 * 3. 处理输出和错误
 *
 * @param {string} dirPath - 项目目录路径
 * @param {string} command - npm 命令（如 'dev'）
 * @param {string} name - 服务名称（用于日志标识）
 * @returns {ChildProcess} 子进程对象
 */
function startService(dirPath, command, name) {
  const fullPath = path.resolve(__dirname, dirPath);

  if (!directoryExists(fullPath)) {
    console.error(`❌ 错误：目录不存在 ${fullPath}`);
    process.exit(1);
  }

  console.log(`🚀 启动 ${name} 服务...`);
  console.log(`📁 目录：${fullPath}`);
  console.log(`📝 命令：npm run ${command}\n`);

  // 根据操作系统选择命令
  const isWindows = process.platform === "win32";
  const npmCommand = isWindows ? "npm.cmd" : "npm";

  const child = spawn(npmCommand, ["run", command], {
    cwd: fullPath,
    stdio: "inherit",
    shell: true,
  });

  // 监听进程错误
  child.on("error", (error) => {
    console.error(`❌ ${name} 启动失败：`, error.message);
  });

  // 监听进程退出
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ ${name} 进程退出，代码：${code}`);
    }
  });

  return child;
}

/**
 * 主函数
 *
 * 【功能说明】
 * 启动前端和后端服务
 *
 * 【工作流程】
 * 1. 检查前端和后端目录
 * 2. 启动后端服务
 * 3. 启动前端服务
 * 4. 监听进程退出信号
 */
function main() {
  console.log("===========================================");
  console.log("  AI NPC 单人世界 - 一键启动");
  console.log("===========================================\n");

  // 检查目录
  const backendPath = path.resolve(__dirname, "npc-backend");
  const frontendPath = path.resolve(__dirname, "npc-frontend");

  if (!directoryExists(backendPath)) {
    console.error("❌ 错误：后端目录不存在");
    process.exit(1);
  }

  if (!directoryExists(frontendPath)) {
    console.error("❌ 错误：前端目录不存在");
    process.exit(1);
  }

  // 启动后端服务
  const backendProcess = startService("npc-backend", "dev", "后端");

  // 延迟启动前端服务（给后端一些启动时间）
  setTimeout(() => {
    startService("npc-frontend", "dev", "前端");
  }, 2000);

  // 监听退出信号
  const cleanup = () => {
    console.log("\n\n🛑 正在关闭服务...");
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

// 运行主函数
main();
