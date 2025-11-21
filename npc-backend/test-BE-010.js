/**
 * ============================================
 * 对话测试脚本 (test-chat.js)
 * ============================================
 *
 * 【文件职责】
 * 提供交互式命令行界面，用于测试消息发送和 AI 回复功能
 *
 * 【主要功能】
 * 1. 交互式对话界面
 * 2. 调用 POST /api/v1/messages API
 * 3. 显示对话历史
 * 4. 支持多轮对话
 * 5. 支持命令操作（退出、清屏、帮助等）
 *
 * 【使用方法】
 * 1. 确保后端服务已启动（npm run dev）
 * 2. 运行测试脚本：node test-chat.js
 * 3. 按照提示输入 userId、agentId
 * 4. 开始对话，输入消息后按回车发送
 * 5. 输入 /exit 退出，输入 /help 查看帮助
 *
 * 【环境变量要求】
 * - PORT: 后端服务端口（默认 8000）
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
const MESSAGES_API_URL = `${API_BASE_URL}/api/v1/messages`;
const AGENTS_API_URL = `${API_BASE_URL}/api/v1/agents`;

// 对话状态
let userId = null;
let agentId = null;
let conversationCount = 0;
let rl = null; // readline 接口（全局变量，用于在异步函数中使用）

/**
 * 创建 readline 接口
 *
 * 【功能说明】
 * 创建交互式命令行输入接口
 *
 * @returns {readline.Interface} readline 接口
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });
}

/**
 * 打印分隔线
 *
 * 【功能说明】
 * 打印美观的分隔线
 *
 * @param {string} char - 分隔字符（默认 "="）
 * @param {number} length - 长度（默认 60）
 */
function printSeparator(char = "=", length = 60) {
  console.log(char.repeat(length));
}

/**
 * 打印标题
 *
 * 【功能说明】
 * 打印格式化的标题
 *
 * @param {string} title - 标题文本
 */
function printTitle(title) {
  console.log();
  printSeparator();
  console.log(title);
  printSeparator();
  console.log();
}

/**
 * 打印帮助信息
 *
 * 【功能说明】
 * 显示所有可用命令的帮助信息
 */
function printHelp() {
  console.log();
  printTitle("📖 可用命令");
  console.log("  /exit 或 /quit    - 退出对话测试");
  console.log("  /clear 或 /cls    - 清屏");
  console.log("  /help 或 /h       - 显示帮助信息");
  console.log("  /reset            - 重置对话（清除对话计数）");
  console.log("  /info             - 显示当前配置信息");
  console.log();
  console.log("💡 提示：直接输入消息内容即可发送，无需特殊命令");
  console.log();
}

/**
 * 打印配置信息
 *
 * 【功能说明】
 * 显示当前测试配置
 */
function printInfo() {
  console.log();
  printTitle("ℹ️  当前配置");
  console.log(`  API 地址: ${API_URL}`);
  console.log(`  用户 ID: ${userId || "未设置"}`);
  console.log(`  Agent ID: ${agentId || "未设置"}`);
  console.log(`  对话轮数: ${conversationCount}`);
  console.log();
}

/**
 * 获取用户的 Agent 列表
 *
 * 【功能说明】
 * 调用 GET /api/v1/agents API 获取用户的 Agent 列表
 *
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} Agent 列表
 * @throws {Error} 如果请求失败
 */
