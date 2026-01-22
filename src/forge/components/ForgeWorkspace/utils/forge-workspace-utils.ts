import { exportToYarn } from '@/forge/lib/yarn-converter';
import type { ForgeGraphDoc } from '@/forge/types/forge-graph';

export async function exportDialogueToYarn(graph: ForgeGraphDoc): Promise<void> {
  const yarn = await exportToYarn(graph);
  const blob = new Blob([yarn], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${graph.title.replace(/\s+/g, '_')}.yarn`;
  a.click();
  URL.revokeObjectURL(url);
}
