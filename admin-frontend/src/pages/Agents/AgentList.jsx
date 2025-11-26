/**
 * ============================================
 * NPC 列表页面 (AgentList.jsx)
 * ============================================
 *
 * 【文件职责】
 * 管理后台 NPC 列表页面
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Tag, message, Popconfirm } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api';

function AgentList() {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAgents();
  }, [page, pageSize, search]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await api.admin.agents.getList({
        page,
        pageSize,
        search: search || undefined,
      });
      if (response.success) {
        setAgents(response.data.agents);
        setTotal(response.data.total);
      } else {
        message.error(response.error?.message || '加载 NPC 列表失败');
      }
    } catch (error) {
      message.error('加载 NPC 列表发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agentId) => {
    try {
      const response = await api.admin.agents.delete(agentId);
      if (response.success) {
        message.success('删除成功');
        loadAgents();
      } else {
        message.error(response.error?.message || '删除失败');
      }
    } catch (error) {
      message.error('删除发生错误');
    }
  };

  const columns = [
    {
      title: 'NPC ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建者',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag>{type === 'general' ? '通用' : '特殊'}</Tag>,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '已删除'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp) => new Date(timestamp).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="确定要删除这个 NPC 吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>NPC 管理</h1>
        <Space>
          <Input
            placeholder="搜索 NPC 名称或创建者"
            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadAgents}>
            刷新
          </Button>
        </Space>
      </div>
      <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <Table
          columns={columns}
          dataSource={agents}
          loading={loading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize);
            },
          }}
        />
      </div>
    </div>
  );
}

export default AgentList;

