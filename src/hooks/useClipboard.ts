import { message } from 'antd';
import { createLogger } from '../utils/logger';

const log = createLogger('Clipboard');

/**
 * 剪贴板操作 Hook
 * 提供统一的复制功能，自动处理成功/失败提示
 */
export const useClipboard = () => {
  /**
   * 复制文本到剪贴板
   * @param text 要复制的文本
   * @returns Promise<boolean> 是否复制成功
   */
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板！');
      return true;
    } catch (error) {
      log.error('复制失败:', error);
      message.error('复制失败！');
      return false;
    }
  };

  /**
   * 从剪贴板读取文本
   * @returns Promise<string | null> 剪贴板内容，失败返回 null
   */
  const read = async (): Promise<string | null> => {
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (error) {
      log.error('读取剪贴板失败:', error);
      message.error('读取剪贴板失败！请检查权限。');
      return null;
    }
  };

  return {
    copy,
    read,
  };
};
