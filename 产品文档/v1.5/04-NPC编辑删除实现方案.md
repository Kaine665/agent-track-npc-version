# NPC 编辑和删除实现方案

**文档版本**：v1.0  
**最后更新**：2025-01-XX  
**相关文档**：[V1.5 版本规划](./README.md)

---

## 功能概述

允许用户编辑和删除已创建的 NPC，提升数据管理能力。

---

## 技术方案

### 实现步骤

#### 1. 更新 AgentService

**文件**：`npc-backend/services/AgentService.js`

```javascript
/**
 * 更新 NPC
 *
 * @param {string} agentId - NPC ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {Object} updateData - 更新数据
 * @returns {Promise<Object>} 更新后的 NPC 信息
 */
async function updateAgent(agentId, userId, updateData) {
  // 1. 查询 NPC 是否存在
  const agent = await agentRepository.findById(agentId);
  
  if (!agent) {
    const error = new Error('NPC 不存在');
    error.code = 'AGENT_NOT_FOUND';
    throw error;
  }

  // 2. 验证权限（只能修改自己的 NPC）
  if (agent.userId !== userId) {
    const error = new Error('无权修改此 NPC');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }

  // 3. 验证更新数据
  const allowedFields = ['name', 'description', 'systemPrompt', 'model', 'provider'];
  const filteredData = {};
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filteredData[field] = updateData[field];
    }
  }

  // 4. 更新 NPC
  const updatedAgent = await agentRepository.update(agentId, {
    ...filteredData,
    updatedAt: Date.now(),
  });

  return updatedAgent;
}

/**
 * 删除 NPC
 *
 * @param {string} agentId - NPC ID
 * @param {string} userId - 用户 ID（用于权限验证）
 * @param {Object} options - 删除选项
 * @param {boolean} options.hardDelete - 是否硬删除（默认 false，软删除）
 * @returns {Promise<Object>} 删除结果
 */
async function deleteAgent(agentId, userId, options = {}) {
  const { hardDelete = false } = options;

  // 1. 查询 NPC 是否存在
  const agent = await agentRepository.findById(agentId);
  
  if (!agent) {
    const error = new Error('NPC 不存在');
    error.code = 'AGENT_NOT_FOUND';
    throw error;
  }

  // 2. 验证权限（只能删除自己的 NPC）
  if (agent.userId !== userId) {
    const error = new Error('无权删除此 NPC');
    error.code = 'PERMISSION_DENIED';
    throw error;
  }

  if (hardDelete) {
    // 硬删除：物理删除 NPC 和相关数据
    // 注意：这会删除所有关联的对话历史
    
    // 3.1 删除关联的对话历史（可选，根据业务需求）
    // await eventRepository.deleteByAgentId(agentId);
    // await sessionRepository.deleteByAgentId(agentId);

    // 3.2 删除 NPC
    await agentRepository.delete(agentId);
    
    return {
      success: true,
      message: 'NPC 已永久删除',
      deletedAt: Date.now(),
    };
  } else {
    // 软删除：标记为已删除，不物理删除数据
    await agentRepository.update(agentId, {
      deleted: true,
      deletedAt: Date.now(),
    });

    return {
      success: true,
      message: 'NPC 已删除（可在回收站恢复）',
      deletedAt: Date.now(),
    };
  }
}
```

#### 2. 更新路由

**文件**：`npc-backend/routes/agents.js`

```javascript
const { authenticate } = require('../middleware/auth');

// 所有接口都需要认证
router.use(authenticate);

/**
 * 更新 NPC
 * PUT /api/v1/agents/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId; // 从认证中间件获取
    const updateData = req.body;

    // 验证必填字段
    if (!id) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'NPC ID is required');
    }

    const updatedAgent = await agentService.updateAgent(id, userId, updateData);
    sendSuccessResponse(res, 200, updatedAgent);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = 
      code === 'AGENT_NOT_FOUND' ? 404 :
      code === 'PERMISSION_DENIED' ? 403 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});

/**
 * 删除 NPC
 * DELETE /api/v1/agents/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { hardDelete } = req.query; // 通过查询参数控制删除方式

    if (!id) {
      return sendErrorResponse(res, 400, 'VALIDATION_ERROR', 'NPC ID is required');
    }

    const result = await agentService.deleteAgent(id, userId, {
      hardDelete: hardDelete === 'true', // 字符串转布尔值
    });

    sendSuccessResponse(res, 200, result);
  } catch (error) {
    const code = error.code || 'SYSTEM_ERROR';
    const status = 
      code === 'AGENT_NOT_FOUND' ? 404 :
      code === 'PERMISSION_DENIED' ? 403 : 500;
    sendErrorResponse(res, status, code, error.message);
  }
});
```

