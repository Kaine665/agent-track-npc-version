-- ============================================
-- 数据库初始化脚本
-- ============================================
-- 
-- 【文件职责】
-- 创建项目所需的数据库和表结构
--
-- 【执行方式】
-- 方式一：使用 MySQL 命令行
--   mysql -u root -p < migrations/001_create_database.sql
--
-- 方式二：使用 MySQL Workbench
--   1. 打开 MySQL Workbench
--   2. 连接到 MySQL 服务器
--   3. 打开此文件
--   4. 执行所有 SQL 语句
--
-- 【重要说明】
-- - 执行前请确保 MySQL 服务已启动
-- - 请确保 root 用户有创建数据库的权限
-- - 如果数据库已存在，会报错（可以忽略或先删除）
--
-- @author AI Assistant
-- @created 2025-11-21
-- ============================================

-- 创建数据库（如果不存在）
-- 注意：如果数据库已存在，会报错，可以忽略或手动删除后重新执行
CREATE DATABASE IF NOT EXISTS npc_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE npc_db;

-- ============================================
-- 创建 users 表（用户表）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY COMMENT '用户 ID（唯一标识符）',
  username VARCHAR(50) NOT NULL COMMENT '用户昵称（显示名称）',
  password VARCHAR(255) NOT NULL COMMENT '密码（V1 版本明文存储，V1.5 改为哈希）',
  created_at BIGINT NOT NULL COMMENT '创建时间戳（毫秒）',
  updated_at BIGINT NOT NULL COMMENT '更新时间戳（毫秒）',
  UNIQUE INDEX idx_users_username (username) COMMENT '用户名唯一索引',
  INDEX idx_users_created_at (created_at) COMMENT '创建时间索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 创建 agents 表（NPC 表）
-- ============================================
CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(100) PRIMARY KEY COMMENT 'NPC ID（唯一标识符）',
  user_id VARCHAR(100) NOT NULL COMMENT '用户 ID（创建该 NPC 的用户）',
  name VARCHAR(50) NOT NULL COMMENT 'NPC 名称',
  type ENUM('general', 'special') NOT NULL COMMENT 'NPC 类型：general（通用）/ special（特定）',
  model VARCHAR(50) NOT NULL COMMENT 'LLM 模型名称',
  system_prompt TEXT NOT NULL COMMENT 'NPC 人设描述（system prompt）',
  avatar_url VARCHAR(500) COMMENT '头像 URL（可选）',
  created_at BIGINT NOT NULL COMMENT '创建时间戳（毫秒）',
  updated_at BIGINT NOT NULL COMMENT '更新时间戳（毫秒）',
  INDEX idx_agents_user_id (user_id) COMMENT '用户 ID 索引（查询用户的 NPC 列表）',
  INDEX idx_agents_created_at (created_at) COMMENT '创建时间索引（排序）',
  INDEX idx_agents_user_created (user_id, created_at DESC) COMMENT '用户+创建时间复合索引（查询用户列表并排序）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NPC 表';

-- ============================================
-- 创建 events 表（事件表）
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(100) PRIMARY KEY COMMENT '事件 ID（唯一标识符）',
  session_id VARCHAR(200) NOT NULL COMMENT '会话 ID（user_id_agent_id）',
  user_id VARCHAR(100) NOT NULL COMMENT '用户 ID',
  agent_id VARCHAR(100) NOT NULL COMMENT 'NPC ID',
  from_type ENUM('user', 'agent') NOT NULL COMMENT '发送者类型：user（用户）/ agent（NPC）',
  from_id VARCHAR(100) NOT NULL COMMENT '发送者 ID（user_id 或 agent_id）',
  to_type ENUM('user', 'agent') NOT NULL COMMENT '接收者类型：user（用户）/ agent（NPC）',
  to_id VARCHAR(100) NOT NULL COMMENT '接收者 ID（user_id 或 agent_id）',
  content TEXT NOT NULL COMMENT '消息内容',
  timestamp BIGINT NOT NULL COMMENT '时间戳（毫秒）',
  INDEX idx_events_session_id (session_id) COMMENT '会话 ID 索引（查询会话的所有事件）',
  INDEX idx_events_timestamp (timestamp) COMMENT '时间戳索引（排序和范围查询）',
  INDEX idx_events_session_timestamp (session_id, timestamp ASC) COMMENT '会话+时间戳复合索引（查询会话事件并排序）',
  INDEX idx_events_user_id (user_id) COMMENT '用户 ID 索引（查询用户的所有事件）',
  INDEX idx_events_agent_id (agent_id) COMMENT 'NPC ID 索引（查询 NPC 的所有事件）',
  INDEX idx_events_user_agent_timestamp (user_id, agent_id, timestamp ASC) COMMENT '用户+NPC+时间戳复合索引（查询用户与 NPC 的事件并排序）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='事件表（对话记录）';

-- ============================================
-- 创建 sessions 表（会话表）
-- ============================================
-- 注意：虽然当前使用内存存储 Session，但为了未来迁移，也创建表结构
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(200) PRIMARY KEY COMMENT '会话 ID（唯一标识符）',
  participants TEXT NOT NULL COMMENT '参与者列表（JSON 格式）',
  created_at BIGINT NOT NULL COMMENT '创建时间戳（毫秒）',
  last_active_at BIGINT NOT NULL COMMENT '最后活动时间戳（毫秒）',
  INDEX idx_sessions_last_active (last_active_at DESC) COMMENT '最后活动时间索引（排序）'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- ============================================
-- 初始化完成提示
-- ============================================
SELECT 'Database initialization completed!' AS message;
SELECT 'Tables created: users, agents, events, sessions' AS tables;

