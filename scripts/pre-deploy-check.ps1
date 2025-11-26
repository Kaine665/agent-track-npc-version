# ============================================
# 预部署检查脚本 (PowerShell 版本)
# ============================================
# 说明：在部署前检查代码质量、运行测试、确保代码没有问题
# 使用方法：.\scripts\pre-deploy-check.ps1
# 最后更新：2025-01-XX

# 设置控制台输出编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Continue"

Write-Host "🔍 开始预部署检查..." -ForegroundColor Cyan
Write-Host ""

# 检查是否在项目根目录
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ 错误：请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查结果统计
$script:CHECKS_PASSED = 0
$script:CHECKS_FAILED = 0
$script:CHECKS_SKIPPED = 0

# 检查函数
function Check-Pass {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $script:CHECKS_PASSED++
}

function Check-Fail {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:CHECKS_FAILED++
}

function Check-Skip {
    param([string]$Message)
    Write-Host "⏭️  $Message (跳过)" -ForegroundColor Yellow
    $script:CHECKS_SKIPPED++
}

# ==================== 1. Git 状态检查 ====================
Write-Host "📋 1. 检查 Git 状态..." -ForegroundColor Cyan

if (Test-Path ".git") {
    try {
        $gitStatus = git status --porcelain 2>&1
        if ($gitStatus -and $gitStatus.Count -gt 0) {
            Write-Host "⚠️  检测到未提交的更改：" -ForegroundColor Yellow
            git status --short
            Write-Host ""
            $continue = Read-Host "是否继续？(y/n)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Host "❌ 检查中止：请先提交或暂存更改" -ForegroundColor Red
                exit 1
            }
            Check-Skip "Git 状态检查（有未提交更改但继续）"
        } else {
            Check-Pass "Git 状态检查（无未提交更改）"
        }
        
        $currentBranch = git branch --show-current 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   当前分支: $currentBranch"
            if ($currentBranch -eq "main" -or $currentBranch -eq "master") {
                Write-Host "   ⚠️  你在主分支上，确保代码已经测试过" -ForegroundColor Yellow
            }
        }
    } catch {
        Check-Skip "Git 状态检查（Git 命令执行失败）"
    }
} else {
    Check-Skip "Git 状态检查（未检测到 Git 仓库）"
}

Write-Host ""

# ==================== 2. 环境变量检查 ====================
Write-Host "📋 2. 检查环境变量配置..." -ForegroundColor Cyan

if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
    $missingVars = @()
    
    if (-not $envContent -or $envContent -match "DB_PASSWORD=your_mysql_password" -or $envContent -notmatch "DB_PASSWORD=") {
        $missingVars += "DB_PASSWORD"
    }
    
    if (-not $envContent -or $envContent -match "OPENROUTER_API_KEY=your_openrouter_api_key" -or $envContent -notmatch "OPENROUTER_API_KEY=") {
        $missingVars += "OPENROUTER_API_KEY"
    }
    
    if ($missingVars.Count -eq 0) {
        Check-Pass "环境变量检查（关键变量已配置）"
    } else {
        Check-Fail "环境变量检查（缺少关键变量: $($missingVars -join ', ')）"
        Write-Host "   请检查 .env 文件中的配置"
    }
} else {
    Check-Fail "环境变量检查（.env 文件不存在）"
    Write-Host "   请复制 env.example 为 .env 并配置"
}

Write-Host ""

# ==================== 3. 后端检查 ====================
Write-Host "📋 3. 检查后端代码..." -ForegroundColor Cyan

