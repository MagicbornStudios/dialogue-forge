# Compacting And Archiving

Guidelines for keeping living artifacts concise and searchable.

## What To Compact

- STATUS done logs that grow too long
- Repetitive failure notes in errors-and-attempts
- Superseded migration notes after outcomes are captured elsewhere

## Trigger Guidelines

- STATUS Done log exceeds ~25 entries: summarize older entries and move details to archive snapshot.
- Any artifact section becomes hard to scan in one viewport: compact.

## How To Archive

1. Move superseded details into `docs/agent-artifacts/archive/`.
2. Leave a one-line pointer in the source artifact.
3. Do not archive current operational state.

## Non-Archive Rule

Core artifacts (`STATUS`, `decisions`, `errors-and-attempts`, `task-registry`) must remain current and directly usable.
