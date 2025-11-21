/**
 * ============================================
 * LLMService 测试脚本
 * ============================================
 *
 * 【功能说明】
 * 用于测试 LLMService 是否正常工作
 *
 * 【使用方法】
 * node test-llm.js
 *
 * 【环境变量要求】
 * - ENABLE_OPENAI=true 或 ENABLE_DEEPSEEK=true 或 ENABLE_OPENROUTER=true
 * - 对应的 API Key（OPENAI_API_KEY / DEEPSEEK_API_KEY / OPENROUTER_API_KEY）
 * - MODELS=模型名:提供商（可选，如果使用预设模型）
 */

require("dotenv").config();
const llmService = require("./services/LLMService");
const { getConfigInfo, getEnabledProviders } = require("./config/models");

async function testLLMService() {
  console.log("=".repeat(60));
  console.log("LLMService 测试");
  console.log("=".repeat(60));
  console.log();

  // 1. 检查配置
  console.log("📋 检查配置...");
  const config = getConfigInfo();
  console.log("启用的提供商:", config.enabledProviders);
  console.log("预设模型:", config.presetModels);
  console.log("允许自定义模型:", config.allowCustomModels);
  console.log();

  if (config.enabledProviders.length === 0) {
    console.error("❌ 错误：没有启用任何提供商");
    console.log("请在 .env 文件中设置：");
    console.log("  ENABLE_OPENAI=true");
    console.log("  或 ENABLE_DEEPSEEK=true");
    console.log("  或 ENABLE_OPENROUTER=true");
    process.exit(1);
  }

  // 2. 确定测试参数
  let model, provider;

  // 优先选择 openrouter（如果可用），强制使用 Claude 4
  const hasOpenRouter = config.enabledProviders.includes("openrouter");

  if (hasOpenRouter) {
    // 使用 OpenRouter 自定义模型（使用 Claude 4.5 Sonnet，最新版本）
    provider = "openrouter";
    // OpenRouter 支持的 Claude 模型格式：anthropic/claude-4.5-sonnet
    // Claude 4.5 Sonnet 是 2025-09-30 发布的最新版本
    model = "anthropic/claude-4.5-sonnet"; // Claude 4.5 Sonnet（最新版本）
    console.log(
      `✅ 使用 OpenRouter Claude 4.5 Sonnet 模型: ${model} (提供商: ${provider})`
    );
  } else if (Object.keys(config.presetModels).length > 0) {
    // 使用预设模型
    const firstModel = Object.keys(config.presetModels)[0];
    model = firstModel;
    provider = config.presetModels[firstModel];
    console.log(`✅ 使用预设模型: ${model} (提供商: ${provider})`);
  } else {
    // 使用自定义模型
    provider = config.enabledProviders[0];
    model =
      provider === "openai"
        ? "gpt-3.5-turbo"
        : provider === "deepseek"
        ? "deepseek-chat"
        : "openai/gpt-3.5-turbo";
    console.log(`✅ 使用自定义模型: ${model} (提供商: ${provider})`);
  }
  console.log();

  // 3. 检查 API Key
  const apiKeyEnv = {
    openai: "OPENAI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
  }[provider];

  if (!process.env[apiKeyEnv]) {
    console.error(`❌ 错误：缺少 ${provider} API Key`);
    console.log(`请在 .env 文件中设置：${apiKeyEnv}=sk-...`);
    process.exit(1);
  }

  console.log(`✅ API Key 已配置: ${apiKeyEnv}`);
  console.log();

  // 4. 测试 LLMService
  console.log("🚀 开始测试 LLMService...");
  console.log();

  try {
    const systemPrompt = "你是一位友好的 AI 助手，用简洁的中文回答问题。";
    const messages = [
      { role: "user", content: "你好，请简单介绍一下你自己。" },
    ];

    console.log("📤 发送请求...");
    console.log("System Prompt:", systemPrompt);
    console.log("Messages:", JSON.stringify(messages, null, 2));
    console.log();

    const startTime = Date.now();
    const reply = await llmService.generateReply({
      model: model,
      provider: provider, // 如果使用预设模型，可以不传，会自动推断
      systemPrompt: systemPrompt,
      messages: messages,
      timeout: 60000, // 增加到 60 秒，避免网络慢导致超时
    });
    const endTime = Date.now();

    console.log("✅ 测试成功！");
    console.log();
    console.log("📥 收到回复:");
    console.log("-".repeat(60));
    console.log(reply);
    console.log("-".repeat(60));
    console.log();
    console.log(`⏱️  响应时间: ${endTime - startTime}ms`);
    console.log();
  } catch (error) {
    console.error("❌ 测试失败！");
    console.error();
    console.error("错误信息:");
    console.error("-".repeat(60));
    console.error("错误码:", error.code);
    console.error("错误消息:", error.message);
    if (error.provider) {
      console.error("提供商:", error.provider);
    }
    if (error.status) {
      console.error("HTTP 状态码:", error.status);
    }
    if (error.originalError) {
      console.error("原始错误:", error.originalError);
    }
    if (error.errorType) {
      console.error("错误类型:", error.errorType);
    }
    console.error("-".repeat(60));
    console.error();

    // 提供故障排查建议
    if (
      error.code === "LLM_API_ERROR" &&
      error.originalError?.includes("Timeout")
    ) {
      console.error("💡 故障排查建议:");
      console.error("1. 检查网络连接是否正常");
      console.error("2. 如果在中国大陆，可能需要配置代理");
      console.error("3. 检查防火墙设置");
      console.error("4. 尝试增加超时时间（当前: 60秒）");
      console.error();
    }

    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("✅ 测试完成！");
  console.log("=".repeat(60));
}

// 运行测试
testLLMService().catch((error) => {
  console.error("未捕获的错误:", error);
  process.exit(1);
});
