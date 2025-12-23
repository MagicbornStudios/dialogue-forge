# Publish Checklist

## Before Publishing

- [ ] Version number updated in `package.json`
- [ ] `npm run build` succeeds without errors
- [ ] `npm pack --dry-run` shows correct files
- [ ] README.md is up to date
- [ ] All tests pass (if applicable)
- [ ] Demo app works: `cd demo && npm run dev`
- [ ] npx executable works: `node bin/dialogue-forge.js`

## Publishing Steps

1. **Build the package:**
   ```bash
   npm run build
   ```

2. **Verify what will be published:**
   ```bash
   npm pack --dry-run
   ```

3. **Sync to GitHub (if needed):**
   ```bash
   npm run sync
   ```

4. **Login to npm:**
   ```bash
   npm login
   ```
   (Make sure you're logged in as @magicborn)

5. **Publish:**
   ```bash
   npm publish --access public
   ```

## After Publishing

- [ ] Verify package appears on npm: https://www.npmjs.com/package/@portfolio/dialogue-forge
- [ ] Test installation: `npm install @portfolio/dialogue-forge`
- [ ] Test npx: `npx @portfolio/dialogue-forge`
- [ ] Create GitHub release (optional)
- [ ] Update documentation if needed

## Version Bumping

Follow semantic versioning:
- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

Update version in `package.json` before publishing.

