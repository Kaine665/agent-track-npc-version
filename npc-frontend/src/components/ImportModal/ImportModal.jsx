/**
 * ============================================
 * 导入模态框组件 (ImportModal.jsx)
 * ============================================
 *
 * 【功能说明】
 * 提供文本输入、解析、预览、确认导入的完整流程
 *
 * 【主要功能】
 * 1. 文本输入区域（支持粘贴）
 * 2. 解析按钮
 * 3. 集成 ImportPreview 组件
 * 4. 确认导入按钮
 * 5. 错误提示和加载状态
 *
 * 【状态说明】
 * 当前版本：功能已实现，但未在前端UI中启用
 * 未来计划：将通过AI实现更智能的解析功能
 * 相关记录：实现问题记录.md - PROB-022
 *
 * @author AI Assistant
 * @created 2025-01-XX
 */

import React, { useState } from 'react';
import { Modal, Input, Button, Steps, message, Alert, Space } from 'antd';
import { FileTextOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ImportPreview from '../ImportPreview/ImportPreview';
import { parseConversation, validateParseResult } from '../../utils/import/conversationParser';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import styles from './ImportModal.module.css';

const { TextArea } = Input;
const { Step } = Steps;

const ImportModal = ({ open, onCancel, onSuccess }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  // 重置状态
  const handleReset = () => {
    setCurrentStep(0);
    setInputText('');
    setParsedData(null);
    setPreviewData(null);
    setError(null);
  };

  // 关闭模态框
  const handleClose = () => {
    handleReset();
    if (onCancel) {
      onCancel();
    }
  };

  // 解析文本
  const handleParse = () => {
    if (!inputText || inputText.trim().length === 0) {
      message.warning('请输入要导入的对话文本');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = parseConversation(inputText);
      
      // 验证解析结果
      const validation = validateParseResult(result);
      
      if (!validation.valid) {
        setError(`解析失败：${validation.errors.join('；')}`);
        setParsedData(result);
        setCurrentStep(1); // 仍然显示预览，让用户手动编辑
        message.warning('解析完成，但存在一些问题，请检查并编辑');
      } else {
        setParsedData(result);
        setPreviewData({
          messages: result.messages,
          agentName: result.agentName
        });
        setCurrentStep(1);
        message.success('解析成功！请检查预览结果');
      }
    } catch (err) {
      console.error('解析失败:', err);
      setError(`解析失败：${err.message}`);
      message.error('解析失败，请检查文本格式');
    } finally {
      setLoading(false);
    }
  };

  // 预览数据变化
  const handlePreviewDataChange = (data) => {
    setPreviewData(data);
  };

  // Agent名称变化
  const handleAgentNameChange = (name) => {
    if (previewData) {
      setPreviewData({
        ...previewData,
        agentName: name
      });
    }
  };

  // 确认导入
  const handleImport = async () => {
    if (!user) {
      message.error('请先登录');
      return;
    }

    if (!previewData || !previewData.messages || previewData.messages.length === 0) {
      message.warning('没有可导入的消息');
      return;
    }

    if (!previewData.agentName || previewData.agentName.trim().length === 0) {
      message.warning('请输入Agent名称');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const response = await api.import.conversations({
        userId: user.id,
        agentName: previewData.agentName.trim(),
        messages: previewData.messages.map(msg => ({
          role: msg.role,
          content: msg.content.trim(),
          timestamp: msg.timestamp || null
        }))
      });

      if (response.success) {
        message.success(`导入成功！已创建 ${previewData.messages.length} 条消息`);
        handleReset();
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new Error(response.error?.message || '导入失败');
      }
    } catch (err) {
      console.error('导入失败:', err);
      setError(`导入失败：${err.message}`);
      message.error(`导入失败：${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // 步骤配置
  const steps = [
    {
      title: '输入文本',
      icon: <FileTextOutlined />,
      content: (
        <div className={styles.stepContent}>
          <div className={styles.inputSection}>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请粘贴从其他平台复制的对话记录..."
              rows={12}
              className={styles.textArea}
            />
          </div>
          <div className={styles.buttonSection}>
            <Button
              type="primary"
              onClick={handleParse}
              loading={loading}
              disabled={!inputText || inputText.trim().length === 0}
            >
              解析文本
            </Button>
          </div>
          {error && currentStep === 0 && (
            <Alert
              message="解析错误"
              description={error}
              type="error"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      ),
    },
    {
      title: '预览确认',
      icon: <EyeOutlined />,
      content: (
        <div className={styles.stepContent}>
          {parsedData && (
            <ImportPreview
              parsedData={parsedData}
              onDataChange={handlePreviewDataChange}
              onAgentNameChange={handleAgentNameChange}
            />
          )}
          {error && (
            <Alert
              message="解析警告"
              description={error}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </div>
      ),
    },
    {
      title: '导入完成',
      icon: <CheckCircleOutlined />,
      content: (
        <div className={styles.stepContent}>
          <Alert
            message="导入成功"
            description="对话已成功导入，可以在Agent列表中查看。"
            type="success"
            showIcon
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="导入对话"
      open={open}
      onCancel={handleClose}
      width={800}
      footer={null}
      destroyOnClose
    >
      <div className={styles.modalContent}>
        <Steps current={currentStep} className={styles.steps}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <div className={styles.stepContentWrapper}>
          {steps[currentStep].content}
        </div>

        <div className={styles.footer}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={() => setCurrentStep(currentStep - 1)}>
                上一步
              </Button>
            )}
            {currentStep === 0 && (
              <Button onClick={handleClose}>取消</Button>
            )}
            {currentStep === 1 && (
              <>
                <Button onClick={handleClose}>取消</Button>
                <Button
                  type="primary"
                  onClick={handleImport}
                  loading={importing}
                  disabled={!previewData || !previewData.messages || previewData.messages.length === 0}
                >
                  确认导入
                </Button>
              </>
            )}
            {currentStep === 2 && (
              <Button type="primary" onClick={handleClose}>
                完成
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default ImportModal;

