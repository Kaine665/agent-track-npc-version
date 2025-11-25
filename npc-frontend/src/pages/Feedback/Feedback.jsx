/**
 * ============================================
 * 用户反馈页面 (Feedback.jsx)
 * ============================================
 *
 * 【功能说明】
 * 提供用户反馈表单，允许用户提交 Bug、功能建议、使用问题等反馈
 *
 * 【工作流程】
 * 1. 用户填写反馈表单（类型、标题、内容）
 * 2. 提交反馈（前端暂存，等待后端API实现）
 * 3. 显示提交成功提示
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Button, 
  Form, 
  Input, 
  Select, 
  message,
  Space,
  Drawer,
  List,
  Tag,
  Empty,
  Spin,
  Card
} from 'antd';
import { ArrowLeftOutlined, MessageOutlined, HistoryOutlined, BugOutlined, BulbOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import styles from './Feedback.module.css';

const { Header, Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // 获取反馈列表
  const loadFeedbacks = async () => {
    if (!user) {
      return;
    }

    try {
      setLoadingFeedbacks(true);
      const response = await api.feedbacks.list({
        userId: user.id,
        page: 1,
        pageSize: 50,
      });

      if (response.success) {
        setFeedbacks(response.data || []);
      } else {
        message.error(response.error?.message || '加载反馈列表失败');
      }
    } catch (error) {
      console.error('加载反馈列表失败:', error);
      message.error('加载反馈列表失败');
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  // 打开历史反馈抽屉
  const handleOpenHistory = () => {
    setHistoryDrawerVisible(true);
    loadFeedbacks();
  };

  // 关闭历史反馈抽屉
  const handleCloseHistory = () => {
    setHistoryDrawerVisible(false);
  };

  // 获取反馈类型标签
  const getTypeTag = (type) => {
    const typeMap = {
      bug: { color: 'red', icon: <BugOutlined />, text: 'Bug 报告' },
      feature: { color: 'blue', icon: <BulbOutlined />, text: '功能建议' },
      question: { color: 'green', icon: <QuestionCircleOutlined />, text: '使用问题' },
    };
    const config = typeMap[type] || { color: 'default', icon: null, text: type };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理' },
      resolved: { color: 'green', text: '已解决' },
      closed: { color: 'default', text: '已关闭' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 提交反馈
  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      if (!user) {
        message.warning('请先登录');
        return;
      }

      // 调用API提交反馈
      const response = await api.feedbacks.submit({
        userId: user.id,
        type: values.type,
        title: values.title,
        content: values.content,
      });

      if (response.success) {
        message.success('反馈提交成功！感谢您的反馈，我们会认真处理。');
        form.resetFields();
        // 如果历史反馈抽屉是打开的，刷新列表
        if (historyDrawerVisible) {
          loadFeedbacks();
        }
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        message.error(response.error?.message || '提交失败，请稍后重试');
      }
    } catch (error) {
      console.error('提交反馈失败:', error);
      message.error('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        background: '#fff', 
        padding: '0 16px', 
        display: 'flex', 
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        zIndex: 1,
        height: 64
      }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ marginRight: 16 }}
          >
            返回
          </Button>
          <MessageOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 8 }} />
          <Title level={3} style={{ margin: 0, fontSize: 18, flex: 1 }}>
            用户反馈
          </Title>
          {user && (
            <Button
              type="text"
              icon={<HistoryOutlined />}
              onClick={handleOpenHistory}
              style={{ color: '#595959' }}
            >
              查看历史反馈
            </Button>
          )}
        </div>
      </Header>

      {/* 内容区域 */}
      <Content style={{ padding: '24px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <div className={styles.feedbackContainer}>
          <div className={styles.feedbackHeader}>
            <p className={styles.feedbackDescription}>
              我们非常重视您的反馈！请告诉我们您遇到的问题、功能建议或使用疑问。
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className={styles.feedbackForm}
            initialValues={{
              type: 'bug'
            }}
          >
            <Form.Item
              label="反馈类型"
              name="type"
              rules={[{ required: true, message: '请选择反馈类型' }]}
            >
              <Select placeholder="请选择反馈类型" size="large">
                <Option value="bug">Bug 报告</Option>
                <Option value="feature">功能建议</Option>
                <Option value="question">使用问题</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="反馈标题"
              name="title"
              rules={[
                { required: true, message: '请输入反馈标题' },
                { max: 100, message: '标题不能超过100个字符' }
              ]}
            >
              <Input 
                placeholder="请简要描述您的反馈（例如：登录按钮点击无响应）" 
                size="large"
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item
              label="反馈内容"
              name="content"
              rules={[
                { required: true, message: '请输入反馈内容' },
                { min: 10, message: '反馈内容至少10个字符' },
                { max: 2000, message: '反馈内容不能超过2000个字符' }
              ]}
            >
              <TextArea
                placeholder="请详细描述您的问题或建议，包括：问题出现的步骤、预期结果、实际结果等"
                rows={8}
                size="large"
                maxLength={2000}
                showCount
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  size="large"
                  loading={submitting}
                  className={styles.submitButton}
                >
                  提交反馈
                </Button>
                <Button 
                  size="large"
                  onClick={() => form.resetFields()}
                  disabled={submitting}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>

          {user && (
            <div className={styles.userInfo}>
              <p className={styles.userInfoText}>
                当前用户：{user.username}（ID: {user.id}）
              </p>
            </div>
          )}
        </div>
      </Content>

      {/* 历史反馈抽屉 */}
      <Drawer
        title="历史反馈"
        placement="right"
        width={600}
        open={historyDrawerVisible}
        onClose={handleCloseHistory}
        destroyOnClose
      >
        {loadingFeedbacks ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : feedbacks.length === 0 ? (
          <Empty description="暂无反馈记录" />
        ) : (
          <List
            dataSource={feedbacks}
            renderItem={(feedback) => (
              <List.Item style={{ padding: '12px 0' }}>
                <Card
                  style={{ 
                    width: '100%', 
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #f0f0f0',
                    backgroundColor: '#fff'
                  }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          {getTypeTag(feedback.type)}
                          {getStatusTag(feedback.status)}
                        </div>
                        <Typography.Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                          {feedback.title}
                        </Typography.Text>
                      </div>
                    </div>
                    <Typography.Paragraph
                      ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                      style={{ color: '#666', marginBottom: 12, marginTop: 0 }}
                    >
                      {feedback.content}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {formatTime(feedback.createdAt)}
                    </Typography.Text>
                  </div>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </Layout>
  );
};

export default Feedback;

