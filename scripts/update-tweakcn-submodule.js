#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const submodulePath = path.join(__dirname, '../vendor/tweakcn');

if (!fs.existsSync(submodulePath)) {
  console.error('tweakcn submodule not found at:', submodulePath);
  console.error('Run: git submodule update --init --recursive');
  process.exit(1);
}

try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: submodulePath,
    encoding: 'utf-8',
  }).trim();

  execSync('git fetch origin', { cwd: submodulePath, stdio: 'inherit' });

  let hasChanges = false;
  try {
    const changes = execSync(`git log HEAD..origin/${currentBranch} --oneline`, {
      cwd: submodulePath,
      encoding: 'utf-8',
    });
    hasChanges = Boolean(changes.trim());
  } catch {
    hasChanges = false;
  }

  if (!hasChanges) {
    console.log('tweakcn submodule is already up to date.');
    process.exit(0);
  }

  execSync(`git merge origin/${currentBranch}`, { cwd: submodulePath, stdio: 'inherit' });
  console.log('Updated tweakcn submodule.');
  console.log('Next: git add vendor/tweakcn && git commit -m "chore: update tweakcn submodule"');
} catch (error) {
  console.error('Error updating tweakcn submodule:', error.message);
  process.exit(1);
}
