import { describe, it, expect, beforeEach } from 'vitest';
import { VariableManager } from '../variable-manager';

describe('VariableManager', () => {
  let manager: VariableManager;

  beforeEach(() => {
    manager = new VariableManager();
  });

  describe('constructor', () => {
    it('should initialize with empty state by default', () => {
      expect(manager.get('test')).toBeUndefined();
      expect(manager.getAllMemoryFlags().size).toBe(0);
    });

    it('should initialize with provided variables', () => {
      const vars = { flag1: true, flag2: 42 };
      const manager2 = new VariableManager(vars);
      expect(manager2.get('flag1')).toBe(true);
      expect(manager2.get('flag2')).toBe(42);
    });

    it('should initialize with provided memory flags', () => {
      const memoryFlags = new Set(['mem1', 'mem2']);
      const manager2 = new VariableManager(undefined, memoryFlags);
      expect(manager2.hasMemoryFlag('mem1')).toBe(true);
      expect(manager2.hasMemoryFlag('mem2')).toBe(true);
    });
  });

  describe('set and get', () => {
    it('should set and get boolean values', () => {
      manager.set('flag1', true);
      expect(manager.get('flag1')).toBe(true);
    });

    it('should set and get number values', () => {
      manager.set('flag2', 42);
      expect(manager.get('flag2')).toBe(42);
    });

    it('should set and get string values', () => {
      manager.set('flag3', 'hello');
      expect(manager.get('flag3')).toBe('hello');
    });

    it('should return undefined for unset variables', () => {
      expect(manager.get('nonexistent')).toBeUndefined();
    });
  });

  describe('memory flags', () => {
    it('should add memory flags', () => {
      manager.addMemoryFlag('mem1');
      expect(manager.hasMemoryFlag('mem1')).toBe(true);
      expect(manager.get('mem1')).toBe(true);
    });

    it('should remove memory flags', () => {
      manager.addMemoryFlag('mem1');
      manager.removeMemoryFlag('mem1');
      expect(manager.hasMemoryFlag('mem1')).toBe(false);
    });

    it('should return memory flags as true when getting', () => {
      manager.addMemoryFlag('mem1');
      expect(manager.get('mem1')).toBe(true);
    });
  });

  describe('getAllVariables', () => {
    it('should return a copy of all variables', () => {
      manager.set('flag1', true);
      manager.set('flag2', 42);
      const vars = manager.getAllVariables();
      expect(vars).toEqual({ flag1: true, flag2: 42 });
      // Should be a copy, not a reference
      vars.flag1 = false;
      expect(manager.get('flag1')).toBe(true);
    });
  });

  describe('getAllMemoryFlags', () => {
    it('should return a copy of memory flags', () => {
      manager.addMemoryFlag('mem1');
      manager.addMemoryFlag('mem2');
      const flags = manager.getAllMemoryFlags();
      expect(flags.has('mem1')).toBe(true);
      expect(flags.has('mem2')).toBe(true);
      // Should be a copy
      flags.delete('mem1');
      expect(manager.hasMemoryFlag('mem1')).toBe(true);
    });
  });

  describe('clearMemoryFlags', () => {
    it('should clear all memory flags', () => {
      manager.addMemoryFlag('mem1');
      manager.addMemoryFlag('mem2');
      manager.clearMemoryFlags();
      expect(manager.getAllMemoryFlags().size).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      manager.set('flag1', true);
      manager.addMemoryFlag('mem1');
      manager.reset();
      expect(manager.get('flag1')).toBeUndefined();
      expect(manager.hasMemoryFlag('mem1')).toBe(false);
    });

    it('should reset to provided state', () => {
      manager.set('flag1', true);
      manager.reset({ flag2: 42 }, new Set(['mem2']));
      expect(manager.get('flag1')).toBeUndefined();
      expect(manager.get('flag2')).toBe(42);
      expect(manager.hasMemoryFlag('mem2')).toBe(true);
    });
  });
});





