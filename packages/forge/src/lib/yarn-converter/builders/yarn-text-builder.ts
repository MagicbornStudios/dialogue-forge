/**
 * Yarn Text Builder
 * 
 * Transparent Yarn text generation with clear formatting functions.
 * All Yarn syntax constants are visible at the top for easy updates.
 * 
 * This builder makes it clear exactly how Yarn text is produced,
 * making it easy to see prefixes, commands, and formatting.
 */

import type { YarnTextBuilder as IYarnTextBuilder } from '../types';

/**
 * Yarn syntax constants
 * 
 * All Yarn Spinner syntax elements in one place for easy updates.
 * These define the exact strings used in Yarn file format.
 */
export const YARN_SYNTAX = {
  /** Node title prefix: "title: NodeName" */
  NODE_TITLE_PREFIX: 'title: ',
  
  /** Node separator: "---" (separates title from content) */
  NODE_SEPARATOR: '---',
  
  /** Node end marker: "===" (separates nodes) */
  NODE_END: '===',
  
  /** Option/choice prefix: "-> Choice text" */
  OPTION_PREFIX: '-> ',
  
  /** Jump command: "<<jump NodeName>>" */
  JUMP_COMMAND: '<<jump ',
  
  /** Set command: "<<set $var = value>>" */
  SET_COMMAND: '<<set ',
  
  /** If command: "<<if condition>>" */
  IF_COMMAND: '<<if ',
  
  /** Elseif command: "<<elseif condition>>" */
  ELSEIF_COMMAND: '<<elseif ',
  
  /** Else command: "<<else>>" */
  ELSE_COMMAND: '<<else>>',
  
  /** Endif command: "<<endif>>" */
  ENDIF_COMMAND: '<<endif>>',
  
  /** Command closing: ">>" */
  COMMAND_CLOSE: '>>',
  
  /** Indent for nested content (4 spaces) */
  INDENT: '    ',
  
  /** Newline character */
  NEWLINE: '\n',
} as const;

/**
 * YarnTextBuilder - Transparent Yarn text generation
 * 
 * Provides clear, visible methods for building Yarn format text.
 * Each method clearly shows what Yarn syntax it produces.
 */
export class YarnTextBuilder implements IYarnTextBuilder {
  private lines: string[] = [];

  /**
   * Add node title line
   * Produces: "title: NodeName\n"
   */
  addNodeTitle(nodeId: string): this {
    this.lines.push(`${YARN_SYNTAX.NODE_TITLE_PREFIX}${nodeId}${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add node separator
   * Produces: "---\n"
   */
  addNodeSeparator(): this {
    this.lines.push(`${YARN_SYNTAX.NODE_SEPARATOR}${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add a dialogue line
   * Produces: "Speaker: content\n" or "content\n"
   * Handles multiline content by prefixing each line with speaker
   */
  addLine(content: string, speaker?: string): this {
    if (speaker) {
      // Multiline content: prefix each line with speaker
      const formatted = content.replace(/\n/g, `\n${speaker}: `);
      this.lines.push(`${speaker}: ${formatted}${YARN_SYNTAX.NEWLINE}`);
    } else {
      this.lines.push(`${content}${YARN_SYNTAX.NEWLINE}`);
    }
    return this;
  }

  /**
   * Add a player option/choice
   * Produces: "-> Choice text\n" (with optional indent)
   */
  addOption(choiceText: string, indent: number = 0): this {
    const indentStr = indent > 0 ? YARN_SYNTAX.INDENT.repeat(indent) : '';
    this.lines.push(`${indentStr}${YARN_SYNTAX.OPTION_PREFIX}${choiceText}${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add a generic command
   * Produces: "<<command args>>\n"
   */
  addCommand(command: string, args?: string): this {
    const argsStr = args ? ` ${args}` : '';
    this.lines.push(`<<${command}${argsStr}>>${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add conditional block start
   * Produces: "<<if condition>>\n" or "<<elseif condition>>\n" or "<<else>>\n"
   */
  addConditionalBlock(type: 'if' | 'elseif' | 'else', condition?: string): this {
    if (type === 'else') {
      this.lines.push(`${YARN_SYNTAX.ELSE_COMMAND}${YARN_SYNTAX.NEWLINE}`);
    } else {
      const command = type === 'if' ? YARN_SYNTAX.IF_COMMAND : YARN_SYNTAX.ELSEIF_COMMAND;
      const conditionStr = condition ? condition : '';
      this.lines.push(`${command}${conditionStr}>>${YARN_SYNTAX.NEWLINE}`);
    }
    return this;
  }

  /**
   * Add conditional block end
   * Produces: "<<endif>>\n"
   */
  addEndConditional(): this {
    this.lines.push(`${YARN_SYNTAX.ENDIF_COMMAND}${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add jump command
   * Produces: "<<jump NodeName>>\n" (with optional indent)
   */
  addJump(targetNodeId: string, indent: number = 0): this {
    const indentStr = indent > 0 ? YARN_SYNTAX.INDENT.repeat(indent) : '';
    this.lines.push(`${indentStr}${YARN_SYNTAX.JUMP_COMMAND}${targetNodeId}>>${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add set command
   * Produces: "<<set $flag = value>>\n" (with optional indent)
   */
  addSetCommand(flag: string, value: any = true, indent: number = 0): this {
    const indentStr = indent > 0 ? YARN_SYNTAX.INDENT.repeat(indent) : '';
    const valueStr = typeof value === 'string' ? `"${value}"` : String(value);
    this.lines.push(`${indentStr}${YARN_SYNTAX.SET_COMMAND}$${flag} = ${valueStr}>>${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add node end marker
   * Produces: "===\n\n"
   */
  addNodeEnd(): this {
    this.lines.push(`${YARN_SYNTAX.NODE_END}${YARN_SYNTAX.NEWLINE}${YARN_SYNTAX.NEWLINE}`);
    return this;
  }

  /**
   * Add raw text (for preserving existing Yarn commands in content)
   */
  addRaw(text: string): this {
    this.lines.push(text);
    return this;
  }

  /**
   * Build final Yarn text string
   */
  build(): string {
    return this.lines.join('');
  }

  /**
   * Clear all lines (for reuse)
   */
  clear(): void {
    this.lines = [];
  }

  /**
   * Get current line count (for debugging)
   */
  getLineCount(): number {
    return this.lines.length;
  }
}
