/**
 * ============================================
 * 用户列表页面 (UserList.jsx)
 * ============================================
 *
 * 【文件职责】
 * 管理后台用户列表页面
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Tag, message, Popconfirm } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api';

function UserList() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.admin.users.getList({
        page,
        pageSize,
        search: search || undefined,
      });
      if (response.success) {
        setUsers(response.data.users);
        setTotal(response.data.total);
      } else {
        message.error(response.error?.message || '加载用户列表失败');
      }
    } catch (error) {
      message.error('加载用户列表发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, status) => {
    try {
      const response = await api.admin.users.updateStatus(userId, status);
      if (response.success) {
        message.success('操作成功');
        loadUsers();
      } else {
        message.error(response.error?.message || '操作失败');
      }
    } catch (error) {
      message.error('操作发生错误');
    }
  };

  const handleDelete = async (userId) => {
    try {
      const response = await api.admin.users.delete(userId);
      if (response.success) {
        message.success('删除成功');
        loadUsers();
      } else {
        message.error(response.error?.message || '删除失败');
      }
    } catch (error) {
      message.error('删除发生错误');
    }
  };

  const columns = [
    {
      title: '用户 ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <Tag>{role}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'disabled' ? 'red' : 'default'}>
          {status === 'active' ? '正常' : status === 'disabled' ? '已禁用' : '已删除'}
        </Tag>
      ),
    },
    {
      title: 'NPC 数',
      dataIndex: 'agentCount',
      key: 'agentCount',
    },
    {
      title: '对话数',
      dataIndex: 'conversationCount',
      key: 'conversationCount',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (timestamp) => new Date(timestamp).toLocaleString(),
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      render: (timestamp) => (timestamp ? new Date(timestamp).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'active' ? (
            <Button size="small" onClick={() => handleStatusChange(record.id, 'disabled')}>
              禁用
            </Button>
          ) : (
            <Button size="small" onClick={() => handleStatusChange(record.id, 'active')}>
              启用
            </Button>
          )}
          <Popconfirm
            title="确定要删除这个用户吗？"
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
        <h1 style={{ fontSize: 24, margin: 0 }}>用户管理</h1>
        <Space>
          <Input
            placeholder="搜索用户 ID 或用户名"
            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadUsers}>
            刷新
          </Button>
        </Space>
      </div>
      <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(0,0,0,0.04)' }}>
        <Table
          columns={columns}
          dataSource={users}
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

export default UserList;

