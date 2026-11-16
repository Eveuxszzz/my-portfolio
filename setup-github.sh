#!/bin/bash

# GitHub Repository Setup Script for My Portfolio
# This script helps you set up your GitHub repository for the portfolio website

echo "🚀 Setting up GitHub repository for My Portfolio..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Configure git user (if not already configured)
if ! git config user.name > /dev/null 2>&1; then
    echo "⚙️  Configuring git user..."
    echo "Please enter your name:"
    read -r git_name
    git config user.name "$git_name"
    
    echo "Please enter your email:"
    read -r git_email
    git config user.email "$git_email"
fi

# Add all files
 echo "📦 Adding project files..."
    git add .

# Create initial commit
if ! git log --oneline | grep -q "Initial commit"; then
    echo "🔄 Creating initial commit..."
    git commit -m "Initial commit: My Portfolio website"
    git branch -M main
fi

# Get GitHub username
if [ -z "$GITHUB_USERNAME" ]; then
    echo "🐙 Please enter your GitHub username:"
    read -r GITHUB_USERNAME
fi

# Add remote repository
REMOTE_URL="https://github.com/${GITHUB_USERNAME}/my-portfolio.git"
if ! git remote | grep -q "origin"; then
    echo "🔗 Adding GitHub remote repository..."
    git remote add origin "$REMOTE_URL"
fi

# Push to GitHub
 echo "⬆️  Pushing to GitHub..."
    git push -u origin main

# Display success message
echo "
✅ Success! Your portfolio repository has been created on GitHub.

Next steps:
1. Visit https://github.com/${GITHUB_USERNAME}/my-portfolio
2. Go to Settings → Pages
3. Select 'main' branch as the source
4. Choose '/root' as the deployment folder
5. Your portfolio will be live at: https://${GITHUB_USERNAME}.github.io/my-portfolio

🎉 Your portfolio is ready to launch!"

# Note: You can also use the GitHub CLI to create the repository first
# if you prefer to handle the initial creation manually.

echo "
💡 Alternative: Create the repository first on GitHub, then:
gh repo create ${GITHUB_USERNAME}/my-portfolio --source=. --public --push"