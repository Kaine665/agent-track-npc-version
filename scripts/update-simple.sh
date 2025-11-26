#!/bin/bash

# ============================================
# 简单更新脚本（方案一）
# ============================================
# 说明：适合小规模部署，会有短暂停机时间
# 使用方法：chmod +x scripts/update-simple.sh && ./scripts/update-simple.sh
# 最后更新：2025-01-XX

set -e

echo "🚀 开始简单更新..."
echo ""

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# ==================== 预部署检查 ====================
echo "=========================================="
echo "🔍 步骤 1/3: 预部署检查"
echo "=========================================="
echo ""

# 运行预部署检查脚本
if [ -f "scripts/pre-deploy-check.sh" ]; then
    chmod +x scripts/pre-deploy-check.sh
    if ! ./scripts/pre-deploy-check.sh; then
        echo ""
        echo "❌ 预部署检查失败，更新已中止"
        echo "   请修复问题后重试，或使用 --skip-checks 跳过检查（不推荐）"
        exit 1
    fi
else
    echo "⚠️  预部署检查脚本不存在，跳过检查"
    echo "   建议先运行: ./scripts/pre-deploy-check.sh"
    echo ""
    read -p "是否继续更新？(y/n): " continue_update
    if [ "$continue_update" != "y" ] && [ "$continue_update" != "Y" ]; then
        echo "更新已取消"
        exit 0
    fi
fi

echo ""
echo "=========================================="
echo "📥 步骤 2/3: 拉取代码并构建"
echo "=========================================="
echo ""

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 1. 拉取最新代码
echo ""
echo "📥 拉取最新代码..."
if [ -d ".git" ]; then
    git pull origin main || git pull origin master || echo "⚠️  Git 拉取失败，继续使用本地代码"
else
    echo "⚠️  未检测到 Git 仓库，跳过代码拉取"
fi

# 2. 重新构建镜像
echo ""
echo "🏗️  重新构建镜像..."
echo "   这可能需要几分钟时间..."
docker-compose build --no-cache

# 3. 重启服务（会短暂停机）
echo ""
echo "🔄 重启服务（会有短暂停机，约30秒-2分钟）..."
docker-compose up -d

# 4. 等待服务启动
echo ""
echo "⏳ 等待服务启动（10秒）..."
sleep 10

# 5. 检查服务状态
echo ""
echo "📊 检查服务状态..."
docker-compose ps

echo ""
echo "=========================================="
echo "🧪 步骤 3/3: 部署验证"
echo "=========================================="
echo ""

# 6. 健康检查
echo "🧪 健康检查..."
MAX_RETRIES=5
RETRY_COUNT=0
HEALTH_CHECK_PASSED=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8000/api/v1/health &> /dev/null; then
        HEALTH_CHECK_PASSED=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   重试 $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

if [ "$HEALTH_CHECK_PASSED" = true ]; then
    echo ""
    echo "✅ 更新成功！"
    echo ""
    echo "📋 服务访问地址："
    echo "   - 前端: http://localhost:${FRONTEND_PORT:-3000}"
    echo "   - 后端 API: http://localhost:${BACKEND_PORT:-8000}"
    echo "   - Nginx: http://localhost:${NGINX_HTTP_PORT:-80}"
    echo ""
    echo "📝 常用命令："
    echo "   - 查看日志: docker-compose logs -f"
    echo "   - 查看状态: docker-compose ps"
    echo "   - 停止服务: docker-compose stop"
else
    echo ""
    echo "❌ 更新失败，健康检查未通过"
    echo ""
    echo "🔍 排查步骤："
    echo "   1. 查看后端日志: docker-compose logs backend"
    echo "   2. 查看所有日志: docker-compose logs"
    echo "   3. 检查服务状态: docker-compose ps"
    echo ""
    exit 1
fi

