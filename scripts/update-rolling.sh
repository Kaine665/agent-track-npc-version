#!/bin/bash

# ============================================
# 滚动更新脚本（方案三）
# ============================================
# 说明：几乎零停机更新，适合生产环境
# 使用方法：chmod +x scripts/update-rolling.sh && ./scripts/update-rolling.sh
# 最后更新：2025-01-XX

set -e

echo "🚀 开始滚动更新（几乎零停机）..."
echo ""

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# ==================== 预部署检查 ====================
echo "=========================================="
echo "🔍 步骤 1/4: 预部署检查"
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
echo "📥 步骤 2/4: 拉取代码并构建"
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

# 2. 构建新镜像
echo ""
echo "🏗️  构建新镜像..."
echo "   这可能需要几分钟时间..."
docker-compose build --no-cache backend frontend

echo ""
echo "=========================================="
echo "🔄 步骤 3/4: 滚动更新服务"
echo "=========================================="
echo ""

# 3. 更新后端（先更新后端，确保 API 可用）
echo "🔄 更新后端服务..."
docker-compose up -d --no-deps backend

# 4. 等待后端健康检查
echo ""
echo "⏳ 等待后端健康检查（10秒）..."
sleep 10

# 5. 验证后端
echo ""
echo "🧪 验证后端服务..."
MAX_RETRIES=5
RETRY_COUNT=0
BACKEND_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8000/api/v1/health &> /dev/null; then
        BACKEND_HEALTHY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   后端健康检查重试 $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

if [ "$BACKEND_HEALTHY" != true ]; then
    echo "❌ 后端更新失败，请检查日志: docker-compose logs backend"
    exit 1
fi

echo "✅ 后端更新成功"

# 6. 更新前端
echo ""
echo "🔄 更新前端服务..."
docker-compose up -d --no-deps frontend

# 7. 等待前端启动
echo ""
echo "⏳ 等待前端启动（5秒）..."
sleep 5

echo ""
echo "=========================================="
echo "🧪 步骤 4/4: 部署验证"
echo "=========================================="
echo ""

# 8. 最终验证
echo "🧪 最终验证..."
MAX_RETRIES=3
RETRY_COUNT=0
FINAL_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost/api/v1/health &> /dev/null; then
        FINAL_HEALTHY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   最终验证重试 $RETRY_COUNT/$MAX_RETRIES..."
    sleep 3
done

if [ "$FINAL_HEALTHY" = true ]; then
    echo ""
    echo "✅ 滚动更新成功！"
    echo ""
    echo "📋 服务访问地址："
    echo "   - 前端: http://localhost:${FRONTEND_PORT:-3000}"
    echo "   - 后端 API: http://localhost:${BACKEND_PORT:-8000}"
    echo "   - Nginx: http://localhost:${NGINX_HTTP_PORT:-80}"
    echo ""
    echo "📝 常用命令："
    echo "   - 查看日志: docker-compose logs -f"
    echo "   - 查看状态: docker-compose ps"
else
    echo ""
    echo "❌ 更新后验证失败"
    echo ""
    echo "🔍 排查步骤："
    echo "   1. 查看后端日志: docker-compose logs backend"
    echo "   2. 查看前端日志: docker-compose logs frontend"
    echo "   3. 查看 Nginx 日志: docker-compose logs nginx"
    echo ""
    exit 1
fi

