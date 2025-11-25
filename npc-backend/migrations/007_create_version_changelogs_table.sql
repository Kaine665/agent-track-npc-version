-- ============================================
-- 数据库迁移：创建版本更新日志表
-- ============================================
-- 说明：创建 version_changelogs 表，用于存储版本更新日志
-- 执行时间：2025-11-25

USE npc_db;

-- 创建版本更新日志表
CREATE TABLE IF NOT EXISTS version_changelogs (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  version VARCHAR(20) NOT NULL UNIQUE COMMENT '版本号（如：1.5.0）',
  title VARCHAR(200) NOT NULL COMMENT '更新标题',
  content TEXT COMMENT '更新内容（Markdown 格式）',
  release_date VARCHAR(20) COMMENT '发布日期（如：2025-11-25）',
  is_active TINYINT(1) DEFAULT 1 COMMENT '是否激活（1=激活，0=禁用）',
  created_at BIGINT NOT NULL COMMENT '创建时间戳（毫秒）',
  updated_at BIGINT NOT NULL COMMENT '更新时间戳（毫秒）',
  INDEX idx_version (version) COMMENT '版本号索引',
  INDEX idx_is_active (is_active) COMMENT '激活状态索引'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='版本更新日志表';

-- 插入初始数据（v1.5.0）
INSERT INTO version_changelogs (version, title, content, release_date, is_active, created_at, updated_at)
VALUES (
  '1.5.0',
  'v1.5.0 版本更新',
  '## 更新内容

本次更新带来了更好的用户体验和功能优化。

### ✨ 新增功能
- 新增版本更新提示功能
- 优化用户登录体验（老用户自动登录）

### 🐛 问题修复
- 修复若干已知问题

### ⚡ 性能优化
- 性能优化和体验改进',
  '2025-11-25',
  1,
  UNIX_TIMESTAMP() * 1000,
  UNIX_TIMESTAMP() * 1000
) ON DUPLICATE KEY UPDATE updated_at = UNIX_TIMESTAMP() * 1000;

