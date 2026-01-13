import { exportToYarn } from '../../../lib/yarn-converter';
import type { ForgeGraphDoc } from '../../../types/forge/forge-graph';

export function exportDialogueToYarn(graph: ForgeGraphDoc): void {
  const yarn = exportToYarn(graph);
  const blob = new Blob([yarn], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${graph.title.replace(/\s+/g, '_')}.yarn`;
  a.click();
  URL.revokeObjectURL(url);
}
