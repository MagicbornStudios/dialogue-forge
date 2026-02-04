/**
 * Tests for Yarn Converter Utility Functions
 * 
 * Tests condition-parser, condition-formatter, content-formatter, and variable-handler
 */

import { describe, it, expect } from 'vitest';
import { parseCondition } from '../utils/condition-parser';
import { formatCondition, formatConditions } from '../utils/condition-formatter';
import { formatContent, extractSetCommands, removeSetCommands } from '../utils/content-formatter';
import { formatSetCommand, parseSetCommand, formatFlagsAsSetCommands } from '../utils/variable-handler';
import { CONDITION_OPERATOR, CONDITION_OPERATOR_SYMBOLS } from '@magicborn/forge/types/constants';
import type { ForgeCondition } from '@magicborn/forge/types/forge-graph';

describe('condition-parser', () => {
  describe('parseCondition', () => {
    it('should parse IS_SET condition', () => {
      const result = parseCondition('$quest');
      expect(result).toEqual([
        { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
      ]);
    });

    it('should parse IS_NOT_SET condition', () => {
      const result = parseCondition('not $quest');
      expect(result).toEqual([
        { flag: 'quest', operator: CONDITION_OPERATOR.IS_NOT_SET },
      ]);
    });

    it('should parse EQUALS condition with number', () => {
      const result = parseCondition('$count == 5');
      expect(result).toEqual([
        { flag: 'count', operator: CONDITION_OPERATOR.EQUALS, value: 5 },
      ]);
    });

    it('should parse EQUALS condition with string', () => {
      const result = parseCondition('$name == "Alice"');
      expect(result).toEqual([
        { flag: 'name', operator: CONDITION_OPERATOR.EQUALS, value: 'Alice' },
      ]);
    });

    it('should parse EQUALS condition with boolean', () => {
      const result = parseCondition('$flag == true');
      expect(result).toEqual([
        { flag: 'flag', operator: CONDITION_OPERATOR.EQUALS, value: true },
      ]);
    });

    it('should parse NOT_EQUALS condition', () => {
      const result = parseCondition('$count != 10');
      expect(result).toEqual([
        { flag: 'count', operator: CONDITION_OPERATOR.NOT_EQUALS, value: 10 },
      ]);
    });

    it('should parse GREATER_THAN condition', () => {
      const result = parseCondition('$gold > 100');
      expect(result).toEqual([
        { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 100 },
      ]);
    });

    it('should parse LESS_THAN condition', () => {
      const result = parseCondition('$health < 50');
      expect(result).toEqual([
        { flag: 'health', operator: CONDITION_OPERATOR.LESS_THAN, value: 50 },
      ]);
    });

    it('should parse GREATER_EQUAL condition', () => {
      const result = parseCondition('$level >= 5');
      expect(result).toEqual([
        { flag: 'level', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 5 },
      ]);
    });

    it('should parse LESS_EQUAL condition', () => {
      const result = parseCondition('$score <= 1000');
      expect(result).toEqual([
        { flag: 'score', operator: CONDITION_OPERATOR.LESS_EQUAL, value: 1000 },
      ]);
    });

    it('should parse multiple conditions with AND', () => {
      const result = parseCondition('$quest and $count == 5');
      expect(result).toEqual([
        { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
        { flag: 'count', operator: CONDITION_OPERATOR.EQUALS, value: 5 },
      ]);
    });

    it('should parse complex AND conditions', () => {
      const result = parseCondition('$quest and $gold > 100 and $level >= 5');
      expect(result).toEqual([
        { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
        { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 100 },
        { flag: 'level', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 5 },
      ]);
    });

    it('should handle empty string', () => {
      const result = parseCondition('');
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only string', () => {
      const result = parseCondition('   ');
      expect(result).toEqual([]);
    });
  });
});

describe('condition-formatter', () => {
  describe('formatCondition', () => {
    it('should format IS_SET condition', () => {
      const cond: ForgeCondition = {
        flag: 'quest',
        operator: CONDITION_OPERATOR.IS_SET,
      };
      expect(formatCondition(cond)).toBe('$quest');
    });

    it('should format IS_NOT_SET condition', () => {
      const cond: ForgeCondition = {
        flag: 'quest',
        operator: CONDITION_OPERATOR.IS_NOT_SET,
      };
      expect(formatCondition(cond)).toBe('not $quest');
    });

    it('should format EQUALS condition with number', () => {
      const cond: ForgeCondition = {
        flag: 'count',
        operator: CONDITION_OPERATOR.EQUALS,
        value: 5,
      };
      expect(formatCondition(cond)).toBe('$count == 5');
    });

    it('should format EQUALS condition with string', () => {
      const cond: ForgeCondition = {
        flag: 'name',
        operator: CONDITION_OPERATOR.EQUALS,
        value: 'Alice',
      };
      expect(formatCondition(cond)).toBe('$name == "Alice"');
    });

    it('should format EQUALS condition with boolean', () => {
      const cond: ForgeCondition = {
        flag: 'flag',
        operator: CONDITION_OPERATOR.EQUALS,
        value: true,
      };
      expect(formatCondition(cond)).toBe('$flag == true');
    });

    it('should format EQUALS condition without value', () => {
      const cond: ForgeCondition = {
        flag: 'flag',
        operator: CONDITION_OPERATOR.EQUALS,
      };
      expect(formatCondition(cond)).toBe('$flag');
    });

    it('should format NOT_EQUALS condition', () => {
      const cond: ForgeCondition = {
        flag: 'count',
        operator: CONDITION_OPERATOR.NOT_EQUALS,
        value: 10,
      };
      expect(formatCondition(cond)).toBe('$count != 10');
    });

    it('should format GREATER_THAN condition', () => {
      const cond: ForgeCondition = {
        flag: 'gold',
        operator: CONDITION_OPERATOR.GREATER_THAN,
        value: 100,
      };
      expect(formatCondition(cond)).toBe('$gold > 100');
    });

    it('should format LESS_THAN condition', () => {
      const cond: ForgeCondition = {
        flag: 'health',
        operator: CONDITION_OPERATOR.LESS_THAN,
        value: 50,
      };
      expect(formatCondition(cond)).toBe('$health < 50');
    });

    it('should format GREATER_EQUAL condition', () => {
      const cond: ForgeCondition = {
        flag: 'level',
        operator: CONDITION_OPERATOR.GREATER_EQUAL,
        value: 5,
      };
      expect(formatCondition(cond)).toBe('$level >= 5');
    });

    it('should format LESS_EQUAL condition', () => {
      const cond: ForgeCondition = {
        flag: 'score',
        operator: CONDITION_OPERATOR.LESS_EQUAL,
        value: 1000,
      };
      expect(formatCondition(cond)).toBe('$score <= 1000');
    });
  });

  describe('formatConditions', () => {
    it('should format single condition', () => {
      const conditions: ForgeCondition[] = [
        { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
      ];
      expect(formatConditions(conditions)).toBe('$quest');
    });

    it('should format multiple conditions with AND', () => {
      const conditions: ForgeCondition[] = [
        { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
        { flag: 'count', operator: CONDITION_OPERATOR.EQUALS, value: 5 },
      ];
      expect(formatConditions(conditions)).toBe('$quest and $count == 5');
    });

    it('should format complex conditions', () => {
      const conditions: ForgeCondition[] = [
        { flag: 'quest', operator: CONDITION_OPERATOR.IS_SET },
        { flag: 'gold', operator: CONDITION_OPERATOR.GREATER_THAN, value: 100 },
        { flag: 'level', operator: CONDITION_OPERATOR.GREATER_EQUAL, value: 5 },
      ];
      expect(formatConditions(conditions)).toBe('$quest and $gold > 100 and $level >= 5');
    });

    it('should handle empty array', () => {
      expect(formatConditions([])).toBe('');
    });
  });
});

describe('content-formatter', () => {
  describe('formatContent', () => {
    it('should format content without speaker', () => {
      expect(formatContent('Hello, world!')).toBe('Hello, world!');
    });

    it('should format content with speaker', () => {
      expect(formatContent('Hello, world!', 'NPC')).toBe('NPC: Hello, world!');
    });

    it('should handle multiline content without speaker', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      expect(formatContent(content)).toBe(content);
    });

    it('should handle multiline content with speaker', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      expect(formatContent(content, 'NPC')).toBe('NPC: Line 1\nNPC: Line 2\nNPC: Line 3');
    });

    it('should handle empty content', () => {
      expect(formatContent('')).toBe('');
    });
  });

  describe('extractSetCommands', () => {
    it('should extract single set command', () => {
      const content = 'Hello! <<set $flag = true>>';
      const result = extractSetCommands(content);
      expect(result).toEqual(['<<set $flag = true>>']);
    });

    it('should extract multiple set commands', () => {
      const content = '<<set $flag1 = true>> Hello! <<set $flag2 = false>>';
      const result = extractSetCommands(content);
      expect(result).toEqual(['<<set $flag1 = true>>', '<<set $flag2 = false>>']);
    });

    it('should extract set commands with operators', () => {
      const content = '<<set $gold += 100>> <<set $health -= 10>>';
      const result = extractSetCommands(content);
      expect(result).toEqual(['<<set $gold += 100>>', '<<set $health -= 10>>']);
    });

    it('should return empty array when no commands', () => {
      expect(extractSetCommands('Hello, world!')).toEqual([]);
    });

    it('should handle empty content', () => {
      expect(extractSetCommands('')).toEqual([]);
    });
  });

  describe('removeSetCommands', () => {
    it('should remove single set command', () => {
      const content = 'Hello! <<set $flag = true>>';
      expect(removeSetCommands(content)).toBe('Hello!');
    });

    it('should remove multiple set commands', () => {
      const content = '<<set $flag1 = true>> Hello! <<set $flag2 = false>>';
      expect(removeSetCommands(content)).toBe('Hello!');
    });

    it('should preserve content without commands', () => {
      expect(removeSetCommands('Hello, world!')).toBe('Hello, world!');
    });

    it('should handle empty content', () => {
      expect(removeSetCommands('')).toBe('');
    });
  });
});

describe('variable-handler', () => {
  describe('formatSetCommand', () => {
    it('should format boolean set command', () => {
      expect(formatSetCommand('flag', true)).toBe('<<set $flag = true>>');
      expect(formatSetCommand('flag', false)).toBe('<<set $flag = false>>');
    });

    it('should format number set command', () => {
      expect(formatSetCommand('count', 5)).toBe('<<set $count = 5>>');
      expect(formatSetCommand('gold', 100)).toBe('<<set $gold = 100>>');
    });

    it('should format string set command', () => {
      expect(formatSetCommand('name', 'Alice')).toBe('<<set $name = "Alice">>');
    });

    it('should default to true', () => {
      expect(formatSetCommand('flag')).toBe('<<set $flag = true>>');
    });
  });

  describe('parseSetCommand', () => {
    it('should parse simple set command', () => {
      const result = parseSetCommand('<<set $flag = true>>');
      expect(result).toEqual({
        flag: 'flag',
        operator: CONDITION_OPERATOR_SYMBOLS.EQUALS,
        value: true,
      });
    });

    it('should parse set command with number', () => {
      const result = parseSetCommand('<<set $count = 5>>');
      expect(result).toEqual({
        flag: 'count',
        operator: CONDITION_OPERATOR_SYMBOLS.EQUALS,
        value: 5,
      });
    });

    it('should parse set command with string', () => {
      const result = parseSetCommand('<<set $name = "Alice">>');
      expect(result).toEqual({
        flag: 'name',
        operator: CONDITION_OPERATOR_SYMBOLS.EQUALS,
        value: 'Alice',
      });
    });

    it('should parse set command with += operator', () => {
      const result = parseSetCommand('<<set $gold += 100>>');
      expect(result).toEqual({
        flag: 'gold',
        operator: CONDITION_OPERATOR_SYMBOLS.ADD,
        value: 100,
      });
    });

    it('should parse set command with -= operator', () => {
      const result = parseSetCommand('<<set $health -= 10>>');
      expect(result).toEqual({
        flag: 'health',
        operator: CONDITION_OPERATOR_SYMBOLS.SUBTRACT,
        value: 10,
      });
    });

    it('should parse set command with *= operator', () => {
      const result = parseSetCommand('<<set $mult *= 2>>');
      expect(result).toEqual({
        flag: 'mult',
        operator: CONDITION_OPERATOR_SYMBOLS.MULTIPLY,
        value: 2,
      });
    });

    it('should parse set command with /= operator', () => {
      const result = parseSetCommand('<<set $div /= 2>>');
      expect(result).toEqual({
        flag: 'div',
        operator: CONDITION_OPERATOR_SYMBOLS.DIVIDE,
        value: 2,
      });
    });

    it('should return null for invalid command', () => {
      expect(parseSetCommand('invalid')).toBeNull();
      expect(parseSetCommand('<<set>>')).toBeNull();
    });
  });

  describe('formatFlagsAsSetCommands', () => {
    it('should format flags array with default value', () => {
      const result = formatFlagsAsSetCommands(['flag1', 'flag2']);
      expect(result).toEqual([
        '<<set $flag1 = true>>',
        '<<set $flag2 = true>>',
      ]);
    });

    it('should format flags array with custom value', () => {
      const result = formatFlagsAsSetCommands(['count'], 5);
      expect(result).toEqual(['<<set $count = 5>>']);
    });

    it('should handle empty array', () => {
      expect(formatFlagsAsSetCommands([])).toEqual([]);
    });
  });
});
