# ============================================
# 本地开发环境检查脚本（PowerShell）
# ============================================
# 用途：检查本地开发环境是否配置正确
# 使用方法：在项目根目录运行：.\scripts\check-local-env.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "本地开发环境检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. 检查 Node.js
Write-Host "[1/8] 检查 Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js 已安装: $nodeVersion" -ForegroundColor Green
    
    # 检查版本是否 >= 18
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        $warnings += "Node.js 版本过低（当前: $nodeVersion，需要: v18+）"
        Write-Host "  ⚠️  Node.js 版本过低，建议升级到 v18+" -ForegroundColor Yellow
    }
} catch {
    $errors += "Node.js 未安装或不在 PATH 中"
    Write-Host "  ❌ Node.js 未安装" -ForegroundColor Red
}

Write-Host ""

# 2. 检查 npm
Write-Host "[2/8] 检查 npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  ✅ npm 已安装: v$npmVersion" -ForegroundColor Green
} catch {
    $errors += "npm 未安装或不在 PATH 中"
    Write-Host "  ❌ npm 未安装" -ForegroundColor Red
}

Write-Host ""

# 3. 检查 MySQL
Write-Host "[3/8] 检查 MySQL..." -ForegroundColor Yellow
try {
    $mysqlVersion = mysql --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ MySQL 已安装: $mysqlVersion" -ForegroundColor Green
    } else {
        $warnings += "MySQL 命令行工具未找到（可能已安装但不在 PATH 中）"
        Write-Host "  ⚠️  MySQL 命令行工具未找到" -ForegroundColor Yellow
    }
} catch {
    $warnings += "MySQL 命令行工具未找到（可能已安装但不在 PATH 中）"
    Write-Host "  ⚠️  MySQL 命令行工具未找到（可能已安装但不在 PATH 中）" -ForegroundColor Yellow
}

# 检查 MySQL 服务是否运行（Windows）
Write-Host "  检查 MySQL 服务状态..." -ForegroundColor Gray
try {
    $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
    if ($mysqlService) {
        $runningService = $mysqlService | Where-Object { $_.Status -eq 'Running' }
        if ($runningService) {
            Write-Host "  ✅ MySQL 服务正在运行" -ForegroundColor Green
        } else {
            $warnings += "MySQL 服务未运行"
            Write-Host "  ⚠️  MySQL 服务未运行，请启动 MySQL 服务" -ForegroundColor Yellow
        }
    } else {
        $warnings += "未找到 MySQL 服务（可能使用其他名称或未安装）"
        Write-Host "  ⚠️  未找到 MySQL 服务" -ForegroundColor Yellow
    }
} catch {
    $warnings += "无法检查 MySQL 服务状态"
    Write-Host "  ⚠️  无法检查 MySQL 服务状态" -ForegroundColor Yellow
}

Write-Host ""

# 4. 检查后端配置文件
Write-Host "[4/8] 检查后端配置..." -ForegroundColor Yellow
$backendConfigYaml = "npc-backend\config.yaml"
$backendConfigEnv = "npc-backend\.env"

if (Test-Path $backendConfigYaml) {
    Write-Host "  ✅ 找到 config.yaml 配置文件" -ForegroundColor Green
    
    # 检查关键配置项
    $configContent = Get-Content $backendConfigYaml -Raw
    if ($configContent -match 'password:\s*"[^"]*"') {
        $password = $configContent -replace '.*password:\s*"([^"]*)".*', '$1'
        if ($password -eq "你的MySQL密码" -or $password -eq "") {
            $errors += "后端配置文件中 MySQL 密码未设置"
            Write-Host "  ❌ MySQL 密码未设置（在 config.yaml 中）" -ForegroundColor Red
        } else {
            Write-Host "  ✅ MySQL 密码已配置" -ForegroundColor Green
        }
    }
    
    if ($configContent -match 'api_key:\s*"[^"]*"') {
        $apiKey = $configContent -replace '.*api_key:\s*"([^"]*)".*', '$1'
        if ($apiKey -eq "你的OpenRouter_API_Key" -or $apiKey -eq "") {
            $warnings += "后端配置文件中 OpenRouter API Key 未设置"
            Write-Host "  ⚠️  OpenRouter API Key 未设置（在 config.yaml 中）" -ForegroundColor Yellow
        } else {
            Write-Host "  ✅ OpenRouter API Key 已配置" -ForegroundColor Green
        }
    }
} elseif (Test-Path $backendConfigEnv) {
    Write-Host "  ✅ 找到 .env 配置文件" -ForegroundColor Green
    # 可以进一步检查 .env 文件内容
} else {
    $errors += "后端配置文件未找到（需要 config.yaml 或 .env）"
    Write-Host "  ❌ 后端配置文件未找到" -ForegroundColor Red
    Write-Host "     请创建 npc-backend\config.yaml 或 npc-backend\.env" -ForegroundColor Gray
}

