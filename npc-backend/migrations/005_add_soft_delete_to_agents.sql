-- ============================================
-- 迁移脚本：为 agents 表添加软删除字段
-- ============================================
-- 说明：添加 deleted 和 deletedAt 字段用于软删除功能
-- 执行时间：2025-01-XX

-- 添加软删除字段
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE COMMENT '是否已删除（软删除）',
ADD COLUMN IF NOT EXISTS deleted_at BIGINT NULL COMMENT '删除时间戳';

-- 创建索引（提高查询效率）
CREATE INDEX IF NOT EXISTS idx_agents_user_deleted ON agents(user_id, deleted);

