# Examples System

## Structure

All examples follow a unified structure for easy discovery and maintenance:

### Files

- **`examples-registry.ts`** - Metadata registry (titles, descriptions, features, flag schemas)
- **`yarn-examples.ts`** - Yarn file contents (all examples as Yarn strings)
- **`legacy-examples.ts`** - Old TypeScript examples (being migrated to Yarn)
- **`index.ts`** - Public API (exports both new and legacy systems)

### Adding a New Example

1. **Create the Yarn file** in the `examples/` directory (e.g., `my-example.yarn`)
2. **Add metadata** to `examples-registry.ts`:
   ```typescript
   {
     id: 'my-example',
     title: 'My Example',
     description: 'What this example demonstrates',
     filename: 'my-example.yarn',
     flagSchemaId: 'rpg',
     features: ['feature1', 'feature2']
   }
   ```
3. **Add Yarn content** to `yarn-examples.ts`:
   ```typescript
   'my-example': `title: start
   ---
   NPC: Hello!
   ===
   `,
   ```
4. **Test it** - The example will automatically appear in the ExampleLoader dropdown

### Example Format

**All examples are stored as Yarn files** - this is the single source of truth. The Yarn format:
- Is human-readable
- Can be imported/exported from the editor
- Works with Unreal Engine
- Is easy to version control

### Migration from Legacy

Old TypeScript examples in `legacy-examples.ts` are being gradually migrated to Yarn format. Once migrated, they'll be removed from the legacy file.

### Testing

Unit tests in `src/lib/yarn-converter/__tests__/round-trip.test.ts` ensure:
- Yarn → DialogueTree conversion works
- DialogueTree → Yarn conversion works  
- Round-trip conversion preserves all data




