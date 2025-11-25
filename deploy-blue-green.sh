#!/bin/bash

# ============================================
# 蓝绿部署脚本
# ============================================
# 说明：部署新版本到备用端口，确认无误后切换流量
# 使用方法：./deploy-blue-green.sh [分支名]
# 示例：./deploy-blue-green.sh v1.5

set -e

TARGET_BRANCH="$1"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检测当前运行的是哪个环境
if docker ps | grep -q "npc-backend-green"; then
    CURRENT_ENV="green"
    NEW_ENV="blue"
    CURRENT_BACKEND_PORT=8001
    CURRENT_FRONTEND_PORT=3001
    NEW_BACKEND_PORT=8000
    NEW_FRONTEND_PORT=3000
else
    CURRENT_ENV="blue"
    NEW_ENV="green"
    CURRENT_BACKEND_PORT=8000
    CURRENT_FRONTEND_PORT=3000
    NEW_BACKEND_PORT=8001
    NEW_FRONTEND_PORT=3001
fi

echo -e "${YELLOW}🚀 开始蓝绿部署...${NC}"
echo -e "${YELLOW}当前生产环境: ${CURRENT_ENV} (端口: ${CURRENT_BACKEND_PORT}, ${CURRENT_FRONTEND_PORT})${NC}"
echo -e "${YELLOW}新部署环境: ${NEW_ENV} (端口: ${NEW_BACKEND_PORT}, ${NEW_FRONTEND_PORT})${NC}"
echo ""

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env 文件不存在${NC}"
    exit 1
fi

# 加载环境变量
export $(grep -v '^#' .env | xargs)

# 1. 切换到目标分支并拉取代码
if [ -d .git ]; then
    if [ -n "$TARGET_BRANCH" ]; then
        echo -e "${YELLOW}📥 切换到分支: ${TARGET_BRANCH}...${NC}"
        git fetch origin --prune || echo "⚠️  Git fetch 失败"
        
        if git ls-remote --heads origin "$TARGET_BRANCH" | grep -q "$TARGET_BRANCH"; then
            git checkout "$TARGET_BRANCH" 2>/dev/null || git checkout -b "$TARGET_BRANCH" "origin/$TARGET_BRANCH"
            git pull origin "$TARGET_BRANCH" || git pull
            echo -e "${GREEN}✅ 代码已更新到分支: ${TARGET_BRANCH}${NC}"
        else
            echo -e "${RED}❌ 远程分支 '$TARGET_BRANCH' 不存在${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}📥 拉取当前分支最新代码...${NC}"
        git pull || echo "⚠️  Git pull 失败"
    fi
fi

# 2. 检查是否已有新环境容器在运行
if docker ps | grep -q "npc-backend-${NEW_ENV}"; then
    echo -e "${YELLOW}⚠️  检测到已有 ${NEW_ENV} 环境在运行，先停止...${NC}"
    docker stop npc-backend-${NEW_ENV} npc-frontend-${NEW_ENV} 2>/dev/null || true
    docker rm npc-backend-${NEW_ENV} npc-frontend-${NEW_ENV} 2>/dev/null || true
fi

# 3. 获取网络名称（从 docker-compose 获取）
NETWORK_NAME=$(docker network ls | grep "npc-network\|agent-track" | head -1 | awk '{print $2}')
if [ -z "$NETWORK_NAME" ]; then
    # 如果没有找到网络，尝试创建或使用默认的
    NETWORK_NAME="agent-track-npc-version_npc-network"
    docker network create $NETWORK_NAME 2>/dev/null || true
fi

# 获取服务器 IP（用于 CORS 配置和前端构建）
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}' || echo "localhost")

echo -e "${YELLOW}📦 构建新版本镜像 (${NEW_ENV})...${NC}"
docker build -t agent-track-npc-version-backend:${NEW_ENV} ./npc-backend

# 构建前端镜像（根据环境使用不同的 API 地址）
if [ "$NEW_ENV" = "green" ]; then
    # Green 环境：使用绝对路径，指向 Green 后端（8001端口）
    # 这样可以直接通过端口 3001 访问并测试
    echo -e "${YELLOW}📦 构建 Green 前端镜像（使用绝对路径 http://${SERVER_IP}:8001）...${NC}"
    docker build \
      --build-arg VITE_API_BASE_URL=http://${SERVER_IP}:8001 \
      -t agent-track-npc-version-frontend:${NEW_ENV} \
      ./npc-frontend
else
    # Blue 环境：使用相对路径（通过 Nginx）
    echo -e "${YELLOW}📦 构建 Blue 前端镜像（使用相对路径 /api）...${NC}"
    docker build \
      --build-arg VITE_API_BASE_URL=/api \
      -t agent-track-npc-version-frontend:${NEW_ENV} \
      ./npc-frontend
