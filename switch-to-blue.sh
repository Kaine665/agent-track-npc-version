#!/bin/bash

# ============================================
# 切换流量到 Blue 环境
# ============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔀 切换流量到 Blue 环境...${NC}"

# 备份当前 Nginx 配置
BACKUP_FILE="nginx/conf.d/default.conf.backup.$(date +%Y%m%d-%H%M%S)"
cp nginx/conf.d/default.conf "$BACKUP_FILE"
echo -e "${GREEN}✅ 已备份 Nginx 配置到: $BACKUP_FILE${NC}"

# 恢复原始 Nginx 配置（使用 docker-compose 服务名）
cat > nginx/conf.d/default.conf << 'EOF'
# ============================================
# Nginx 站点配置 - Blue 环境
# ============================================

# 上游服务器：后端 API (Blue)
upstream backend {
    server backend:8000;
    keepalive 32;
}

# 上游服务器：前端应用 (Blue)
upstream frontend {
    server frontend:80;
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_cache_valid 200 1h;
        proxy_no_cache $http_upgrade;
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
echo -e "${GREEN}✅ 流量已切换到 Blue 环境${NC}"
echo ""

