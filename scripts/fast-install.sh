#!/bin/bash

# ============================================
# 快速安装脚本
# ============================================
# 说明：使用最快的安装方式安装依赖
# 使用方法：./scripts/fast-install.sh [method]
# 示例：
#   ./scripts/fast-install.sh npm    # 使用 npm（默认）
#   ./scripts/fast-install.sh cnpm   # 使用 cnpm（推荐）
#   ./scripts/fast-install.sh pnpm   # 使用 pnpm

METHOD=${1:-npm}
FRONTEND_DIR="npc-frontend"

echo "🚀 快速安装依赖..."
echo "============================================"
echo "使用方法: $METHOD"
echo ""

# 检查目录
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ 错误: 找不到 $FRONTEND_DIR 目录"
    exit 1
fi

cd "$FRONTEND_DIR"

# 清理旧依赖
echo "🧹 清理旧依赖..."
rm -rf node_modules package-lock.json
npm cache clean --force 2>/dev/null || true
echo "✅ 清理完成"
echo ""

# 根据方法安装
case $METHOD in
    npm)
        echo "📦 使用 npm 安装（已配置国内镜像）..."
        npm install
        ;;
    cnpm)
        echo "📦 使用 cnpm 安装（最快）..."
        # 检查是否已安装 cnpm
        if ! command -v cnpm &> /dev/null; then
            echo "⚠️  cnpm 未安装，正在安装..."
            npm install -g cnpm --registry=https://registry.npmmirror.com
        fi
        cnpm install
        ;;
    pnpm)
        echo "📦 使用 pnpm 安装（很快）..."
        # 检查是否已安装 pnpm
        if ! command -v pnpm &> /dev/null; then
            echo "⚠️  pnpm 未安装，正在安装..."
            npm install -g pnpm
        fi
        pnpm install
        ;;
    yarn)
        echo "📦 使用 yarn 安装..."
        # 检查是否已安装 yarn
        if ! command -v yarn &> /dev/null; then
            echo "⚠️  yarn 未安装，正在安装..."
            npm install -g yarn
        fi
        yarn install
        ;;
    *)
        echo "❌ 未知的方法: $METHOD"
        echo ""
        echo "可用方法:"
        echo "  npm   - 使用 npm（默认，已配置国内镜像）"
        echo "  cnpm  - 使用 cnpm（推荐，最快）"
        echo "  pnpm  - 使用 pnpm（很快）"
        echo "  yarn  - 使用 yarn"
        exit 1
        ;;
esac

echo ""
echo "============================================"
echo "✅ 安装完成！"
echo ""
echo "💡 提示："
echo "  - 如果安装很慢，尝试使用 cnpm: ./scripts/fast-install.sh cnpm"
echo "  - 查看安装时间: time npm install"

