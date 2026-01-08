#!/usr/bin/env node

/**
 * Dialogue Forge Demo Server
 * 
 * This script starts the Next.js demo server for Dialogue Forge.
 * Users can run: npx @magicborn/dialogue-forge
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this package is installed
const packageDir = path.resolve(__dirname, '..');
const demoDir = path.join(packageDir, 'demo');

// Check if demo directory exists
if (!fs.existsSync(demoDir)) {
  console.error('❌ Demo directory not found. Make sure the package is properly installed.');
  process.exit(1);
}

// Check if we're in a published package (has node_modules/@magicborn) or local dev
const isPublished = fs.existsSync(path.join(packageDir, 'node_modules', '@magicborn'));
const nodeModulesPath = path.join(demoDir, 'node_modules');

// For published packages, use npm package references
// For local dev, use file references (already set in package.json)
if (isPublished) {
  // Update demo package.json to use published packages
  const demoPackageJson = path.join(demoDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(demoPackageJson, 'utf8'));
  pkg.dependencies['@magicborn/dialogue-forge'] = '*';
  pkg.dependencies['@magicborn/server-template'] = '*';
  fs.writeFileSync(demoPackageJson, JSON.stringify(pkg, null, 2));
}

if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  const install = spawn('npm', ['install'], {
    cwd: demoDir,
    stdio: 'inherit',
    shell: true,
  });

  install.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  console.log('🚀 Starting Dialogue Forge Demo Server...');
  console.log('📖 Open http://localhost:3000 in your browser\n');

  const dev = spawn('npm', ['run', 'dev'], {
    cwd: demoDir,
    stdio: 'inherit',
    shell: true,
  });

  dev.on('close', (code) => {
    process.exit(code);
  });

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    dev.kill('SIGINT');
    process.exit(0);
  });
}