Write-Host ""

# 5. 检查前端配置文件
Write-Host "[5/8] 检查前端配置..." -ForegroundColor Yellow
$frontendConfigEnv = "npc-frontend\.env"

if (Test-Path $frontendConfigEnv) {
    Write-Host "  ✅ 找到前端 .env 配置文件" -ForegroundColor Green
} else {
    $warnings += "前端 .env 文件未找到（可选，有默认值）"
    Write-Host "  ⚠️  前端 .env 文件未找到（可选）" -ForegroundColor Yellow
    Write-Host "     默认使用 http://localhost:8000" -ForegroundColor Gray
}

Write-Host ""

# 6. 检查依赖是否安装
Write-Host "[6/8] 检查依赖..." -ForegroundColor Yellow

# 检查后端依赖
if (Test-Path "npc-backend\node_modules") {
    Write-Host "  ✅ 后端依赖已安装" -ForegroundColor Green
} else {
    $warnings += "后端依赖未安装"
    Write-Host "  ⚠️  后端依赖未安装，请运行: cd npc-backend && npm install" -ForegroundColor Yellow
}

# 检查前端依赖
if (Test-Path "npc-frontend\node_modules") {
    Write-Host "  ✅ 前端依赖已安装" -ForegroundColor Green
} else {
    $warnings += "前端依赖未安装"
    Write-Host "  ⚠️  前端依赖未安装，请运行: cd npc-frontend && npm install" -ForegroundColor Yellow
}

Write-Host ""

# 7. 检查数据库是否初始化
Write-Host "[7/8] 检查数据库..." -ForegroundColor Yellow
# 这里可以尝试连接数据库检查表是否存在
# 由于需要密码，暂时跳过详细检查
Write-Host "  ℹ️  数据库初始化检查需要手动验证" -ForegroundColor Gray
Write-Host "     请运行: cd npc-backend && npm run db:init" -ForegroundColor Gray

Write-Host ""

# 8. 检查端口占用
Write-Host "[8/8] 检查端口占用..." -ForegroundColor Yellow

# 检查后端端口 8000
$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "  ⚠️  端口 8000 已被占用（后端端口）" -ForegroundColor Yellow
    Write-Host "     占用进程: $($port8000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "  ✅ 端口 8000 可用（后端端口）" -ForegroundColor Green
}

# 检查前端端口 3000
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "  ⚠️  端口 3000 已被占用（前端端口）" -ForegroundColor Yellow
    Write-Host "     占用进程: $($port3000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "  ✅ 端口 3000 可用（前端端口）" -ForegroundColor Green
}

Write-Host ""

# 总结
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "检查结果总结" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ 所有检查通过！可以开始开发了。" -ForegroundColor Green
} else {
    if ($errors.Count -gt 0) {
        Write-Host "❌ 发现 $($errors.Count) 个错误：" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "   - $error" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  发现 $($warnings.Count) 个警告：" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   - $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "请参考《本地开发环境配置指南.md》解决这些问题。" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "快速启动命令：" -ForegroundColor Cyan
Write-Host "  npm run dev          # 一键启动前后端" -ForegroundColor Gray
Write-Host "  或" -ForegroundColor Gray
Write-Host "  cd npc-backend && npm run dev    # 启动后端" -ForegroundColor Gray
Write-Host "  cd npc-frontend && npm run dev   # 启动前端" -ForegroundColor Gray

