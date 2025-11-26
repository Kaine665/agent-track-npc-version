/**
 * ============================================
 * 配置加载器 (config-loader.js)
 * ============================================
 *
 * 【文件职责】
 * 从 YAML 配置文件加载配置，并设置到环境变量中
 * 同时支持 .env 文件（向后兼容）
 *
 * 【主要功能】
 * 1. 优先读取 config.yaml 文件
 * 2. 如果 config.yaml 不存在，回退到 .env 文件
 * 3. 将配置设置到 process.env 中
 * 4. 提供统一的配置访问接口
 *
 * 【工作流程】
 * 检查 config.yaml → 读取 YAML → 解析配置 → 设置环境变量 → 导出配置对象
 *
 * 【依赖】
 * - js-yaml: YAML 解析库
 * - fs: 文件系统（Node.js 内置）
 * - path: 路径处理（Node.js 内置）
 * - dotenv: .env 文件支持（向后兼容）
 *
 * 【被谁使用】
 * - server.js: 在启动时加载配置
 * - 所有需要配置的模块（通过 process.env 访问）
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * 配置文件路径
 */
const CONFIG_YAML_PATH = path.join(__dirname, "..", "config.yaml");
const ENV_FILE_PATH = path.join(__dirname, "..", ".env");

/**
 * 从 YAML 文件加载配置
 *
 * 【功能说明】
 * 读取 config.yaml 文件，解析配置并设置到环境变量中
 *
 * 【配置结构】
 * server:
 *   port: 8000
 * database:
 *   host: localhost
 *   port: 3306
 *   user: root
 *   password: ""
 *   name: npc_db
 * llm:
 *   openrouter:
 *     enabled: true
 *     api_key: "..."
 *
 * @returns {Object|null} 配置对象，如果文件不存在则返回 null
 */
function loadYAMLConfig() {
  try {
    if (!fs.existsSync(CONFIG_YAML_PATH)) {
      return null;
    }

    const fileContents = fs.readFileSync(CONFIG_YAML_PATH, "utf8");
    const config = yaml.load(fileContents);

    // 将配置设置到环境变量中
    // 环境变量优先级高于 YAML 配置（Docker 部署时环境变量已设置）
    if (config.server) {
      if (config.server.port && !process.env.PORT) {
        process.env.PORT = String(config.server.port);
      }
    }

    if (config.database) {
      // 环境变量优先级高于 YAML 配置
      // 只在环境变量未设置时才从 YAML 读取（Docker 部署时环境变量已设置）
      if (config.database.host && !process.env.DB_HOST) {
        process.env.DB_HOST = config.database.host;
      }
      if (config.database.port && !process.env.DB_PORT) {
        process.env.DB_PORT = String(config.database.port);
      }
      if (config.database.user && !process.env.DB_USER) {
        process.env.DB_USER = config.database.user;
      }
      // 处理密码：必须设置，即使是空字符串
      // 注意：如果 password 是 undefined，不设置环境变量（使用默认值）
      // 如果 password 是空字符串 ""，设置为空字符串（表示无密码）
      // 如果 password 有值，设置为该值
      // 环境变量优先级高于 YAML 配置
      if (config.database.password !== undefined && config.database.password !== null && !process.env.DB_PASSWORD) {
        process.env.DB_PASSWORD = String(config.database.password);
      }
      if (config.database.name && !process.env.DB_NAME) {
        process.env.DB_NAME = config.database.name;
      }
    }

    if (config.llm) {
      // YAML 配置优先级：如果 YAML 中有配置，优先使用 YAML（覆盖环境变量）
      // 这样可以在 config.yaml 中统一管理所有配置
      // OpenRouter 配置
      if (config.llm.openrouter) {
        if (config.llm.openrouter.enabled !== undefined) {
          process.env.ENABLE_OPENROUTER = String(config.llm.openrouter.enabled);
        }
        if (config.llm.openrouter.api_key) {
          // 清理 API Key：去除空格，确保格式正确
          const cleanedApiKey = config.llm.openrouter.api_key
            .split(',')
            .map(key => key.trim())
            .filter(key => key.length > 0)
            .join(',');
          process.env.OPENROUTER_API_KEY = cleanedApiKey;
          if (process.env.NODE_ENV !== "production") {
            const keyCount = cleanedApiKey.split(',').length;
            console.log(`   - OpenRouter API Key: ${keyCount} key(s) loaded from config.yaml`);
          }
        }
      }

      // OpenAI 配置
      if (config.llm.openai) {
        if (config.llm.openai.enabled !== undefined) {
          process.env.ENABLE_OPENAI = String(config.llm.openai.enabled);
        }
        if (config.llm.openai.api_key) {
          // 清理 API Key：去除空格
          const cleanedApiKey = config.llm.openai.api_key
            .split(',')
            .map(key => key.trim())
            .filter(key => key.length > 0)
            .join(',');
          process.env.OPENAI_API_KEY = cleanedApiKey;
        }
      }

      // DeepSeek 配置
      if (config.llm.deepseek) {
        if (config.llm.deepseek.enabled !== undefined) {
          process.env.ENABLE_DEEPSEEK = String(config.llm.deepseek.enabled);
        }
        if (config.llm.deepseek.api_key) {
          // 清理 API Key：去除空格
          const cleanedApiKey = config.llm.deepseek.api_key
            .split(',')
            .map(key => key.trim())
            .filter(key => key.length > 0)
            .join(',');
          process.env.DEEPSEEK_API_KEY = cleanedApiKey;
        }
      }
    }

    return config;
  } catch (error) {
    console.error("❌ Error loading YAML config:", error.message);
    return null;
  }
}

