# ============================================
# 快速检查脚本 (PowerShell 版本)
# ============================================
# 说明：快速检查常见问题
# 使用方法：.\scripts\quick-check.ps1

Write-Host "🔍 快速检查常见问题..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查容器是否运行
Write-Host "1️⃣  检查容器状态：" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Gray
$containers = @("npc-backend", "npc-frontend", "npc-nginx", "npc-mysql")
$allRunning = $true
foreach ($container in $containers) {
    $running = docker ps --format "{{.Names}}" | Select-String -Pattern "^${container}$"
    if ($running) {
        Write-Host "  ✅ $container : 运行中" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $container : 未运行" -ForegroundColor Red
        $allRunning = $false
    }
}
Write-Host ""

if (-not $allRunning) {
    Write-Host "⚠️  有容器未运行，请先启动：" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d" -ForegroundColor Yellow
    Write-Host ""
}

# 2. 检查后端 API Key
Write-Host "2️⃣  检查后端 API Key 配置：" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Gray
$apiKeys = docker exec npc-backend env 2>$null | Select-String -Pattern "API_KEY"
if ($apiKeys) {
    $keyCount = ($apiKeys | Measure-Object).Count
    Write-Host "  ✅ 找到 $keyCount 个 API Key 配置" -ForegroundColor Green
    $apiKeys | ForEach-Object {
        $line = $_ -replace '=.*', '=***'
        Write-Host "    $line" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ 未找到 API Key 配置" -ForegroundColor Red
    Write-Host "  💡 请在 .env 文件中配置 API Key" -ForegroundColor Yellow
}
Write-Host ""

# 3. 检查后端健康
Write-Host "3️⃣  检查后端健康状态：" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ 后端服务正常 (HTTP $($response.StatusCode))" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Compress | Write-Host -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ 后端服务异常" -ForegroundColor Red
    Write-Host "  💡 查看日志: .\scripts\view-logs.ps1 backend" -ForegroundColor Yellow
}
Write-Host ""

# 4. 检查前端健康
Write-Host "4️⃣  检查前端健康状态：" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ 前端服务正常 (HTTP $($response.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ 前端服务异常" -ForegroundColor Red
    Write-Host "  💡 查看日志: .\scripts\view-logs.ps1 frontend" -ForegroundColor Yellow
}
Write-Host ""

# 5. 检查最近的错误
Write-Host "5️⃣  检查最近的错误日志：" -ForegroundColor Yellow
Write-Host "--------------------------------------------" -ForegroundColor Gray
$errors = docker logs --tail 100 npc-backend 2>&1 | Select-String -Pattern "error|failed|❌|API_KEY_MISSING|401|429" | Select-Object -Last 5
if ($errors) {
    Write-Host "  ⚠️  发现错误：" -ForegroundColor Yellow
    $errors | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "  💡 常见错误解决方案：" -ForegroundColor Yellow
    Write-Host "    - API_KEY_MISSING: 检查 .env 文件中的 API Key 配置" -ForegroundColor Gray
    Write-Host "    - 401: API Key 无效，需要更新" -ForegroundColor Gray
    Write-Host "    - 429: API Key 达到速率限制，等待或使用其他 Key" -ForegroundColor Gray
} else {
    Write-Host "  ✅ 没有发现错误" -ForegroundColor Green
}
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ 快速检查完成" -ForegroundColor Green
Write-Host ""
Write-Host "💡 更多帮助：" -ForegroundColor Yellow
Write-Host "  - 查看详细日志: .\scripts\view-logs.ps1 backend" -ForegroundColor Gray
Write-Host "  - 查看所有日志: .\scripts\view-logs.ps1 all" -ForegroundColor Gray

