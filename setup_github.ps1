# PowerShell script to set up GitHub repository for My Portfolio
# Run this script from the project directory

Write-Host "🚀 Setting up GitHub repository for My Portfolio..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Configure git user (if not already configured)
if (-not (git config user.name)) {
    Write-Host "⚙️  Configuring git user..." -ForegroundColor Yellow
    $git_name = Read-Host "Please enter your name"
    git config user.name $git_name
    
    $git_email = Read-Host "Please enter your email"
    git config user.email $git_email
}

# Add all files
Write-Host "📦 Adding project files..." -ForegroundColor Yellow
git add .

# Create initial commit
$has_initial_commit = git log --oneline | Select-String -Pattern "Initial commit"
if (-not $has_initial_commit) {
    Write-Host "🔄 Creating initial commit..." -ForegroundColor Yellow
    git commit -m "Initial commit: My Portfolio website"
    git branch -M main
}

# Get GitHub username
if (-not $env:GITHUB_USERNAME) {
    $GITHUB_USERNAME = Read-Host "🐙 Please enter your GitHub username"
    $env:GITHUB_USERNAME = $GITHUB_USERNAME
}

# Add remote repository
$REMOTE_URL = "https://github.com/$env:GITHUB_USERNAME/my-portfolio.git"
$has_origin = git remote | Select-String -Pattern "origin"
if (-not $has_origin) {
    Write-Host "🔗 Adding GitHub remote repository..." -ForegroundColor Yellow
    git remote add origin $REMOTE_URL
}

# Push to GitHub
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

# Display success message
Write-Host "" -ForegroundColor White
Write-Host "✅ Success! Your portfolio repository has been created on GitHub." -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Visit https://github.com/$env:GITHUB_USERNAME/my-portfolio" -ForegroundColor White
Write-Host "2. Go to Settings → Pages" -ForegroundColor White
Write-Host "3. Select 'main' branch as the source" -ForegroundColor White
Write-Host "4. Choose '/root' as the deployment folder" -ForegroundColor White
Write-Host "5. Your portfolio will be live at: https://$env:GITHUB_USERNAME.github.io/my-portfolio" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "🎉 Your portfolio is ready to launch!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "💡 Alternative: Create the repository first on GitHub, then:" -ForegroundColor Gray
Write-Host "   gh repo create $env:GITHUB_USERNAME/my-portfolio --source=. --public --push" -ForegroundColor Gray