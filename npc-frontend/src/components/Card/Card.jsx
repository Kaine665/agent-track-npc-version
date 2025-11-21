/**
 * ============================================
 * 卡片组件 (Card.jsx)
 * ============================================
 *
 * 【功能说明】
 * 基于 Ant Design Card 封装的通用卡片组件
 *
 * 【Props】
 * - title: ReactNode (卡片标题)
 * - extra: ReactNode (卡片右上角操作区)
 * - bordered: boolean (是否有边框，默认 true)
 * - hoverable: boolean (是否可悬停，默认 false)
 * - loading: boolean (当卡片内容还在加载中时，可以用 loading 展示一个占位)
 * - actions: Array<ReactNode> (卡片底部的操作组)
 * - cover: ReactNode (卡片封面)
 * - onClick: function (点击卡片事件)
 * - children: ReactNode (卡片内容)
 *
 * @author AI Assistant
 * @created 2025-11-21
 */

import React from 'react';
import { Card as AntCard } from 'antd';
import PropTypes from 'prop-types';

const Card = ({
  title,
  extra,
  bordered = true,
  hoverable = false,
  loading = false,
  actions,
  cover,
  onClick,
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <AntCard
      title={title}
      extra={extra}
      bordered={bordered}
      hoverable={hoverable}
      loading={loading}
      actions={actions}
      cover={cover}
      onClick={onClick}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </AntCard>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  extra: PropTypes.node,
  bordered: PropTypes.bool,
  hoverable: PropTypes.bool,
  loading: PropTypes.bool,
  actions: PropTypes.arrayOf(PropTypes.node),
  cover: PropTypes.node,
  onClick: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default Card;

