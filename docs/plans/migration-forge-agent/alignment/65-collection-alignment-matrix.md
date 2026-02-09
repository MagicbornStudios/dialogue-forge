# Collection Alignment Matrix (dialogue-forge -> forge-agent)

Purpose: maintain a field-level crosswalk so collection evolution stays migration-safe.

## Ownership

- Canonical target semantics: `forge-agent`
- Playground validation and compatibility shims: `dialogue-forge`

## Sync Cadence

- Update this matrix whenever a collection schema or data contract changes in either repo.
- Required touchpoints after each relevant slice:
- `docs/agent-artifacts/core/STATUS.md`
- `docs/agent-artifacts/core/MIGRATION.md`
- this matrix (`65`)

## Direction Flags

- `target`: canonical target-state field/shape from forge-agent
- `legacy`: existing dialogue-forge field kept for compatibility
- `compat`: bridge/mapped field used during transition

## Projects Collection

| Concern | dialogue-forge | forge-agent | Flag | Notes |
|---|---|---|---|---|
| name/title | `name` | `title` | compat | keep `name` now; map to title semantics in compat layer |
| slug | `slug` | `slug` | target | aligned |
| narrative graph pointer | `narrativeGraph` | `forgeGraph` | compat | both may exist during transition |
| settings | `settings` (json) | domain/status fields + owner | compat | dialogue-forge keeps richer runtime settings |

## Pages Collection

| Concern | dialogue-forge | forge-agent | Flag | Notes |
|---|---|---|---|---|
| hierarchy type | `pageType` (`ACT/CHAPTER/PAGE`) | Notion-like `parent` object | legacy/target | keep `pageType` while introducing parent contracts |
| content blob | `bookBody`, `content` | none (content in blocks) | legacy | compatibility-only; do not expand usage |
| properties | limited fields | `properties` json | target | map legacy title/summary into properties where needed |
| archived flags | `archivedAt` date | `archived`, `in_trash` bool | compat | coexist; normalize via mappers |
| project | relationship | relationship | target | aligned |

## Blocks Collection

| Concern | dialogue-forge | forge-agent | Flag | Notes |
|---|---|---|---|---|
| existence | added in this alignment wave | canonical | target | new `blocks` collection in dialogue-forge |
| page relation | `page` | `page` | target | aligned |
| nesting | `parent_block` | `parent_block` | target | aligned |
| type | `type` string | `type` string | target | aligned |
| order | `position` number | `position` number | target | aligned |
| payload | `payload` json | `payload` json | target | aligned |
| lifecycle flags | `archived`, `in_trash`, `has_children` | same | target | aligned |

## Forge Graphs Collection

| Concern | dialogue-forge | forge-agent | Flag | Notes |
|---|---|---|---|---|
| base graph shape | `project`, `kind`, `title`, `flow` | same | target | aligned core |
| start/end metadata | `startNodeId`, `endNodeIds`, `compiledYarn` | not present in simplified forge-agent collection | compat | dialogue-forge retains richer yarn/runtime metadata |

## Characters / Relationships

| Concern | dialogue-forge | forge-agent | Flag | Notes |
|---|---|---|---|---|
| characters | present | present | target | generally aligned, field-level follow-up needed |
| relationships | present | present | target | generally aligned |

## Migration Notes

1. `bookBody`/`content` remain readable during transition but are deprecated.
2. Canonical page/block APIs should prefer Notion-shaped contracts.
3. Any new writer/editor feature should target blocks first, then fallback to legacy page blob only when blocks absent.
