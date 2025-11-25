/**
 * ============================================
 * 直接测试登录脚本
 * ============================================
 * 
 * 模拟前端请求，直接测试登录功能
 */

const configLoader = require('../config/config-loader');
configLoader.init();

const userService = require('../services/UserService');

async function testDirectLogin() {
  const testCases = [
    {
      userId: 'admin_Kaine',
      password: 'j877413lxy',
      description: '正确的密码（直接输入）'
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
    {
      userId: 'admin_Kaine',
      password: 'j877413lxy\n',
      description: '密码末尾有换行符'
    },
    {
      userId: 'admin_Kaine',
      password: '\nj877413lxy',
      description: '密码开头有换行符'
    },
  ];

  console.log('🧪 Testing direct login...\n');

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.description}`);
    console.log(`   User ID: "${testCase.userId}"`);
    console.log(`   Password: "${testCase.password}"`);
    console.log(`   Password length: ${testCase.password.length}`);
    console.log(`   Password bytes (hex): ${Buffer.from(testCase.password).toString('hex')}`);
    
    try {
      const user = await userService.login(testCase.userId, testCase.password);
      console.log(`   ✅ Login successful!`);
      console.log(`   User: ${user.id} (${user.username})`);
    } catch (error) {
      console.log(`   ❌ Login failed: ${error.code} - ${error.message}`);
    }
  }

  // 检查数据库中的实际密码
  console.log('\n\n🔍 Database password details:');
  const userRepository = require('../repositories/UserRepository');
  const user = await userRepository.findById('admin_Kaine');
  if (user) {
    console.log(`   Password: "${user.password}"`);
    console.log(`   Length: ${user.password.length}`);
    console.log(`   Bytes (hex): ${Buffer.from(user.password).toString('hex')}`);
    console.log(`   Character codes:`, Array.from(user.password).map(c => c.charCodeAt(0)).join(','));
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testDirectLogin()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = testDirectLogin;

