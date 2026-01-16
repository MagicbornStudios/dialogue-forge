import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DROP_COMMAND,
  PASTE_COMMAND,
  createCommand,
  type LexicalCommand,
  type NodeKey,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useWriterWorkspaceStore } from '@/writer/components/WriterWorkspace/store/writer-workspace-store';
import {
  $createEmbedBlockNode,
  $createFileAttachmentNode,
  $createImageBlockNode,
  EmbedBlockNode,
  FileAttachmentNode,
  ImageBlockNode,
} from '@/writer/components/WriterWorkspace/editor/lexical/nodes/MediaNodes';
import { WRITER_MEDIA_KIND, type WriterMediaKind } from '@/writer/lib/data-adapter/media';

type MediaPickerPayload = {
  kind: WriterMediaKind;
  nodeKey?: NodeKey;
};

type EmbedDialogPayload = {
  nodeKey?: NodeKey;
};

export const OPEN_MEDIA_PICKER_COMMAND: LexicalCommand<MediaPickerPayload> = createCommand();
export const OPEN_EMBED_DIALOG_COMMAND: LexicalCommand<EmbedDialogPayload> = createCommand();

const acceptForKind = (kind: WriterMediaKind) => {
  if (kind === WRITER_MEDIA_KIND.IMAGE) {
    return 'image/*';
  }
  if (kind === WRITER_MEDIA_KIND.FILE) {
    return '*/*';
  }
  return '*/*';
};

const isImageFile = (file: File) => file.type.startsWith('image/');

export function MediaPlugin() {
  const [editor] = useLexicalComposerContext();
  const dataAdapter = useWriterWorkspaceStore((state) => state.dataAdapter);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pickerPayload, setPickerPayload] = useState<MediaPickerPayload | null>(null);

  const replaceNodeMedia = useCallback(
    (nodeKey: NodeKey, mediaId: string, fallbackLabel?: string, fallbackUrl?: string | null) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node instanceof ImageBlockNode) {
          node.setMediaId(mediaId);
          return;
        }
        if (node instanceof FileAttachmentNode) {
          node.setMediaId(mediaId);
          if (fallbackLabel) {
            node.setLabel(fallbackLabel);
          }
          return;
        }
        if (node instanceof EmbedBlockNode) {
          node.setMediaId(mediaId);
          if (fallbackUrl) {
            node.setFallbackUrl(fallbackUrl);
          }
        }
      });
    },
    [editor]
  );

  const insertNodeForUpload = useCallback(
    (mediaId: string, file: File) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }
        if (isImageFile(file)) {
          selection.insertNodes([$createImageBlockNode(mediaId)]);
        } else {
          selection.insertNodes([$createFileAttachmentNode(mediaId, file.name)]);
        }
      });
    },
    [editor]
  );

  const uploadFiles = useCallback(
    async (files: File[], payload: MediaPickerPayload | null) => {
      if (!dataAdapter?.uploadMedia) {
        return;
      }
      if (payload?.nodeKey && files.length > 0) {
        const file = files[0];
        const result = await dataAdapter.uploadMedia(file);
        if (!result?.mediaId) {
          return;
        }
        replaceNodeMedia(payload.nodeKey, result.mediaId, file.name);
        return;
      }
      await Promise.all(
        files.map(async (file) => {
          const result = await dataAdapter.uploadMedia(file);
          if (!result?.mediaId) {
            return;
          }
          insertNodeForUpload(result.mediaId, file);
        })
      );
    },
    [dataAdapter, insertNodeForUpload, replaceNodeMedia]
  );

  const openEmbedDialog = useCallback(
    async (payload: EmbedDialogPayload) => {
      const url = window.prompt('Embed URL');
      if (!url) {
        return;
      }
      if (dataAdapter?.createEmbed) {
        const result = await dataAdapter.createEmbed(url);
        if (!result?.mediaId) {
          return;
        }
        if (payload.nodeKey) {
          replaceNodeMedia(payload.nodeKey, result.mediaId, undefined, url);
          return;
        }
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return;
          }
          selection.insertNodes([
            $createEmbedBlockNode(result.mediaId, '', '', undefined, 100, 360, url),
          ]);
        });
        return;
      }
      const mediaId = url;
      if (payload.nodeKey) {
        replaceNodeMedia(payload.nodeKey, mediaId, undefined, url);
        return;
      }
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }
        selection.insertNodes([$createEmbedBlockNode(mediaId, '', '', undefined, 100, 360, url)]);
      });
    },
    [dataAdapter, editor, replaceNodeMedia]
  );

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) {
      return;
    }
    const payload = pickerPayload;
    setPickerPayload(null);
    await uploadFiles(files, payload);
  };

  const handleOpenPicker = useCallback(
    (payload: MediaPickerPayload) => {
      if (!dataAdapter?.uploadMedia || !inputRef.current) {
        return;
      }
      setPickerPayload(payload);
      inputRef.current.accept = acceptForKind(payload.kind);
      inputRef.current.multiple = !payload.nodeKey;
      inputRef.current.click();
    },
    [dataAdapter]
  );

  const handleDrop = useCallback(
    (event: DragEvent) => {
      if (!dataAdapter?.uploadMedia) {
        return false;
      }
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length === 0) {
        return false;
      }
      event.preventDefault();
      void uploadFiles(files, null);
      return true;
    },
    [dataAdapter, uploadFiles]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (!dataAdapter?.uploadMedia) {
        return false;
      }
      const files = Array.from(event.clipboardData?.files ?? []);
      if (files.length === 0) {
        return false;
      }
      event.preventDefault();
      void uploadFiles(files, null);
      return true;
    },
    [dataAdapter, uploadFiles]
  );

  const registerCommands = useMemo(
    () => [
      editor.registerCommand(
        OPEN_MEDIA_PICKER_COMMAND,
        (payload) => {
          handleOpenPicker(payload);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        OPEN_EMBED_DIALOG_COMMAND,
        (payload) => {
          void openEmbedDialog(payload);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event: DragEvent) => {
          return handleDrop(event);
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          return handlePaste(event);
        },
        COMMAND_PRIORITY_LOW
      ),
    ],
    [editor, handleDrop, handleOpenPicker, handlePaste, openEmbedDialog]
  );

  React.useEffect(() => {
    return () => {
      registerCommands.forEach((unregister) => unregister());
    };
  }, [registerCommands]);

  return (
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      onChange={onInputChange}
    />
  );
}
