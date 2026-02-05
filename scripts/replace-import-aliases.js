const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const domainTargets = {
  shared: '@magicborn/shared',
  ai: '@magicborn/ai',
  forge: '@magicborn/forge',
  video: '@magicborn/video',
  writer: '@magicborn/writer',
  characters: '@magicborn/characters',
  runtime: '@magicborn/runtime',
};

const hostTargets = {
  app: path.join(repoRoot, 'apps/studio/app'),
  components: path.join(repoRoot, 'apps/studio/components'),
  styles: path.join(repoRoot, 'apps/studio/styles'),
  host: path.join(repoRoot, 'apps/studio/app/lib'),
};

const fileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx']);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function resolveHostRelative(specifier, filePath) {
  const rest = specifier.slice(2);
  const [segment, ...restParts] = rest.split('/');
  const base = hostTargets[segment];
  if (!base) {
    return null;
  }
  const targetPath = path.join(base, ...restParts);
  const relative = path.relative(path.dirname(filePath), targetPath);
  const posixRelative = toPosix(relative);
  return posixRelative.startsWith('.') ? posixRelative : `./${posixRelative}`;
}

function resolveDomainImport(specifier) {
  const rest = specifier.slice(2);
  const [segment, ...restParts] = rest.split('/');
  const base = domainTargets[segment];
  if (!base) {
    return null;
  }
  return restParts.length ? `${base}/${restParts.join('/')}` : base;
}

function replaceAliasesInContent(content, filePath) {
  return content.replace(/(['"])(@\/[^'"]+)\1/g, (match, quote, specifier) => {
    if (!specifier.startsWith('@/')) {
      return match;
    }

    const domainReplacement = resolveDomainImport(specifier);
    if (domainReplacement) {
      return `${quote}${domainReplacement}${quote}`;
    }

    const hostReplacement = resolveHostRelative(specifier, filePath);
    if (hostReplacement) {
      return `${quote}${hostReplacement}${quote}`;
    }

    return match;
  });
}

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

function run() {
  const targets = [
    path.join(repoRoot, 'packages'),
    path.join(repoRoot, 'apps/studio'),
  ];

  const files = targets.flatMap((target) => walk(target));
  let updatedCount = 0;

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, 'utf8');
    const updated = replaceAliasesInContent(original, filePath);
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      updatedCount += 1;
    }
  }

  console.log(`Updated ${updatedCount} files.`);
}

run();
