/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {JSX} from 'react';


import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';
import {mergeRegister} from '@lexical/utils';
import {
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
import * as React from 'react';
import {useEffect} from 'react';

export type SerializedPageBreakNode = SerializedLexicalNode;

function PageBreakComponent({nodeKey}: {nodeKey: NodeKey}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const pbElem = editor.getElementByKey(nodeKey);

          if (event.target === pbElem) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [clearSelection, editor, isSelected, nodeKey, setSelected]);

  useEffect(() => {
    const pbElem = editor.getElementByKey(nodeKey);
    if (pbElem !== null) {
      if (isSelected) {
        pbElem.classList.add('border-df-node-selected');
        pbElem.style.setProperty('--before-opacity', '1');
      } else {
        pbElem.classList.remove('border-df-node-selected');
        pbElem.style.setProperty('--before-opacity', '0.5');
      }
    }
  }, [editor, isSelected, nodeKey]);

  return null;
}

export class PageBreakNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'page-break';
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  static importJSON(serializedNode: SerializedPageBreakNode): PageBreakNode {
    return $createPageBreakNode().updateFromJSON(serializedNode);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      figure: (domNode: HTMLElement) => {
        const tp = domNode.getAttribute('type');
        if (tp !== this.getType()) {
          return null;
        }

        return {
          conversion: $convertPageBreakElement,
          priority: COMMAND_PRIORITY_HIGH,
        };
      },
    };
  }

  createDOM(): HTMLElement {
    const el = document.createElement('figure');
    el.style.pageBreakAfter = 'always';
    el.setAttribute('type', this.getType());
    el.className = 'relative block w-full overflow-visible -ml-7 mt-7 mb-7 border-0 border-t border-b border-dashed border-df-control-border bg-df-control-bg before:content-[""] before:absolute before:top-1/2 before:-translate-y-1/2 before:left-[40px] before:opacity-50 before:w-4 before:h-4 before:bg-contain before:bg-no-repeat before:bg-center after:content-["PAGE_BREAK"] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:block after:py-0.5 after:px-1.5 after:border after:border-df-control-border after:bg-df-surface after:text-xs after:text-df-text-primary after:font-semibold';
    el.style.setProperty('--editor-input-padding', '28px');
    el.style.width = 'calc(100% + var(--editor-input-padding) * 2)';
    el.style.marginLeft = 'calc(var(--editor-input-padding) * -1)';
    el.style.marginTop = 'var(--editor-input-padding)';
    el.style.marginBottom = 'var(--editor-input-padding)';
    el.style.setProperty('--before-bg-image', 'url(/src/images/icons/scissors.svg)');
    el.style.setProperty('--before-left', 'calc(var(--editor-input-padding) + 12px)');
    return el;
  }

  getTextContent(): string {
    return '\n';
  }

  isInline(): false {
    return false;
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(): JSX.Element {
    return <PageBreakComponent nodeKey={this.__key} />;
  }
}

function $convertPageBreakElement(): DOMConversionOutput {
  return {node: $createPageBreakNode()};
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(
  node: LexicalNode | null | undefined,
): node is PageBreakNode {
  return node instanceof PageBreakNode;
}
