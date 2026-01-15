const fs = require('fs');
const path = require('path');

const srcStylesDir = path.join(__dirname, '..', 'src', 'styles');
const distStylesDir = path.join(__dirname, '..', 'dist', 'styles');

function copyStyles() {
  if (!fs.existsSync(srcStylesDir)) return;
  fs.mkdirSync(distStylesDir, { recursive: true });
  const files = fs.readdirSync(srcStylesDir).filter((file) => file.endsWith('.css'));
  files.forEach((file) => {
    fs.copyFileSync(path.join(srcStylesDir, file), path.join(distStylesDir, file));
  });
}

function updateEsmEntryPoints() {
  const esmEntries = [
    path.join(__dirname, '..', 'dist', 'esm', 'index.js'),
    path.join(__dirname, '..', 'dist', 'esm', 'index.d.ts')
  ];

  esmEntries.forEach((filePath) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const updated = content.replace(/\.\/styles\//g, '../styles/');
    fs.writeFileSync(filePath, updated);
  });
}

function verifyCssPaths() {
  const checks = [
    {
      filePath: path.join(__dirname, '..', 'dist', 'index.js'),
      cssImports: ['./styles/scrollbar.css', './styles/themes.css']
    },
    {
      filePath: path.join(__dirname, '..', 'dist', 'index.d.ts'),
      cssImports: ['./styles/scrollbar.css', './styles/themes.css']
    },
    {
      filePath: path.join(__dirname, '..', 'dist', 'esm', 'index.js'),
      cssImports: ['../styles/scrollbar.css', '../styles/themes.css']
    },
    {
      filePath: path.join(__dirname, '..', 'dist', 'esm', 'index.d.ts'),
      cssImports: ['../styles/scrollbar.css', '../styles/themes.css']
    }
  ];

  checks.forEach(({ filePath, cssImports }) => {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');

    cssImports.forEach((cssPath) => {
      if (!content.includes(cssPath)) {
        throw new Error(`Missing CSS import ${cssPath} in ${path.relative(process.cwd(), filePath)}`);
      }

      const resolved = path.resolve(path.dirname(filePath), cssPath);
      if (!fs.existsSync(resolved)) {
        throw new Error(`CSS asset not found for ${cssPath} referenced by ${path.relative(process.cwd(), filePath)}`);
      }
    });
  });
}

copyStyles();
updateEsmEntryPoints();
verifyCssPaths();
