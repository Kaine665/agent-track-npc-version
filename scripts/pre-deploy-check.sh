#!/bin/bash

# ============================================
# 预部署检查脚本
# ============================================
# 说明：在部署前检查代码质量、运行测试、确保代码没有问题
# 使用方法：chmod +x scripts/pre-deploy-check.sh && ./scripts/pre-deploy-check.sh
# 最后更新：2025-01-XX

set -e

echo "🔍 开始预部署检查..."
echo ""

# 检查是否在项目根目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 检查结果统计
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_SKIPPED=0

# 检查函数
check_pass() {
    echo "✅ $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

check_fail() {
    echo "❌ $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

check_skip() {
    echo "⏭️  $1 (跳过)"
    CHECKS_SKIPPED=$((CHECKS_SKIPPED + 1))
}

# ==================== 1. Git 状态检查 ====================
echo "📋 1. 检查 Git 状态..."

if [ -d ".git" ]; then
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  检测到未提交的更改："
        git status --short
        echo ""
        read -p "是否继续？(y/n): " continue_with_changes
        if [ "$continue_with_changes" != "y" ] && [ "$continue_with_changes" != "Y" ]; then
            echo "❌ 检查中止：请先提交或暂存更改"
            exit 1
        fi
        check_skip "Git 状态检查（有未提交更改但继续）"
    else
        check_pass "Git 状态检查（无未提交更改）"
    fi
    
    # 检查当前分支
    CURRENT_BRANCH=$(git branch --show-current)
    echo "   当前分支: $CURRENT_BRANCH"
    
    # 如果是 main 或 master 分支，给出提示
    if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "master" ]; then
        echo "   ⚠️  你在主分支上，确保代码已经测试过"
    fi
else
    check_skip "Git 状态检查（未检测到 Git 仓库）"
fi

echo ""

# ==================== 2. 环境变量检查 ====================
echo "📋 2. 检查环境变量配置..."

if [ -f ".env" ]; then
    # 检查关键环境变量
    MISSING_VARS=()
    
    if ! grep -q "DB_PASSWORD=" .env || grep -q "DB_PASSWORD=your_mysql_password" .env; then
        MISSING_VARS+=("DB_PASSWORD")
    fi
    
    if ! grep -q "OPENROUTER_API_KEY=" .env || grep -q "OPENROUTER_API_KEY=your_openrouter_api_key" .env; then
        MISSING_VARS+=("OPENROUTER_API_KEY")
    fi
    
    if [ ${#MISSING_VARS[@]} -eq 0 ]; then
        check_pass "环境变量检查（关键变量已配置）"
    else
        check_fail "环境变量检查（缺少关键变量: ${MISSING_VARS[*]}）"
        echo "   请检查 .env 文件中的配置"
    fi
else
    check_fail "环境变量检查（.env 文件不存在）"
    echo "   请复制 env.example 为 .env 并配置"
fi

echo ""

# ==================== 3. 后端检查 ====================
echo "📋 3. 检查后端代码..."

if [ -d "npc-backend" ]; then
    cd npc-backend
    
    # 3.1 检查依赖是否安装
    if [ ! -d "node_modules" ]; then
        echo "   📦 安装后端依赖..."
        npm install
    fi
    
    # 3.2 运行测试
    echo "   🧪 运行后端测试..."
    if npm test 2>&1 | tee /tmp/backend-test.log; then
        check_pass "后端测试"
    else
        check_fail "后端测试失败"
        echo "   测试日志已保存到 /tmp/backend-test.log"
        cd ..
        if [ $CHECKS_FAILED -gt 0 ]; then
            echo ""
            echo "❌ 预部署检查失败，请修复问题后重试"
            exit 1
        fi
    fi
    
    cd ..
else
    check_skip "后端检查（npc-backend 目录不存在）"
fi

echo ""

# ==================== 4. 前端检查 ====================
echo "📋 4. 检查前端代码..."

if [ -d "npc-frontend" ]; then
    cd npc-frontend
    
    # 4.1 检查依赖是否安装
    if [ ! -d "node_modules" ]; then
        echo "   📦 安装前端依赖..."
        npm install
    fi
    
    # 4.2 代码检查（Lint）
    echo "   🔍 运行 ESLint 检查..."
    if npm run lint 2>&1 | tee /tmp/frontend-lint.log; then
        check_pass "前端代码检查（ESLint）"
    else
        LINT_EXIT_CODE=${PIPESTATUS[0]}
        if [ $LINT_EXIT_CODE -eq 0 ]; then
            check_pass "前端代码检查（ESLint）"
        else
            check_fail "前端代码检查失败（ESLint 发现错误）"
            echo "   Lint 日志已保存到 /tmp/frontend-lint.log"
            echo "   请修复代码问题后重试"
            cd ..
            if [ $CHECKS_FAILED -gt 0 ]; then
                echo ""
                echo "❌ 预部署检查失败，请修复问题后重试"
                exit 1
            fi
        fi
    fi
    
    # 4.3 构建测试（确保能正常构建）
    echo "   🏗️  测试前端构建..."
    if npm run build 2>&1 | tee /tmp/frontend-build.log; then
        check_pass "前端构建测试"
        # 清理构建产物（可选）
        # rm -rf dist
    else
        check_fail "前端构建失败"
        echo "   构建日志已保存到 /tmp/frontend-build.log"
        cd ..
        if [ $CHECKS_FAILED -gt 0 ]; then
            echo ""
            echo "❌ 预部署检查失败，请修复问题后重试"
            exit 1
        fi
    fi
    
    cd ..
else
    check_skip "前端检查（npc-frontend 目录不存在）"
fi

echo ""

# ==================== 5. Docker 检查 ====================
echo "📋 5. 检查 Docker 环境..."

if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        check_pass "Docker 运行状态"
        
        # 检查 Docker Compose
        if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
            check_pass "Docker Compose 可用"
        else
            check_fail "Docker Compose 不可用"
        fi
    else
        check_fail "Docker 未运行"
    fi
else
    check_fail "Docker 未安装"
fi

echo ""

# ==================== 6. 配置文件检查 ====================
echo "📋 6. 检查配置文件..."

CONFIG_FILES=("docker-compose.yml" "nginx/nginx.conf" "nginx/conf.d/default.conf")

for config_file in "${CONFIG_FILES[@]}"; do
    if [ -f "$config_file" ]; then
        check_pass "配置文件存在: $config_file"
    else
        check_fail "配置文件缺失: $config_file"
    fi
done

echo ""

# ==================== 总结 ====================
echo "=========================================="
echo "📊 预部署检查总结"
echo "=========================================="
echo "✅ 通过: $CHECKS_PASSED"
echo "❌ 失败: $CHECKS_FAILED"
echo "⏭️  跳过: $CHECKS_SKIPPED"
echo ""

if [ $CHECKS_FAILED -gt 0 ]; then
    echo "❌ 预部署检查失败！"
    echo "   请修复上述问题后重试"
    echo ""
    echo "💡 提示："
    echo "   - 查看测试日志: cat /tmp/backend-test.log"
    echo "   - 查看 Lint 日志: cat /tmp/frontend-lint.log"
    echo "   - 查看构建日志: cat /tmp/frontend-build.log"
    exit 1
else
    echo "✅ 预部署检查全部通过！"
    echo "   可以安全地进行部署了"
    echo ""
    exit 0
fi

