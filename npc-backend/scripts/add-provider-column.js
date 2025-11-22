/**
 * 添加 provider 字段到 agents 表
 */
require("dotenv").config();
const mysql = require("mysql2/promise");

async function addProviderColumn() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "npc_db",
    });

    try {
      await conn.execute(
        "ALTER TABLE agents ADD COLUMN provider VARCHAR(50) COMMENT 'LLM provider' AFTER model"
      );
      console.log("✅ Provider column added successfully");
    } catch (error) {
      if (error.message.includes("Duplicate column")) {
        console.log("✅ Provider column already exists");
      } else {
        throw error;
      }
    }

    await conn.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

addProviderColumn();

