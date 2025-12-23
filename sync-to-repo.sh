#!/bin/bash

# Sync dialogue-forge package to its own GitHub repo
# This script pushes the package to MagicbornStudios/dialogue-forge
# When pushed to main, GitHub Actions will automatically publish to npm

set -e

PACKAGE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_NAME="dialogue-forge"
REPO_URL="https://github.com/MagicbornStudios/$PACKAGE_NAME.git"

echo "🔄 Syncing $PACKAGE_NAME to its own repository..."

cd "$PACKAGE_DIR"

# Check if git repo is initialized
if [ ! -d ".git" ]; then
  echo "❌ Git repo not initialized. Run: git init"
  exit 1
fi

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
  echo "📡 Adding remote origin..."
  git remote add origin "$REPO_URL"
fi

# Verify remote URL
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
  echo "🔄 Updating remote URL..."
  git remote set-url origin "$REPO_URL"
fi

# Ensure we're on main branch
git checkout -b main 2>/dev/null || git checkout main

# Stage all files
echo "📦 Staging files..."
git add -A

# Check if there are changes
if git diff --staged --quiet; then
  echo "✅ No changes to commit"
else
  # Commit changes
  echo "💾 Committing changes..."
  git commit -m "Update package from monorepo" || echo "No changes to commit"
fi

# Push to remote main branch
echo "🚀 Pushing to GitHub main branch..."
echo "   (This will trigger automatic npm publish via GitHub Actions)"
git push -u origin main || git push -u origin master || {
  echo "⚠️  Push failed. You may need to:"
  echo "   1. Create the repo on GitHub first"
  echo "   2. Set up authentication"
  echo "   3. Run: git push -u origin main"
  exit 1
}

echo "✅ Sync complete!"
echo "📦 GitHub Actions will automatically publish to npm on main branch push"

