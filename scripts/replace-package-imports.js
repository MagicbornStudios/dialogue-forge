const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const domainMap = {
  shared: '@magicborn/shared',
  runtime: '@magicborn/runtime',
  forge: '@magicborn/forge',
  writer: '@magicborn/writer',
  video: '@magicborn/video',
  characters: '@magicborn/characters',
  ai: '@magicborn/ai',
};

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

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

function replaceDomainImports(content) {
  let updated = content;
  for (const [domain, target] of Object.entries(domainMap)) {
    const pattern = new RegExp(`(@magicborn\\/dialogue-forge\\/${domain})(\\/[^'"\\s]*)?`, 'g');
    updated = updated.replace(pattern, (_match, _prefix, suffix) => {
      return `${target}${suffix || ''}`;
    });
  }
  return updated;
}

function run() {
  const targets = [
    path.join(repoRoot, 'packages'),
    path.join(repoRoot, 'apps/studio'),
  ];

  const files = targets.flatMap((target) => walk(target));
  let updatedCount = 0;

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = replaceDomainImports(original);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      updatedCount += 1;
    }
  }

  console.log(`Updated ${updatedCount} files.`);
}

run();