fi

# 4. 启动新版本后端容器（使用容器名，方便 Nginx 访问）
echo -e "${YELLOW}🚀 启动新版本后端容器 (${NEW_ENV})...${NC}"

# 构建 CORS 允许的来源列表
# 生产环境：通过 Nginx（端口 80）
# Green 测试：端口 3001
# Blue 测试：端口 3000
CORS_ORIGINS="http://${SERVER_IP},http://${SERVER_IP}:80"
if [ "$NEW_ENV" = "green" ]; then
    CORS_ORIGINS="${CORS_ORIGINS},http://${SERVER_IP}:3001"
else
    CORS_ORIGINS="${CORS_ORIGINS},http://${SERVER_IP}:3000"
fi

# 如果环境变量中已经设置了 CORS_ORIGINS，追加到列表
if [ -n "${CORS_ORIGINS_ENV:-}" ]; then
    CORS_ORIGINS="${CORS_ORIGINS},${CORS_ORIGINS_ENV}"
fi

docker run -d \
  --name npc-backend-${NEW_ENV} \
  --network ${NETWORK_NAME} \
  -p ${NEW_BACKEND_PORT}:8000 \
  -e NODE_ENV=production \
  -e PORT=8000 \
  -e SERVER_IP=${SERVER_IP} \
  -e CORS_ORIGINS="${CORS_ORIGINS}" \
  -e FRONTEND_DOMAIN="${FRONTEND_DOMAIN:-}" \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_USER=${DB_USER:-root} \
  -e DB_PASSWORD=${DB_PASSWORD:-your_mysql_password} \
  -e DB_NAME=${DB_NAME:-npc_db} \
  -e OPENROUTER_API_KEY="${OPENROUTER_API_KEY:-}" \
  -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
  -e DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-}" \
  --restart unless-stopped \
  --add-host=host.docker.internal:host-gateway \
  agent-track-npc-version-backend:${NEW_ENV}

# 5. 启动新版本前端容器（使用容器名，方便 Nginx 访问）
echo -e "${YELLOW}🚀 启动新版本前端容器 (${NEW_ENV})...${NC}"
docker run -d \
  --name npc-frontend-${NEW_ENV} \
  --network ${NETWORK_NAME} \
  -p ${NEW_FRONTEND_PORT}:80 \
  --restart unless-stopped \
  agent-track-npc-version-frontend:${NEW_ENV}

# 6. 等待新版本启动
echo -e "${YELLOW}⏳ 等待新版本启动（30秒）...${NC}"
sleep 30

# 7. 健康检查
echo -e "${YELLOW}🧪 检查新版本健康状态...${NC}"
MAX_RETRIES=12
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:${NEW_BACKEND_PORT}/api/v1/health &> /dev/null; then
        echo -e "${GREEN}✅ 新版本后端健康检查通过${NC}"
        HEALTHY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "等待中... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ "$HEALTHY" = false ]; then
    echo -e "${RED}❌ 新版本后端健康检查失败${NC}"
    echo -e "${YELLOW}查看日志: docker logs npc-backend-${NEW_ENV}${NC}"
    read -p "是否继续？(y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ] && [ "$continue_anyway" != "Y" ]; then
        echo -e "${YELLOW}🔄 清理新版本容器...${NC}"
        docker stop npc-backend-${NEW_ENV} npc-frontend-${NEW_ENV} 2>/dev/null || true
        docker rm npc-backend-${NEW_ENV} npc-frontend-${NEW_ENV} 2>/dev/null || true
        exit 1
    fi
fi

# 8. 显示部署信息
echo ""
echo -e "${GREEN}✅ 新版本已部署完成！${NC}"
echo ""

# 服务器 IP 已在前面获取，这里直接使用

echo -e "${YELLOW}📋 测试地址：${NC}"
echo "   - 新后端健康检查: http://${SERVER_IP}:${NEW_BACKEND_PORT}/api/v1/health"
echo "   - 新前端: http://${SERVER_IP}:${NEW_FRONTEND_PORT}"
echo ""
echo -e "${YELLOW}💡 提示：如果无法访问，请检查服务器防火墙是否开放端口 ${NEW_BACKEND_PORT} 和 ${NEW_FRONTEND_PORT}${NC}"
echo ""
echo -e "${YELLOW}📊 当前运行的服务：${NC}"
docker ps --filter "name=npc-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo -e "${GREEN}🔀 下一步操作：${NC}"
echo "   1. 测试新版本功能是否正常"
echo "   2. 确认无误后，执行切换流量: ./switch-to-${NEW_ENV}.sh"
echo "   3. 如需回滚，执行: ./rollback-to-${CURRENT_ENV}.sh"
echo ""

