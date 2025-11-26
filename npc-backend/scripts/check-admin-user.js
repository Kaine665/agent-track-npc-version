/**
 * ============================================
 * 检查管理员用户脚本
 * ============================================
 * 
 * 用于检查管理员用户是否存在
 */

const configLoader = require('../config/config-loader');
configLoader.init();

const userRepository = require('../repositories/UserRepository');

async function checkAdminUser() {
  const adminId = 'admin_Kaine';
  const adminUsername = 'Kaine';

  try {
    console.log('🔍 Checking admin user...\n');
    
    // 检查用户 ID
    const userById = await userRepository.findById(adminId);
    console.log(`📋 User by ID (${adminId}):`, userById ? '✅ EXISTS' : '❌ NOT FOUND');
    if (userById) {
      console.log(`   - Username: ${userById.username}`);
      console.log(`   - Password: ${userById.password}`);
      console.log(`   - Created: ${new Date(userById.createdAt).toLocaleString()}`);
    }

    // 检查用户名
    const userByUsername = await userRepository.findByUsername(adminUsername);
    console.log(`\n📋 User by Username (${adminUsername}):`, userByUsername ? '✅ EXISTS' : '❌ NOT FOUND');
    if (userByUsername) {
      console.log(`   - User ID: ${userByUsername.id}`);
      console.log(`   - Password: ${userByUsername.password}`);
      console.log(`   - Created: ${new Date(userByUsername.createdAt).toLocaleString()}`);
    }

    // 如果用户 ID 不存在但用户名存在，说明用户名冲突
    if (!userById && userByUsername) {
      console.log('\n⚠️  WARNING: Username conflict!');
      console.log(`   User ID "${adminId}" does not exist, but username "${adminUsername}" is already used by user "${userByUsername.id}"`);
    }

    // 如果用户 ID 存在但用户名不匹配
    if (userById && userById.username !== adminUsername) {
      console.log('\n⚠️  WARNING: Username mismatch!');
      console.log(`   User ID "${adminId}" exists but username is "${userById.username}" instead of "${adminUsername}"`);
    }

    if (userById && userById.username === adminUsername) {
      console.log('\n✅ Admin user is correctly configured!');
    } else if (!userById && !userByUsername) {
      console.log('\n❌ Admin user does not exist. Please create it.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkAdminUser()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = checkAdminUser;

