#!/bin/bash

# ============================================
# 生产环境滚动更新脚本
# ============================================
# 说明：无停机更新生产环境版本
# 使用方法：chmod +x update-production.sh && ./update-production.sh [分支名]
# 示例：./update-production.sh main
#       ./update-production.sh develop
# 最后更新：2025-11-25

set -e  # 遇到错误立即退出

# 从命令行参数获取分支名（如果提供）
TARGET_BRANCH="$1"

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
    # 显示当前分支
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null)
    echo -e "${YELLOW}当前分支: ${CURRENT_BRANCH}${NC}"
    
    # 如果命令行提供了分支名，直接使用；否则询问用户
    if [ -n "$TARGET_BRANCH" ]; then
        echo -e "${YELLOW}目标分支（命令行指定）: ${TARGET_BRANCH}${NC}"
        SWITCH_BRANCH="y"
        TARGET_BRANCH_INPUT="$TARGET_BRANCH"
        PULL_CODE="y"
    else
        read -p "是否拉取最新代码？(y/n): " pull_code
        PULL_CODE="$pull_code"
        if [ "$pull_code" != "y" ] && [ "$pull_code" != "Y" ]; then
            echo -e "${YELLOW}跳过代码拉取${NC}"
        else
            # 询问是否切换分支
            read -p "是否切换到其他分支？(y/n，默认n): " switch_branch
            SWITCH_BRANCH="$switch_branch"
            if [ "$switch_branch" = "y" ] || [ "$switch_branch" = "Y" ]; then
                echo -e "${YELLOW}正在获取远程分支列表...${NC}"
                git fetch origin --prune || echo "⚠️  Git fetch 失败"
                echo ""
                echo "可用远程分支："
                git branch -r | sed 's/origin\///' | grep -v HEAD | sed 's/^/  /' | sort
                echo ""
                read -p "请输入要切换的分支名: " TARGET_BRANCH_INPUT
            fi
        fi
    fi
    
    # 如果需要切换分支
    if [ "$SWITCH_BRANCH" = "y" ] || [ "$SWITCH_BRANCH" = "Y" ] || [ -n "$TARGET_BRANCH" ]; then
        if [ -n "$TARGET_BRANCH_INPUT" ]; then
            echo -e "${YELLOW}🔄 切换到分支: $TARGET_BRANCH_INPUT...${NC}"
            
            # 先获取所有远程分支
            git fetch origin --prune || echo "⚠️  Git fetch 失败"
            
            # 检查远程分支是否存在
            if git ls-remote --heads origin "$TARGET_BRANCH_INPUT" | grep -q "$TARGET_BRANCH_INPUT"; then
                # 如果当前有未提交的更改，先stash
                if ! git diff-index --quiet HEAD --; then
                    echo -e "${YELLOW}检测到未提交的更改，正在暂存...${NC}"
                    git stash save "Auto-stash before branch switch $(date +%Y%m%d-%H%M%S)"
                fi
                
                # 切换到分支
                if git checkout "$TARGET_BRANCH_INPUT" 2>/dev/null; then
                    echo -e "${GREEN}✅ 已切换到本地分支: $TARGET_BRANCH_INPUT${NC}"
                elif git checkout -b "$TARGET_BRANCH_INPUT" "origin/$TARGET_BRANCH_INPUT" 2>/dev/null; then
                    echo -e "${GREEN}✅ 已创建并切换到分支: $TARGET_BRANCH_INPUT${NC}"
                else
                    echo -e "${RED}❌ 切换分支失败${NC}"
                    echo "提示：请确保分支名正确，或手动执行："
                    echo "  git fetch origin"
                    echo "  git checkout $TARGET_BRANCH_INPUT"
                    exit 1
                fi
            else
                echo -e "${RED}❌ 远程分支 '$TARGET_BRANCH_INPUT' 不存在${NC}"
                echo "可用分支："
                git branch -r | sed 's/origin\///' | grep -v HEAD | sed 's/^/  /'
                exit 1
            fi
        fi
    fi
    
    # 拉取最新代码
    if [ "$PULL_CODE" = "y" ] || [ "$PULL_CODE" = "Y" ] || [ -n "$TARGET_BRANCH" ]; then
        CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null)
        echo -e "${YELLOW}📥 拉取分支 '$CURRENT_BRANCH' 的最新代码...${NC}"
        git pull origin "$CURRENT_BRANCH" || {
            echo -e "${YELLOW}⚠️  使用默认方式拉取...${NC}"
            git pull || echo -e "${RED}⚠️  Git pull 失败，继续使用当前代码${NC}"
        }
        echo -e "${GREEN}✅ 代码拉取完成${NC}"
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

