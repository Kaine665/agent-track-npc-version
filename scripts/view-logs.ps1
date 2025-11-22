# ============================================
# 日志查看脚本 (PowerShell 版本)
# ============================================
# 说明：快速查看各个服务的日志
# 使用方法：.\scripts\view-logs.ps1 [service]
# 示例：
#   .\scripts\view-logs.ps1 backend    # 查看后端日志
#   .\scripts\view-logs.ps1 frontend   # 查看前端日志
#   .\scripts\view-logs.ps1 nginx      # 查看 Nginx 日志
#   .\scripts\view-logs.ps1 mysql      # 查看数据库日志
#   .\scripts\view-logs.ps1 all        # 查看所有服务日志

param(
    [string]$Service = "backend"
)

switch ($Service) {
    "backend" {
        Write-Host "📋 查看后端日志（按 Ctrl+C 退出）..." -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        docker logs -f npc-backend
    }
    "frontend" {
        Write-Host "📋 查看前端日志（按 Ctrl+C 退出）..." -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        docker logs -f npc-frontend
    }
    "nginx" {
        Write-Host "📋 查看 Nginx 日志（按 Ctrl+C 退出）..." -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        docker logs -f npc-nginx
    }
    "mysql" {
        Write-Host "📋 查看数据库日志（按 Ctrl+C 退出）..." -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        docker logs -f npc-mysql
    }
    "all" {
        Write-Host "📋 查看所有服务日志（按 Ctrl+C 退出）..." -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Cyan
        docker-compose logs -f
    }
    default {
        Write-Host "❌ 未知的服务名称: $Service" -ForegroundColor Red
        Write-Host ""
        Write-Host "使用方法: .\scripts\view-logs.ps1 [service]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "可用服务:" -ForegroundColor Yellow
        Write-Host "  backend   - 后端服务日志"
        Write-Host "  frontend  - 前端服务日志"
        Write-Host "  nginx     - Nginx 日志"
        Write-Host "  mysql     - 数据库日志"
        Write-Host "  all       - 所有服务日志"
        exit 1
    }
}

