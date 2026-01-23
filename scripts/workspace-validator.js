#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_WORKSPACE_REQUIRED_FILES = [
  'workspace-state.ts',
  'actions.ts',
  'contracts.ts'
];

const DEFAULT_EDITOR_REQUIRED_FILES = [
  'Editor.tsx',
  path.join('shell', 'store.ts'),
  path.join('shell', 'actions.ts'),
  path.join('shell', 'events.ts')
];

const DEFAULT_EDITOR_REQUIRED_DIRS = [
  path.join('inspector')
];

const getArgValue = (args, flag) => {
  const exactIndex = args.indexOf(flag);
  if (exactIndex !== -1 && args[exactIndex + 1]) {
    return args[exactIndex + 1];
  }

  const prefix = `${flag}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const getListArgValue = (args, flag) => {
  const value = getArgValue(args, flag);
  if (!value) {
    return null;
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const loadConfig = (configPath) => {
  if (!configPath) {
    return null;
  }

  const resolvedPath = path.resolve(configPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  return JSON.parse(raw);
};

const ensurePosixRelative = (filePath) => filePath.split(path.sep).join('/');

const listDirectoryEntries = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath);
};

const collectMissingFiles = (basePath, files) =>
  files.filter((file) => !fs.existsSync(path.join(basePath, file)));

const collectMissingDirectories = (basePath, directories) =>
  directories.filter((dir) => {
    const fullPath = path.join(basePath, dir);
    return !fs.existsSync(fullPath) || listDirectoryEntries(fullPath).length === 0;
  });

const validateRequiredFiles = (label, basePath, requiredFiles, requiredDirs) => {
  const missingFiles = collectMissingFiles(basePath, requiredFiles);
  const missingDirs = collectMissingDirectories(basePath, requiredDirs);
  const missing = [
    ...missingFiles.map((file) => ensurePosixRelative(path.join(basePath, file))),
    ...missingDirs.map((dir) => `${ensurePosixRelative(path.join(basePath, dir))}/*`)
  ];

  if (missing.length === 0) {
    console.log(`✅ ${label} requirements satisfied: ${basePath}`);
    return [];
  }

  console.log(`❌ ${label} is missing required files:`);
  missing.forEach((file) => {
    console.log(`  - ${file}`);
  });
  return missing;
};

const args = process.argv.slice(2);
const workspaceDir = getArgValue(args, '--workspace') || getArgValue(args, '-w');
const editorDir = getArgValue(args, '--editor') || getArgValue(args, '-e');
const configPath = getArgValue(args, '--config');

if (!workspaceDir && !editorDir) {
  console.error('❌ Provide --workspace <path> or --editor <path> to validate.');
  process.exit(1);
}

let config = null;

try {
  config = loadConfig(configPath);
} catch (error) {
  console.error(`❌ ${error.message}`);
  process.exit(1);
}

const workspacePath = workspaceDir ? path.resolve(workspaceDir) : null;
const editorPath = editorDir
  ? path.resolve(editorDir)
  : workspacePath
    ? path.join(workspacePath, 'editor')
    : null;

const workspaceFilesOverride = getListArgValue(args, '--workspace-files');
const workspaceDirsOverride = getListArgValue(args, '--workspace-dirs');
const editorFilesOverride = getListArgValue(args, '--editor-files');
const editorDirsOverride = getListArgValue(args, '--editor-dirs');

const workspaceFiles =
  workspaceFilesOverride ??
  config?.workspace?.files ??
  DEFAULT_WORKSPACE_REQUIRED_FILES;
const workspaceDirs = workspaceDirsOverride ?? config?.workspace?.dirs ?? [];
const editorFiles =
  editorFilesOverride ?? config?.editor?.files ?? DEFAULT_EDITOR_REQUIRED_FILES;
const editorDirs =
  editorDirsOverride ?? config?.editor?.dirs ?? DEFAULT_EDITOR_REQUIRED_DIRS;

const missing = [];

if (workspacePath) {
  missing.push(
    ...validateRequiredFiles(
      'Workspace',
      workspacePath,
      workspaceFiles,
      workspaceDirs
    )
  );
}

if (editorPath) {
  missing.push(
    ...validateRequiredFiles(
      'Editor',
      editorPath,
      editorFiles,
      editorDirs
    )
  );
}

if (missing.length > 0) {
  console.log('\n📋 Missing workspace/editor requirements detected.');
  process.exit(1);
}

console.log('\n🎉 Workspace/editor validation passed.');
