-- 创建反馈表
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

