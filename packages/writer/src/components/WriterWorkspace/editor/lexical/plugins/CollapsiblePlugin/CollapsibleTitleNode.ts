/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {IS_CHROME} from '@lexical/utils';
import {
  $createParagraphNode,
  $isElementNode,
  buildImportMap,
  DOMConversionOutput,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
} from 'lexical';

import {$isCollapsibleContainerNode} from './CollapsibleContainerNode';
import {$isCollapsibleContentNode} from './CollapsibleContentNode';

export function $convertSummaryElement(
  domNode: HTMLElement,
): DOMConversionOutput | null {
  const node = $createCollapsibleTitleNode();
  return {
    node,
  };
}

/** @noInheritDoc */
export class CollapsibleTitleNode extends ElementNode {
  /** @internal */
  $config() {
    return this.config('collapsible-title', {
      $transform(node: CollapsibleTitleNode) {
        if (node.isEmpty()) {
          node.remove();
        }
      },
      extends: ElementNode,
      importDOM: buildImportMap({
        summary: () => ({
          conversion: $convertSummaryElement,
          priority: 1,
        }),
      }),
    });
  }

  createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('summary');
    dom.classList.add('cursor-pointer', 'py-1.5', 'px-1.5', 'pl-5', 'relative', 'font-bold', 'list-none', 'outline-none', '[&::marker]:hidden', '[&::-webkit-details-marker]:hidden', 'before:content-[""]', 'before:absolute', 'before:left-1.5', 'before:top-1/2', 'before:-translate-y-1/2', 'before:border-solid', 'before:border-transparent', 'before:border-l-df-text-primary', 'before:border-[4px_6px_4px_6px]');
    if (IS_CHROME) {
      dom.addEventListener('click', () => {
        editor.update(() => {
          const collapsibleContainer = this.getLatest().getParentOrThrow();
          if (!$isCollapsibleContainerNode(collapsibleContainer)) {
            throw new Error(
              'Expected parent node to be a CollapsibleContainerNode',
            );
          }
          collapsibleContainer.toggleOpen();
        });
      });
    }
    return dom;
  }

  updateDOM(prevNode: this, dom: HTMLElement): boolean {
    return false;
  }

  insertNewAfter(_: RangeSelection, restoreSelection = true): ElementNode {
    const containerNode = this.getParentOrThrow();

    if (!$isCollapsibleContainerNode(containerNode)) {
      throw new Error(
        'CollapsibleTitleNode expects to be child of CollapsibleContainerNode',
      );
    }

    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isCollapsibleContentNode(contentNode)) {
        throw new Error(
          'CollapsibleTitleNode expects to have CollapsibleContentNode sibling',
        );
      }

      const firstChild = contentNode.getFirstChild();
      if ($isElementNode(firstChild)) {
        return firstChild;
      } else {
        const paragraph = $createParagraphNode();
        contentNode.append(paragraph);
        return paragraph;
      }
    } else {
      const paragraph = $createParagraphNode();
      containerNode.insertAfter(paragraph, restoreSelection);
      return paragraph;
    }
  }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return new CollapsibleTitleNode();
}

export function $isCollapsibleTitleNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}