if (Test-Path "npc-backend") {
    Push-Location "npc-backend"
    
    # 3.1 检查依赖是否安装
    if (-not (Test-Path "node_modules")) {
        Write-Host "   📦 安装后端依赖..." -ForegroundColor Yellow
        npm install
    }
    
    # 3.2 运行测试
    Write-Host "   🧪 运行后端测试..." -ForegroundColor Yellow
    try {
        $testOutput = npm test 2>&1 | Tee-Object -FilePath "$env:TEMP\backend-test.log"
        if ($LASTEXITCODE -eq 0) {
            Check-Pass "后端测试"
        } else {
            Check-Fail "后端测试失败"
            Write-Host "   测试日志已保存到 $env:TEMP\backend-test.log"
            Pop-Location
            if ($script:CHECKS_FAILED -gt 0) {
                Write-Host ""
                Write-Host "❌ 预部署检查失败，请修复问题后重试" -ForegroundColor Red
                exit 1
            }
        }
    } catch {
        Check-Fail "后端测试执行失败: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
} else {
    Check-Skip "后端检查（npc-backend 目录不存在）"
}

Write-Host ""

# ==================== 4. 前端检查 ====================
Write-Host "📋 4. 检查前端代码..." -ForegroundColor Cyan

if (Test-Path "npc-frontend") {
    Push-Location "npc-frontend"
    
    # 4.1 检查依赖是否安装
    if (-not (Test-Path "node_modules")) {
        Write-Host "   📦 安装前端依赖..." -ForegroundColor Yellow
        npm install
    }
    
    # 4.2 代码检查（Lint）
    Write-Host "   🔍 运行 ESLint 检查..." -ForegroundColor Yellow
    try {
        $lintOutput = npm run lint 2>&1 | Tee-Object -FilePath "$env:TEMP\frontend-lint.log"
        if ($LASTEXITCODE -eq 0) {
            Check-Pass "前端代码检查（ESLint）"
        } else {
            Check-Fail "前端代码检查失败（ESLint 发现错误）"
            Write-Host "   Lint 日志已保存到 $env:TEMP\frontend-lint.log"
            Write-Host "   请修复代码问题后重试"
            Pop-Location
            if ($script:CHECKS_FAILED -gt 0) {
                Write-Host ""
                Write-Host "❌ 预部署检查失败，请修复问题后重试" -ForegroundColor Red
                exit 1
            }
        }
    } catch {
        Check-Fail "前端 Lint 执行失败: $_"
        Pop-Location
        exit 1
    }
    
    # 4.3 构建测试
    Write-Host "   🏗️  测试前端构建..." -ForegroundColor Yellow
    try {
        $buildOutput = npm run build 2>&1 | Tee-Object -FilePath "$env:TEMP\frontend-build.log"
        if ($LASTEXITCODE -eq 0) {
            Check-Pass "前端构建测试"
        } else {
            Check-Fail "前端构建失败"
            Write-Host "   构建日志已保存到 $env:TEMP\frontend-build.log"
            Pop-Location
            if ($script:CHECKS_FAILED -gt 0) {
                Write-Host ""
                Write-Host "❌ 预部署检查失败，请修复问题后重试" -ForegroundColor Red
                exit 1
            }
        }
    } catch {
        Check-Fail "前端构建执行失败: $_"
        Pop-Location
        exit 1
    }
    
    Pop-Location
} else {
    Check-Skip "前端检查（npc-frontend 目录不存在）"
}

Write-Host ""

# ==================== 5. Docker 检查 ====================
Write-Host "📋 5. 检查 Docker 环境..." -ForegroundColor Cyan

try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Check-Pass "Docker 运行状态"
        
        # 检查 Docker Compose
        $composeCheck = $false
        try {
            docker compose version 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Check-Pass "Docker Compose 可用"
                $composeCheck = $true
            }
        } catch {
            # 继续尝试 docker-compose
        }
        
        if (-not $composeCheck) {
            try {
                docker-compose version 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Check-Pass "Docker Compose 可用"
                } else {
                    Check-Fail "Docker Compose 不可用"
                }
            } catch {
                Check-Fail "Docker Compose 不可用"
            }
        }
    } else {
        Check-Fail "Docker 未运行"
    }
} catch {
    Check-Fail "Docker 未安装"
}

Write-Host ""

# ==================== 6. 配置文件检查 ====================
Write-Host "📋 6. 检查配置文件..." -ForegroundColor Cyan

$configFiles = @("docker-compose.yml", "nginx/nginx.conf", "nginx/conf.d/default.conf")

foreach ($configFile in $configFiles) {
    if (Test-Path $configFile) {
        Check-Pass "配置文件存在: $configFile"
    } else {
        Check-Fail "配置文件缺失: $configFile"
    }
}

Write-Host ""

# ==================== 总结 ====================
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 预部署检查总结" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ 通过: $script:CHECKS_PASSED" -ForegroundColor Green
Write-Host "❌ 失败: $script:CHECKS_FAILED" -ForegroundColor Red
Write-Host "⏭️  跳过: $script:CHECKS_SKIPPED" -ForegroundColor Yellow
Write-Host ""

if ($script:CHECKS_FAILED -gt 0) {
    Write-Host "❌ 预部署检查失败！" -ForegroundColor Red
    Write-Host "   请修复上述问题后重试"
    Write-Host ""
    Write-Host "💡 提示：" -ForegroundColor Yellow
    Write-Host "   - 查看测试日志: Get-Content $env:TEMP\backend-test.log"
    Write-Host "   - 查看 Lint 日志: Get-Content $env:TEMP\frontend-lint.log"
    Write-Host "   - 查看构建日志: Get-Content $env:TEMP\frontend-build.log"
    exit 1
} else {
    Write-Host "✅ 预部署检查全部通过！" -ForegroundColor Green
    Write-Host "   可以安全地进行部署了"
    Write-Host ""
    exit 0
}
