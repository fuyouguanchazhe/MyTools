/**
 * useClipboard Hook 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../hooks/useClipboard';
import { message } from 'antd';

describe('useClipboard', () => {
  // Mock clipboard API
  const mockClipboard = {
    writeText: vi.fn(),
    readText: vi.fn(),
  };

  beforeEach(() => {
    // 设置 mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
    });

    // 清除所有 mock
    vi.clearAllMocks();
  });

  describe('copy', () => {
    it('应该成功复制文本到剪贴板', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.copy('test text');
      });

      expect(success).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(message.success).toHaveBeenCalledWith('已复制到剪贴板！');
    });

    it('应该处理复制失败的情况', async () => {
      const error = new Error('Permission denied');
      mockClipboard.writeText.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.copy('test text');
      });

      expect(success).toBe(false);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(message.error).toHaveBeenCalledWith('复制失败！');
    });

    it('应该复制空字符串', async () => {
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.copy('');
      });

      expect(success).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });

    it('应该复制长文本', async () => {
      const longText = 'a'.repeat(10000);
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.copy(longText);
      });

      expect(success).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(longText);
    });

    it('应该复制多行文本', async () => {
      const multilineText = 'line1\nline2\nline3';
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useClipboard());

      let success: boolean | undefined;
      await act(async () => {
        success = await result.current.copy(multilineText);
      });

      expect(success).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(multilineText);
    });
  });

  describe('read', () => {
    it('应该成功从剪贴板读取文本', async () => {
      const expectedText = 'clipboard text';
      mockClipboard.readText.mockResolvedValueOnce(expectedText);

      const { result } = renderHook(() => useClipboard());

      let text: string | null = null;
      await act(async () => {
        text = await result.current.read();
      });

      expect(text).toBe(expectedText);
      expect(mockClipboard.readText).toHaveBeenCalled();
      // read 成功时不应该显示 message
      expect(message.error).not.toHaveBeenCalled();
    });

    it('应该处理读取失败的情况', async () => {
      const error = new Error('Permission denied');
      mockClipboard.readText.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useClipboard());

      let text: string | null = null;
      await act(async () => {
        text = await result.current.read();
      });

      expect(text).toBeNull();
      expect(mockClipboard.readText).toHaveBeenCalled();
      expect(message.error).toHaveBeenCalledWith('读取剪贴板失败！请检查权限。');
    });

    it('应该读取空剪贴板', async () => {
      mockClipboard.readText.mockResolvedValueOnce('');

      const { result } = renderHook(() => useClipboard());

      let text: string | null = null;
      await act(async () => {
        text = await result.current.read();
      });

      expect(text).toBe('');
    });

    it('应该读取长文本', async () => {
      const longText = 'a'.repeat(10000);
      mockClipboard.readText.mockResolvedValueOnce(longText);

      const { result } = renderHook(() => useClipboard());

      let text: string | null = null;
      await act(async () => {
        text = await result.current.read();
      });

      expect(text).toBe(longText);
    });

    it('应该读取多行文本', async () => {
      const multilineText = 'line1\nline2\nline3';
      mockClipboard.readText.mockResolvedValueOnce(multilineText);

      const { result } = renderHook(() => useClipboard());

      let text: string | null = null;
      await act(async () => {
        text = await result.current.read();
      });

      expect(text).toBe(multilineText);
    });
  });

  describe('多次调用', () => {
    it('应该支持连续多次复制', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const { result } = renderHook(() => useClipboard());

      await act(async () => {
        await result.current.copy('text1');
        await result.current.copy('text2');
        await result.current.copy('text3');
      });

      expect(mockClipboard.writeText).toHaveBeenCalledTimes(3);
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(1, 'text1');
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(2, 'text2');
      expect(mockClipboard.writeText).toHaveBeenNthCalledWith(3, 'text3');
      expect(message.success).toHaveBeenCalledTimes(3);
    });

    it('应该支持连续多次读取', async () => {
      mockClipboard.readText
        .mockResolvedValueOnce('text1')
        .mockResolvedValueOnce('text2')
        .mockResolvedValueOnce('text3');

      const { result } = renderHook(() => useClipboard());

      let text1: string | null = null;
      let text2: string | null = null;
      let text3: string | null = null;

      await act(async () => {
        text1 = await result.current.read();
        text2 = await result.current.read();
        text3 = await result.current.read();
      });

      expect(mockClipboard.readText).toHaveBeenCalledTimes(3);
      expect(text1).toBe('text1');
      expect(text2).toBe('text2');
      expect(text3).toBe('text3');
    });
  });
});
