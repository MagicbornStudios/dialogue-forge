export function createUniqueId(existingIds: string[], prefix: string): string {
  let index = Math.max(existingIds.length, 0) + 1;
  let nextId = `${prefix}-${index}`;
  while (existingIds.includes(nextId)) {
    index += 1;
    nextId = `${prefix}-${index}`;
  }
  return nextId;
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

export function parseDelimitedList(input: string): string[] {
  return input
    .split(/\s*,\s*|\n/g)
    .map(value => value.trim())
    .filter(Boolean);
}
