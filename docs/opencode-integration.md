# OpenCode Integration

OpenCode has been integrated as a git submodule vendor, allowing the SolidJS web UI to be embedded in the Next.js React app via iframe.

## Why Git Submodules?

Git submodules are the recommended approach for vendoring OpenCode because:

- **Version Control**: Track exact commits from upstream, ensuring reproducible builds
- **Easy Updates**: Pull upstream changes while maintaining your customizations
- **Separation**: Keep vendor code separate from your codebase
- **GitHub Integration**: Works seamlessly with GitHub's dependency management
- **Customization**: Make local changes and maintain them across updates

### Alternatives Considered

- **Git Subtrees**: Merges external repo into yours, harder to update and track
- **NPM Packages**: OpenCode isn't published as a package, and you need source access for customization
- **Direct Copy**: Loses version history and makes updates difficult

Submodules are the best fit for this use case.

## Setup

### Initial Installation

1. **Install OpenCode dependencies:**
   ```bash
   npm run vendor:opencode:install
   ```

2. **For development (hot reload):**
   - Start the OpenCode UI dev server:
     ```bash
     npm run vendor:opencode:dev
     ```
   - Create `.env.local` with:
     ```bash
     NEXT_PUBLIC_OPENCODE_UI_DEV_URL=http://localhost:5173
     ```
   - The dev server typically runs on port 5173 (Vite default)

3. **For production:**
   - Build the OpenCode UI:
     ```bash
     npm run vendor:opencode:build
     ```
   - Sync the build to public folder:
     ```bash
     npm run vendor:opencode:sync
     ```
   - Ensure `NEXT_PUBLIC_OPENCODE_UI_DEV_URL` is unset or empty

## Usage

### Homepage Access

OpenCode is now accessible from the main homepage at `/` alongside other tools:

- **Forge** - Visual Dialogue Editor (`/forge`)
- **Writer** - Narrative Editor (`/writer`) 
- **OpenCode** - AI Assistant (`/opencode`) ← **NEW**
- **Admin** - Payload CMS (`/admin`)

### Direct Access

Navigate to `/opencode` in your Next.js app to view the OpenCode UI directly.

- **Dev mode**: Iframe loads from dev server (hot reload enabled)
- **Prod mode**: Iframe loads from static assets at `/vendor/opencode/index.html`

### Homepage Integration

The OpenCode card on the homepage features:
- **Terminal Icon**: Orange theme to distinguish from other tools
- **Hover Effects**: Consistent with other tool cards
- **Responsive Design**: Works on all screen sizes
- **Direct Navigation**: One-click access from the main landing page

## Updating OpenCode

### Automated Update (Recommended)

Use the automated update script:

```bash
# Update submodule, build, and sync in one command
npm run vendor:opencode:update-and-build
```

Or step by step:

```bash
# 1. Update submodule to latest upstream
npm run vendor:opencode:update

# 2. Review changes
git diff vendor/opencode

# 3. Build and sync
npm run vendor:opencode:build
npm run vendor:opencode:sync

# 4. Commit the update
git add vendor/opencode
git commit -m "chore: update opencode submodule"
```

### Manual Update

If you prefer manual control:

```bash
cd vendor/opencode
git fetch origin
git merge origin/main  # or the branch you're tracking
# Resolve any conflicts if you've customized files
cd ../..
npm run vendor:opencode:build
npm run vendor:opencode:sync
```

### Handling Merge Conflicts

If you've customized OpenCode files and there are conflicts:

1. **Resolve conflicts** in `vendor/opencode`:
   ```bash
   cd vendor/opencode
   # Edit conflicted files, resolve conflicts
   git add .
   git commit -m "Merge upstream changes with local customizations"
   ```

2. **Return to root and commit**:
   ```bash
   cd ../..
   git add vendor/opencode
   git commit -m "chore: update opencode submodule with customizations"
   ```

3. **Rebuild**:
   ```bash
   npm run vendor:opencode:build
   npm run vendor:opencode:sync
   ```

### GitHub Features for Submodules

- **Dependabot**: Can be configured to check for submodule updates (requires custom setup)
- **Submodule Status**: GitHub shows submodule commit status in the repository view
- **Pull Requests**: Submodule updates appear in PRs when you update the submodule pointer
- **Releases**: Tag your releases to lock submodule versions

## Customizing the UI

You can customize the OpenCode UI by editing files directly in `vendor/opencode/packages/console/app/src/`. After making changes:

- **Dev mode**: Changes reflect immediately (hot reload)
- **Prod mode**: Rebuild and sync:
  ```bash
  npm run vendor:opencode:build
  npm run vendor:opencode:sync
  ```

## Project Structure

```
vendor/opencode/              # Git submodule
  packages/
    console/
      app/                    # SolidStart/SolidJS web UI
        .output/
          public/             # Build output (copied to public/vendor/opencode)
        src/                  # Source files (customize here)
        
app/
  (opencode)/
    opencode/
      page.tsx                # Next.js route with iframe

public/
  vendor/
    opencode/                 # Static build assets (gitignored)
```

## Notes

- The UI is embedded via iframe to avoid React-Solid bridge complexity
- CORS may need configuration when the UI calls OpenCode API endpoints
- Server integration will be handled separately when launching the OpenCode server
