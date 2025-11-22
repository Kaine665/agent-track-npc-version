# ============================================
# 快速安装脚本 (PowerShell 版本)
# ============================================
# 说明：使用最快的安装方式安装依赖
# 使用方法：.\scripts\fast-install.ps1 [method]
# 示例：
#   .\scripts\fast-install.ps1 npm    # 使用 npm（默认）
#   .\scripts\fast-install.ps1 cnpm   # 使用 cnpm（推荐）

param(
    [string]$Method = "npm"
)

$FrontendDir = "npc-frontend"

Write-Host "🚀 快速安装依赖..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "使用方法: $Method" -ForegroundColor Yellow
Write-Host ""

# 检查目录
if (-not (Test-Path $FrontendDir)) {
    Write-Host "❌ 错误: 找不到 $FrontendDir 目录" -ForegroundColor Red
    exit 1
}

Set-Location $FrontendDir

# 清理旧依赖
Write-Host "🧹 清理旧依赖..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}
npm cache clean --force 2>$null
Write-Host "✅ 清理完成" -ForegroundColor Green
Write-Host ""

# 根据方法安装
switch ($Method) {
    "npm" {
        Write-Host "📦 使用 npm 安装（已配置国内镜像）..." -ForegroundColor Yellow
        npm install
    }
    "cnpm" {
        Write-Host "📦 使用 cnpm 安装（最快）..." -ForegroundColor Yellow
        # 检查是否已安装 cnpm
        $cnpmInstalled = Get-Command cnpm -ErrorAction SilentlyContinue
        if (-not $cnpmInstalled) {
            Write-Host "⚠️  cnpm 未安装，正在安装..." -ForegroundColor Yellow
            npm install -g cnpm --registry=https://registry.npmmirror.com
        }
        cnpm install
    }
    "pnpm" {
        Write-Host "📦 使用 pnpm 安装（很快）..." -ForegroundColor Yellow
        # 检查是否已安装 pnpm
        $pnpmInstalled = Get-Command pnpm -ErrorAction SilentlyContinue
        if (-not $pnpmInstalled) {
            Write-Host "⚠️  pnpm 未安装，正在安装..." -ForegroundColor Yellow
            npm install -g pnpm
        }
        pnpm install
    }
    "yarn" {
        Write-Host "📦 使用 yarn 安装..." -ForegroundColor Yellow
        # 检查是否已安装 yarn
        $yarnInstalled = Get-Command yarn -ErrorAction SilentlyContinue
        if (-not $yarnInstalled) {
            Write-Host "⚠️  yarn 未安装，正在安装..." -ForegroundColor Yellow
            npm install -g yarn
        }
        yarn install
    }
    default {
        Write-Host "❌ 未知的方法: $Method" -ForegroundColor Red
        Write-Host ""
        Write-Host "可用方法:" -ForegroundColor Yellow
        Write-Host "  npm   - 使用 npm（默认，已配置国内镜像）"
        Write-Host "  cnpm  - 使用 cnpm（推荐，最快）"
        Write-Host "  pnpm  - 使用 pnpm（很快）"
        Write-Host "  yarn  - 使用 yarn"
        exit 1
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ 安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "💡 提示：" -ForegroundColor Yellow
Write-Host "  - 如果安装很慢，尝试使用 cnpm: .\scripts\fast-install.ps1 cnpm" -ForegroundColor Gray

