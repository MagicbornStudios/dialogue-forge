# Publishing Guide

## Overview

This package is managed in a monorepo but has its own GitHub repository for distribution and collaboration.

- **Monorepo**: Main development happens here
- **GitHub Repo**: https://github.com/MagicbornStudios/dialogue-forge
- **NPM Package**: `@portfolio/dialogue-forge`

## Publishing Workflow

### 1. Development (in Monorepo)

Make changes in the monorepo at `packages/dialogue-forge/`.

### 2. Build the Package

```bash
cd packages/dialogue-forge
npm run build
```

This creates the `dist/` directory with compiled JavaScript.

### 3. Sync to GitHub Repo

```bash
npm run sync
# or
./sync-to-repo.sh
```

This script:
- Stages all changes
- Commits with message "Update package from monorepo"
- Pushes to `MagicbornStudios/dialogue-forge`

### 4. Publish to NPM

```bash
# Make sure you're logged in
npm login

# Verify what will be published
npm pack --dry-run

# Publish
npm publish --access public
```

**Note**: The `prepublishOnly` script automatically runs `npm run build` before publishing.

## Package Structure

### Files Included in NPM Package

- `dist/` - Compiled JavaScript and TypeScript definitions
- `demo/` - Standalone demo Next.js app
- `bin/` - Executable script for `npx`
- `README.md` - Package documentation

### Files Excluded

See `.npmignore` for full list. Key exclusions:
- `src/` - Source TypeScript files
- `node_modules/` - Dependencies
- Test files
- Development configs

## Version Management

Update version in `package.json`:

```json
{
  "version": "0.1.0"
}
```

Follow semantic versioning:
- `0.1.0` → `0.1.1` (patch: bug fixes)
- `0.1.0` → `0.2.0` (minor: new features)
- `0.1.0` → `1.0.0` (major: breaking changes)

## Testing Before Publish

1. **Test the build:**
   ```bash
   npm run build
   ```

2. **Test what will be published:**
   ```bash
   npm pack --dry-run
   ```

3. **Test locally:**
   ```bash
   npm pack
   npm install -g ./portfolio-dialogue-forge-0.1.0.tgz
   npx dialogue-forge
   ```

4. **Test the demo:**
   ```bash
   cd demo
   npm install
   npm run dev
   ```

## GitHub Repository

The package has its own GitHub repository for:
- Issue tracking
- Pull requests
- Releases
- Documentation
- Community contributions

**Repository**: https://github.com/MagicbornStudios/dialogue-forge

## NPM Publishing

**Publisher**: [@magicborn](https://www.npmjs.com/~magicborn)

**Package**: https://www.npmjs.com/package/@portfolio/dialogue-forge

## Troubleshooting

### "Module not found" after publishing

- Ensure `dist/` directory exists (run `npm run build`)
- Check that `files` array in `package.json` includes `dist`
- Verify `.npmignore` doesn't exclude needed files

### Sync script fails

- Check GitHub authentication
- Verify remote URL is correct
- Ensure you have push access to `MagicbornStudios/dialogue-forge`

### Build errors

- Check TypeScript errors: `npm run build`
- Verify all dependencies are installed: `npm install`
- Check `tsconfig.json` configuration

