#!/bin/bash

# ============================================
# 快速部署脚本
# ============================================
# 说明：一键部署脚本，简化部署流程
# 使用方法：chmod +x deploy.sh && ./deploy.sh
# 最后更新：2025-11-22

set -e  # 遇到错误立即退出

echo "🚀 开始部署 NPC 应用..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，正在创建..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ 已创建 .env 文件，请编辑 .env 文件填写配置"
        echo "📝 重要：请修改 .env 文件中的以下配置："
        echo "   - DB_PASSWORD: 数据库密码"
        echo "   - OPENROUTER_API_KEY: OpenRouter API Key"
        echo "   - FRONTEND_API_URL: 前端 API 地址（如果使用域名）"
        read -p "按 Enter 键继续，或 Ctrl+C 取消..."
    else
        echo "❌ env.example 文件不存在，请手动创建 .env 文件"
        exit 1
    fi
fi

# 询问是否初始化数据库
read -p "是否初始化数据库？(y/n): " init_db
if [ "$init_db" = "y" ] || [ "$init_db" = "Y" ]; then
    echo "📦 启动 MySQL 服务..."
    docker-compose up -d mysql
    
    echo "⏳ 等待 MySQL 启动（30秒）..."
    sleep 30
    
    echo "🔧 初始化数据库..."
    # 检查是否有 Node.js（用于运行初始化脚本）
    if command -v node &> /dev/null; then
        cd npc-backend
        if [ ! -d node_modules ]; then
            echo "📦 安装后端依赖..."
            npm install
        fi
        echo "🗄️  创建数据库表..."
        npm run db:init
        cd ..
    else
        echo "⚠️  未检测到 Node.js，请手动初始化数据库："
        echo "   1. 安装 Node.js"
        echo "   2. 运行: cd npc-backend && npm install && npm run db:init"
        read -p "按 Enter 键继续..."
    fi
fi

# 构建并启动所有服务
echo "🏗️  构建 Docker 镜像（首次构建可能需要几分钟）..."
docker-compose build

echo "🚀 启动所有服务..."
docker-compose up -d

echo "⏳ 等待服务启动（10秒）..."
sleep 10

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 测试服务
echo "🧪 测试服务..."
echo "测试后端健康检查..."
if curl -f http://localhost:8000/api/v1/health &> /dev/null; then
    echo "✅ 后端服务正常"
else
    echo "⚠️  后端服务可能未就绪，请查看日志: docker-compose logs backend"
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 服务访问地址："
echo "   - 前端: http://localhost:${FRONTEND_PORT:-3000}"
echo "   - 后端 API: http://localhost:${BACKEND_PORT:-8000}"
echo "   - Nginx: http://localhost:${NGINX_HTTP_PORT:-80}"
echo ""
echo "📝 常用命令："
echo "   - 查看日志: docker-compose logs -f"
echo "   - 停止服务: docker-compose stop"
echo "   - 重启服务: docker-compose restart"
echo "   - 查看状态: docker-compose ps"
echo ""
echo "📚 更多信息请查看 DEPLOYMENT.md"

