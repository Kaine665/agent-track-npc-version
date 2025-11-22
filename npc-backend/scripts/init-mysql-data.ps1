# ============================================
# MySQL Data Directory Initialization Script
# ============================================
# 
# Usage:
# 1. Run PowerShell as Administrator
# 2. Execute: .\scripts\init-mysql-data.ps1
#
# Important:
# - Requires Administrator privileges
# - Will stop MySQL service
# - Will initialize data directory if not exists
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "MySQL Data Directory Initialization Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Administrator privileges required!" -ForegroundColor Red
    Write-Host "[TIP] Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# MySQL paths
$mysqlBinPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$mysqldPath = Join-Path $mysqlBinPath "mysqld.exe"
$dataDir = "C:\ProgramData\MySQL\MySQL Server 8.0\Data"

# Check if MySQL exists
if (-not (Test-Path $mysqldPath)) {
    Write-Host "[ERROR] MySQL not found!" -ForegroundColor Red
    Write-Host "[TIP] Please check if MySQL is installed at: $mysqlBinPath" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Found MySQL: $mysqldPath" -ForegroundColor Green
Write-Host ""

# Step 1: Stop MySQL service
Write-Host "Step 1: Stopping MySQL service..." -ForegroundColor Cyan
try {
    $mysqlService = Get-Service -Name MySQL80 -ErrorAction SilentlyContinue
    if ($mysqlService) {
        if ($mysqlService.Status -eq "Running") {
            Stop-Service -Name MySQL80 -Force
            Write-Host "[OK] MySQL service stopped" -ForegroundColor Green
        } else {
            Write-Host "[INFO] MySQL service is not running" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] MySQL80 service not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Error stopping service: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Check data directory
Write-Host "Step 2: Checking data directory..." -ForegroundColor Cyan
if (Test-Path $dataDir) {
    $dataFiles = Get-ChildItem $dataDir -ErrorAction SilentlyContinue
    if ($dataFiles.Count -gt 0) {
        Write-Host "[OK] Data directory exists with $($dataFiles.Count) files/folders" -ForegroundColor Green
        Write-Host "[TIP] If MySQL cannot start, may need to reinitialize" -ForegroundColor Yellow
        $reinit = Read-Host "Reinitialize data directory? (y/n)"
        if ($reinit -ne "y" -and $reinit -ne "Y") {
            Write-Host "[INFO] Skipping initialization" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Next step: Try to start MySQL service" -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 0
        }
        
        # Backup existing data directory
        $backupDir = "$dataDir.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
        Write-Host "[INFO] Backing up existing data directory to: $backupDir" -ForegroundColor Yellow
        try {
            Move-Item $dataDir $backupDir -Force
            Write-Host "[OK] Backup completed" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Backup failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "[TIP] Please manually backup or delete data directory" -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Host "[INFO] Data directory exists but is empty, will initialize" -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Data directory does not exist, will create and initialize" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

Write-Host ""

# Step 3: Initialize data directory
Write-Host "Step 3: Initializing data directory..." -ForegroundColor Cyan
Write-Host "[TIP] This may take a few minutes, please wait..." -ForegroundColor Yellow
Write-Host ""

try {
    # Change to MySQL bin directory
    Push-Location $mysqlBinPath
    
    # Initialize data directory (using --initialize-insecure to create root user without password)
    $initProcess = Start-Process -FilePath $mysqldPath -ArgumentList "--initialize-insecure", "--datadir=$dataDir" -Wait -NoNewWindow -PassThru
    
    if ($initProcess.ExitCode -eq 0) {
        Write-Host "[OK] Data directory initialized successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Initialization failed, exit code: $($initProcess.ExitCode)" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Pop-Location
} catch {
    Write-Host "[ERROR] Initialization failed: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 4: Start MySQL service
Write-Host "Step 4: Starting MySQL service..." -ForegroundColor Cyan
try {
    Start-Service -Name MySQL80
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name MySQL80
    if ($service.Status -eq "Running") {
        Write-Host "[OK] MySQL service started" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] MySQL service status: $($service.Status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Error starting service: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "[TIP] Please start MySQL service manually" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Test connection
Write-Host "Step 5: Testing connection..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

try {
    Push-Location $mysqlBinPath
    $mysqlPath = Join-Path $mysqlBinPath "mysql.exe"
    $testResult = & $mysqlPath -u root -e "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] MySQL connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "[SUCCESS] Initialization completed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Important information:" -ForegroundColor Yellow
        Write-Host "- Root user currently has no password (using --initialize-insecure)" -ForegroundColor Yellow
        Write-Host "- You can connect using: mysql -u root" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Set root password (optional)" -ForegroundColor Yellow
        Write-Host "2. Update DB_PASSWORD in .env file (if password is set)" -ForegroundColor Yellow
        Write-Host "3. Run: npm run db:init" -ForegroundColor Yellow
    } else {
        Write-Host "[WARNING] Connection test failed, but service may be running" -ForegroundColor Yellow
        Write-Host "[TIP] Please test connection manually" -ForegroundColor Yellow
    }
    
    Pop-Location
} catch {
    Write-Host "[WARNING] Error testing connection: $($_.Exception.Message)" -ForegroundColor Yellow
    Pop-Location
}

Write-Host ""
Read-Host "Press Enter to exit"
