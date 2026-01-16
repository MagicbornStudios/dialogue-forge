import React, { useCallback, useEffect, useState } from 'react';
import {
  DecoratorNode,
  $getNodeByKey,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import type { WriterMediaRecord } from '@/writer/lib/data-adapter/media';
import { WRITER_MEDIA_KIND } from '@/writer/lib/data-adapter/media';
import {
  WRITER_LEXICAL_NODE_TYPE,
  WRITER_MEDIA_ALIGNMENT,
  type WriterMediaAlignment,
} from './media-constants';
import {
  OPEN_EMBED_DIALOG_COMMAND,
  OPEN_MEDIA_PICKER_COMMAND,
} from '@/writer/components/WriterWorkspace/editor/lexical/plugins/MediaPlugin';

type SerializedWriterImageNode = Spread<{
  type: typeof WRITER_LEXICAL_NODE_TYPE.IMAGE;
  version: 1;
  mediaId: string;
  altText: string;
  caption: string;
  alignment: WriterMediaAlignment;
  width: number;
  height: number | null;
}, SerializedLexicalNode>;

type SerializedWriterFileNode = Spread<{
  type: typeof WRITER_LEXICAL_NODE_TYPE.FILE;
  version: 1;
  mediaId: string;
  label: string;
  caption: string;
  alignment: WriterMediaAlignment;
  width: number;
}, SerializedLexicalNode>;

type SerializedWriterEmbedNode = Spread<{
  type: typeof WRITER_LEXICAL_NODE_TYPE.EMBED;
  version: 1;
  mediaId: string;
  title: string;
  caption: string;
  alignment: WriterMediaAlignment;
  width: number;
  height: number;
  fallbackUrl?: string | null;
}, SerializedLexicalNode>;

const clampWidth = (value: number) => Math.min(100, Math.max(25, value));

const useResolvedMedia = (mediaId: string) => {
  const dataAdapter = useWriterWorkspaceStore((state) => state.dataAdapter);
  const [record, setRecord] = useState<WriterMediaRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!dataAdapter?.resolveMedia || !mediaId) {
      setRecord(null);
      return;
    }
    setIsLoading(true);
    dataAdapter
      .resolveMedia(mediaId)
      .then((resolved) => {
        if (!isMounted) return;
        setRecord(resolved ?? null);
      })
      .catch(() => {
        if (!isMounted) return;
        setRecord(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [dataAdapter, mediaId]);

  return { record, isLoading };
};

const alignmentClass = (alignment: WriterMediaAlignment) => {
  if (alignment === WRITER_MEDIA_ALIGNMENT.CENTER) {
    return 'mx-auto';
  }
  if (alignment === WRITER_MEDIA_ALIGNMENT.RIGHT) {
    return 'ml-auto';
  }
  return 'mr-auto';
};

const controlButton =
  'rounded-md border border-df-control-border bg-df-control-bg px-2 py-1 text-[11px] text-df-text-secondary transition hover:text-df-text-primary';

type MediaControlsProps = {
  alignment: WriterMediaAlignment;
  width: number;
  onAlign: (alignment: WriterMediaAlignment) => void;
  onResize: (width: number) => void;
};

const MediaControls = ({ alignment, width, onAlign, onResize }: MediaControlsProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <button
      type="button"
      className={controlButton}
      onClick={() => onAlign(WRITER_MEDIA_ALIGNMENT.LEFT)}
      aria-pressed={alignment === WRITER_MEDIA_ALIGNMENT.LEFT}
    >
      Left
    </button>
    <button
      type="button"
      className={controlButton}
      onClick={() => onAlign(WRITER_MEDIA_ALIGNMENT.CENTER)}
      aria-pressed={alignment === WRITER_MEDIA_ALIGNMENT.CENTER}
    >
      Center
    </button>
    <button
      type="button"
      className={controlButton}
      onClick={() => onAlign(WRITER_MEDIA_ALIGNMENT.RIGHT)}
      aria-pressed={alignment === WRITER_MEDIA_ALIGNMENT.RIGHT}
    >
      Right
    </button>
    <label className="flex items-center gap-2 text-[11px] text-df-text-secondary">
      Width
      <input
        type="range"
        min={25}
        max={100}
        step={5}
        value={width}
        onChange={(event) => onResize(Number(event.target.value))}
      />
      <span className="text-[11px] text-df-text-tertiary">{width}%</span>
    </label>
  </div>
);

type ImageBlockComponentProps = {
  nodeKey: NodeKey;
  mediaId: string;
  altText: string;
  caption: string;
  alignment: WriterMediaAlignment;
  width: number;
  height: number | null;
};

const ImageBlockComponent = ({
  nodeKey,
  mediaId,
  altText,
  caption,
  alignment,
  width,
  height,
}: ImageBlockComponentProps) => {
  const [editor] = useLexicalComposerContext();
  const { record, isLoading } = useResolvedMedia(mediaId);
  const resolvedUrl = record?.url ?? null;

  const updateNode = useCallback(
    (updater: (node: ImageBlockNode) => void) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ImageBlockNode) {
          updater(node);
        }
      });
    },
    [editor, nodeKey]
  );

  const onAltChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNode((node) => node.setAltText(event.target.value));
  };

  const onCaptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNode((node) => node.setCaption(event.target.value));
  };

  const onAlign = (next: WriterMediaAlignment) => {
    updateNode((node) => node.setAlignment(next));
  };

  const onResize = (nextWidth: number) => {
    updateNode((node) => node.setWidth(nextWidth));
  };

  const onReplace = () => {
    editor.dispatchCommand(OPEN_MEDIA_PICKER_COMMAND, {
      kind: WRITER_MEDIA_KIND.IMAGE,
      nodeKey,
    });
  };

  return (
    <figure className="my-4 flex flex-col gap-3">
      <div className={`flex flex-col gap-2 ${alignmentClass(alignment)}`} style={{ width: `${width}%` }}>
        {resolvedUrl ? (
          <img
            src={resolvedUrl}
            alt={altText}
            className="h-auto w-full rounded-md border border-df-node-border object-cover"
            style={height ? { height } : undefined}
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-df-node-border text-xs text-df-text-tertiary">
            {isLoading ? 'Loading image…' : 'No image selected'}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={controlButton} onClick={onReplace}>
            {resolvedUrl ? 'Replace' : 'Select image'}
          </button>
          <MediaControls alignment={alignment} width={width} onAlign={onAlign} onResize={onResize} />
        </div>
      </div>
      <div className="flex flex-col gap-2 text-[11px] text-df-text-secondary">
        <label className="flex flex-col gap-1">
          Alt text
          <input
            className="rounded-md border border-df-control-border bg-df-surface-2 px-2 py-1 text-xs text-df-text-primary"
            value={altText}
            onChange={onAltChange}
            placeholder="Describe the image"
          />
        </label>
        <label className="flex flex-col gap-1">
          Caption
          <input
            className="rounded-md border border-df-control-border bg-df-surface-2 px-2 py-1 text-xs text-df-text-primary"
            value={caption}
            onChange={onCaptionChange}
            placeholder="Optional caption"
          />
        </label>
      </div>
    </figure>
  );
};

export class ImageBlockNode extends DecoratorNode<JSX.Element> {
  __mediaId: string;
  __altText: string;
  __caption: string;
  __alignment: WriterMediaAlignment;
  __width: number;
  __height: number | null;

  static getType() {
    return WRITER_LEXICAL_NODE_TYPE.IMAGE;
  }

  static clone(node: ImageBlockNode) {
    return new ImageBlockNode(
      node.__mediaId,
      node.__altText,
      node.__caption,
      node.__alignment,
      node.__width,
      node.__height,
      node.__key
    );
  }

  constructor(
    mediaId: string,
    altText = '',
    caption = '',
    alignment: WriterMediaAlignment = WRITER_MEDIA_ALIGNMENT.CENTER,
    width = 100,
    height: number | null = null,
    key?: NodeKey
  ) {
    super(key);
    this.__mediaId = mediaId;
    this.__altText = altText;
    this.__caption = caption;
    this.__alignment = alignment;
    this.__width = clampWidth(width);
    this.__height = height;
  }

  static importJSON(serializedNode: SerializedWriterImageNode) {
    return $createImageBlockNode(
      serializedNode.mediaId,
      serializedNode.altText,
      serializedNode.caption,
      serializedNode.alignment,
      serializedNode.width,
      serializedNode.height
    );
  }

  exportJSON(): SerializedWriterImageNode {
    return {
      type: WRITER_LEXICAL_NODE_TYPE.IMAGE,
      version: 1,
      mediaId: this.__mediaId,
      altText: this.__altText,
      caption: this.__caption,
      alignment: this.__alignment,
      width: this.__width,
      height: this.__height,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <ImageBlockComponent
        nodeKey={this.getKey()}
        mediaId={this.__mediaId}
        altText={this.__altText}
        caption={this.__caption}
        alignment={this.__alignment}
        width={this.__width}
        height={this.__height}
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  setMediaId(mediaId: string) {
    const writable = this.getWritable();
    writable.__mediaId = mediaId;
  }

  setAltText(altText: string) {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setCaption(caption: string) {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  setAlignment(alignment: WriterMediaAlignment) {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setWidth(width: number) {
    const writable = this.getWritable();
    writable.__width = clampWidth(width);
  }

  setHeight(height: number | null) {
    const writable = this.getWritable();
    writable.__height = height;
  }

  getMediaId() {
    return this.__mediaId;
  }
}

export const $createImageBlockNode = (
  mediaId: string,
  altText = '',
  caption = '',
  alignment: WriterMediaAlignment = WRITER_MEDIA_ALIGNMENT.CENTER,
  width = 100,
  height: number | null = null
) => new ImageBlockNode(mediaId, altText, caption, alignment, width, height);

export const $isImageBlockNode = (node: LexicalNode | null | undefined): node is ImageBlockNode =>
  node instanceof ImageBlockNode;

type FileAttachmentComponentProps = {
  nodeKey: NodeKey;
  mediaId: string;
  label: string;
  caption: string;
  alignment: WriterMediaAlignment;
  width: number;
};

const FileAttachmentComponent = ({
  nodeKey,
  mediaId,
  label,
  caption,
  alignment,
  width,
}: FileAttachmentComponentProps) => {
  const [editor] = useLexicalComposerContext();
  const { record, isLoading } = useResolvedMedia(mediaId);
  const resolvedUrl = record?.url ?? null;
  const displayLabel = record?.filename ?? label ?? 'Attachment';

  const updateNode = useCallback(
    (updater: (node: FileAttachmentNode) => void) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof FileAttachmentNode) {
          updater(node);
        }
      });
    },
    [editor, nodeKey]
  );

  const onLabelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNode((node) => node.setLabel(event.target.value));
  };

  const onCaptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNode((node) => node.setCaption(event.target.value));
  };

  const onAlign = (next: WriterMediaAlignment) => {
    updateNode((node) => node.setAlignment(next));
  };

  const onResize = (nextWidth: number) => {
    updateNode((node) => node.setWidth(nextWidth));
  };

  const onReplace = () => {
    editor.dispatchCommand(OPEN_MEDIA_PICKER_COMMAND, {
      kind: WRITER_MEDIA_KIND.FILE,
      nodeKey,
    });
  };

  return (
    <div className="my-4 flex flex-col gap-3">
      <div className={`${alignmentClass(alignment)} flex flex-col gap-2`} style={{ width: `${width}%` }}>
        <div className="flex flex-col gap-2 rounded-md border border-df-node-border bg-df-surface-2 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-df-text-primary">
                {displayLabel}
              </span>
              <span className="text-[11px] text-df-text-tertiary">
                {record?.mimeType ?? 'File attachment'}
              </span>
            </div>
            {resolvedUrl ? (
              <a
                href={resolvedUrl}
                className="text-[11px] text-df-text-secondary underline"
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            ) : (
              <span className="text-[11px] text-df-text-tertiary">
                {isLoading ? 'Loading…' : 'No file selected'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={controlButton} onClick={onReplace}>
              {resolvedUrl ? 'Replace' : 'Select file'}
            </button>
            <MediaControls alignment={alignment} width={width} onAlign={onAlign} onResize={onResize} />
          </div>
        </div>
        <div className="flex flex-col gap-2 text-[11px] text-df-text-secondary">
          <label className="flex flex-col gap-1">
            Label
            <input
              className="rounded-md border border-df-control-border bg-df-surface-2 px-2 py-1 text-xs text-df-text-primary"
              value={label}
              onChange={onLabelChange}
              placeholder="Attachment label"
            />
          </label>
          <label className="flex flex-col gap-1">
            Caption
            <input
              className="rounded-md border border-df-control-border bg-df-surface-2 px-2 py-1 text-xs text-df-text-primary"
              value={caption}
              onChange={onCaptionChange}
              placeholder="Optional caption"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export class FileAttachmentNode extends DecoratorNode<JSX.Element> {
  __mediaId: string;
  __label: string;
  __caption: string;
  __alignment: WriterMediaAlignment;
  __width: number;

  static getType() {
    return WRITER_LEXICAL_NODE_TYPE.FILE;
  }

  static clone(node: FileAttachmentNode) {
    return new FileAttachmentNode(
      node.__mediaId,
      node.__label,
      node.__caption,
      node.__alignment,
      node.__width,
      node.__key
    );
  }

  constructor(
    mediaId: string,
    label = '',
    caption = '',
    alignment: WriterMediaAlignment = WRITER_MEDIA_ALIGNMENT.LEFT,
    width = 100,
    key?: NodeKey
  ) {
    super(key);
    this.__mediaId = mediaId;
    this.__label = label;
    this.__caption = caption;
    this.__alignment = alignment;
    this.__width = clampWidth(width);
  }

  static importJSON(serializedNode: SerializedWriterFileNode) {
    return $createFileAttachmentNode(
      serializedNode.mediaId,
      serializedNode.label,
      serializedNode.caption,
      serializedNode.alignment,
      serializedNode.width
    );
  }

  exportJSON(): SerializedWriterFileNode {
    return {
      type: WRITER_LEXICAL_NODE_TYPE.FILE,
      version: 1,
      mediaId: this.__mediaId,
      label: this.__label,
      caption: this.__caption,
      alignment: this.__alignment,
      width: this.__width,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <FileAttachmentComponent
        nodeKey={this.getKey()}
        mediaId={this.__mediaId}
        label={this.__label}
        caption={this.__caption}
        alignment={this.__alignment}
        width={this.__width}
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  setMediaId(mediaId: string) {
    const writable = this.getWritable();
    writable.__mediaId = mediaId;
  }

  setLabel(label: string) {
    const writable = this.getWritable();
    writable.__label = label;
  }

  setCaption(caption: string) {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  setAlignment(alignment: WriterMediaAlignment) {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setWidth(width: number) {
    const writable = this.getWritable();
    writable.__width = clampWidth(width);
  }
}

export const $createFileAttachmentNode = (
  mediaId: string,
  label = '',
  caption = '',
  alignment: WriterMediaAlignment = WRITER_MEDIA_ALIGNMENT.LEFT,
  width = 100
) => new FileAttachmentNode(mediaId, label, caption, alignment, width);

export const $isFileAttachmentNode = (node: LexicalNode | null | undefined): node is FileAttachmentNode =>
  node instanceof FileAttachmentNode;

type EmbedBlockComponentProps = {
  nodeKey: NodeKey;
  mediaId: string;
  title: string;
  caption: string;
  alignment: WriterMediaAlignment;
  width: number;
  height: number;
  fallbackUrl?: string | null;
};

const EmbedBlockComponent = ({
  nodeKey,
  mediaId,
  title,
  caption,
  alignment,
  width,
  height,
  fallbackUrl,
}: EmbedBlockComponentProps) => {
  const [editor] = useLexicalComposerContext();
  const { record, isLoading } = useResolvedMedia(mediaId);
  const resolvedUrl = record?.url ?? fallbackUrl ?? null;
  const displayTitle = record?.title ?? title ?? 'Embed';

  const updateNode = useCallback(
    (updater: (node: EmbedBlockNode) => void) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof EmbedBlockNode) {
          updater(node);
        }
      });
    },
    [editor, nodeKey]
  );

  const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNode((node) => node.setTitle(event.target.value));
  };

  const onCaptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateNode((node) => node.setCaption(event.target.value));
  };

  const onAlign = (next: WriterMediaAlignment) => {
    updateNode((node) => node.setAlignment(next));
  };

  const onResize = (nextWidth: number) => {
    updateNode((node) => node.setWidth(nextWidth));
  };

  const onResizeHeight = (nextHeight: number) => {
    updateNode((node) => node.setHeight(nextHeight));
  };

  const onEdit = () => {
    editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, { nodeKey });
  };

  return (
    <figure className="my-4 flex flex-col gap-3">
      <div className={`${alignmentClass(alignment)} flex flex-col gap-2`} style={{ width: `${width}%` }}>
        {resolvedUrl ? (
          <iframe
            src={resolvedUrl}
            title={displayTitle}
            className="w-full rounded-md border border-df-node-border"
            style={{ height }}
          />
        ) : (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-df-node-border text-xs text-df-text-tertiary">
            {isLoading ? 'Loading embed…' : 'No embed selected'}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={controlButton} onClick={onEdit}>
            {resolvedUrl ? 'Edit embed' : 'Set embed URL'}
          </button>
          <MediaControls alignment={alignment} width={width} onAlign={onAlign} onResize={onResize} />
          <label className="flex items-center gap-2 text-[11px] text-df-text-secondary">
            Height
            <input
              type="range"
              min={160}
              max={720}
              step={20}
              value={height}
              onChange={(event) => onResizeHeight(Number(event.target.value))}
            />
            <span className="text-[11px] text-df-text-tertiary">{height}px</span>
          </label>
        </div>
      </div>
      <div className="flex flex-col gap-2 text-[11px] text-df-text-secondary">
        <label className="flex flex-col gap-1">
          Title
          <input
            className="rounded-md border border-df-control-border bg-df-surface-2 px-2 py-1 text-xs text-df-text-primary"
            value={title}
            onChange={onTitleChange}
            placeholder="Embed title"
          />
        </label>
        <label className="flex flex-col gap-1">
          Caption
          <input
            className="rounded-md border border-df-control-border bg-df-surface-2 px-2 py-1 text-xs text-df-text-primary"
            value={caption}
            onChange={onCaptionChange}
            placeholder="Optional caption"
          />
        </label>
      </div>
    </figure>
  );
};

export class EmbedBlockNode extends DecoratorNode<JSX.Element> {
  __mediaId: string;
  __title: string;
  __caption: string;
  __alignment: WriterMediaAlignment;
  __width: number;
  __height: number;
  __fallbackUrl: string | null;

  static getType() {
    return WRITER_LEXICAL_NODE_TYPE.EMBED;
  }

  static clone(node: EmbedBlockNode) {
    return new EmbedBlockNode(
      node.__mediaId,
      node.__title,
      node.__caption,
      node.__alignment,
      node.__width,
      node.__height,
      node.__fallbackUrl,
      node.__key
    );
  }

  constructor(
    mediaId: string,
    title = '',
    caption = '',
    alignment: WriterMediaAlignment = WRITER_MEDIA_ALIGNMENT.CENTER,
    width = 100,
    height = 360,
    fallbackUrl: string | null = null,
    key?: NodeKey
  ) {
    super(key);
    this.__mediaId = mediaId;
    this.__title = title;
    this.__caption = caption;
    this.__alignment = alignment;
    this.__width = clampWidth(width);
    this.__height = height;
    this.__fallbackUrl = fallbackUrl;
  }

  static importJSON(serializedNode: SerializedWriterEmbedNode) {
    return $createEmbedBlockNode(
      serializedNode.mediaId,
      serializedNode.title,
      serializedNode.caption,
      serializedNode.alignment,
      serializedNode.width,
      serializedNode.height,
      serializedNode.fallbackUrl ?? null
    );
  }

  exportJSON(): SerializedWriterEmbedNode {
    return {
      type: WRITER_LEXICAL_NODE_TYPE.EMBED,
      version: 1,
      mediaId: this.__mediaId,
      title: this.__title,
      caption: this.__caption,
      alignment: this.__alignment,
      width: this.__width,
      height: this.__height,
      fallbackUrl: this.__fallbackUrl,
    };
  }

  createDOM(): HTMLElement {
    return document.createElement('div');
  }

  updateDOM(): boolean {
    return false;
  }

  decorate(editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <EmbedBlockComponent
        nodeKey={this.getKey()}
        mediaId={this.__mediaId}
        title={this.__title}
        caption={this.__caption}
        alignment={this.__alignment}
        width={this.__width}
        height={this.__height}
        fallbackUrl={this.__fallbackUrl}
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  setMediaId(mediaId: string) {
    const writable = this.getWritable();
    writable.__mediaId = mediaId;
  }

  setTitle(title: string) {
    const writable = this.getWritable();
    writable.__title = title;
  }

  setCaption(caption: string) {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  setAlignment(alignment: WriterMediaAlignment) {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setWidth(width: number) {
    const writable = this.getWritable();
    writable.__width = clampWidth(width);
  }

  setHeight(height: number) {
    const writable = this.getWritable();
    writable.__height = height;
  }

  setFallbackUrl(url: string | null) {
    const writable = this.getWritable();
    writable.__fallbackUrl = url;
  }
}

export const $createEmbedBlockNode = (
  mediaId: string,
  title = '',
  caption = '',
  alignment: WriterMediaAlignment = WRITER_MEDIA_ALIGNMENT.CENTER,
  width = 100,
  height = 360,
  fallbackUrl: string | null = null
) => new EmbedBlockNode(mediaId, title, caption, alignment, width, height, fallbackUrl);

export const $isEmbedBlockNode = (node: LexicalNode | null | undefined): node is EmbedBlockNode =>
  node instanceof EmbedBlockNode;
