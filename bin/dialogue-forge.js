#!/usr/bin/env node

/**
 * Dialogue Forge Demo Server
 * 
 * This script starts the Next.js demo server for Dialogue Forge.
 * Users can run: npx @portfolio/dialogue-forge
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

// Check if node_modules exists (package might need install)
const nodeModulesPath = path.join(demoDir, 'node_modules');
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

