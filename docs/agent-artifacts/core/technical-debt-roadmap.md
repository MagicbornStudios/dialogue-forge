# Technical Debt Roadmap

Active technical debt items that affect migration quality and contributor velocity.

## Open

1. Writer persistence duality
- Legacy page blob (`bookBody`) and canonical blocks coexist.
- Need clear cutover checkpoints and removal criteria.

2. Root/documentation drift risk
- Keep root governance docs and agent artifact indexes synchronized.

3. Collection/type parity drift
- Payload collections can diverge from forge-agent without matrix updates.

4. Migration-plan consistency
- Ensure `00/63/65/66` and STATUS stay synchronized after each slice.

## In Progress

1. Alignment parity foundation
- Governance docs, artifact strategy parity, and non-breaking blocks schema path.

## Done

- Adapter-context data flow replaced with hook-based package data access.
- Project switcher resilience and retry UX slice implemented.
