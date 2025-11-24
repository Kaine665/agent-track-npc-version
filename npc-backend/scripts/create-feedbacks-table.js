/**
 * 直接创建 feedbacks 表
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

const createTableSQL = `
CREATE TABLE IF NOT EXISTS feedbacks (
  id VARCHAR(255) PRIMARY KEY COMMENT '反馈ID',
  user_id VARCHAR(255) NOT NULL COMMENT '用户ID',
  type VARCHAR(50) NOT NULL COMMENT '反馈类型：bug, feature, question',
  title VARCHAR(500) NOT NULL COMMENT '反馈标题',
  content TEXT NOT NULL COMMENT '反馈内容',
  status VARCHAR(50) DEFAULT 'pending' COMMENT '状态：pending, resolved, closed',
  user_agent TEXT COMMENT '用户环境信息（JSON）',
  screenshots TEXT COMMENT '截图URL（JSON数组）',
  created_at BIGINT NOT NULL COMMENT '创建时间',
  updated_at BIGINT COMMENT '更新时间',
  resolved_at BIGINT COMMENT '解决时间',
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户反馈表';
`;

async function createTable() {
  let connection;
  try {
    console.log("📡 Connecting to MySQL server...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to MySQL server");

    console.log("\n⚙️  Creating feedbacks table...");
    await connection.execute(createTableSQL);
    console.log("✅ feedbacks table created successfully");

    // 验证表是否存在
    const [tables] = await connection.query("SHOW TABLES LIKE 'feedbacks'");
    if (tables.length > 0) {
      console.log("\n✅ Verification: feedbacks table exists");
      
      // 显示表结构
      const [columns] = await connection.query("DESCRIBE feedbacks");
      console.log("\n📋 Table structure:");
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(not null)'}`);
      });
    }

    await connection.end();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createTable();

