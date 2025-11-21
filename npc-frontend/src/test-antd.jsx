/**
 * ============================================
 * Ant Design 测试组件 (test-antd.jsx)
 * ============================================
 *
 * 【文件职责】
 * 测试 Ant Design 组件库是否正常安装和配置
 *
 * 【主要功能】
 * 1. 导入 Ant Design 组件
 * 2. 测试基础组件使用
 * 3. 验证样式是否正常加载
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React from 'react';
import { Button, Card, Space } from 'antd';

/**
 * Ant Design 测试组件
 *
 * 【功能说明】
 * 测试 Ant Design 组件是否正常工作
 *
 * @returns {JSX.Element} 测试组件
 */
function TestAntd() {
  return (
    <div style={{ padding: '24px' }}>
      <Card title="Ant Design 测试" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h3>按钮组件测试</h3>
            <Space>
              <Button type="primary">主要按钮</Button>
              <Button>默认按钮</Button>
              <Button type="dashed">虚线按钮</Button>
              <Button danger>危险按钮</Button>
            </Space>
          </div>
          
          <div>
            <h3>按钮状态测试</h3>
            <Space>
              <Button loading>加载中</Button>
              <Button disabled>禁用</Button>
            </Space>
          </div>
          
          <div>
            <p>✅ Ant Design 组件库已成功安装并配置！</p>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default TestAntd;

