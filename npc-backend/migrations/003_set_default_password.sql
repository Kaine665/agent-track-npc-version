-- ============================================
-- 数据库迁移脚本：为无密码用户设置默认密码
-- ============================================
-- 
-- 【文件职责】
-- 为数据库中密码为空或NULL的用户设置默认密码123456
--
-- 【执行方式】
-- 方式一：使用 MySQL 命令行
--   mysql -u root -p npc_db < migrations/003_set_default_password.sql
--
-- 方式二：使用 MySQL Workbench
--   1. 打开 MySQL Workbench
--   2. 连接到 MySQL 服务器
--   3. 打开此文件
--   4. 执行所有 SQL 语句
--
-- 【重要说明】
-- - 此脚本会更新所有密码为空字符串或NULL的用户
-- - 默认密码设置为：123456
-- - 如果用户已有密码，不会被修改
--
-- @author AI Assistant
-- @created 2025-01-XX
-- ============================================

USE npc_db;

-- 更新密码为空字符串或NULL的用户，设置为默认密码123456
-- 注意：由于password字段是NOT NULL，理论上不会有NULL值，但可能有空字符串
UPDATE users 
SET password = '123456', updated_at = UNIX_TIMESTAMP(NOW()) * 1000
WHERE password IS NULL OR password = '' OR TRIM(password) = '';

-- 显示更新结果
SELECT 
    COUNT(*) AS updated_count,
    'Users with default password set to 123456' AS message
FROM users 
WHERE password = '123456';

