/**
 * ============================================
 * 测试登录脚本
 * ============================================
 * 
 * 用于测试管理员登录功能
 */

const configLoader = require('../config/config-loader');
configLoader.init();

const userService = require('../services/UserService');

async function testLogin() {
  const testCases = [
    {
      userId: 'admin_Kaine',
      password: 'j877413lxy',
      description: '正确的账号密码'
    },
    {
      userId: 'admin_Kaine',
      password: 'wrong_password',
      description: '错误的密码'
    },
    {
      userId: 'admin_Kaine',
      password: 'j877413lxy ',
      description: '密码末尾有空格'
    },
    {
      userId: 'admin_Kaine',
      password: ' j877413lxy',
      description: '密码开头有空格'
    },
  ];

  console.log('🧪 Testing login functionality...\n');

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.description}`);
    console.log(`   User ID: ${testCase.userId}`);
    console.log(`   Password: "${testCase.password}" (length: ${testCase.password.length})`);
    
    try {
      const user = await userService.login(testCase.userId, testCase.password);
      console.log(`   ✅ Login successful!`);
      console.log(`   User: ${user.id} (${user.username})`);
    } catch (error) {
      console.log(`   ❌ Login failed: ${error.code} - ${error.message}`);
    }
  }

  // 检查数据库中的实际密码
  console.log('\n\n🔍 Checking database password:');
  const userRepository = require('../repositories/UserRepository');
  const user = await userRepository.findById('admin_Kaine');
  if (user) {
    console.log(`   User ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Password: "${user.password}"`);
    console.log(`   Password length: ${user.password.length}`);
    console.log(`   Password bytes:`, Buffer.from(user.password).toString('hex'));
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testLogin()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = testLogin;

