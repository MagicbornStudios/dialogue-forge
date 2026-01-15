/**
 * Content Formatter
 * 
 * Formats dialogue content with speaker prefixes and extracts set commands.
 * Handles multiline content and speaker formatting.
 */

/**
 * Format content with optional speaker
 * 
 * If speaker provided, formats as "Speaker: content"
 * Handles multiline by prefixing each line with speaker
 * 
 * @param content - Dialogue content
 * @param speaker - Optional speaker name
 * @returns Formatted content string
 */
export function formatContent(content: string, speaker?: string): string {
  if (!content) return '';

  if (speaker) {
    // Multiline content: prefix each line with speaker
    return content.replace(/\n/g, `\n${speaker}: `);
  }

  return content;
}

/**
 * Extract <<set>> commands from content
 * 
 * Matches patterns like:
 * - <<set $var = value>>
 * - <<set $var += value>>
 * - <<set $var -= value>>
 * 
 * @param content - Content string that may contain set commands
 * @returns Array of set command strings
 */
export function extractSetCommands(content: string): string[] {
  if (!content) return [];

  const setCommandRegex = /<<set\s+\$(\w+)\s*([+\-*/=]+)\s*(.+?)>>/g;
  const matches: string[] = [];
  let match;

  while ((match = setCommandRegex.exec(content)) !== null) {
    matches.push(match[0]);
  }

  return matches;
}

/**
 * Remove set commands from content
 * 
 * @param content - Content string
 * @returns Content with set commands removed
 */
export function removeSetCommands(content: string): string {
  const commands = extractSetCommands(content);
  let cleaned = content;

  commands.forEach(cmd => {
    cleaned = cleaned.replace(cmd, '').trim();
  });

  return cleaned;
}
