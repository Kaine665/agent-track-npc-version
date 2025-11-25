#!/bin/bash

# ============================================
# 切换流量到 Green 环境
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔀 切换流量到 Green 环境...${NC}"

# 检查 Green 环境是否运行
if ! docker ps | grep -q "npc-backend-green"; then
    echo -e "${RED}❌ Green 环境未运行，请先执行部署: ./deploy-blue-green.sh${NC}"
    exit 1
fi

# 备份当前 Nginx 配置
BACKUP_FILE="nginx/conf.d/default.conf.backup.$(date +%Y%m%d-%H%M%S)"
cp nginx/conf.d/default.conf "$BACKUP_FILE"
echo -e "${GREEN}✅ 已备份 Nginx 配置到: $BACKUP_FILE${NC}"

# 创建新的 Nginx 配置（使用容器名访问 Green 环境）
cat > nginx/conf.d/default.conf << EOF
# ============================================
# Nginx 站点配置 - Green 环境
# ============================================

# 上游服务器：后端 API (Green - 使用容器名)
upstream backend {
    server npc-backend-green:8000;
    keepalive 32;
}

# 上游服务器：前端应用 (Green - 使用容器名)
upstream frontend {
    server npc-frontend-green:80;
    keepalive 32;
}

# HTTP 服务器配置
server {
    listen 80;
    server_name _;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_cache_valid 200 1h;
        proxy_no_cache \$http_upgrade;
        proxy_redirect off;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# 重新加载 Nginx
echo -e "${YELLOW}🔄 重新加载 Nginx 配置...${NC}"
if docker exec npc-nginx nginx -t 2>/dev/null; then
    docker exec npc-nginx nginx -s reload
    echo -e "${GREEN}✅ Nginx 配置已重新加载${NC}"
else
    echo -e "${RED}❌ Nginx 配置测试失败，请检查配置${NC}"
    echo -e "${YELLOW}恢复备份配置...${NC}"
    cp "$BACKUP_FILE" nginx/conf.d/default.conf
    docker exec npc-nginx nginx -s reload
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 流量已切换到 Green 环境${NC}"
echo ""
echo -e "${YELLOW}⚠️  请测试确认无误后，执行清理旧版本: ./cleanup-old-version.sh${NC}"
echo ""

