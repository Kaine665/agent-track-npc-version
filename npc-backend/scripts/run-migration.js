/**
 * ============================================
 * 数据库迁移脚本 (run-migration.js)
 * ============================================
 *
 * 【文件职责】
 * 执行指定的数据库迁移 SQL 文件
 *
 * 【使用方式】
 * node scripts/run-migration.js <migration-file>
 * 
 * 例如：
 * node scripts/run-migration.js migrations/004_create_feedbacks_table.sql
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

/**
 * 读取 SQL 文件
 */
function readSQLFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`❌ Error reading SQL file: ${filePath}`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * 执行 SQL 语句
 */
async function executeSQL(connection, sql) {
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    if (statement.length > 0) {
      try {
        await connection.execute(statement);
        
        // 输出执行成功的提示
        if (statement.toUpperCase().trim().startsWith("CREATE TABLE")) {
          const tableMatch = statement.match(/CREATE TABLE.*?IF NOT EXISTS.*?`?(\w+)`?/i) ||
                             statement.match(/CREATE TABLE.*?`?(\w+)`?/i);
          if (tableMatch) {
            console.log(`   ✓ Created table: ${tableMatch[1]}`);
          }
        } else if (statement.toUpperCase().trim().startsWith("ALTER TABLE")) {
          console.log(`   ✓ Altered table structure`);
        } else if (statement.toUpperCase().trim().startsWith("CREATE INDEX")) {
          const indexMatch = statement.match(/CREATE INDEX.*?`?(\w+)`?/i);
          if (indexMatch) {
            console.log(`   ✓ Created index: ${indexMatch[1]}`);
          }
        }
      } catch (error) {
        // 忽略 "table already exists" 错误
        if (
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          (error.message.includes("already exists") && statement.toUpperCase().includes("TABLE"))
        ) {
          const tableMatch = statement.match(/CREATE TABLE.*?IF NOT EXISTS.*?`?(\w+)`?/i) ||
                             statement.match(/CREATE TABLE.*?`?(\w+)`?/i);
          if (tableMatch) {
            console.log(`   ℹ️  Table already exists: ${tableMatch[1]}`);
          }
        }
        // 忽略 "column already exists" 错误（ALTER TABLE ADD COLUMN IF NOT EXISTS）
        else if (
          error.code === "ER_DUP_FIELDNAME" ||
          (error.message.includes("Duplicate column name") && statement.toUpperCase().includes("ALTER TABLE"))
        ) {
          console.log(`   ℹ️  Column already exists, skipping...`);
        }
        // 忽略 "index already exists" 错误（CREATE INDEX IF NOT EXISTS）
        else if (
          error.code === "ER_DUP_KEYNAME" ||
          (error.message.includes("Duplicate key name") && statement.toUpperCase().includes("CREATE INDEX"))
        ) {
          console.log(`   ℹ️  Index already exists, skipping...`);
        }
        else {
          console.error(`   ❌ Error executing statement:`);
          console.error(`      ${statement.substring(0, 150)}...`);
          console.error(`      Error: ${error.message}`);
          throw error;
        }
      }
    }
  }
}

/**
 * 主函数
 */
async function main() {
  // 获取迁移文件路径
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error("❌ Please provide a migration file path");
    console.error("Usage: node scripts/run-migration.js <migration-file>");
    console.error("Example: node scripts/run-migration.js migrations/004_create_feedbacks_table.sql");
    process.exit(1);
  }

  // 解析文件路径
  const sqlFilePath = path.isAbsolute(migrationFile)
    ? migrationFile
    : path.join(__dirname, "..", migrationFile);

  console.log("🚀 Starting database migration...");
  console.log("📋 Database config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
  });
  console.log(`📄 Migration file: ${sqlFilePath}`);

  let connection;

  try {
    // 1. 连接数据库
    console.log("\n📡 Connecting to MySQL server...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server");

    // 2. 读取 SQL 文件
    console.log(`\n📖 Reading SQL file...`);
    const sql = readSQLFile(sqlFilePath);
    console.log("✅ SQL file read successfully");

    // 3. 执行 SQL
    console.log("\n⚙️  Executing SQL statements...");
    await executeSQL(connection, sql);
    console.log("✅ SQL statements executed successfully");

    console.log("\n🎉 Database migration completed!");

    // 4. 关闭连接
    await connection.end();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("\n❌ Database migration failed!");
    console.error("Error:", error.message);
    console.error("\n💡 Please check:");
    console.error("   1. MySQL service is running");
    console.error("   2. Database credentials in .env are correct");
    console.error("   3. Database exists");

    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// 执行主函数
main();

