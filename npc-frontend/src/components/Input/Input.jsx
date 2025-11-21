/**
 * ============================================
 * 输入框组件 (Input.jsx)
 * ============================================
 *
 * 【功能说明】
 * 基于 Ant Design Input 封装的通用输入框组件，支持单行和多行文本
 *
 * 【Props】
 * - type: 'text' | 'textarea' | 'password' (默认 'text')
 * - placeholder: string (占位符)
 * - value: string (输入值)
 * - defaultValue: string (默认值)
 * - onChange: function (值变更事件)
 * - onPressEnter: function (回车事件)
 * - disabled: boolean (是否禁用)
 * - maxLength: number (最大长度)
 * - showCount: boolean (是否显示字数)
 * - rows: number (多行输入框行数，默认 4)
 * - allowClear: boolean (是否允许清空)
 * - prefix: ReactNode (前缀图标/内容)
 * - suffix: ReactNode (后缀图标/内容)
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React from 'react';
import { Input as AntInput } from 'antd';
import PropTypes from 'prop-types';

const { TextArea, Password } = AntInput;

const Input = ({
  type = 'text',
  placeholder,
  value,
  defaultValue,
  onChange,
  onPressEnter,
  disabled = false,
  maxLength,
  showCount = false,
  rows = 4,
  allowClear = false,
  prefix,
  suffix,
  ...rest
}) => {
  // 渲染多行文本框
  if (type === 'textarea') {
    return (
      <TextArea
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onPressEnter={onPressEnter}
        disabled={disabled}
        maxLength={maxLength}
        showCount={showCount}
        rows={rows}
        allowClear={allowClear}
        {...rest}
      />
    );
  }

  // 渲染密码框
  if (type === 'password') {
    return (
      <Password
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        onPressEnter={onPressEnter}
        disabled={disabled}
        maxLength={maxLength}
        allowClear={allowClear}
        prefix={prefix}
        suffix={suffix}
        {...rest}
      />
    );
  }

  // 渲染普通文本框
  return (
    <AntInput
      type={type}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onPressEnter={onPressEnter}
      disabled={disabled}
      maxLength={maxLength}
      showCount={showCount}
      allowClear={allowClear}
      prefix={prefix}
      suffix={suffix}
      {...rest}
    />
  );
};

Input.propTypes = {
  type: PropTypes.oneOf(['text', 'textarea', 'password']),
  placeholder: PropTypes.string,
  value: PropTypes.string,
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  onPressEnter: PropTypes.func,
  disabled: PropTypes.bool,
  maxLength: PropTypes.number,
  showCount: PropTypes.bool,
  rows: PropTypes.number,
  allowClear: PropTypes.bool,
  prefix: PropTypes.node,
  suffix: PropTypes.node,
};

export default Input;