async function getAgentList(userId) {
  const response = await fetch(
    `${AGENTS_API_URL}?userId=${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `API 错误 (${response.status}): ${
        data.error?.message || data.error?.code || "未知错误"
      }`
    );
  }

  return data.data || [];
}

/**
 * 创建 Agent
 *
 * 【功能说明】
 * 调用 POST /api/v1/agents API 创建新的 Agent
 *
 * @param {Object} agentData - Agent 数据
 * @returns {Promise<Object>} 创建的 Agent 对象
 * @throws {Error} 如果请求失败
 */
async function createAgent(agentData) {
  const response = await fetch(AGENTS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(agentData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `API 错误 (${response.status}): ${
        data.error?.message || data.error?.code || "未知错误"
      }`
    );
  }

  return data.data;
}

/**
 * 发送消息到 API
 *
 * 【功能说明】
 * 调用 POST /api/v1/messages API 发送消息
 *
 * 【工作流程】
 * 1. 构建请求体
 * 2. 发送 POST 请求
 * 3. 解析响应
 * 4. 返回结果
 *
 * @param {string} text - 消息内容
 * @returns {Promise<Object>} API 响应数据
 * @throws {Error} 如果请求失败
 */
async function sendMessage(text) {
  const requestBody = {
    userId: userId,
    agentId: agentId,
    text: text,
    contextLimit: 20, // 使用默认值
  };

  const response = await fetch(MESSAGES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `API 错误 (${response.status}): ${
        data.error?.message || data.error?.code || "未知错误"
      }`
    );
  }

  return data;
}

/**
 * 处理用户输入
 *
 * 【功能说明】
 * 处理用户输入的命令或消息
 *
 * 【工作流程】
 * 1. 检查是否是命令（以 / 开头）
 * 2. 如果是命令，执行对应操作
 * 3. 如果是消息，发送到 API 并显示回复
 *
 * @param {readline.Interface} rl - readline 接口
 * @param {string} input - 用户输入
 */
async function handleInput(rl, input) {
  const trimmedInput = input.trim();

  // 空输入，忽略
  if (!trimmedInput) {
    rl.prompt();
    return;
  }

  // ==================== 命令处理 ====================
  if (trimmedInput.startsWith("/")) {
    const command = trimmedInput.toLowerCase();

    switch (command) {
      case "/exit":
      case "/quit":
        console.log();
        console.log("👋 再见！");
        console.log();
        rl.close();
        process.exit(0);
        break;

      case "/clear":
      case "/cls":
        // 清屏（Windows 和 Unix 都支持）
        console.clear();
        printTitle("💬 对话测试");
        console.log("💡 输入 /help 查看帮助，输入 /exit 退出");
        console.log();
        rl.prompt();
        break;

      case "/help":
      case "/h":
        printHelp();
        rl.prompt();
        break;

      case "/reset":
        conversationCount = 0;
        console.log();
        console.log("✅ 对话计数已重置");
        console.log();
        rl.prompt();
        break;

      case "/info":
        printInfo();
        rl.prompt();
        break;

      default:
        console.log();
        console.log(`❌ 未知命令: ${trimmedInput}`);
        console.log("💡 输入 /help 查看帮助");
        console.log();
        rl.prompt();
        break;
    }
    return;
  }

  // ==================== 消息处理 ====================
  // 检查是否已设置 userId 和 agentId
  if (!userId || !agentId) {
    console.log();
    console.log("❌ 错误：请先设置 userId 和 agentId");
    console.log("💡 提示：在启动脚本时，会提示输入这些信息");
    console.log();
    rl.prompt();
    return;
  }

  // 发送消息
  try {
    console.log();
    console.log("📤 发送中...");

    const startTime = Date.now();
    const response = await sendMessage(trimmedInput);
    const endTime = Date.now();

    conversationCount++;

    // 显示用户消息
    console.log();
    printSeparator("-", 50);
    console.log(`👤 你 (第 ${conversationCount} 轮):`);
    console.log(trimmedInput);
    printSeparator("-", 50);

    // 显示 AI 回复
    console.log();
    console.log(`🤖 AI 回复:`);
    console.log(response.data.content);
    console.log();

    // 显示元信息
    console.log(`⏱️  响应时间: ${endTime - startTime}ms`);
    console.log(`📝 Event ID: ${response.data.eventId}`);
    console.log();

    rl.prompt();
  } catch (error) {
    console.log();
    console.error("❌ 发送失败！");
    console.error();
    console.error("错误信息:");
    console.error("-".repeat(50));
    console.error(error.message);
    console.error("-".repeat(50));
    console.error();

    // 提供故障排查建议
    if (
      error.message.includes("fetch failed") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.error("💡 故障排查建议:");
      console.error("1. 确保后端服务已启动（npm run dev）");
      console.error(`2. 检查 API 地址是否正确: ${API_URL}`);
      console.error("3. 检查端口是否被占用");
      console.error();
    }

    rl.prompt();
  }
}

/**
 * 显示 Agent 列表
 *
 * 【功能说明】
 * 显示用户的 Agent 列表，供用户选择
 *
 * @param {Array} agents - Agent 列表
 */
function displayAgentList(agents) {
  if (agents.length === 0) {
    console.log("  （暂无 Agent）");
    return;
  }

  agents.forEach((agent, index) => {
    console.log(`  ${index + 1}. ${agent.name} (ID: ${agent.id})`);
    console.log(`     类型: ${agent.type} | 模型: ${agent.model}`);
    if (agent.systemPrompt) {
      const promptPreview =
        agent.systemPrompt.length > 50
          ? agent.systemPrompt.substring(0, 50) + "..."
          : agent.systemPrompt;
      console.log(`     人设: ${promptPreview}`);
    }
    console.log();
  });
}

/**
 * 创建 Agent 的交互式流程
 *
 * 【功能说明】
 * 引导用户创建新的 Agent
 *
 * @returns {Promise<string>} 创建的 Agent ID
 */
async function createAgentInteractive() {
  return new Promise((resolve, reject) => {
    console.log();
    printTitle("➕ 创建新 Agent");

    const questions = [];
    let agentData = {};

    // 步骤 1：输入名称
    rl.question("请输入 Agent 名称: ", (name) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        console.log("❌ Agent 名称不能为空");
        reject(new Error("Agent 名称不能为空"));
        return;
      }
      agentData.name = trimmedName;

      // 步骤 2：选择类型
      rl.question(
        "请输入 Agent 类型 (general/special，默认: special): ",
        (type) => {
          agentData.type = (type.trim() || "special").toLowerCase();
          if (agentData.type !== "general" && agentData.type !== "special") {
            agentData.type = "special";
          }

          // 步骤 3：输入模型
          rl.question(
            "请输入模型名称 (例如: gpt-4, deepseek-chat): ",
            async (model) => {
              const trimmedModel = model.trim();
              if (!trimmedModel) {
                console.log("❌ 模型名称不能为空");
                reject(new Error("模型名称不能为空"));
                return;
              }
              agentData.model = trimmedModel;

              // 步骤 4：输入人设描述
              rl.question("请输入 Agent 人设描述: ", async (systemPrompt) => {
                const trimmedPrompt = systemPrompt.trim();
                if (!trimmedPrompt) {
                  console.log("❌ 人设描述不能为空");
                  reject(new Error("人设描述不能为空"));
                  return;
                }
                agentData.systemPrompt = trimmedPrompt;

                // 步骤 5：创建 Agent（先尝试不指定 provider，如果是预设模型会自动推断）
                try {
                  console.log();
                  console.log("📤 正在创建 Agent...");
                  const createdAgent = await createAgent({
                    userId: userId,
                    name: agentData.name,
                    type: agentData.type,
                    model: agentData.model,
                    systemPrompt: agentData.systemPrompt,
                  });

                  console.log();
                  console.log("✅ Agent 创建成功！");
                  console.log(`   ID: ${createdAgent.id}`);
                  console.log(`   名称: ${createdAgent.name}`);
                  console.log();

                  resolve(createdAgent.id);
                } catch (error) {
                  // 如果错误是"必须指定提供商"，提示用户选择 provider
                  if (
                    error.message.includes("必须指定提供商") ||
                    error.message.includes("provider")
                  ) {
                    console.log();
                    console.log("💡 该模型不在预设列表中，需要指定提供商");
                    console.log("可用的提供商: openai, deepseek, openrouter");
                    rl.question(
                      "请输入提供商 (openai/deepseek/openrouter): ",
                      async (provider) => {
                        const trimmedProvider = provider.trim().toLowerCase();
                        if (
                          !trimmedProvider ||
                          !["openai", "deepseek", "openrouter"].includes(
                            trimmedProvider
                          )
                        ) {
                          console.log("❌ 无效的提供商");
                          reject(new Error("无效的提供商"));
                          return;
                        }

                        try {
                          console.log();
                          console.log("📤 正在创建 Agent...");
                          const createdAgent = await createAgent({
                            userId: userId,
                            name: agentData.name,
                            type: agentData.type,
                            model: agentData.model,
                            provider: trimmedProvider,
                            systemPrompt: agentData.systemPrompt,
                          });

                          console.log();
                          console.log("✅ Agent 创建成功！");
                          console.log(`   ID: ${createdAgent.id}`);
                          console.log(`   名称: ${createdAgent.name}`);
                          console.log();

                          resolve(createdAgent.id);
                        } catch (retryError) {
                          console.log();
                          console.error("❌ 创建失败:", retryError.message);
                          reject(retryError);
                        }
                      }
                    );
                  } else {
                    console.log();
                    console.error("❌ 创建失败:", error.message);
                    reject(error);
                  }
                }
              });
            }
          );
        }
      );
    });
  });
}

/**
 * 选择 Agent
 *
 * 【功能说明】
 * 让用户从 Agent 列表中选择一个 Agent
 *
 * @param {Array} agents - Agent 列表
 * @returns {Promise<string>} 选择的 Agent ID
 */
function selectAgent(agents) {
  return new Promise((resolve, reject) => {
    if (agents.length === 0) {
      reject(new Error("没有可用的 Agent"));
      return;
    }

    rl.question(`请选择 Agent (1-${agents.length}): `, (answer) => {
      const index = parseInt(answer.trim()) - 1;
      if (isNaN(index) || index < 0 || index >= agents.length) {
        console.log("❌ 无效的选择");
        reject(new Error("无效的选择"));
        return;
      }

      const selectedAgent = agents[index];
      resolve(selectedAgent.id);
    });
  });
}

/**
 * 初始化对话
 *
 * 【功能说明】
 * 提示用户输入 userId，然后选择或创建 Agent，最后开始对话
 *
 * 【工作流程】
 * 1. 提示输入 userId
 * 2. 获取用户的 Agent 列表
 * 3. 让用户选择 Agent 或创建新 Agent
 * 4. 显示欢迎信息
 * 5. 开始对话循环
 */
async function initializeConversation() {
  console.log();
  printTitle("🚀 对话测试初始化");

  // 步骤 1：输入 userId
  rl.question("请输入用户 ID (userId): ", async (inputUserId) => {
    const trimmedUserId = inputUserId.trim();
    if (!trimmedUserId) {
      console.log("❌ 用户 ID 不能为空");
      rl.close();
      process.exit(1);
    }
    userId = trimmedUserId;

    try {
      // 步骤 2：获取 Agent 列表
      console.log();
      console.log("📋 正在获取 Agent 列表...");
      const agents = await getAgentList(userId);

      console.log();
      printTitle("📋 您的 Agent 列表");
      displayAgentList(agents);

      // 步骤 3：选择或创建 Agent
      let selectedAgentId = null;

      if (agents.length === 0) {
        // 没有 Agent，提示创建
        console.log("💡 您还没有创建任何 Agent，让我们创建一个吧！");
        try {
          selectedAgentId = await createAgentInteractive();
        } catch (error) {
          console.log();
          console.error("❌ 创建 Agent 失败，退出");
          rl.close();
          process.exit(1);
        }
      } else {
        // 有 Agent，让用户选择
        console.log("请选择操作：");
        console.log("  1. 选择现有 Agent");
        console.log("  2. 创建新 Agent");
        rl.question("请输入选项 (1/2，默认: 1): ", async (choice) => {
          const trimmedChoice = (choice.trim() || "1").toLowerCase();

          try {
            if (trimmedChoice === "2") {
              // 创建新 Agent
              selectedAgentId = await createAgentInteractive();
            } else {
              // 选择现有 Agent
              selectedAgentId = await selectAgent(agents);
            }

            agentId = selectedAgentId;
            startConversation();
          } catch (error) {
            console.log();
            console.error("❌ 操作失败:", error.message);
            rl.close();
            process.exit(1);
          }
        });
        return; // 等待用户选择
      }

      // 如果直接创建了 Agent，设置 agentId 并开始对话
      agentId = selectedAgentId;
      startConversation();
    } catch (error) {
      console.log();
      console.error("❌ 获取 Agent 列表失败:", error.message);
      console.error();
      console.error("💡 故障排查建议:");
      console.error("1. 确保后端服务已启动（npm run dev）");
      console.error(`2. 检查 API 地址是否正确: ${AGENTS_API_URL}`);
      console.error("3. 检查网络连接");
      console.error();
      rl.close();
      process.exit(1);
    }
  });
}

/**
 * 开始对话
 *
 * 【功能说明】
 * 显示欢迎信息并开始对话循环
 */
function startConversation() {
  // 显示欢迎信息
  console.log();
  printTitle("💬 对话测试");
  console.log(`✅ 用户 ID: ${userId}`);
  console.log(`✅ Agent ID: ${agentId}`);
  console.log();
  console.log("💡 提示:");
  console.log("  - 直接输入消息内容即可发送");
  console.log("  - 输入 /help 查看帮助");
  console.log("  - 输入 /exit 退出");
  console.log();
  printSeparator();

  // 开始对话循环
  rl.prompt();
}

/**
 * 主函数
 *
 * 【功能说明】
 * 启动对话测试脚本
 *
 * 【工作流程】
 * 1. 检查 Node.js 版本（需要支持 fetch）
 * 2. 创建 readline 接口
 * 3. 初始化对话
 * 4. 监听用户输入
 */
function main() {
  // 检查 Node.js 版本（fetch 需要 Node.js 18+）
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split(".")[0].substring(1));
  if (majorVersion < 18) {
    console.error("❌ 错误：需要 Node.js 18 或更高版本");
    console.error(`当前版本: ${nodeVersion}`);
    process.exit(1);
  }

  // 检查 fetch 是否可用（Node.js 18+ 内置）
  if (typeof fetch === "undefined") {
    console.error("❌ 错误：当前 Node.js 版本不支持 fetch");
    console.error("💡 提示：请升级到 Node.js 18 或更高版本");
    process.exit(1);
  }

  // 创建 readline 接口（设置为全局变量）
  rl = createReadlineInterface();

  // 监听用户输入
  rl.on("line", async (input) => {
    await handleInput(rl, input);
  });

  // 监听关闭事件
  rl.on("close", () => {
    console.log();
    console.log("👋 再见！");
    process.exit(0);
  });

  // 初始化对话
  initializeConversation();
}

// 运行主函数
main();
