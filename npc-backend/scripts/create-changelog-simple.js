/**
 * ============================================
 * 快速创建更新日志脚本（简化版）
 * ============================================
 * 
 * 【功能说明】
 * 通过命令行参数快速创建更新日志，适合脚本化使用
 * 
 * 【使用方法】
 * node scripts/create-changelog-simple.js <version> <title> <content> [releaseDate] [userId] [password]
 * 
 * 【示例】
 * node scripts/create-changelog-simple.js "1.6.0" "v1.6.0 版本更新" "## 更新内容\n\n### ✨ 新增功能\n- 功能A" "2025-12-01"
 */

const http = require('http');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const DEFAULT_USER_ID = process.env.ADMIN_USER_ID || '';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || '';

// HTTP 请求工具函数
function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || API_BASE_URL + options.path);
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
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
  const response = await httpRequest({
    path: '/api/v1/users/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  }, {
    userId: userId,
    password: password,
  });

  if (response.status === 200 && response.data.success) {
    return response.data.data.accessToken;
  } else {
    throw new Error(response.data.error?.message || '登录失败');
  }
}

// 创建更新日志
async function createChangelog(token, changelogData) {
  const response = await httpRequest({
    path: '/api/v1/versions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  }, changelogData);

  if (response.status === 201 && response.data.success) {
    return response.data.data;
  } else {
    throw new Error(response.data.error?.message || '创建失败');
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('使用方法:');
    console.log('  node scripts/create-changelog-simple.js <version> <title> <content> [releaseDate] [userId] [password]');
    console.log('');
    console.log('示例:');
    console.log('  node scripts/create-changelog-simple.js "1.6.0" "v1.6.0 版本更新" "## 更新内容\\n\\n### ✨ 新增功能\\n- 功能A" "2025-12-01"');
    process.exit(1);
  }

  const [version, title, content, releaseDate, userId, password] = args;

  try {
    console.log('🔐 正在登录...');
    const finalUserId = userId || DEFAULT_USER_ID;
    const finalPassword = password || DEFAULT_PASSWORD;

    if (!finalUserId || !finalPassword) {
      throw new Error('请提供用户 ID 和密码（通过参数或环境变量）');
    }

    const token = await login(finalUserId, finalPassword);
    console.log('✅ 登录成功');

    console.log('📝 正在创建更新日志...');
    const result = await createChangelog(token, {
      version: version,
      title: title,
      content: content.replace(/\\n/g, '\n'), // 将 \n 转换为真正的换行
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      isActive: true,
    });

    console.log('✅ 更新日志创建成功！');
    console.log('');
    console.log('版本号:', result.version);
    console.log('标题:', result.title);
    console.log('发布日期:', result.releaseDate);
    console.log('激活状态: ✅ 已激活');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();

