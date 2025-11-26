# ============================================
# 简单更新脚本（方案一）- PowerShell 版本
# ============================================
# 说明：适合小规模部署，会有短暂停机时间
# 使用方法：.\scripts\update-simple.ps1
# 最后更新：2025-01-XX

# 设置控制台输出编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Continue"

Write-Host "🚀 开始简单更新..." -ForegroundColor Cyan
Write-Host ""

# 检查是否在项目根目录
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ 错误：请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# ==================== 预部署检查 ====================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔍 步骤 1/3: 预部署检查" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 运行预部署检查脚本
if (Test-Path "scripts\pre-deploy-check.ps1") {
    try {
        & "scripts\pre-deploy-check.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "❌ 预部署检查失败，更新已中止" -ForegroundColor Red
            Write-Host "   请修复问题后重试" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "❌ 预部署检查执行失败: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  预部署检查脚本不存在，跳过检查" -ForegroundColor Yellow
    Write-Host "   建议先运行: .\scripts\pre-deploy-check.ps1" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "是否继续更新？(y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "更新已取消" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📥 步骤 2/3: 拉取代码并构建" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否运行
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker 未运行，请先启动 Docker" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Docker 未运行，请先启动 Docker" -ForegroundColor Red
    exit 1
}

# 1. 拉取最新代码
Write-Host "📥 拉取最新代码..." -ForegroundColor Yellow
if (Test-Path ".git") {
    try {
        git pull origin main 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            git pull origin master 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "⚠️  Git 拉取失败，继续使用本地代码" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "⚠️  Git 拉取失败，继续使用本地代码" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  未检测到 Git 仓库，跳过代码拉取" -ForegroundColor Yellow
}

# 2. 重新构建镜像
Write-Host ""
Write-Host "🏗️  重新构建镜像..." -ForegroundColor Yellow
Write-Host "   这可能需要几分钟时间..." -ForegroundColor Gray
docker-compose build --no-cache

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 镜像构建失败" -ForegroundColor Red
    exit 1
}

# 3. 重启服务（会短暂停机）
Write-Host ""
Write-Host "🔄 重启服务（会有短暂停机，约30秒-2分钟）..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 服务启动失败" -ForegroundColor Red
    exit 1
}

# 4. 等待服务启动
Write-Host ""
Write-Host "⏳ 等待服务启动（10秒）..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 5. 检查服务状态
Write-Host ""
Write-Host "📊 检查服务状态..." -ForegroundColor Yellow
docker-compose ps

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🧪 步骤 3/3: 部署验证" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 6. 健康检查
Write-Host "🧪 健康检查..." -ForegroundColor Yellow
$maxRetries = 5
$retryCount = 0
$healthCheckPassed = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthCheckPassed = $true
            break
        }
    } catch {
        # 继续重试
    }
    $retryCount++
    Write-Host "   重试 $retryCount/$maxRetries..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
}

if ($healthCheckPassed) {
    Write-Host ""
    Write-Host "✅ 更新成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 服务访问地址：" -ForegroundColor Cyan
    $frontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" }
    $backendPort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { "8000" }
    $nginxPort = if ($env:NGINX_HTTP_PORT) { $env:NGINX_HTTP_PORT } else { "80" }
    Write-Host "   - 前端: http://localhost:$frontendPort"
    Write-Host "   - 后端 API: http://localhost:$backendPort"
    Write-Host "   - Nginx: http://localhost:$nginxPort"
    Write-Host ""
    Write-Host "📝 常用命令：" -ForegroundColor Cyan
    Write-Host "   - 查看日志: docker-compose logs -f"
    Write-Host "   - 查看状态: docker-compose ps"
    Write-Host "   - 停止服务: docker-compose stop"
} else {
    Write-Host ""
    Write-Host "❌ 更新失败，健康检查未通过" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 排查步骤：" -ForegroundColor Yellow
    Write-Host "   1. 查看后端日志: docker-compose logs backend"
    Write-Host "   2. 查看所有日志: docker-compose logs"
    Write-Host "   3. 检查服务状态: docker-compose ps"
    Write-Host ""
    exit 1
}
