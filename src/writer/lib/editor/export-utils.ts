import { $convertToMarkdownString } from '@lexical/markdown';
import { createEditor } from 'lexical';
import { PLAYGROUND_TRANSFORMERS } from '@/writer/components/WriterWorkspace/editor/lexical/plugins/MarkdownTransformers';
import PlaygroundNodes from '@/writer/components/WriterWorkspace/editor/lexical/nodes/PlaygroundNodes';

/**
 * Converts serialized Lexical editor content to markdown string
 */
export async function convertSerializedContentToMarkdown(
  serializedContent: string | null | undefined,
): Promise<string> {
  if (!serializedContent) {
    return '';
  }

  try {
    // Create a temporary editor instance with the same configuration
    const editor = createEditor({
      namespace: 'Export',
      nodes: PlaygroundNodes,
      onError: (error) => {
        console.error('Error converting to markdown:', error);
      },
    });

    // Parse the serialized content and get editor state
    const editorState = editor.parseEditorState(serializedContent);
    
    // Convert to markdown
    let markdown = '';
    editorState.read(() => {
      markdown = $convertToMarkdownString(PLAYGROUND_TRANSFORMERS);
    });

    return markdown;
  } catch (error) {
    console.error('Failed to convert content to markdown:', error);
    // Fallback to empty string or could return plain text
    return '';
  }
}