/**
 * 加载配置（优先 YAML，回退到 .env）
 *
 * 【功能说明】
 * 1. 优先尝试加载 config.yaml
 * 2. 如果不存在，加载 .env 文件（向后兼容）
 * 3. 返回配置对象
 *
 * @returns {Object} 配置对象
 */
function loadConfig() {
  // 优先加载 YAML 配置
  const yamlConfig = loadYAMLConfig();
  if (yamlConfig) {
    console.log("✅ Loaded configuration from config.yaml");
    return yamlConfig;
  }

  // 回退到 .env 文件（向后兼容）
  if (fs.existsSync(ENV_FILE_PATH)) {
    require("dotenv").config();
    console.log("✅ Loaded configuration from .env");
    return null; // .env 配置已设置到 process.env，不需要返回对象
  }

  console.warn("⚠️  No configuration file found (config.yaml or .env)");
  // 即使没有配置文件，也尝试加载 .env（dotenv 会静默失败）
  require("dotenv").config();
  return null;
}

/**
 * 初始化配置加载
 *
 * 【功能说明】
 * 在应用启动时调用，加载配置并设置环境变量
 *
 * 【调用时机】
 * 必须在其他模块导入之前调用（在 server.js 的最开始）
 */
/**
 * 初始化配置加载
 *
 * 【功能说明】
 * 在应用启动时调用，加载配置并设置环境变量
 *
 * 【调用时机】
 * 必须在其他模块导入之前调用（在 server.js 的最开始）
 *
 * 【调试信息】
 * 输出加载的配置信息（不包含敏感信息）
 */
function init() {
  const config = loadConfig();
  
  // 输出配置加载信息（用于调试）
  if (process.env.NODE_ENV !== "production") {
    console.log("📋 Configuration loaded:");
    console.log(`   - Server Port: ${process.env.PORT || "8000"}`);
    console.log(`   - Database: ${process.env.DB_NAME || "npc_db"} @ ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}`);
    console.log(`   - Database User: ${process.env.DB_USER || "root"}`);
    console.log(`   - Database Password: ${process.env.DB_PASSWORD ? "***" : "(not set)"}`);
    
    // 显示 API Key 配置信息
    if (process.env.OPENROUTER_API_KEY) {
      const keyCount = process.env.OPENROUTER_API_KEY.split(',').filter(k => k.trim()).length;
      console.log(`   - OpenRouter API Key: ${keyCount} key(s) configured`);
    } else {
      console.log(`   - OpenRouter API Key: (not set)`);
    }
    
    if (process.env.OPENAI_API_KEY) {
      console.log(`   - OpenAI API Key: configured`);
    }
    if (process.env.DEEPSEEK_API_KEY) {
      console.log(`   - DeepSeek API Key: configured`);
    }
  }
}

module.exports = {
  init,
  loadConfig,
  loadYAMLConfig,
};

