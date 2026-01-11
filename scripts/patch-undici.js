#!/usr/bin/env node

/**
 * Patch undici CacheStorage constructor to fix Node.js 20 compatibility issue
 * This fixes the "Illegal constructor" error when running payload generate:types
 */

const fs = require('fs');
const path = require('path');

const undiciPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'payload',
  'node_modules',
  'undici',
  'lib',
  'web',
  'cache',
  'cachestorage.js'
);

if (fs.existsSync(undiciPath)) {
  let content = fs.readFileSync(undiciPath, 'utf8');
  
  // Check if already patched
  if (content.includes('Bypass constructor check')) {
    console.log('✓ undici CacheStorage already patched');
    return;
  }
  
  // Apply patch
  const originalConstructor = `  constructor () {
    if (arguments[0] !== kConstruct) {
      webidl.illegalConstructor()
    }

    webidl.util.markAsUncloneable(this)
  }`;
  
  const patchedConstructor = `  constructor () {
    // Bypass constructor check to fix Node.js 20 compatibility issue
    // The kConstruct symbol check fails in some environments
    try {
      webidl.util.markAsUncloneable(this)
    } catch (e) {
      // Ignore if markAsUncloneable fails
    }
  }`;
  
  if (content.includes(originalConstructor)) {
    content = content.replace(originalConstructor, patchedConstructor);
    fs.writeFileSync(undiciPath, content, 'utf8');
    console.log('✓ Patched undici CacheStorage constructor');
  } else {
    console.log('⚠ Could not find constructor to patch (may already be patched or structure changed)');
  }
} else {
  console.log('⚠ undici not found at expected path, skipping patch');
}
