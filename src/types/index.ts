export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path: string;
}

/**
 * 窗口尺寸类型
 */
export type WindowSizeType = 'compact' | 'standard' | 'wide' | 'maximized' | 'custom';

/**
 * 自定义窗口尺寸
 */
export interface CustomWindowSize {
  width: number;
  height: number;
}

export interface AppConfig {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US';
  primaryColor?: string;
  autoSave?: boolean;
  restoreState?: boolean;
  lastUsedTool?: string;
  windowSize?: WindowSizeType;
  customWindowSize?: CustomWindowSize;
}
