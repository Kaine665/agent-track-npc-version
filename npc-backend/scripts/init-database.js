/**
 * ============================================
 * 数据库初始化脚本 (init-database.js)
 * ============================================
 *
 * 【文件职责】
 * 自动执行数据库初始化 SQL 脚本，创建数据库和表结构
 *
 * 【主要功能】
 * 1. 读取 SQL 文件
 * 2. 连接数据库
 * 3. 执行 SQL 语句
 * 4. 输出执行结果
 *
 * 【使用方式】
 * node scripts/init-database.js
 *
 * 【重要说明】
 * - 需要先配置 .env 文件中的数据库连接信息
 * - 需要确保 MySQL 服务已启动
 * - 如果数据库已存在，会跳过创建（使用 IF NOT EXISTS）
 *
 * @author AI Assistant
 * @created 2025-11-21
 * @lastModified 2025-11-21
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

/**
 * 数据库配置（不包含 database，因为要先创建数据库）
 */
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  // 注意：这里不指定 database，因为要先创建数据库
};

const dbName = process.env.DB_NAME || "npc_db";

/**
 * 读取 SQL 文件
 *
 * @param {string} filePath - SQL 文件路径
 * @returns {string} SQL 内容
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
 *
 * @param {mysql.Connection} connection - 数据库连接
 * @param {string} sql - SQL 语句
 */
async function executeSQL(connection, sql) {
  // 分割 SQL 语句（按分号分割，但要注意字符串中的分号）
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let useDatabaseExecuted = false;

  for (const statement of statements) {
    if (statement.length > 0) {
      try {
        // 跳过 SELECT 语句（用于提示信息）
        if (statement.toUpperCase().trim().startsWith("SELECT")) {
          continue;
        }
        
        // 如果是 USE 语句，使用 query 而不是 execute（因为 USE 不能参数化）
        if (statement.toUpperCase().trim().startsWith("USE")) {
          await connection.query(statement);
          useDatabaseExecuted = true;
          console.log(`   ✓ Switched to database: ${dbName}`);
        }
        // 其他语句使用 execute
        else {
          await connection.execute(statement);
          
          // 如果是 CREATE TABLE 语句，输出提示
          if (statement.toUpperCase().trim().startsWith("CREATE TABLE")) {
            const tableMatch = statement.match(/CREATE TABLE.*?IF NOT EXISTS.*?`?(\w+)`?/i) ||
                               statement.match(/CREATE TABLE.*?`?(\w+)`?/i);
            if (tableMatch) {
              console.log(`   ✓ Created table: ${tableMatch[1]}`);
            }
          }
          // 如果是 CREATE DATABASE 语句，输出提示
          else if (statement.toUpperCase().trim().startsWith("CREATE DATABASE")) {
            console.log(`   ✓ Created database: ${dbName}`);
          }
        }
      } catch (error) {
        // 忽略 "database already exists" 错误
        if (
          error.code === "ER_DB_CREATE_EXISTS" ||
          (error.message.includes("already exists") && statement.toUpperCase().includes("DATABASE"))
        ) {
          console.log(`   ℹ️  Database already exists, skipping...`);
        }
        // 忽略 "table already exists" 错误
        else if (
          error.code === "ER_TABLE_EXISTS_ERROR" ||
          error.code === "ER_DUP_ENTRY" ||
          (error.message.includes("already exists") && statement.toUpperCase().includes("TABLE"))
        ) {
          const tableMatch = statement.match(/CREATE TABLE.*?IF NOT EXISTS.*?`?(\w+)`?/i) ||
                             statement.match(/CREATE TABLE.*?`?(\w+)`?/i);
          if (tableMatch) {
            console.log(`   ℹ️  Table already exists: ${tableMatch[1]}`);
          }
        } else {
          console.error(`   ❌ Error executing statement:`);
          console.error(`      ${statement.substring(0, 150)}...`);
          console.error(`      Error: ${error.message}`);
          throw error;
        }
      }
    }
  }
  
  // 如果 SQL 中没有 USE 语句，手动切换
  if (!useDatabaseExecuted) {
    await connection.query(`USE ${dbName}`);
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🚀 Starting database initialization...");
  console.log("📋 Database config:", {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbName,
  });

  let connection;

  try {
    // 1. 连接数据库（不指定 database）
    console.log("\n📡 Connecting to MySQL server...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server");

    // 2. 读取 SQL 文件
    const sqlFilePath = path.join(__dirname, "../migrations/001_create_database.sql");
    console.log(`\n📖 Reading SQL file: ${sqlFilePath}`);
    const sql = readSQLFile(sqlFilePath);
    console.log("✅ SQL file read successfully");

    // 3. 执行 SQL
    console.log("\n⚙️  Executing SQL statements...");
    await executeSQL(connection, sql);
    console.log("✅ SQL statements executed successfully");

    // 4. 验证表是否创建成功
    console.log("\n🔍 Verifying tables...");
    await connection.query(`USE ${dbName}`);
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map((t) => Object.values(t)[0]);
    if (tableNames.length > 0) {
      console.log("✅ Tables found:", tableNames.join(", "));
    } else {
      console.log("⚠️  No tables found. Please check SQL execution.");
    }

    console.log("\n🎉 Database initialization completed!");
    console.log(`📊 Database: ${dbName}`);
    console.log(`📋 Tables: ${tables.length} tables created`);

    // 5. 关闭连接
    await connection.end();
    console.log("\n✅ Database connection closed");
  } catch (error) {
    console.error("\n❌ Database initialization failed!");
    console.error("Error:", error.message);
    console.error("\n💡 Please check:");
    console.error("   1. MySQL service is running");
    console.error("   2. Database credentials in .env are correct");
    console.error("   3. User has permission to create database");

    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

// 执行主函数
main();

