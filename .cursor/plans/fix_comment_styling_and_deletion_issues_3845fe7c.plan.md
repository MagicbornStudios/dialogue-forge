---
name: Fix Comment Styling and Deletion Issues
overview: Revert comment UI styling to use df-* theme colors instead of Google Docs white/gray, fix text formatting loss when comments are removed, and resolve deletion issues caused by autosave interference.
todos:
  - id: "1"
    content: Revert CommentInputBox styling to df-* theme colors
    status: completed
  - id: "2"
    content: Revert AddCommentBox styling to df-* theme colors
    status: completed
  - id: "3"
    content: Revert CommentsPanel styling to df-* theme colors
    status: completed
  - id: "4"
    content: Revert FloatingTextFormatToolbar styling to df-* theme colors
    status: completed
  - id: "5"
    content: Create COMMENT_DELETION_TAG constant and export it
    status: completed
  - id: "6"
    content: Update EditorSyncPlugin to skip COMMENT_DELETION_TAG updates
    status: completed
  - id: "7"
    content: "Fix deleteCommentOrThread: remove setTimeout, add COMMENT_DELETION_TAG, ensure synchronous mark unwrapping"
    status: completed
  - id: "8"
    content: Verify text formatting preservation when comments are removed
    status: completed
isProject: false
---

# Fix Comment Styling and Deletion Issues

## Problems Identified

1. **Styling too light**: Comment UI uses white/gray Google Docs styling instead of df-* theme colors
2. **Text formatting lost**: When comments are removed via `$unwrapMarkNode`, text formatting (bold, italic, etc.) is lost
3. **Deletion struggles**: Autosave and async operations interfere with comment deletion

## Solution

### 1. Revert Comment UI Styling to df-* Theme

**Files to update:**

- `src/writer/components/WriterWorkspace/editor/lexical/plugins/CommentPlugin/CommentInputBox.tsx`
- `src/writer/components/WriterWorkspace/editor/lexical/plugins/CommentPlugin/AddCommentBox.tsx`
- `src/writer/components/WriterWorkspace/editor/lexical/plugins/CommentPlugin/CommentsPanel.tsx`
- `src/writer/components/WriterWorkspace/editor/lexical/plugins/FloatingTextFormatToolbarPlugin/index.tsx`

**Changes:**

- Replace `bg-white`, `border-gray-300`, `text-gray-900` with `bg-df-elevated`, `border-df-control-border`, `text-df-text-primary`
- Replace `bg-gray-50`, `bg-gray-100`, `bg-gray-200` with `bg-df-control-bg`, `bg-df-control-hover`
- Replace `bg-blue-600` with `bg-df-node-selected`
- Use df-* color variables throughout for consistency with dark theme

### 2. Fix Text Formatting Loss on Comment Removal

**File:** `src/writer/components/WriterWorkspace/editor/lexical/plugins/CommentPlugin/index.tsx`

**Issue:** When `$unwrapMarkNode` is called, it should preserve text formatting but might be losing it.

**Solution:**

- Ensure `$unwrapMarkNode` is called within an editor update that preserves formatting
- The mark node unwrapping should preserve child text nodes and their formatting
- Verify that text nodes maintain their `__format` and `__style` properties when unwrapped

**Code location:** Lines 161-179 in `deleteCommentOrThread` function

**Fix:**

- Remove the `setTimeout` wrapper (causes async issues)
- Ensure the editor update properly preserves text formatting
- The `$unwrapMarkNode` function from Lexical should handle this, but we need to ensure it's called correctly

### 3. Fix Deletion Interference with Autosave

**Files:**

- `src/writer/components/WriterWorkspace/editor/lexical/plugins/CommentPlugin/index.tsx`
- `src/writer/components/WriterWorkspace/editor/lexical/plugins/EditorSyncPlugin/index.tsx`

**Issues:**

- `setTimeout` in `deleteCommentOrThread` causes race conditions
- Async Payload operations trigger editor updates that conflict with autosave
- No tag to skip autosave during comment deletion

**Solution:**

1. Create a `COMMENT_DELETION_TAG` to mark comment deletion updates
2. Remove `setTimeout` wrapper around mark node unwrapping - do it synchronously
3. Update `EditorSyncPlugin` to skip updates tagged with `COMMENT_DELETION_TAG`
4. Ensure Payload operations don't trigger unnecessary editor updates

**Implementation:**

- Add tag constant: `export const COMMENT_DELETION_TAG = 'comment-deletion';`
- In `deleteCommentOrThread`, wrap editor.update with tag:
  ```typescript
  editor.update(() => {
    $addUpdateTag(COMMENT_DELETION_TAG);
    // ... mark unwrapping code
  }, { tag: COMMENT_DELETION_TAG });
  ```

- In `EditorSyncPlugin`, add check: `if (tags.has(COMMENT_DELETION_TAG)) return;`

### 4. Improve Comment Deletion UX

**File:** `src/writer/components/WriterWorkspace/editor/lexical/plugins/CommentPlugin/index.tsx`

**Changes:**

- Make deletion synchronous (remove setTimeout)
- Add error handling for deletion failures
- Ensure mark node cleanup happens immediately

## Implementation Order

1. Revert styling to df-* theme colors (all comment UI components)
2. Add COMMENT_DELETION_TAG and update EditorSyncPlugin to skip it
3. Fix deleteCommentOrThread to remove setTimeout and use tag
4. Verify text formatting preservation (may require testing)

## Testing Checklist

- [ ] Comment UI uses dark theme colors (df-*)
- [ ] Text formatting (bold, italic) preserved when comment removed
- [ ] Comment deletion works without autosave interference
- [ ] Deletion is responsive (no delays)
- [ ] Payload persistence still works correctly