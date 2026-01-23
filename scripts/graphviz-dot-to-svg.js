#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const getArgValue = (args, flag) => {
  const exactIndex = args.indexOf(flag);
  if (exactIndex !== -1 && args[exactIndex + 1]) {
    return args[exactIndex + 1];
  }

  const prefix = `${flag}=`;
  const match = args.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : null;
};

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const verifyGraphviz = () => {
  const result = spawnSync('dot', ['-V'], { encoding: 'utf8' });
  if (result.error) {
    console.error('❌ Graphviz "dot" command not found. Install Graphviz to generate SVGs.');
    process.exit(1);
  }
};

const convertDotToSvg = (inputPath, outputPath) => {
  const result = spawnSync('dot', ['-Tsvg', inputPath, '-o', outputPath], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`❌ Failed to convert ${inputPath}: ${result.stderr || result.stdout}`);
    process.exit(1);
  }
};

const args = process.argv.slice(2);
const outputDir =
  getArgValue(args, '--output') || getArgValue(args, '-o') || path.join('docs', 'architecture', 'reports', 'deps');
const inputDir = getArgValue(args, '--input') || getArgValue(args, '-i') || outputDir;

verifyGraphviz();
ensureDirectory(outputDir);

if (!fs.existsSync(inputDir)) {
  console.error(`❌ Input directory not found: ${inputDir}`);
  process.exit(1);
}

const dotFiles = fs
  .readdirSync(inputDir)
  .filter((entry) => entry.endsWith('.dot'))
  .map((entry) => path.join(inputDir, entry));

if (dotFiles.length === 0) {
  console.warn(`⚠️  No .dot files found in ${inputDir}`);
  process.exit(0);
}

console.log(`🧭 Converting ${dotFiles.length} DOT file(s) to SVG...`);

dotFiles.forEach((dotFile) => {
  const svgName = `${path.basename(dotFile, '.dot')}.svg`;
  const outputPath = path.join(outputDir, svgName);

  convertDotToSvg(dotFile, outputPath);
  console.log(`✅ ${path.basename(dotFile)} → ${path.relative(process.cwd(), outputPath)}`);
});
