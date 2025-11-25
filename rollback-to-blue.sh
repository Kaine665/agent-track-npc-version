#!/bin/bash

# ============================================
# 回滚到 Blue 环境
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 回滚到 Blue 环境...${NC}"

# 切换流量回 Blue
./switch-to-blue.sh

# 停止 Green 环境容器（可选，如果想保留可以注释掉）
read -p "是否停止 Green 环境容器？(y/n，默认n): " stop_green
if [ "$stop_green" = "y" ] || [ "$stop_green" = "Y" ]; then
    echo -e "${YELLOW}🛑 停止 Green 环境容器...${NC}"
    docker stop npc-backend-green npc-frontend-green 2>/dev/null || true
    echo -e "${GREEN}✅ Green 环境已停止${NC}"
fi

echo ""
echo -e "${GREEN}✅ 已回滚到 Blue 环境${NC}"
echo ""

