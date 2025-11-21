/**
 * ============================================
 * 历史接口测试脚本 (test-history.js)
 * ============================================
 *
 * 【文件职责】
 * 测试 GET /api/v1/history 接口的功能
 *
 * 【主要功能】
 * 1. 测试获取对话历史
 * 2. 测试 Session 不存在的情况
 * 3. 测试参数验证
 * 4. 显示测试结果
 *
 * 【使用方法】
 * 1. 确保后端服务已启动（npm run dev）
 * 2. 运行测试脚本：node test-history.js
 * 3. 按照提示输入 userId 和 agentId
 *
 * 【环境变量要求】
 * - API_BASE_URL: API 基础地址（默认 http://localhost:8000）
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

require("dotenv").config();
const readline = require("readline");

// API 配置
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";
const HISTORY_API_URL = `${API_BASE_URL}/api/v1/history`;
const SESSIONS_API_URL = `${API_BASE_URL}/api/v1/sessions`;

/**
 * 创建 readline 接口
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * 打印分隔线
 */
function printSeparator(char = "=", length = 60) {
  console.log(char.repeat(length));
}

/**
 * 打印标题
 */
function printTitle(title) {
  console.log();
  printSeparator();
  console.log(title);
  printSeparator();
  console.log();
}

/**
 * 获取用户的所有会话列表
 *
 * @param {string} userId - 用户 ID
 * @returns {Promise<Object>} API 响应数据
 */
async function getSessions(userId) {
  const url = `${SESSIONS_API_URL}?userId=${encodeURIComponent(userId)}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `API 错误 (${response.status}): ${data.error?.message || data.error?.code || "未知错误"}`
    );
  }

  return data;
}

/**
 * 获取对话历史
 *
 * @param {string} userId - 用户 ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object>} API 响应数据
 */
async function getHistory(userId, agentId) {
  const url = `${HISTORY_API_URL}?userId=${encodeURIComponent(userId)}&agentId=${encodeURIComponent(agentId)}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `API 错误 (${response.status}): ${data.error?.message || data.error?.code || "未知错误"}`
    );
  }

  return data;
}

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * 显示历史记录
 */
function displayHistory(history) {
  const { session, events } = history.data;

  console.log();
  printTitle("📋 对话历史");

  // 显示 Session 信息
  if (session) {
    console.log("✅ Session 信息：");
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   参与者:`);
    session.participants.forEach((p) => {
      console.log(`     - ${p.type}: ${p.id}`);
    });
    console.log(`   创建时间: ${formatTimestamp(session.createdAt)}`);
    console.log(`   最后活动: ${formatTimestamp(session.lastActiveAt)}`);
    console.log();
  } else {
    console.log("ℹ️  Session 不存在（用户和 Agent 从未对话过）");
    console.log();
  }

  // 显示事件列表
  if (events && events.length > 0) {
    console.log(`📝 事件列表（共 ${events.length} 条）:`);
    printSeparator("-", 60);
    events.forEach((event, index) => {
      const fromLabel = event.fromType === "user" ? "👤 用户" : "🤖 Agent";
      const toLabel = event.toType === "user" ? "用户" : "Agent";
      
      console.log();
      console.log(`[${index + 1}] ${fromLabel} → ${toLabel}`);
      console.log(`    时间: ${formatTimestamp(event.timestamp)}`);
      console.log(`    内容: ${event.content}`);
      console.log(`    Event ID: ${event.id}`);
    });
    printSeparator("-", 60);
  } else {
    console.log("📝 事件列表：空（暂无对话记录）");
  }
  console.log();
}

/**
 * 显示会话列表
 */
function displaySessions(sessionsData) {
  const { sessions } = sessionsData.data;

  console.log();
  printTitle("📋 用户会话列表");

  if (sessions && sessions.length > 0) {
    console.log(`✅ 找到 ${sessions.length} 个会话：`);
    console.log();
    sessions.forEach((session, index) => {
      console.log(`[${index + 1}] Session ID: ${session.sessionId}`);
      if (session.agent) {
        console.log(`    Agent: ${session.agent.name} (${session.agentId})`);
        console.log(`    类型: ${session.agent.type} | 模型: ${session.agent.model}`);
      } else {
        console.log(`    Agent: 未知 (${session.agentId || "无"}) - Agent 可能已被删除`);
      }
      console.log(`    创建时间: ${formatTimestamp(session.createdAt)}`);
      console.log(`    最后活动: ${formatTimestamp(session.lastActiveAt)}`);
      console.log();
    });
  } else {
    console.log("ℹ️  暂无会话（用户还没有和任何 Agent 对话过）");
    console.log();
  }
}

/**
 * 运行测试
 */
async function runTest() {
  console.log();
  printTitle("🚀 历史接口测试");

  // 检查 fetch 是否可用
  if (typeof fetch === "undefined") {
    console.error("❌ 错误：当前 Node.js 版本不支持 fetch");
    console.error("💡 提示：请升级到 Node.js 18 或更高版本");
    process.exit(1);
  }

  const rl = createReadlineInterface();

  try {
    // 输入 userId
    const userId = await new Promise((resolve) => {
      rl.question("请输入用户 ID (userId): ", resolve);
    });

    if (!userId.trim()) {
      console.log("❌ 用户 ID 不能为空");
      rl.close();
      process.exit(1);
    }

    // 先获取用户的会话列表
    console.log();
    console.log("📤 正在获取用户会话列表...");
    console.log();

    const sessionsStartTime = Date.now();
    const sessionsData = await getSessions(userId.trim());
    const sessionsEndTime = Date.now();

    // 显示会话列表
    displaySessions(sessionsData);

    // 显示统计信息
    console.log("📊 会话列表统计：");
    console.log(`   响应时间: ${sessionsEndTime - sessionsStartTime}ms`);
    console.log(`   会话数量: ${sessionsData.data.sessions?.length || 0}`);
    console.log();

    // 如果有会话，询问是否查看某个 Agent 的详细历史
    if (sessionsData.data.sessions && sessionsData.data.sessions.length > 0) {
      const agentId = await new Promise((resolve) => {
        rl.question("请输入要查看的 Agent ID (agentId，直接回车跳过): ", resolve);
      });

      if (agentId && agentId.trim()) {
        // 获取特定 Agent 的对话历史
        console.log();
        console.log("📤 正在获取对话历史...");
        console.log();

        const historyStartTime = Date.now();
        const history = await getHistory(userId.trim(), agentId.trim());
        const historyEndTime = Date.now();

        // 显示结果
        displayHistory(history);

        // 显示统计信息
        console.log("📊 对话历史统计：");
        console.log(`   响应时间: ${historyEndTime - historyStartTime}ms`);
        console.log(`   Session: ${history.data.session ? "存在" : "不存在"}`);
        console.log(`   事件数量: ${history.data.events?.length || 0}`);
        console.log();
      }
    }

    console.log("✅ 测试完成！");
    console.log();
  } catch (error) {
    console.log();
    console.error("❌ 测试失败！");
    console.error();
    console.error("错误信息:");
    console.error("-".repeat(50));
    console.error(error.message);
    console.error("-".repeat(50));
    console.error();

    // 提供故障排查建议
    if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
      console.error("💡 故障排查建议:");
      console.error("1. 确保后端服务已启动（npm run dev）");
      console.error(`2. 检查 API 地址是否正确: ${SESSIONS_API_URL}`);
      console.error("3. 检查端口是否被占用");
      console.error();
    }

    process.exit(1);
  } finally {
    rl.close();
  }
}

// 运行测试
runTest().catch((error) => {
  console.error("未捕获的错误:", error);
  process.exit(1);
});

