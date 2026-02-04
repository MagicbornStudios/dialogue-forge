const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const replacements = [
  ['packages/dialogue-forge/src/forge/runtime/engine/', 'packages/runtime/src/engine/'],
  ['packages/dialogue-forge/src/forge/runtime/__tests__/fixtures/', 'packages/runtime/src/__tests__/fixtures/'],
  ['packages/dialogue-forge/src/forge/runtime/', 'packages/runtime/src/'],
  ['packages/dialogue-forge/src/styles/', 'packages/shared/src/styles/'],
  ['packages/dialogue-forge/src/forge/styles/', 'packages/forge/src/styles/'],
  ['packages/dialogue-forge/src/shared/', 'packages/shared/src/'],
  ['packages/dialogue-forge/src/forge/', 'packages/forge/src/'],
  ['packages/dialogue-forge/src/writer/', 'packages/writer/src/'],
  ['packages/dialogue-forge/src/video/', 'packages/video/src/'],
  ['packages/dialogue-forge/src/characters/', 'packages/characters/src/'],
  ['packages/dialogue-forge/src/ai/', 'packages/ai/src/'],
];

const fileExtensions = new Set(['.md']);

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
      continue;
    }
    if (!fileExtensions.has(path.extname(entry.name))) {
      continue;
    }
    results.push(fullPath);
  }
  return results;
}

function replaceContent(content) {
  let updated = content;
  for (const [from, to] of replacements) {
    updated = updated.split(from).join(to);
  }
  return updated;
}

const targets = [
  path.join(repoRoot, 'docs'),
  path.join(repoRoot, 'ARCHITECTURE.md'),
  path.join(repoRoot, 'ARCHITECTURE_REVIEW.md'),
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'ROADMAP.md'),
  path.join(repoRoot, 'CHANGELOG.md'),
];

const files = targets.flatMap((target) => {
  if (!fs.existsSync(target)) {
    return [];
  }
  if (fs.statSync(target).isDirectory()) {
    return walk(target);
  }
  return [target];
});

let updatedCount = 0;

for (const filePath of files) {
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = replaceContent(original);
  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    updatedCount += 1;
  }
}

console.log(`Updated ${updatedCount} markdown files.`);
