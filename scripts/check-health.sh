#!/bin/bash

# ============================================
# 健康检查脚本
# ============================================
# 说明：检查所有服务的健康状态
# 使用方法：./scripts/check-health.sh

echo "🔍 检查服务健康状态..."
echo "============================================"
echo ""

# 检查容器状态
echo "📦 容器状态："
echo "--------------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep npc-
echo ""

# 检查后端健康
echo "🔌 后端健康检查："
echo "--------------------------------------------"
BACKEND_HEALTH=$(curl -s http://localhost:8000/api/v1/health 2>/dev/null)
if [ $? -eq 0 ]; then
  echo "✅ 后端服务正常"
  echo "   响应: $BACKEND_HEALTH"
else
  echo "❌ 后端服务无法访问"
fi
echo ""

# 检查前端健康
echo "🌐 前端健康检查："
echo "--------------------------------------------"
FRONTEND_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null)
if [ $? -eq 0 ]; then
  echo "✅ 前端服务正常"
  echo "   响应: $FRONTEND_HEALTH"
else
  echo "❌ 前端服务无法访问"
fi
echo ""

# 检查数据库连接
echo "🗄️  数据库连接检查："
echo "--------------------------------------------"
DB_CHECK=$(docker exec npc-backend node -e "require('./config/database').getConnection().then(() => console.log('OK')).catch(e => console.log('ERROR:', e.message))" 2>/dev/null)
if [ $? -eq 0 ]; then
  echo "✅ 数据库连接正常"
else
  echo "❌ 数据库连接失败"
fi
echo ""

# 检查环境变量
echo "🔑 环境变量检查："
echo "--------------------------------------------"
echo "后端 API Keys："
docker exec npc-backend env 2>/dev/null | grep -E "API_KEY" | sed 's/=.*/=***/' || echo "  ⚠️  无法检查"
echo ""

# 检查最近的错误日志
echo "⚠️  最近的错误日志（最后 10 条）："
echo "--------------------------------------------"
docker logs --tail 50 npc-backend 2>&1 | grep -i "error\|failed\|❌" | tail -10 || echo "  没有发现错误"
echo ""

echo "============================================"
echo "✅ 健康检查完成"
echo ""
echo "💡 提示："
echo "  - 查看详细日志: ./scripts/view-logs.sh backend"
echo "  - 查看所有日志: ./scripts/view-logs.sh all"

