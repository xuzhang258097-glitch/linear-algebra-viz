# ============================================
# LinearViz - GitHub Upload Script
# 一键上传到 GitHub 并开启 GitHub Pages
# ============================================

$repoName = "linear-algebra-viz"
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$msg)
    Write-Host "`n[>] $msg" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$msg)
    Write-Host "[OK] $msg" -ForegroundColor Green
}

function Write-Warn {
    param([string]$msg)
    Write-Host "[!] $msg" -ForegroundColor Yellow
}

# Step 1: Check / Install GitHub CLI
Write-Step "检查 GitHub CLI (gh)..."
try {
    $ghVersion = gh --version 2>$null
    Write-Success "GitHub CLI 已安装"
} catch {
    Write-Warn "GitHub CLI 未安装，正在下载..."
    $ghZip = "$env:TEMP\gh.zip"
    $ghUrl = "https://github.com/cli/cli/releases/download/v2.52.0/gh_2.52.0_windows_amd64.zip"
    try {
        Invoke-WebRequest -Uri $ghUrl -OutFile $ghZip -UseBasicParsing
        Expand-Archive -Path $ghZip -DestinationPath "$env:TEMP\gh" -Force
        $ghBin = "$env:TEMP\gh\bin"
        $env:Path += ";$ghBin"
        Write-Success "GitHub CLI 下载完成"
    } catch {
        Write-Host "下载失败，请手动安装 GitHub CLI: https://cli.github.com/" -ForegroundColor Red
        exit 1
    }
}

# Step 2: GitHub Auth
Write-Step "检查 GitHub 登录状态..."
$authStatus = gh auth status 2>&1
if ($authStatus -match "not logged") {
    Write-Warn "未登录 GitHub，正在启动浏览器登录..."
    gh auth login --web --git-protocol https
} else {
    Write-Success "GitHub 已登录"
}

# Step 3: Get GitHub username
$username = gh api user --jq '.login' 2>$null
if (-not $username) {
    Write-Host "无法获取 GitHub 用户名，请确保已登录" -ForegroundColor Red
    exit 1
}
Write-Success "GitHub 用户名: $username"

# Step 4: Create repo
Write-Step "创建 GitHub 仓库: $repoName..."
$repoExists = gh repo view "$username/$repoName" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Warn "仓库 $repoName 已存在，将直接推送"
} else {
    gh repo create $repoName --public --source=. --remote=origin --push
    Write-Success "仓库创建完成"
    exit 0
}

# Step 5: Configure remote and push
Write-Step "配置远程仓库并推送..."
git remote remove origin 2>$null
git remote add origin "https://github.com/$username/$repoName.git"
git branch -M main
git push -u origin main
Write-Success "代码已推送到 GitHub"

# Step 6: Enable GitHub Pages
Write-Step "开启 GitHub Pages..."
gh api -X PUT "repos/$username/$repoName/pages" `
    -F "source[branch]=main" `
    -F "source[path]=/" 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Warn "API 开启 Pages 失败，请在仓库设置中手动开启:"
    Write-Host "   https://github.com/$username/$repoName/settings/pages" -ForegroundColor Yellow
} else {
    Write-Success "GitHub Pages 已开启"
}

# Step 7: Done
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  上传完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  仓库地址: https://github.com/$username/$repoName" -ForegroundColor White
Write-Host "  Pages 地址: https://$username.github.io/$repoName/" -ForegroundColor White
Write-Host ""
Write-Host "  注意: Pages 首次部署可能需要 1-5 分钟" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
