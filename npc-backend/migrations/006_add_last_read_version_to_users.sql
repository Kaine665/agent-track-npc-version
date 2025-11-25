-- ============================================
-- 数据库迁移：添加用户已读版本字段
-- ============================================
-- 说明：为 users 表添加 last_read_version 字段，用于记录用户已读的最新版本
-- 执行时间：2025-11-25

USE npc_db;

-- 添加 last_read_version 字段
ALTER TABLE users 
ADD COLUMN last_read_version VARCHAR(20) DEFAULT NULL COMMENT '用户已读的最新版本号（如：1.5.0）' 
AFTER updated_at;

-- 添加索引（可选，如果版本查询频繁）
-- CREATE INDEX idx_users_last_read_version ON users(last_read_version);

