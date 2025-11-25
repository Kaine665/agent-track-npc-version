/**
 * ============================================
 * 创建默认管理员账号脚本
 * ============================================
 * 
 * 用于创建默认的管理员账号
 * 
 * 使用方式：
 * node scripts/create-admin-user.js
 */

const configLoader = require('../config/config-loader');
configLoader.init();

const userRepository = require('../repositories/UserRepository');

async function createAdminUser() {
  const adminId = 'admin_Kaine';
  const adminUsername = 'Kaine';
  const adminPassword = 'j877413lxy';

  try {
    // 检查用户 ID 是否已存在
    const userById = await userRepository.findById(adminId);
    const userByUsername = await userRepository.findByUsername(adminUsername);
    
    // 如果用户 ID 和用户名都正确，检查密码
    if (userById && userById.username === adminUsername) {
      if (userById.password === adminPassword) {
        console.log(`✅ Admin user already exists: ${adminId}`);
        return;
      } else {
        // 更新密码
        console.log(`🔑 Updating admin user password...`);
        await userRepository.updatePassword(adminId, adminPassword);
        console.log(`✅ Admin user password updated successfully!`);
        return;
      }
    }

    // 如果用户名被其他用户使用，更新该用户
    if (!userById && userByUsername) {
      console.log(`⚠️  Username "${adminUsername}" is used by user "${userByUsername.id}"`);
      console.log(`🔄 Updating existing user to admin user...`);
      const { query } = require('../config/database');
      const now = Date.now();
      await query(
        'UPDATE users SET id = ?, password = ?, updated_at = ? WHERE username = ?',
        [adminId, adminPassword, now, adminUsername]
      );
      console.log(`✅ Admin user updated successfully!`);
      console.log(`   User ID: ${adminId}`);
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: ${adminPassword}`);
      return;
    }

    // 创建新管理员账号
    await userRepository.create({
      id: adminId,
      username: adminUsername,
      password: adminPassword,
    });

    console.log(`✅ Admin user created successfully!`);
    console.log(`   User ID: ${adminId}`);
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
  } catch (error) {
    if (error.code === 'DUPLICATE_USER_ID' || error.code === 'ER_DUP_ENTRY') {
      console.log(`ℹ️  Admin user already exists: ${adminId}`);
    } else {
      console.error(`❌ Failed to create admin user:`, error.message);
      throw error;
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = createAdminUser;

