/**
 * 检查 feedbacks 表是否存在
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "npc_db",
};

async function checkTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // 检查表是否存在
    const [tables] = await connection.query("SHOW TABLES LIKE 'feedbacks'");
    
    if (tables.length > 0) {
      console.log("✅ feedbacks table exists");
      
      // 显示表结构
      const [columns] = await connection.query("DESCRIBE feedbacks");
      console.log("\n📋 Table structure:");
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    } else {
      console.log("❌ feedbacks table not found");
    }
    
    await connection.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

checkTable();

