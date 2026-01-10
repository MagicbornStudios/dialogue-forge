/**
 * Create a unique ID based on existing IDs and a prefix.
 * Generates IDs like: prefix_1, prefix_2, etc.
 * 
 * @param existingIds - Array of existing IDs to avoid collisions
 * @param prefix - Prefix for the ID (e.g., 'pool', 'storylet', 'act')
 * @returns A unique ID string
 */
export function createUniqueId(existingIds: string[], prefix: string): string {
  const prefixPattern = new RegExp(`^${prefix}_\\d+$`);
  const existingNumbers = existingIds
    .filter(id => prefixPattern.test(id))
    .map(id => {
      const match = id.match(/_(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => !isNaN(num));

  const nextNumber = existingNumbers.length > 0
    ? Math.max(...existingNumbers) + 1
    : 1;

  return `${prefix}_${nextNumber}`;
}
