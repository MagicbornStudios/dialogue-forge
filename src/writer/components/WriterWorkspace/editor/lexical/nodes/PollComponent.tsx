/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {Option, Options, PollNode} from './PollNode';
import type {JSX} from 'react';


import {useCollaborationContext} from '@lexical/react/LexicalCollaborationContext';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {useLexicalNodeSelection} from '@lexical/react/useLexicalNodeSelection';
import {mergeRegister} from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  NodeKey,
} from 'lexical';
import {useEffect, useMemo, useRef, useState} from 'react';

import Button from '../ui/Button';
import joinClasses from '../utils/joinClasses';
import {$isPollNode, createPollOption} from './PollNode';

function getTotalVotes(options: Options): number {
  return options.reduce((totalVotes, next) => {
    return totalVotes + next.votes.length;
  }, 0);
}

function PollOptionComponent({
  option,
  index,
  options,
  totalVotes,
  withPollNode,
}: {
  index: number;
  option: Option;
  options: Options;
  totalVotes: number;
  withPollNode: (
    cb: (pollNode: PollNode) => void,
    onSelect?: () => void,
  ) => void;
}): JSX.Element {
  const {name: username} = useCollaborationContext();
  const checkboxRef = useRef(null);
  const votesArray = option.votes;
  const checkedIndex = votesArray.indexOf(username);
  const checked = checkedIndex !== -1;
  const votes = votesArray.length;
  const text = option.text;

  return (
    <div className="flex flex-row mb-2.5 items-center">
      <div
        className={joinClasses(
          'relative flex w-[22px] h-[22px] border border-df-text-tertiary mr-2.5 rounded',
          checked && 'border-df-node-selected bg-df-node-selected after:content-[""] after:cursor-pointer after:border-white after:border-solid after:absolute after:block after:top-1 after:w-1.5 after:left-2 after:h-2.5 after:m-0 after:rotate-45 after:border-r-0.5 after:border-b-0.5 after:pointer-events-none',
        )}>
        <input
          ref={checkboxRef}
          className="border-0 absolute block w-full h-full opacity-0 cursor-pointer"
          type="checkbox"
          onChange={(e) => {
            withPollNode((node) => {
              node.toggleVote(option, username);
            });
          }}
          checked={checked}
        />
      </div>
      <div className="flex flex-[10px] border border-df-node-selected rounded relative overflow-hidden cursor-pointer">
        <div
          className="bg-df-control-hover h-full absolute top-0 left-0 transition-all duration-1000 ease z-0"
          style={{width: `${votes === 0 ? 0 : (votes / totalVotes) * 100}%`}}
        />
        <span className="text-df-node-selected absolute right-4 text-xs top-1.5">
          {votes > 0 && (votes === 1 ? '1 vote' : `${votes} votes`)}
        </span>
        <input
          className="flex flex-[1px] border-0 p-1.5 text-df-node-selected bg-transparent font-bold outline-0 z-0 placeholder:font-normal placeholder:text-df-text-tertiary"
          type="text"
          value={text}
          onChange={(e) => {
            const target = e.target;
            const value = target.value;
            const selectionStart = target.selectionStart;
            const selectionEnd = target.selectionEnd;
            withPollNode(
              (node) => {
                node.setOptionText(option, value);
              },
              () => {
                target.selectionStart = selectionStart;
                target.selectionEnd = selectionEnd;
              },
            );
          }}
          placeholder={`Option ${index + 1}`}
        />
      </div>
      <button
        disabled={options.length < 3}
        className={joinClasses(
          'relative flex w-7 h-7 ml-1.5 border-0 bg-transparent z-0 cursor-pointer rounded opacity-30 hover:opacity-100 hover:bg-df-control-hover before:content-[""] before:absolute before:block before:bg-df-text-tertiary before:w-0.5 before:h-4 before:top-1.5 before:left-[13px] before:-rotate-45 after:content-[""] after:absolute after:block after:bg-df-text-tertiary after:w-0.5 after:h-4 after:top-1.5 after:left-[13px] after:rotate-45',
          options.length < 3 && 'cursor-not-allowed hover:opacity-30 hover:bg-transparent',
        )}
        aria-label="Remove"
        onClick={() => {
          withPollNode((node) => {
            node.deleteOption(option);
          });
        }}
      />
    </div>
  );
}

export default function PollComponent({
  question,
  options,
  nodeKey,
}: {
  nodeKey: NodeKey;
  options: Options;
  question: string;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const totalVotes = useMemo(() => getTotalVotes(options), [options]);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const ref = useRef(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        setSelection(editorState.read(() => $getSelection()));
      }),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;

          if (event.target === ref.current) {
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

  const withPollNode = (
    cb: (node: PollNode) => void,
    onUpdate?: () => void,
  ): void => {
    editor.update(
      () => {
        const node = $getNodeByKey(nodeKey);
        if ($isPollNode(node)) {
          cb(node);
        }
      },
      {onUpdate},
    );
  };

  const addOption = () => {
    withPollNode((node) => {
      node.addOption(createPollOption());
    });
  };

  const isFocused = $isNodeSelection(selection) && isSelected;

  return (
    <div
      className={`PollNode__container ${isFocused ? 'focused' : ''}`}
      ref={ref}>
      <div className="PollNode__inner">
        <h2 className="PollNode__heading">{question}</h2>
        {options.map((option, index) => {
          const key = option.uid;
          return (
            <PollOptionComponent
              key={key}
              withPollNode={withPollNode}
              option={option}
              index={index}
              options={options}
              totalVotes={totalVotes}
            />
          );
        })}
        <div className="flex justify-center">
          <Button onClick={addOption} small={true}>
            Add Option
          </Button>
        </div>
      </div>
    </div>
  );
}
