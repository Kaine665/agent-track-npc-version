/**
 * ============================================
 * 版本更新提示组件 (VersionUpdateModal.jsx)
 * ============================================
 *
 * 【文件职责】
 * 显示版本更新提示弹窗
 *
 * 【主要功能】
 * 1. 显示版本更新信息
 * 2. 用户关闭后标记已读
 * 3. 支持点击外部区域关闭
 */

import React from 'react';
import { Modal, Typography, List, Tag, Button } from 'antd';
import { CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

/**
 * 版本更新提示弹窗组件
 *
 * @param {Object} props
 * @param {boolean} props.open - 是否显示弹窗
 * @param {Object} props.changelog - 更新日志对象
 * @param {string} props.version - 版本号
 * @param {Function} props.onClose - 关闭回调（会标记已读）
 * @param {Function} props.onMarkRead - 标记已读回调
 */
const VersionUpdateModal = ({ open, changelog, version, onClose, onMarkRead }) => {
  const handleClose = () => {
    // 标记已读
    if (onMarkRead) {
      onMarkRead(version);
    }
    // 关闭弹窗
    if (onClose) {
      onClose();
    }
  };

  // 点击遮罩层也关闭
  const handleMaskClick = () => {
    handleClose();
  };

  if (!changelog) {
    return null;
  }

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      maskClosable={true}
      onOk={handleClose}
      okText="知道了"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={600}
      centered
      closeIcon={<CloseOutlined />}
      maskStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div style={{ padding: '8px 0' }}>
        <Title level={3} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
          <span>{changelog.title || `版本 ${version} 更新`}</span>
          <Tag color="blue" style={{ marginLeft: 'auto' }}>v{version}</Tag>
        </Title>

        {changelog.releaseDate && (
          <Paragraph type="secondary" style={{ marginBottom: 16 }}>
            发布日期：{changelog.releaseDate}
          </Paragraph>
        )}

        {changelog.description && (
          <Paragraph style={{ marginBottom: 16 }}>
            {changelog.description}
          </Paragraph>
        )}

        {changelog.features && changelog.features.length > 0 && (
          <div>
            <Title level={5} style={{ marginBottom: 12 }}>更新内容：</Title>
            <List
              size="small"
              dataSource={changelog.features}
              renderItem={(item) => (
                <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <span>{item}</span>
                </List.Item>
              )}
            />
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button type="primary" size="large" onClick={handleClose}>
            知道了
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default VersionUpdateModal;

