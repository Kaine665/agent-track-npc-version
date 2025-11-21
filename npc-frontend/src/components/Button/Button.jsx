/**
 * ============================================
 * 按钮组件 (Button.jsx)
 * ============================================
 *
 * 【功能说明】
 * 基于 Ant Design Button 封装的通用按钮组件
 *
 * 【Props】
 * - type: 'primary' | 'default' | 'dashed' | 'text' | 'link' (默认 'default')
 * - size: 'large' | 'middle' | 'small' (默认 'middle')
 * - loading: boolean (是否加载中)
 * - disabled: boolean (是否禁用)
 * - danger: boolean (是否危险按钮)
 * - block: boolean (是否适应父容器宽度)
 * - icon: ReactNode (图标)
 * - onClick: function (点击事件)
 * - children: ReactNode (按钮内容)
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React from 'react';
import { Button as AntButton } from 'antd';
import PropTypes from 'prop-types';

const Button = ({
  type = 'default',
  size = 'middle',
  loading = false,
  disabled = false,
  danger = false,
  block = false,
  icon = null,
  onClick,
  children,
  ...rest
}) => {
  return (
    <AntButton
      type={type}
      size={size}
      loading={loading}
      disabled={disabled}
      danger={danger}
      block={block}
      icon={icon}
      onClick={onClick}
      {...rest}
    >
      {children}
    </AntButton>
  );
};

Button.propTypes = {
  type: PropTypes.oneOf(['primary', 'default', 'dashed', 'text', 'link']),
  size: PropTypes.oneOf(['large', 'middle', 'small']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  danger: PropTypes.bool,
  block: PropTypes.bool,
  icon: PropTypes.node,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

export default Button;

