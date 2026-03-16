/**
 * jsonHelpers.ts 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  countJsonKeys,
  getJsonStats,
  checkJsonSize,
  clearCache,
  getCacheStats,
} from '../utils/jsonHelpers';

describe('jsonHelpers', () => {
  beforeEach(() => {
    // 每个测试前清空缓存
    clearCache();
    // 清除所有 mock
    vi.clearAllMocks();
  });

  describe('countJsonKeys', () => {
    it('应该正确计算空对象的键数量', () => {
      expect(countJsonKeys({})).toBe(0);
    });

    it('应该正确计算简单对象的键数量', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(countJsonKeys(obj)).toBe(3);
    });

    it('应该正确计算嵌套对象的键数量', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: 3,
        },
      };
      // a + b + c + d = 4
      expect(countJsonKeys(obj)).toBe(4);
    });

    it('应该正确计算数组的键数量', () => {
      const arr = [{ a: 1 }, { b: 2 }];
      // a + b = 2
      expect(countJsonKeys(arr)).toBe(2);
    });

    it('应该正确计算混合结构的键数量', () => {
      const obj = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        total: 2,
      };
      // users + total + id + name + id + name = 6
      expect(countJsonKeys(obj)).toBe(6);
    });

    it('应该在达到最大递归深度时返回 0', () => {
      const obj = { a: { b: { c: { d: 1 } } } };
      expect(countJsonKeys(obj, 0)).toBe(0);
    });

    it('应该处理 null 和非对象值', () => {
      expect(countJsonKeys(null)).toBe(0);
      expect(countJsonKeys(undefined)).toBe(0);
      expect(countJsonKeys(123)).toBe(0);
      expect(countJsonKeys('string')).toBe(0);
    });

    it('应该处理空数组', () => {
      expect(countJsonKeys([])).toBe(0);
    });

    it('应该处理深层嵌套结构', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              value: 1,
            },
          },
        },
      };
      // level1 + level2 + level3 + value = 4
      expect(countJsonKeys(obj)).toBe(4);
    });
  });

  describe('getJsonStats', () => {
    it('应该正确解析有效的 JSON', () => {
      const jsonText = JSON.stringify({ a: 1, b: 2 });
      const stats = getJsonStats(jsonText);

      expect(stats.keys).toBe(2);
      expect(stats.parsed).toEqual({ a: 1, b: 2 });
      expect(stats.fromCache).toBe(false);
    });

    it('应该正确计算行数', () => {
      const jsonText = '{\n  "a": 1,\n  "b": 2\n}';
      const stats = getJsonStats(jsonText);

      expect(stats.lines).toBe(4);
    });

    it('应该正确计算大小', () => {
      const jsonText = '{"a":1}';
      const stats = getJsonStats(jsonText);

      expect(stats.size).toBe(7); // 7 bytes
    });

    it('应该使用缓存返回结果', () => {
      const jsonText = JSON.stringify({ a: 1 });

      // 第一次调用
      const stats1 = getJsonStats(jsonText);
      expect(stats1.fromCache).toBe(false);

      // 第二次调用应该使用缓存
      const stats2 = getJsonStats(jsonText);
      expect(stats2.fromCache).toBe(true);
      expect(stats2.keys).toBe(stats1.keys);
    });

    it('应该支持强制刷新缓存', () => {
      const jsonText = JSON.stringify({ a: 1 });

      // 第一次调用
      getJsonStats(jsonText);

      // 强制刷新
      const stats = getJsonStats(jsonText, true);
      expect(stats.fromCache).toBe(false);
    });

    it('应该处理无效的 JSON', () => {
      const invalidJson = 'not a json';
      const stats = getJsonStats(invalidJson);

      expect(stats.keys).toBe(0);
      expect(stats.parsed).toBeNull();
    });

    it('应该正确处理大型 JSON', () => {
      const largeObj = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));
      const jsonText = JSON.stringify(largeObj);
      const stats = getJsonStats(jsonText);

      expect(stats.keys).toBe(2000); // 1000 * 2 keys
      expect(stats.parsed).toEqual(largeObj);
    });
  });

  describe('checkJsonSize', () => {
    it('应该返回 safe 级别（小于 100KB）', () => {
      const result = checkJsonSize(50 * 1024); // 50KB
      expect(result.level).toBe('safe');
      expect(result.message).toBe('JSON大小正常');
    });

    it('应该返回 warning 级别（100KB - 1MB）', () => {
      const result = checkJsonSize(500 * 1024); // 500KB
      expect(result.level).toBe('warning');
      expect(result.message).toContain('JSON较大');
      expect(result.message).toContain('KB');
    });

    it('应该返回 danger 级别（大于 1MB）', () => {
      const result = checkJsonSize(2 * 1024 * 1024); // 2MB
      expect(result.level).toBe('danger');
      expect(result.message).toContain('JSON非常大');
      expect(result.message).toContain('MB');
    });

    it('应该正确处理边界值', () => {
      // 99.99KB
      expect(checkJsonSize(100 * 1024 - 1).level).toBe('safe');
      // 100KB
      expect(checkJsonSize(100 * 1024).level).toBe('warning');
      // 1MB - 1 byte
      expect(checkJsonSize(1024 * 1024 - 1).level).toBe('warning');
      // 1MB
      expect(checkJsonSize(1024 * 1024).level).toBe('danger');
    });
  });

  describe('clearCache', () => {
    it('应该清空所有缓存', () => {
      const jsonText = JSON.stringify({ a: 1 });
      getJsonStats(jsonText);

      // 确认有缓存
      const statsBefore = getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      // 清空缓存
      clearCache();

      // 确认缓存已清空
      const statsAfter = getCacheStats();
      expect(statsAfter.size).toBe(0);
    });
  });

  describe('getCacheStats', () => {
    it('应该返回正确的缓存统计信息', () => {
      const jsonText = JSON.stringify({ a: 1 });
      getJsonStats(jsonText);

      const stats = getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].keyLength).toBe(jsonText.length);
      expect(stats.entries[0].keys).toBe(1);
      expect(stats.entries[0].age).toBeLessThan(1000); // 应该小于 1 秒
    });

    it('应该在空缓存时返回空数组', () => {
      clearCache();
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toHaveLength(0);
    });
  });
});
