# Tool Usage

Search and navigation conventions for contributors and coding agents.

## Preferred Commands

- Text search: `rg "pattern" -n <paths>`
- File listing: `rg --files <paths>` or targeted `Get-ChildItem`
- Focused reads: `Get-Content <file> -TotalCount <n>` or direct file open

## Workflow

1. Search first (`rg`) for symbols/patterns.
2. Read exact files before editing.
3. Apply minimal scoped edits.
4. Re-run targeted validations.

## For Alignment Work

- Compare with forge-agent using explicit path reads, not memory.
- Update `65-collection-alignment-matrix.md` whenever collection contracts change.
- Check link integrity in docs indexes after adding core docs.

## Validation Commands

- `pnpm run typecheck:domains`
- `pnpm run typecheck:studio`
- `pnpm payload:generate` (after collection changes)
- `pnpm run test` (when feasible)
