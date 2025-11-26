/**
 * ============================================
 * 仪表盘页面 (Dashboard.jsx)
 * ============================================
 *
 * 【文件职责】
 * 管理后台仪表盘，显示数据概览
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, RobotOutlined, MessageOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../../api';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.statistics.getDashboard();
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.error?.message || '加载数据失败');
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setError(error.message || '加载数据时发生错误');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#86868b' }}>加载中...</div>;
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: '#ff3b30', marginBottom: 16 }}>
          {error || '数据加载失败'}
        </div>
        <button
          onClick={loadData}
          style={{
            padding: '8px 16px',
            background: '#007aff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.pageHeader}>
        <h1>概览</h1>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic
              title="总用户数"
              value={data.totalUsers}
              prefix={<UserOutlined style={{ color: '#007aff' }} />}
              valueStyle={{ fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic
              title="总 NPC 数"
              value={data.totalAgents}
              prefix={<RobotOutlined style={{ color: '#5856d6' }} />}
              valueStyle={{ fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic
              title="总对话数"
              value={data.totalConversations}
              prefix={<MessageOutlined style={{ color: '#ff2d55' }} />}
              valueStyle={{ fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.statCard} bordered={false}>
            <Statistic
              title="今日活跃"
              value={data.todayActiveUsers}
              prefix={<TeamOutlined style={{ color: '#34c759' }} />}
              valueStyle={{ fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="用户增长趋势" className={styles.chartCard} bordered={false}>
            <div className={styles.placeholder}>
              图表功能待实现
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="NPC 增长趋势" className={styles.chartCard} bordered={false}>
            <div className={styles.placeholder}>
              图表功能待实现
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;

