import React from 'react';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { MarkdownPastePlugin } from './MarkdownPastePlugin';
import { SlashCommandPlugin } from './SlashCommandPlugin';
import { MediaPlugin } from './MediaPlugin';
import { TablePlugin } from './TablePlugin';

export function WriterPlugins() {
  return (
    <>
      <AutoFocusPlugin />
      <MediaPlugin />
      <ListPlugin />
      <LinkPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <MarkdownPastePlugin />
      <SlashCommandPlugin />
      <TablePlugin />
    </>
  );
}
