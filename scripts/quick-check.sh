#!/bin/bash

# ============================================
# 快速检查脚本
# ============================================
# 说明：快速检查常见问题
# 使用方法：./scripts/quick-check.sh

echo "🔍 快速检查常见问题..."
echo "============================================"
echo ""

# 1. 检查容器是否运行
echo "1️⃣  检查容器状态："
echo "--------------------------------------------"
CONTAINERS=("npc-backend" "npc-frontend" "npc-nginx" "npc-mysql")
ALL_RUNNING=true
for container in "${CONTAINERS[@]}"; do
  if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
    echo "  ✅ $container: 运行中"
  else
    echo "  ❌ $container: 未运行"
    ALL_RUNNING=false
  fi
done
echo ""

if [ "$ALL_RUNNING" = false ]; then
  echo "⚠️  有容器未运行，请先启动："
  echo "   docker-compose up -d"
  echo ""
fi

# 2. 检查后端 API Key
echo "2️⃣  检查后端 API Key 配置："
echo "--------------------------------------------"
API_KEYS=$(docker exec npc-backend env 2>/dev/null | grep -E "API_KEY" | wc -l)
if [ "$API_KEYS" -gt 0 ]; then
  echo "  ✅ 找到 $API_KEYS 个 API Key 配置"
  docker exec npc-backend env 2>/dev/null | grep -E "API_KEY" | sed 's/=.*/=***/' | sed 's/^/    /'
else
  echo "  ❌ 未找到 API Key 配置"
  echo "  💡 请在 .env 文件中配置 API Key"
fi
echo ""

# 3. 检查后端健康
echo "3️⃣  检查后端健康状态："
echo "--------------------------------------------"
BACKEND_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/v1/health 2>/dev/null)
HTTP_CODE=$(echo "$BACKEND_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ 后端服务正常 (HTTP $HTTP_CODE)"
  echo "$BACKEND_RESPONSE" | head -1 | sed 's/^/    /'
else
  echo "  ❌ 后端服务异常 (HTTP $HTTP_CODE)"
  echo "  💡 查看日志: ./scripts/view-logs.sh backend"
fi
echo ""

# 4. 检查前端健康
echo "4️⃣  检查前端健康状态："
echo "--------------------------------------------"
FRONTEND_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/health 2>/dev/null)
HTTP_CODE=$(echo "$FRONTEND_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "  ✅ 前端服务正常 (HTTP $HTTP_CODE)"
else
  echo "  ❌ 前端服务异常 (HTTP $HTTP_CODE)"
  echo "  💡 查看日志: ./scripts/view-logs.sh frontend"
fi
echo ""

# 5. 检查最近的错误
echo "5️⃣  检查最近的错误日志："
echo "--------------------------------------------"
ERRORS=$(docker logs --tail 100 npc-backend 2>&1 | grep -iE "error|failed|❌|API_KEY_MISSING|401|429" | tail -5)
if [ -n "$ERRORS" ]; then
  echo "  ⚠️  发现错误："
  echo "$ERRORS" | sed 's/^/    /'
  echo ""
  echo "  💡 常见错误解决方案："
  echo "    - API_KEY_MISSING: 检查 .env 文件中的 API Key 配置"
  echo "    - 401: API Key 无效，需要更新"
  echo "    - 429: API Key 达到速率限制，等待或使用其他 Key"
else
  echo "  ✅ 没有发现错误"
fi
echo ""

# 6. 检查数据库连接
echo "6️⃣  检查数据库连接："
echo "--------------------------------------------"
DB_CONNECTION=$(docker exec npc-backend node -e "
  const db = require('./config/database');
  db.getConnection()
    .then(() => {
      console.log('OK');
      process.exit(0);
    })
    .catch((e) => {
      console.log('ERROR:', e.message);
      process.exit(1);
    });
" 2>/dev/null)
if [ $? -eq 0 ]; then
  echo "  ✅ 数据库连接正常"
else
  echo "  ❌ 数据库连接失败"
  echo "  💡 检查数据库容器是否运行: docker ps | grep mysql"
fi
echo ""

echo "============================================"
echo "✅ 快速检查完成"
echo ""
echo "💡 更多帮助："
echo "  - 查看详细日志: ./scripts/view-logs.sh backend"
echo "  - 健康检查: ./scripts/check-health.sh"
echo "  - 实时监控: ./scripts/monitor.sh"

