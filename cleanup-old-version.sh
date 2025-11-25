#!/bin/bash

# ============================================
# 清理旧版本容器
# ============================================
# 说明：确认新版本运行正常后，清理旧版本容器以释放资源

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧹 清理旧版本容器...${NC}"

# 检测当前运行的是哪个环境
if docker ps | grep -q "npc-backend-green"; then
    OLD_ENV="blue"
    echo -e "${YELLOW}当前生产环境: Green，将清理 Blue 环境${NC}"
else
    OLD_ENV="green"
    echo -e "${YELLOW}当前生产环境: Blue，将清理 Green 环境${NC}"
fi

read -p "确认清理 ${OLD_ENV} 环境容器？(y/n): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

echo -e "${YELLOW}🛑 停止 ${OLD_ENV} 环境容器...${NC}"
docker stop npc-backend-${OLD_ENV} npc-frontend-${OLD_ENV} 2>/dev/null || true
docker rm npc-backend-${OLD_ENV} npc-frontend-${OLD_ENV} 2>/dev/null || true

echo -e "${YELLOW}🗑️  删除 ${OLD_ENV} 环境镜像（可选）...${NC}"
read -p "是否删除 ${OLD_ENV} 环境镜像？(y/n，默认n): " delete_images
if [ "$delete_images" = "y" ] || [ "$delete_images" = "Y" ]; then
    docker rmi agent-track-npc-version-backend:${OLD_ENV} 2>/dev/null || true
    docker rmi agent-track-npc-version-frontend:${OLD_ENV} 2>/dev/null || true
    echo -e "${GREEN}✅ 镜像已删除${NC}"
fi

echo ""
echo -e "${GREEN}✅ 清理完成${NC}"
echo ""

