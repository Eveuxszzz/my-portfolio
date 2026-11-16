# GitHub Repository Setup Guide

This guide will help you set up your GitHub repository for your portfolio website.

## Prerequisites

Before setting up your GitHub repository, make sure you have:

1. **Git installed** - Check with `git --version`
2. **GitHub account** - Create one if you don't have one
3. **GitHub CLI (gh) optional** - Can be used to automate repository creation

## Step-by-Step Setup

### Step 1: Create GitHub Repository

Option A: Manual Creation (Recommended)
1. Go to [GitHub.com](https://github.com)
2. Click the "New repository" button
3. Fill in the details:
   - **Repository name**: `my-portfolio`
   - **Visibility**: `Public` (as requested)
   - **Description**: "My personal portfolio website"
   - **Owner**: Your GitHub username
   - **Check**: "Initialize this repository with a README" (optional, since we already have one)
4. Click "Create repository"

Option B: Using GitHub CLI (if installed)
```bash
gh repo create your-username/my-portfolio --public --description="My personal portfolio website"
```

### Step 2: Clone Your Repository

Once created, clone the repository to your local machine:

```bash
# If you created it manually
git clone https://github.com/your-username/my-portfolio.git

# If you used GitHub CLI
git clone https://github.com/your-username/my-portfolio.git

cd my-portfolio
```

### Step 3: Add Local Project Files

Your local project files are already in the `my-portfolio` directory. You'll need to:

1. **Check the current status:**
   ```bash
   git status
   ```

2. **Add all project files:**
   ```bash
   git add .
   ```

3. **Create initial commit:**
   ```bash
   git commit -m "Initial commit: My Portfolio website"
   ```

### Step 4: Configure Remote Repository

Set the GitHub repository as the remote origin:

```bash
# Replace 'your-username' with your actual GitHub username
git remote add origin https://github.com/your-username/my-portfolio.git
```

### Step 5: Set Main Branch

Ensure you're on the main branch:

```bash
git branch -M main
git branch
git push -u origin main
```

## Using PowerShell Script

Alternatively, you can use the provided PowerShell script `setup_github.ps1`:

1. Open PowerShell in the project directory
2. Run: `.
setup_github.ps1`
3. Follow the prompts for your GitHub username and commit details

## GitHub Pages Setup

After pushing your code:

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select:
   - **Branch**: `main`
   - **Folder**: `/root` (default)
5. Click "Save"
6. Wait a few minutes for deployment

Your portfolio will be live at: `https://your-username.github.io/my-portfolio`

## Project Structure

Your portfolio website includes:

### Core Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration

### Source Code
- `src/` - All React source code
  - `components/` - Reusable UI components
  - `pages/` - Page components
  - `test/` - Testing setup

### Documentation
- `README.md` - Basic usage instructions
- `GITHUB_SETUP.md` - This guide
- `PROJECT_SUMMARY.md` - Project details

### Configuration
- `.gitignore` - Git ignore patterns
- `setup_github.ps1` - PowerShell setup script

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Git Operations
```bash
# Check status
git status

# View recent commits
ggit log --oneline

# Check branches
git branch

# Pull updates from remote
git pull origin main
```

## Troubleshooting

### Common Issues

**Issue: "fatal: repository 'https://github.com/...' not found"**
```bash
# Delete the local repository and re-clone
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/my-portfolio.git
git push -u origin main
```

**Issue: Permission denied (publickey)**
```bash
# Check SSH configuration
ssh -T git@github.com

# Configure SSH key if needed
gh auth login
```

**Issue: Files not tracked**
```bash
git status
git add .
git commit -m "Update: Add project files"
```

### Getting Started

If this is your first time with Git:

1. **Install Git:**
   - Windows: Download from https://git-scm.com/download/win
   - macOS: `brew install git`
   - Linux: `sudo apt install git`

2. **Configure Git:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. **Verify setup:
   ```bash
   git config --global user.name
git config --global user.email
   ```

## Files to Add/Modify

### Add to .gitignore:
- `*.log`
- `node_modules/`
- `dist/`
- `build/`
- `.env`
- `.env.local`

### Update package.json:
```json
{
  "name": "my-portfolio",
  "version": "1.0.إلىاس",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext .ts,.tsx",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.18",
    "typescript": "^5.6.2",
    "vite": "^5.4.10"
  }
}
```

## Advanced Configuration

### GitHub Actions (Optional)

Add a `.github/workflows/` directory for CI/CD:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm install
      - name: Build project
        run: npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Final Steps

1. **Complete the GitHub setup** as described above
2. **Push all changes** to your remote repository
3. **Enable GitHub Pages** for deployment
4. **Test your portfolio** locally before going live
5. **Customize** the content with your information
6. **Share** your portfolio with others!

## Support

If you encounter any issues:

1. **Check GitHub Docs:** https://docs.github.com
2. **GitHub Community:** https://github.com/community
3. **Stack Overflow:** Search for "GitHub Pages setup" with error messages
4. **Contact Support:** Through GitHub's official channels

Your portfolio website is now ready for GitHub deployment! Follow these steps, and you'll have a professional portfolio website live on GitHub Pages in no time.