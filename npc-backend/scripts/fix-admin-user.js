/**
 * ============================================
 * 修复管理员用户脚本
 * ============================================
 * 
 * 用于修复管理员用户问题：
 * - 如果用户名冲突，更新现有用户的密码和 ID
 * - 如果用户不存在，创建新用户
 */

const configLoader = require('../config/config-loader');
configLoader.init();

const userRepository = require('../repositories/UserRepository');
const { query } = require('../config/database');

async function fixAdminUser() {
  const adminId = 'admin_Kaine';
  const adminUsername = 'Kaine';
  const adminPassword = 'j877413lxy';

  try {
    console.log('🔧 Fixing admin user...\n');
    
    const userById = await userRepository.findById(adminId);
    const userByUsername = await userRepository.findByUsername(adminUsername);

    // 情况1：用户 ID 和用户名都正确，只需要更新密码
    if (userById && userById.username === adminUsername) {
      console.log('✅ Admin user exists with correct ID and username');
      if (userById.password !== adminPassword) {
        console.log('🔑 Updating password...');
        await userRepository.updatePassword(adminId, adminPassword);
        console.log('✅ Password updated successfully!');
      } else {
        console.log('✅ Password is already correct');
      }
      return;
    }

    // 情况2：用户 ID 不存在，但用户名被其他用户使用
    if (!userById && userByUsername) {
      console.log(`⚠️  Username "${adminUsername}" is used by user "${userByUsername.id}"`);
      console.log('🔄 Updating existing user to admin user...');
      
      // 更新现有用户的 ID 和密码
      const now = Date.now();
      const sql = `
        UPDATE users 
        SET id = ?, password = ?, updated_at = ?
        WHERE username = ?
      `;
      
      await query(sql, [adminId, adminPassword, now, adminUsername]);
      console.log('✅ User updated successfully!');
      console.log(`   - User ID changed from "${userByUsername.id}" to "${adminId}"`);
      console.log(`   - Password updated to "${adminPassword}"`);
      return;
    }

    // 情况3：用户 ID 存在但用户名不匹配
    if (userById && userById.username !== adminUsername) {
      console.log(`⚠️  User ID "${adminId}" exists but username is "${userById.username}"`);
      console.log('🔄 Updating username...');
      
      // 检查新用户名是否可用
      const existingUser = await userRepository.findByUsername(adminUsername);
      if (existingUser) {
        console.error(`❌ Cannot update: Username "${adminUsername}" is already used by user "${existingUser.id}"`);
        console.log('💡 Suggestion: Delete the conflicting user first or use a different username');
        throw new Error('Username conflict');
      }
      
      // 更新用户名和密码
      const now = Date.now();
      const sql = `
        UPDATE users 
        SET username = ?, password = ?, updated_at = ?
        WHERE id = ?
      `;
      
      await query(sql, [adminUsername, adminPassword, now, adminId]);
      console.log('✅ User updated successfully!');
      return;
    }

    // 情况4：用户完全不存在，创建新用户
    if (!userById && !userByUsername) {
      console.log('➕ Creating new admin user...');
      await userRepository.create({
        id: adminId,
        username: adminUsername,
        password: adminPassword,
      });
      console.log('✅ Admin user created successfully!');
      console.log(`   - User ID: ${adminId}`);
      console.log(`   - Username: ${adminUsername}`);
      console.log(`   - Password: ${adminPassword}`);
      return;
    }

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      console.error('❌ Database error: Duplicate entry');
      console.error('   This might be a race condition. Please try again.');
    } else {
      console.error('❌ Error:', error.message);
    }
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  fixAdminUser()
    .then(() => {
      console.log('\n🎉 Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = fixAdminUser;