#### 3. 更新数据模型（软删除支持）

**文件**：`npc-backend/migrations/add_soft_delete_to_agents.sql`

```sql
-- 为 agents 表添加软删除字段
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE COMMENT '是否已删除（软删除）',
ADD COLUMN IF NOT EXISTS deletedAt BIGINT NULL COMMENT '删除时间戳';

-- 创建索引（提高查询效率）
CREATE INDEX IF NOT EXISTS idx_agents_user_deleted ON agents(userId, deleted);
```

#### 4. 更新 Repository（支持软删除查询）

**文件**：`npc-backend/repositories/AgentRepository.js`

```javascript
/**
 * 查询用户的 NPC 列表（排除已删除的）
 *
 * @param {string} userId - 用户 ID
 * @returns {Promise<Array>} NPC 列表
 */
async function findByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT * FROM agents 
     WHERE userId = ? AND (deleted IS NULL OR deleted = FALSE)
     ORDER BY createdAt DESC`,
    [userId]
  );
  return rows;
}

/**
 * 查询用户的 NPC（包括已删除的，用于回收站）
 *
 * @param {string} userId - 用户 ID
 * @param {boolean} includeDeleted - 是否包含已删除的
 * @returns {Promise<Array>} NPC 列表
 */
async function findByUserIdWithDeleted(userId, includeDeleted = false) {
  let sql = `SELECT * FROM agents WHERE userId = ?`;
  const params = [userId];

  if (!includeDeleted) {
    sql += ` AND (deleted IS NULL OR deleted = FALSE)`;
  }

  sql += ` ORDER BY createdAt DESC`;

  const [rows] = await pool.execute(sql, params);
  return rows;
}
```

---

## 前端适配

### 1. 更新 API 适配层

**文件**：`npc-frontend/src/api/adapter.js`

```javascript
agents: {
  // ... 现有方法
  
  /**
   * 更新 NPC
   */
  update: async (agentId, data) => {
    return await api.put(`/agents/${agentId}`, data);
  },

  /**
   * 删除 NPC
   */
  delete: async (agentId, hardDelete = false) => {
    return await api.delete(`/agents/${agentId}?hardDelete=${hardDelete}`);
  },
}
```

### 2. NPC 编辑组件

**文件**：`npc-frontend/src/components/AgentEditModal/AgentEditModal.jsx`

```javascript
import React, { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import api from '../../api';

const AgentEditModal = ({ agent, visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await api.agents.update(agent.id, values);
      if (response.success) {
        message.success('NPC 更新成功');
        onSuccess();
        onCancel();
      }
    } catch (error) {
      message.error(error.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="编辑 NPC"
      visible={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} initialValues={agent} layout="vertical">
        <Form.Item name="name" label="NPC 名称" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item name="systemPrompt" label="系统提示词">
          <Input.TextArea rows={6} />
        </Form.Item>
        {/* 其他字段... */}
      </Form>
    </Modal>
  );
};
```

### 3. NPC 删除确认

**文件**：`npc-frontend/src/components/AgentList/AgentList.jsx`

```javascript
import { Modal, message } from 'antd';
import api from '../../api';

const handleDelete = (agent) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除 NPC "${agent.name}" 吗？删除后相关对话历史将保留。`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const response = await api.agents.delete(agent.id, false); // 软删除
        if (response.success) {
          message.success('NPC 已删除');
          // 刷新列表
          loadAgents();
        }
      } catch (error) {
        message.error(error.message || '删除失败');
      }
    },
  });
};
```

---

## 测试要点

1. **权限验证**：验证用户只能编辑/删除自己的 NPC
2. **更新功能**：验证 NPC 信息是否正确更新
3. **软删除**：验证软删除后 NPC 是否从列表中消失
4. **数据完整性**：验证删除后对话历史是否保留
5. **错误处理**：验证不存在的 NPC、无权限等情况

---

## 注意事项

1. **删除策略**：
   - 默认使用软删除（推荐），数据可恢复
   - 硬删除需要谨慎，会永久删除数据

2. **关联数据**：
   - 删除 NPC 时，对话历史可以保留（用于数据分析）
   - 或者提供选项让用户选择是否删除对话历史

3. **回收站功能**（可选）：
   - 可以实现回收站功能，允许用户恢复已删除的 NPC
   - 需要添加"恢复"接口

4. **批量删除**（可选）：
   - 可以添加批量删除功能
   - 需要前端支持多选

