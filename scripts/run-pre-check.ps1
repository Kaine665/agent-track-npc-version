# PowerShell 编码设置包装脚本
# 用于解决中文编码问题

# 设置代码页为 UTF-8
chcp 65001 | Out-Null

# 设置控制台输出编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# 运行预部署检查脚本
& "$PSScriptRoot\pre-deploy-check.ps1"

