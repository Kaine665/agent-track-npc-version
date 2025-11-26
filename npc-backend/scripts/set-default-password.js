/**
 * ============================================
 * 数据库迁移脚本：为无密码用户设置默认密码
 * ============================================
 *
 * 【文件职责】
 * 执行数据库迁移，为数据库中密码为空或NULL的用户设置默认密码123456
 *
 * 【使用方式】
 * node scripts/set-default-password.js
 *
 * 【重要说明】
 * - 需要先配置 .env 文件中的数据库连接信息
 * - 需要确保 MySQL 服务已启动
 * - 此脚本会更新所有密码为空字符串或NULL的用户
 * - 默认密码设置为：123456
 * - 如果用户已有密码，不会被修改
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

/**
 * 数据库配置
 */
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "npc_db",
};

const DEFAULT_PASSWORD = "123456";

/**
 * 主函数
 */
async function main() {
  console.log("🚀 Starting password migration...");
  console.log("📋 Database config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
  });

  let connection;

  try {
    // 1. 连接数据库
    console.log("\n📡 Connecting to MySQL server...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server");

    // 2. 查询需要更新的用户数量
    console.log("\n🔍 Checking users with empty passwords...");
    const [checkResults] = await connection.query(
      `SELECT COUNT(*) as count FROM users WHERE password IS NULL OR password = '' OR TRIM(password) = ''`
    );
    const emptyPasswordCount = checkResults[0].count;
    console.log(`   Found ${emptyPasswordCount} users with empty passwords`);

    if (emptyPasswordCount === 0) {
      console.log("\n✅ No users need password update. Migration completed!");
      await connection.end();
      return;
    }

    // 3. 执行更新
    console.log("\n⚙️  Updating passwords to default password (123456)...");
    const [updateResult] = await connection.query(
      `UPDATE users 
       SET password = ?, updated_at = UNIX_TIMESTAMP(NOW()) * 1000
       WHERE password IS NULL OR password = '' OR TRIM(password) = ''`,
      [DEFAULT_PASSWORD]
    );

    console.log(`   ✓ Updated ${updateResult.affectedRows} users`);

    // 4. 验证更新结果
    console.log("\n🔍 Verifying update...");
    const [verifyResults] = await connection.query(
      `SELECT COUNT(*) as count FROM users WHERE password = ?`,
      [DEFAULT_PASSWORD]
    );
    const defaultPasswordCount = verifyResults[0].count;
    console.log(`   ✓ Users with default password: ${defaultPasswordCount}`);

    console.log("\n🎉 Password migration completed!");
    console.log(`📊 Updated users: ${updateResult.affectedRows}`);
    console.log(`🔑 Default password: ${DEFAULT_PASSWORD}`);

    // 5. 关闭连接
    await connection.end();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("\n❌ Password migration failed!");
    console.error("Error:", error.message);
    console.error("\n💡 Please check:");
    console.error("   1. MySQL service is running");
    console.error("   2. Database credentials in .env are correct");
    console.error("   3. Database and table exist");

    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// 执行主函数
main();




