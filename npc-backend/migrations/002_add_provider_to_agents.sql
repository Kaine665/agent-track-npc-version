-- ============================================
-- 迁移脚本：为 agents 表添加 provider 字段
-- ============================================
-- 说明：添加 provider 字段用于存储 LLM 提供商信息
-- 执行时间：2025-11-21

-- 添加 provider 字段
ALTER TABLE agents 
ADD COLUMN provider VARCHAR(50) COMMENT 'LLM 提供商（openai/deepseek/openrouter）' 
AFTER model;

-- 为已有数据设置默认值（如果有数据的话）
-- 注意：这里设置为 null，实际使用时需要从 model 推断或手动设置
UPDATE agents SET provider = NULL WHERE provider IS NULL;

