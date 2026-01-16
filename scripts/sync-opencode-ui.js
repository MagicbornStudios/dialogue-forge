#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../vendor/opencode/packages/console/app/.output/public');
const dest = path.join(__dirname, '../public/vendor/opencode');

if (!fs.existsSync(src)) {
  console.error('❌ Build output not found at:', src);
  console.error('   Run "npm run vendor:opencode:build" first.');
  process.exit(1);
}

// Remove existing destination
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
  console.log('🗑️  Removed existing build artifacts');
}

// Create destination directory
fs.mkdirSync(path.dirname(dest), { recursive: true });

// Copy build output
fs.cpSync(src, dest, { recursive: true });
console.log('✅ Synced OpenCode UI to public/vendor/opencode');
console.log(`   Source: ${src}`);
console.log(`   Destination: ${dest}`);
