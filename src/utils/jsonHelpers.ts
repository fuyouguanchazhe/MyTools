/**
 * JSON 处理工具函数
 * 
 * 提供JSON统计、格式化、优化等功能
 */

import { createLogger } from './logger';

const log = createLogger('jsonHelpers');

// 缓存JSON解析结果，避免重复计算
const jsonCache = new Map<string, {
  keys: number;
  parsed: unknown;
  timestamp: number;
}>();

// 缓存过期时间（5分钟）
const CACHE_EXPIRE_TIME = 5 * 60 * 1000;

/**
 * 计算JSON对象的键数量（优化版本）
 * 
 * @param obj 要计算的对象
 * @param maxDepth 最大递归深度（防止栈溢出）
 * @returns 键的数量
 */
export const countJsonKeys = (obj: unknown, maxDepth = 100): number => {
  if (maxDepth <= 0) {
    log.warn('达到最大递归深度，停止计数');
    return 0;
  }

  if (typeof obj !== 'object' || obj === null) {
    return 0;
  }

  let count = 0;

  if (Array.isArray(obj)) {
    // 数组：递归计算每个元素
    for (const item of obj) {
      count += countJsonKeys(item, maxDepth - 1);
    }
  } else {
    // 对象：计算键数量 + 递归计算值
    count = Object.keys(obj).length;
    for (const value of Object.values(obj)) {
      count += countJsonKeys(value, maxDepth - 1);
    }
  }

  return count;
};

/**
 * 获取JSON统计信息（带缓存）
 * 
 * @param jsonText JSON文本
 * @param forceRefresh 是否强制刷新缓存
 * @returns 统计信息
 */
export const getJsonStats = (
  jsonText: string,
  forceRefresh = false
): {
  keys: number;
  lines: number;
  size: number;
  parsed: unknown | null;
  fromCache: boolean;
} => {
  const lines = jsonText.split('\n').length;
  const size = new Blob([jsonText]).size;

  // 检查缓存
  const cacheKey = jsonText;
  const cached = jsonCache.get(cacheKey);

  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_EXPIRE_TIME) {
    return {
      keys: cached.keys,
      lines,
      size,
      parsed: cached.parsed,
      fromCache: true,
    };
  }

  // 解析JSON
  let parsed: unknown = null;
  let keys = 0;

  try {
    parsed = JSON.parse(jsonText);
    keys = countJsonKeys(parsed);

    // 更新缓存
    jsonCache.set(cacheKey, {
      keys,
      parsed,
      timestamp: Date.now(),
    });

    // 清理过期缓存
    cleanExpiredCache();
  } catch (error) {
    log.error('JSON解析失败:', error);
  }

  return {
    keys,
    lines,
    size,
    parsed,
    fromCache: false,
  };
};

/**
 * 清理过期缓存
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, value] of jsonCache.entries()) {
    if (now - value.timestamp > CACHE_EXPIRE_TIME) {
      jsonCache.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    log.debug(`清理了 ${cleanedCount} 个过期缓存`);
  }
};

/**
 * 检查JSON大小并返回警告级别
 * 
 * @param size JSON大小（字节）
 * @returns 警告级别
 */
export const checkJsonSize = (size: number): {
  level: 'safe' | 'warning' | 'danger';
  message: string;
} => {
  const KB = 1024;
  const MB = 1024 * KB;

  if (size < 100 * KB) {
    return {
      level: 'safe',
      message: 'JSON大小正常',
    };
  } else if (size < 1 * MB) {
    return {
      level: 'warning',
      message: `JSON较大 (${(size / KB).toFixed(1)} KB)，处理可能较慢`,
    };
  } else {
    return {
      level: 'danger',
      message: `JSON非常大 (${(size / MB).toFixed(2)} MB)，可能导致浏览器卡顿`,
    };
  }
};

/**
 * 清空缓存
 */
export const clearCache = () => {
  jsonCache.clear();
  log.debug('缓存已清空');
};

/**
 * 获取缓存统计信息
 */
export const getCacheStats = () => {
  return {
    size: jsonCache.size,
    entries: Array.from(jsonCache.entries()).map(([key, value]) => ({
      keyLength: key.length,
      keys: value.keys,
      age: Date.now() - value.timestamp,
    })),
  };
};
