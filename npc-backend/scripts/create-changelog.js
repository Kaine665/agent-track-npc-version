/**
 * ============================================
 * 创建更新日志脚本 (create-changelog.js)
 * ============================================
 * 
 * 【功能说明】
 * 交互式创建版本更新日志，简化操作流程
 * 
 * 【使用方法】
 * node scripts/create-changelog.js
 * 
 * 【工作流程】
 * 1. 提示输入版本号、标题、内容等
 * 2. 自动登录获取 Token
 * 3. 调用 API 创建更新日志
 * 4. 显示创建结果
 */

const readline = require('readline');
const http = require('http');

// 配置（从环境变量读取，或使用默认值）
// 支持本地和生产环境：
// - 本地：http://localhost:8000
// - 生产：http://你的服务器IP:8000 或 https://api.yourdomain.com
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const DEFAULT_USER_ID = process.env.ADMIN_USER_ID || '';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || '';

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 工具函数：询问用户输入
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// 工具函数：HTTP 请求
function httpRequest(url, method, headers, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: headers,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 登录获取 Token
async function login(userId, password) {
  console.log('\n🔐 正在登录...');
  
  try {
    const response = await httpRequest(
      `${API_BASE_URL}/api/v1/users/login`,
      'POST',
      {
        'Content-Type': 'application/json',
      },
      {
        userId: userId,
        password: password,
      }
    );

    if (response.status === 200 && response.data.success) {
      return response.data.data.accessToken;
    } else {
      throw new Error(response.data.error?.message || '登录失败');
    }
  } catch (error) {
    throw new Error(`登录失败: ${error.message}`);
  }
}

// 创建更新日志
async function createChangelog(token, changelogData) {
  console.log('\n📝 正在创建更新日志...');
  
  try {
    const response = await httpRequest(
      `${API_BASE_URL}/api/v1/versions`,
      'POST',
      {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      changelogData
    );

    if (response.status === 201 && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error?.message || '创建失败');
    }
  } catch (error) {
    throw new Error(`创建失败: ${error.message}`);
  }
}

// 主函数
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   创建版本更新日志');
  console.log('═══════════════════════════════════════\n');

  try {
    // 1. 获取登录信息
    let userId = DEFAULT_USER_ID;
    let password = DEFAULT_PASSWORD;

    if (!userId) {
      userId = await question('请输入用户 ID: ');
    } else {
      console.log(`使用默认用户 ID: ${userId}`);
    }

    if (!password) {
      password = await question('请输入密码: ');
    } else {
      console.log('使用默认密码');
    }

    // 2. 登录获取 Token
    const token = await login(userId, password);
    console.log('✅ 登录成功\n');

    // 3. 收集更新日志信息
    console.log('请填写更新日志信息：\n');

    const version = await question('版本号（如 1.6.0）: ');
    if (!version) {
      console.error('❌ 版本号不能为空');
      process.exit(1);
    }

    const title = await question('更新标题（如 v1.6.0 版本更新）: ');
    if (!title) {
      console.error('❌ 标题不能为空');
      process.exit(1);
    }

    const releaseDate = await question('发布日期（如 2025-12-01，可选，直接回车使用今天）: ') || 
                        new Date().toISOString().split('T')[0];

    console.log('\n请输入更新内容（Markdown 格式）：');
    console.log('提示：输入多行内容，输入 "END" 结束输入\n');

    let content = '';
    let line;
    while (true) {
      line = await question('');
      if (line.trim() === 'END') {
        break;
      }
      content += line + '\n';
    }

    // 如果内容为空，使用默认模板
    if (!content.trim()) {
      console.log('\n⚠️  内容为空，使用默认模板...');
      content = `## 更新内容

本次更新带来了以下改进：

### ✨ 新增功能
- 新增功能A
- 新增功能B

### 🐛 问题修复
- 修复了问题X

### ⚡ 性能优化
- 优化了性能Y`;
    }

    const isActiveInput = await question('是否激活（y/n，默认 y）: ') || 'y';
    const isActive = isActiveInput.toLowerCase() === 'y';

    // 4. 创建更新日志
    const changelogData = {
      version: version.trim(),
      title: title.trim(),
      content: content.trim(),
      releaseDate: releaseDate.trim(),
      isActive: isActive,
    };

    const result = await createChangelog(token, changelogData);

    // 5. 显示结果
    console.log('\n═══════════════════════════════════════');
    console.log('✅ 更新日志创建成功！');
    console.log('═══════════════════════════════════════\n');
    console.log('版本号:', result.version);
    console.log('标题:', result.title);
    console.log('发布日期:', result.releaseDate);
    console.log('激活状态:', result.isActive ? '✅ 已激活' : '❌ 未激活');
    console.log('\n💡 提示：用户登录时会自动看到此更新日志');

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// 运行主函数
main();

