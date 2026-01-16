#!/bin/bash
# Update OpenCode submodule to latest from upstream
# This script automates pulling the latest changes from the OpenCode repository

set -e  # Exit on error

echo "🔄 Updating OpenCode submodule..."

# Navigate to submodule directory
cd vendor/opencode

# Fetch latest changes
echo "📥 Fetching latest changes from upstream..."
git fetch origin

# Get current branch (usually main or master)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Current branch: $CURRENT_BRANCH"

# Show what will be updated
echo ""
echo "📊 Changes to be merged:"
git log HEAD..origin/$CURRENT_BRANCH --oneline --decorate || echo "   (no new changes)"

# Ask for confirmation (optional - remove for CI/CD)
read -p "Continue with update? (y/n) " -n 1 -r
echo
if [[ ! $REPO_REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Update cancelled"
    exit 1
fi

# Merge latest changes
echo "🔀 Merging latest changes..."
git merge origin/$CURRENT_BRANCH || {
    echo "⚠️  Merge conflicts detected!"
    echo "   Please resolve conflicts in vendor/opencode, then:"
    echo "   1. Commit the resolved changes"
    echo "   2. Return to root and commit the submodule update"
    exit 1
}

# Return to root
cd ../..

# Show submodule status
echo ""
echo "✅ Submodule updated successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review changes: git diff vendor/opencode"
echo "   2. Test the update: npm run vendor:opencode:build"
echo "   3. Commit the update: git add vendor/opencode && git commit -m 'chore: update opencode submodule'"
echo "   4. Rebuild and sync: npm run vendor:opencode:build && npm run vendor:opencode:sync"
