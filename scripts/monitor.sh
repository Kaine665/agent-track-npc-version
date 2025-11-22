#!/bin/bash

# ============================================
# 实时监控脚本
# ============================================
# 说明：实时监控所有服务的日志和状态
# 使用方法：./scripts/monitor.sh

echo "📊 实时监控面板"
echo "============================================"
echo "按 Ctrl+C 退出监控"
echo ""

# 创建一个临时文件来存储日志
LOG_FILE="/tmp/npc-monitor.log"

# 清理旧日志
> "$LOG_FILE"

# 启动后台日志收集
{
  while true; do
    echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG_FILE"
    docker logs --tail 5 npc-backend 2>&1 | grep -E "\[MessageService\]|\[LLMService\]|ERROR|error" >> "$LOG_FILE" || true
    sleep 2
  done
} &

MONITOR_PID=$!

# 清理函数
cleanup() {
  echo ""
  echo "正在停止监控..."
  kill $MONITOR_PID 2>/dev/null
  rm -f "$LOG_FILE"
  exit 0
}

trap cleanup SIGINT SIGTERM

# 显示监控信息
while true; do
  clear
  echo "📊 NPC 系统实时监控"
  echo "============================================"
  echo "更新时间: $(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  
  # 容器状态
  echo "📦 容器状态："
  docker ps --format "table {{.Names}}\t{{.Status}}" | grep npc- | head -5
  echo ""
  
  # 后端健康
  BACKEND_HEALTH=$(curl -s http://localhost:8000/api/v1/health 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "✅ 后端: 正常"
  else
    echo "❌ 后端: 异常"
  fi
  
  # 前端健康
  FRONTEND_HEALTH=$(curl -s http://localhost:3000/health 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "✅ 前端: 正常"
  else
    echo "❌ 前端: 异常"
  fi
  echo ""
  
  # 最近的日志
  echo "📋 最近的日志（最后 20 行）："
  echo "--------------------------------------------"
  if [ -f "$LOG_FILE" ]; then
    tail -20 "$LOG_FILE" 2>/dev/null || echo "  暂无日志"
  else
    echo "  暂无日志"
  fi
  
  echo ""
  echo "按 Ctrl+C 退出监控"
  
  sleep 5
done

