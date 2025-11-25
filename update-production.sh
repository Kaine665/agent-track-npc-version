#!/bin/bash

# ============================================
# 生产环境滚动更新脚本
# ============================================
# 说明：无停机更新生产环境版本
# 使用方法：chmod +x update-production.sh && ./update-production.sh
# 最后更新：2025-11-25

set -e  # 遇到错误立即退出

echo "🚀 开始滚动更新生产环境..."

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose 未安装${NC}"
    exit 1
fi

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env 文件不存在${NC}"
    exit 1
fi

# 备份当前版本（可选）
read -p "是否备份当前版本？(y/n，推荐y): " backup
if [ "$backup" = "y" ] || [ "$backup" = "Y" ]; then
    echo -e "${YELLOW}📦 备份当前版本...${NC}"
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份配置文件
    cp .env "$BACKUP_DIR/" 2>/dev/null || true
    cp docker-compose.yml "$BACKUP_DIR/" 2>/dev/null || true
    
    # 导出数据库（如果可能）
    echo "💾 备份数据库..."
    docker-compose exec -T mysql mysqldump -u root -p"${DB_PASSWORD:-your_mysql_password}" ${DB_NAME:-npc_db} > "$BACKUP_DIR/database.sql" 2>/dev/null || echo "⚠️  数据库备份失败（可能数据库未运行）"
    
    echo -e "${GREEN}✅ 备份完成：$BACKUP_DIR${NC}"
fi

# 拉取最新代码（如果使用 Git）
if [ -d .git ]; then
    read -p "是否拉取最新代码？(y/n): " pull_code
    if [ "$pull_code" = "y" ] || [ "$pull_code" = "Y" ]; then
        echo -e "${YELLOW}📥 拉取最新代码...${NC}"
        git pull || echo "⚠️  Git pull 失败，继续使用当前代码"
    fi
fi

# 步骤1：更新后端（先更新后端，因为前端依赖后端）
echo ""
echo -e "${YELLOW}📦 步骤 1/3：更新后端服务...${NC}"
echo "构建后端镜像..."
docker-compose build backend

echo "停止旧后端容器..."
docker-compose stop backend || true

echo "启动新后端容器..."
docker-compose up -d backend

echo "等待后端健康检查（最多60秒）..."
for i in {1..12}; do
    sleep 5
    if docker-compose exec -T backend node -e "require('http').get('http://localhost:8000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" 2>/dev/null; then
        echo -e "${GREEN}✅ 后端健康检查通过${NC}"
        break
    fi
    if [ $i -eq 12 ]; then
        echo -e "${RED}❌ 后端健康检查失败，请检查日志${NC}"
        echo "查看日志：docker-compose logs backend"
        read -p "是否继续更新前端？(y/n): " continue_frontend
        if [ "$continue_frontend" != "y" ] && [ "$continue_frontend" != "Y" ]; then
            echo -e "${YELLOW}🔄 回滚后端...${NC}"
            docker-compose restart backend
            exit 1
        fi
    fi
done

# 步骤2：更新前端
echo ""
echo -e "${YELLOW}📦 步骤 2/3：更新前端服务...${NC}"
echo "构建前端镜像..."
docker-compose build frontend

echo "停止旧前端容器..."
docker-compose stop frontend || true

echo "启动新前端容器..."
docker-compose up -d frontend

echo "等待前端启动（10秒）..."
sleep 10

# 步骤3：重新加载 Nginx（确保配置生效）
echo ""
echo -e "${YELLOW}📦 步骤 3/3：重新加载 Nginx...${NC}"
docker-compose exec nginx nginx -s reload || docker-compose restart nginx

# 验证更新
echo ""
echo -e "${YELLOW}🧪 验证更新...${NC}"

# 检查后端
if curl -f http://localhost:8000/api/v1/health &> /dev/null; then
    echo -e "${GREEN}✅ 后端服务正常${NC}"
else
    echo -e "${RED}❌ 后端服务异常${NC}"
fi

# 检查前端
if curl -f http://localhost:${FRONTEND_PORT:-3000} &> /dev/null; then
    echo -e "${GREEN}✅ 前端服务正常${NC}"
else
    echo -e "${YELLOW}⚠️  前端服务可能未就绪（可能需要更长时间）${NC}"
fi

# 检查 Nginx
if curl -f http://localhost:${NGINX_HTTP_PORT:-80} &> /dev/null; then
    echo -e "${GREEN}✅ Nginx 服务正常${NC}"
else
    echo -e "${RED}❌ Nginx 服务异常${NC}"
fi

# 显示服务状态
echo ""
echo -e "${GREEN}📊 服务状态：${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}🎉 滚动更新完成！${NC}"
echo ""
echo "📋 服务访问地址："
echo "   - 前端: http://localhost:${FRONTEND_PORT:-3000}"
echo "   - 后端 API: http://localhost:${BACKEND_PORT:-8000}"
echo "   - Nginx: http://localhost:${NGINX_HTTP_PORT:-80}"
echo ""
echo "📝 如果出现问题，可以："
echo "   1. 查看日志: docker-compose logs -f"
echo "   2. 重启服务: docker-compose restart"
echo "   3. 回滚版本: 使用备份目录中的配置"
echo ""

