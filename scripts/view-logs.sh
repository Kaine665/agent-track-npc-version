#!/bin/bash

# ============================================
# 日志查看脚本
# ============================================
# 说明：快速查看各个服务的日志
# 使用方法：./scripts/view-logs.sh [service]
# 示例：
#   ./scripts/view-logs.sh backend    # 查看后端日志
#   ./scripts/view-logs.sh frontend  # 查看前端日志
#   ./scripts/view-logs.sh nginx     # 查看 Nginx 日志
#   ./scripts/view-logs.sh mysql     # 查看数据库日志
#   ./scripts/view-logs.sh all       # 查看所有服务日志

SERVICE=${1:-backend}

case $SERVICE in
  backend)
    echo "📋 查看后端日志（按 Ctrl+C 退出）..."
    echo "============================================"
    docker logs -f npc-backend
    ;;
  frontend)
    echo "📋 查看前端日志（按 Ctrl+C 退出）..."
    echo "============================================"
    docker logs -f npc-frontend
    ;;
  nginx)
    echo "📋 查看 Nginx 日志（按 Ctrl+C 退出）..."
    echo "============================================"
    docker logs -f npc-nginx
    ;;
  mysql)
    echo "📋 查看数据库日志（按 Ctrl+C 退出）..."
    echo "============================================"
    docker logs -f npc-mysql
    ;;
  all)
    echo "📋 查看所有服务日志（按 Ctrl+C 退出）..."
    echo "============================================"
    docker-compose logs -f
    ;;
  *)
    echo "❌ 未知的服务名称: $SERVICE"
    echo ""
    echo "使用方法: ./scripts/view-logs.sh [service]"
    echo ""
    echo "可用服务:"
    echo "  backend   - 后端服务日志"
    echo "  frontend  - 前端服务日志"
    echo "  nginx     - Nginx 日志"
    echo "  mysql     - 数据库日志"
    echo "  all       - 所有服务日志"
    exit 1
    ;;
esac

