/**
 * Vitest 测试设置文件
 * 在每个测试文件运行前执行
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Tauri SQL API
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockResolvedValue({
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockResolvedValue([]),
    }),
  },
}));

// Mock Ant Design message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
    },
  };
});

// 全局测试工具函数
global.console = {
  ...console,
  // 在测试中静默日志（可选）
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
