/**
 * 应用配置相关常量
 */

import { AppConfig } from '../types';

/**
 * 默认应用配置
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  theme: 'light',
  language: 'zh-CN',
  primaryColor: '#1890ff',
  autoSave: true,
  restoreState: true,
  windowSize: 'standard',
};

/**
 * 支持的主题列表
 */
export const THEMES = [
  { value: 'light', label: '浅色主题' },
  { value: 'dark', label: '深色主题' },
] as const;

/**
 * 支持的语言列表
 */
export const LANGUAGES = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English (US)' },
] as const;

/**
 * 预设主题色列表
 */
export const PRESET_COLORS = [
  { value: '#1890ff', label: '蓝色' },
  { value: '#52c41a', label: '绿色' },
  { value: '#fa8c16', label: '橙色' },
  { value: '#eb2f96', label: '洋红' },
  { value: '#722ed1', label: '紫色' },
  { value: '#13c2c2', label: '青色' },
] as const;

/**
 * 窗口尺寸预设选项
 */
export const WINDOW_SIZE_OPTIONS = [
  { value: 'compact', label: '紧凑', width: 1024, height: 768, description: '1024 × 768' },
  { value: 'standard', label: '标准', width: 1200, height: 800, description: '1200 × 800' },
  { value: 'wide', label: '宽屏', width: 1400, height: 900, description: '1400 × 900' },
  { value: 'maximized', label: '最大化', width: 0, height: 0, description: '全屏显示' },
] as const;

/**
 * 数据库文件名
 */
export const DATABASE_FILE_NAME = 'sqlite:mytools.db';
