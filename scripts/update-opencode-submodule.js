#!/usr/bin/env node
/**
 * Update OpenCode submodule to latest from upstream
 * Cross-platform Node.js version (works on Windows, Mac, Linux)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const submodulePath = path.join(__dirname, '../vendor/opencode');

if (!fs.existsSync(submodulePath)) {
  console.error('❌ OpenCode submodule not found at:', submodulePath);
  console.error('   Run: git submodule update --init --recursive');
  process.exit(1);
}

try {
  console.log('🔄 Updating OpenCode submodule...\n');

  // Get current branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: submodulePath,
    encoding: 'utf-8'
  }).trim();

  console.log(`📍 Current branch: ${currentBranch}\n`);

  // Fetch latest changes
  console.log('📥 Fetching latest changes from upstream...');
  execSync('git fetch origin', { cwd: submodulePath, stdio: 'inherit' });

  // Show what will be updated
  console.log('\n📊 Changes to be merged:');
  let hasChanges = false;
  try {
    const changes = execSync(`git log HEAD..origin/${currentBranch} --oneline --decorate`, {
      cwd: submodulePath,
      encoding: 'utf-8'
    });
    if (changes.trim()) {
      console.log(changes);
      hasChanges = true;
    } else {
      console.log('   (no new changes)');
    }
  } catch (e) {
    console.log('   (no new changes)');
  }

  if (!hasChanges) {
    console.log('\n✅ Submodule is already up to date!');
    process.exit(0);
  }

  // Merge latest changes
  console.log('\n🔀 Merging latest changes...');
  try {
    execSync(`git merge origin/${currentBranch}`, {
      cwd: submodulePath,
      stdio: 'inherit'
    });
  } catch (e) {
    console.error('\n⚠️  Merge conflicts detected!');
    console.error('   Please resolve conflicts in vendor/opencode, then:');
    console.error('   1. Commit the resolved changes');
    console.error('   2. Return to root and commit the submodule update');
    process.exit(1);
  }

  console.log('\n✅ Submodule updated successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Review changes: git diff vendor/opencode');
  console.log('   2. Test the update: npm run vendor:opencode:build');
  console.log('   3. Commit the update: git add vendor/opencode && git commit -m "chore: update opencode submodule"');
  console.log('   4. Rebuild and sync: npm run vendor:opencode:build && npm run vendor:opencode:sync');

} catch (error) {
  console.error('❌ Error updating submodule:', error.message);
  process.exit(1);
}
