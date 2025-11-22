/**
 * 简单的 API 测试脚本
 * 不需要学习 API 测试工具，直接运行这个脚本就能测试所有接口
 * 
 * 注意：发送消息测试需要配置 OPENROUTER_API_KEY 环境变量
 */
// 加载配置（优先 YAML，回退到 .env）
const configLoader = require("../config/config-loader");
configLoader.init();
const http = require("http");

const BASE_URL = `http://localhost:${process.env.PORT || 8000}`;
const API_BASE = `${BASE_URL}/api/v1`;

// 测试结果
const results = {
  passed: [],
  failed: [],
};

// 辅助函数：发送 HTTP 请求
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    // 确保路径正确拼接
    const fullUrl = path.startsWith('/') ? `${API_BASE}${path}` : `${API_BASE}/${path}`;
    const url = new URL(fullUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + (url.search || ''),
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 测试函数
async function test(name, fn) {
  try {
    console.log(`\n🧪 测试: ${name}`);
    await fn();
    console.log(`   ✅ 通过`);
    results.passed.push(name);
  } catch (error) {
    console.log(`   ❌ 失败: ${error.message}`);
    results.failed.push({ name, error: error.message });
  }
}

// 主测试函数
async function runTests() {
  console.log("🚀 开始 API 测试...");
  console.log(`📍 测试地址: ${API_BASE}\n`);

  let testUserId = null;
  let testAgentId = null;
  let testSessionId = null;

  // 1. 测试用户注册
  await test("用户注册", async () => {
    const timestamp = Date.now();
    testUserId = `test_user_${timestamp}`;
    const response = await request("POST", "/users/register", {
      userId: testUserId,  // 注意：API 期望的是 userId，不是 id
      username: `testuser_${timestamp}`,
      password: "test123",
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`注册失败: ${JSON.stringify(response.data)}`);
    }
    console.log(`   📝 创建用户: ${testUserId}`);
  });

  // 2. 测试用户登录
  await test("用户登录", async () => {
    if (!testUserId) throw new Error("需要先创建用户");
    const response = await request("POST", "/users/login", {
      userId: testUserId,  // 注意：API 期望的是 userId，不是 username
      password: "test123",
    });
    if (response.status !== 200) {
      throw new Error(`登录失败: ${JSON.stringify(response.data)}`);
    }
    console.log(`   📝 登录成功`);
  });

  // 3. 测试创建 NPC
  await test("创建 NPC", async () => {
    if (!testUserId) throw new Error("需要先创建用户");
    const response = await request("POST", "/agents", {
      createdBy: testUserId,
      name: "测试 NPC",
      type: "general",
      model: "gpt-4",
      systemPrompt: "你是一个友好的助手", // 可选，可以为空
    });
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`创建失败: ${JSON.stringify(response.data)}`);
    }
    testAgentId = response.data.data?.id || response.data.id;
    console.log(`   📝 创建 NPC: ${testAgentId}`);
  });

  // 4. 测试获取 NPC 列表
  await test("获取 NPC 列表", async () => {
    if (!testUserId) throw new Error("需要先创建用户");
    const response = await request("GET", `/agents?userId=${testUserId}`);
    if (response.status !== 200) {
      throw new Error(`获取失败: ${JSON.stringify(response.data)}`);
    }
    // 响应格式：{ success: true, data: { agents: [...], total: ... } }
    const agents = response.data.data?.agents || response.data.agents || response.data.data || response.data;
    console.log(`   📝 找到 ${Array.isArray(agents) ? agents.length : 0} 个 NPC`);
  });

  // 5. 测试发送消息（需要 API Key）
  await test("发送消息", async () => {
    if (!testUserId || !testAgentId) {
      throw new Error("需要先创建用户和 NPC");
    }
    
    // 检查是否有 API Key（如果没有则跳过测试）
    if (!process.env.OPENROUTER_API_KEY) {
      console.log(`   ⚠️  跳过：需要设置 OPENROUTER_API_KEY 环境变量才能测试发送消息`);
      results.passed.push("发送消息（已跳过）");
      return;
    }
    
    const response = await request("POST", "/messages", {
      userId: testUserId,
      agentId: testAgentId,
      text: "你好，这是一条测试消息", // 注意：API 期望的是 text，不是 content
    });
    if (response.status !== 200 && response.status !== 201) {
      // 如果是 API_KEY_MISSING 错误，给出友好提示
      if (response.data.error?.code === "API_KEY_MISSING") {
        throw new Error(`发送失败：${response.data.error.message}（这是正常的，需要配置 API Key）`);
      }
      throw new Error(`发送失败: ${JSON.stringify(response.data)}`);
    }
    console.log(`   📝 消息已发送`);
  });

  // 6. 测试获取对话历史
  await test("获取对话历史", async () => {
    if (!testUserId || !testAgentId) {
      throw new Error("需要先创建用户和 NPC");
    }
    const response = await request(
      "GET",
      `/history?userId=${testUserId}&agentId=${testAgentId}`
    );
    if (response.status !== 200) {
      throw new Error(`获取失败: ${JSON.stringify(response.data)}`);
    }
    const events = response.data.data || response.data;
    console.log(`   📝 找到 ${Array.isArray(events) ? events.length : 0} 条历史记录`);
  });

  // 7. 测试获取会话列表
  await test("获取会话列表", async () => {
    if (!testUserId) throw new Error("需要先创建用户");
    const response = await request("GET", `/sessions?userId=${testUserId}`);
    if (response.status !== 200) {
      throw new Error(`获取失败: ${JSON.stringify(response.data)}`);
    }
    const sessions = response.data.data || response.data;
    console.log(`   📝 找到 ${Array.isArray(sessions) ? sessions.length : 0} 个会话`);
  });

  // 打印测试结果
  console.log("\n" + "=".repeat(50));
  console.log("📊 测试结果汇总");
  console.log("=".repeat(50));
  console.log(`✅ 通过: ${results.passed.length} 个`);
  console.log(`❌ 失败: ${results.failed.length} 个`);

  if (results.failed.length > 0) {
    console.log("\n失败的测试:");
    results.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }

  console.log("\n" + "=".repeat(50));

  // 退出
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// 检查服务器是否运行
async function checkServer() {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL);
    const req = http.get({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
    }, (res) => {
      resolve(true);
    });
    req.on("error", () => {
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 主函数
async function main() {
  console.log("🔍 检查服务器是否运行...");
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log("❌ 服务器未运行！");
    console.log("\n💡 请先启动后端服务器：");
    console.log("   cd npc-backend");
    console.log("   npm run dev");
    console.log("\n然后重新运行此测试脚本。");
    process.exit(1);
  }

  console.log("✅ 服务器运行正常\n");
  await runTests();
}

main();

