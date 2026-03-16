import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AppConfig } from '../types';
import { DEFAULT_APP_CONFIG } from '../constants/app';
import { createLogger } from '../utils/logger';
import { getAppConfig, updateAppConfig } from '../hooks/useDatabase';

const log = createLogger('AppContext');

// Context 类型定义
interface AppContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// 创建 Context
const AppContext = createContext<AppContextType | null>(null);

// Provider Props
interface AppProviderProps {
  children: ReactNode;
}

/**
 * 全局应用配置 Provider
 * 
 * 功能：
 * 1. 全局共享应用配置
 * 2. 提供配置更新方法
 * 3. 自动持久化到 SQLite 数据库
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化：加载配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        log.info('加载应用配置...');
        const savedConfig = await getAppConfig();
        
        // 合并默认配置，确保所有字段都有值
        setConfig({ ...DEFAULT_APP_CONFIG, ...savedConfig });
        log.info('配置加载成功:', savedConfig);
        
        // 应用窗口尺寸
        if (savedConfig.windowSize) {
          await applyWindowSize(savedConfig.windowSize, savedConfig.customWindowSize);
        }
        
        setLoading(false);
      } catch (err) {
        log.error('加载配置失败:', err);
        setError((err as Error).message);
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // 应用窗口尺寸
  const applyWindowSize = async (
    size: AppConfig['windowSize'], 
    custom?: AppConfig['customWindowSize']
  ) => {
    try {
      await invoke('set_window_size', {
        size: size,
        width: custom?.width,
        height: custom?.height,
      });
      log.info(`窗口尺寸已应用: ${size}${custom ? ` (${custom.width}x${custom.height})` : ''}`);
    } catch (err) {
      log.error(`应用窗口尺寸失败: ${err}`);
    }
  };

  /**
   * 更新配置
   * @param updates 要更新的配置字段
   */
  const handleUpdateConfig = async (updates: Partial<AppConfig>) => {
    try {
      // 合并新旧配置
      const newConfig = { ...config, ...updates };
      
      // 更新状态
      setConfig(newConfig);
      
      // 持久化到数据库
      await updateAppConfig(newConfig);
      
      log.debug('配置已保存:', newConfig);
    } catch (err) {
      log.error('保存配置失败:', err);
      setError((err as Error).message);
      // 回滚状态
      setConfig(config);
      throw err;
    }
  };

  return (
    <AppContext.Provider value={{ config, updateConfig: handleUpdateConfig, loading, error }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * 使用应用配置的 Hook
 * 
 * @throws {Error} 如果在 AppProvider 外部使用会抛出错误
 * @returns {AppContextType} 包含 config, updateConfig, loading, error
 * 
 * @example
 * const { config, updateConfig } = useAppConfig();
 * 
 * // 读取配置
 * console.log(config.theme);
 * 
 * // 更新配置
 * await updateConfig({ theme: 'dark' });
 */
export const useAppConfig = (): AppContextType => {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppConfig 必须在 AppProvider 内部使用');
  }
  
  return context;
};

export default AppContext;
