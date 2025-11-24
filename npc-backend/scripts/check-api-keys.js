/**
 * 检查 API Key 配置脚本
 * 用途：验证多个 API Key 是否正确配置
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// 加载配置
const configPath = path.join(__dirname, '..', 'config.yaml');
const config = yaml.load(fs.readFileSync(configPath, 'utf8'));

console.log('========================================');
console.log('API Key 配置检查');
console.log('========================================\n');

// 检查 OpenRouter API Key
if (config.llm && config.llm.openrouter && config.llm.openrouter.api_key) {
  const apiKeyStr = config.llm.openrouter.api_key;
  console.log('📋 原始配置值:');
  console.log(`   ${apiKeyStr.substring(0, 50)}...\n`);
  
  // 解析多个 API Key
  const apiKeys = apiKeyStr
    .split(',')
    .map(key => key.trim())
    .filter(key => key.length > 0);
  
  console.log(`✅ 解析到 ${apiKeys.length} 个 API Key:\n`);
  apiKeys.forEach((key, index) => {
    console.log(`   Key ${index + 1}: ${key.substring(0, 30)}...`);
    console.log(`   长度: ${key.length} 字符`);
    console.log(`   格式: ${key.startsWith('sk-or-v1-') ? '✅ 正确' : '❌ 错误'}\n`);
  });
  
  // 检查环境变量（如果已设置）
  if (process.env.OPENROUTER_API_KEY) {
    console.log('⚠️  环境变量 OPENROUTER_API_KEY 已设置（优先级高于 config.yaml）');
    const envKeys = process.env.OPENROUTER_API_KEY
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0);
    console.log(`   环境变量中有 ${envKeys.length} 个 API Key\n`);
  } else {
    console.log('ℹ️  环境变量 OPENROUTER_API_KEY 未设置，将使用 config.yaml 中的配置\n');
  }
} else {
  console.log('❌ 未找到 OpenRouter API Key 配置\n');
}

console.log('========================================');

