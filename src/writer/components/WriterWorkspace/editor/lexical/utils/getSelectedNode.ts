import { $isElementNode, $isTextNode, LexicalNode } from 'lexical';
import { $getSelection, $isRangeSelection } from 'lexical';

export function getSelectedNode(selection: ReturnType<typeof $getSelection>): LexicalNode {
  if (!$isRangeSelection(selection)) {
    throw new Error('Expected RangeSelection');
  }
  const anchor = selection.anchor;
  const anchorNode = anchor.getNode();
  let node = anchorNode;

  if ($isTextNode(anchorNode)) {
    node = anchorNode.getParentOrThrow();
  }

  if ($isElementNode(node)) {
    return node;
  }

  return anchorNode;
}
