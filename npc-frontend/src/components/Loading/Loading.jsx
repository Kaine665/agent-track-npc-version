/**
 * ============================================
 * 加载组件 (Loading.jsx)
 * ============================================
 *
 * 【功能说明】
 * 基于 Ant Design Spin 封装的通用加载组件，支持全屏加载和内联加载
 *
 * 【Props】
 * - spinning: boolean (是否显示加载状态，默认 true)
 * - tip: string (自定义描述文案)
 * - size: 'small' | 'default' | 'large' (默认 'default')
 * - fullScreen: boolean (是否全屏显示，默认 false)
 * - children: ReactNode (被包裹的元素)
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React from 'react';
import { Spin } from 'antd';
import PropTypes from 'prop-types';

const Loading = ({
  spinning = true,
  tip,
  size = 'default',
  fullScreen = false,
  children,
  ...rest
}) => {
  // 全屏加载样式
  const fullScreenStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999,
  };

  // 如果是全屏加载
  if (fullScreen) {
    if (!spinning) return null;
    
    return (
      <div style={fullScreenStyle}>
        <Spin tip={tip} size="large" {...rest}>
          {/* 全屏模式下不需要 children */}
        </Spin>
      </div>
    );
  }

  // 内联加载（包裹内容）
  return (
    <Spin spinning={spinning} tip={tip} size={size} {...rest}>
      {children}
    </Spin>
  );
};

Loading.propTypes = {
  spinning: PropTypes.bool,
  tip: PropTypes.string,
  size: PropTypes.oneOf(['small', 'default', 'large']),
  fullScreen: PropTypes.bool,
  children: PropTypes.node,
};

export default Loading;

