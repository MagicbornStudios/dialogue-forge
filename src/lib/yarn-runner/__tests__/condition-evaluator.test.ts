import { describe, it, expect } from 'vitest';
import { evaluateCondition, evaluateConditions, VariableState } from '../condition-evaluator';
import { Condition } from '../../../types';
import { CONDITION_OPERATOR } from '../../../types/constants';

describe('condition-evaluator', () => {
  describe('evaluateCondition', () => {
    const variables: VariableState = {
      flag1: true,
      flag2: false,
      flag3: 42,
      flag4: 'hello',
      flag5: 0,
    };
    const memoryFlags = new Set(['memory1', 'memory2']);

    it('should evaluate IS_SET correctly', () => {
      const condition: Condition = {
        flag: 'flag1',
        operator: CONDITION_OPERATOR.IS_SET,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag2',
        operator: CONDITION_OPERATOR.IS_SET,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(false);
      
      const condition3: Condition = {
        flag: 'memory1',
        operator: CONDITION_OPERATOR.IS_SET,
      };
      expect(evaluateCondition(condition3, variables, memoryFlags)).toBe(true);
    });

    it('should evaluate IS_NOT_SET correctly', () => {
      const condition: Condition = {
        flag: 'nonexistent',
        operator: CONDITION_OPERATOR.IS_NOT_SET,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag1',
        operator: CONDITION_OPERATOR.IS_NOT_SET,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(false);
    });

    it('should evaluate EQUALS correctly', () => {
      const condition: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.EQUALS,
        value: 42,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag4',
        operator: CONDITION_OPERATOR.EQUALS,
        value: 'hello',
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(true);
      
      const condition3: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.EQUALS,
        value: 10,
      };
      expect(evaluateCondition(condition3, variables, memoryFlags)).toBe(false);
    });

    it('should evaluate NOT_EQUALS correctly', () => {
      const condition: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.NOT_EQUALS,
        value: 10,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.NOT_EQUALS,
        value: 42,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(false);
    });

    it('should evaluate GREATER_THAN correctly', () => {
      const condition: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.GREATER_THAN,
        value: 40,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.GREATER_THAN,
        value: 50,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(false);
    });

    it('should evaluate LESS_THAN correctly', () => {
      const condition: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.LESS_THAN,
        value: 50,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.LESS_THAN,
        value: 40,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(false);
    });

    it('should evaluate GREATER_EQUAL correctly', () => {
      const condition: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.GREATER_EQUAL,
        value: 42,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.GREATER_EQUAL,
        value: 41,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(true);
    });

    it('should evaluate LESS_EQUAL correctly', () => {
      const condition: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.LESS_EQUAL,
        value: 42,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'flag3',
        operator: CONDITION_OPERATOR.LESS_EQUAL,
        value: 43,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(true);
    });

    it('should treat undefined as 0 for numeric comparisons', () => {
      const condition: Condition = {
        flag: 'nonexistent',
        operator: CONDITION_OPERATOR.GREATER_THAN,
        value: -1,
      };
      expect(evaluateCondition(condition, variables, memoryFlags)).toBe(true);
      
      const condition2: Condition = {
        flag: 'nonexistent',
        operator: CONDITION_OPERATOR.LESS_THAN,
        value: 1,
      };
      expect(evaluateCondition(condition2, variables, memoryFlags)).toBe(true);
    });
  });

  describe('evaluateConditions', () => {
    const variables: VariableState = {
      flag1: true,
      flag2: 42,
    };

    it('should return true when all conditions are true', () => {
      const conditions: Condition[] = [
        { flag: 'flag1', operator: CONDITION_OPERATOR.IS_SET },
        { flag: 'flag2', operator: CONDITION_OPERATOR.EQUALS, value: 42 },
      ];
      expect(evaluateConditions(conditions, variables)).toBe(true);
    });

    it('should return false when any condition is false', () => {
      const conditions: Condition[] = [
        { flag: 'flag1', operator: CONDITION_OPERATOR.IS_SET },
        { flag: 'flag2', operator: CONDITION_OPERATOR.EQUALS, value: 10 },
      ];
      expect(evaluateConditions(conditions, variables)).toBe(false);
    });

    it('should return true for empty conditions array', () => {
      expect(evaluateConditions([], variables)).toBe(true);
    });
  });
});




