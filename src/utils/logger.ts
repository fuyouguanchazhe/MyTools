/**
 * 统一日志工具
 * 
 * 功能：
 * 1. 支持日志级别（debug/info/warn/error）
 * 2. 根据环境变量自动调整日志级别
 * 3. 统一的日志格式（时间戳、级别、模块、消息）
 * 4. 支持日志上报（可选）
 * 5. 生产环境自动禁用 debug 日志
 */

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * 日志级别名称映射
 */
const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: 'SILENT',
};

/**
 * 日志级别颜色（控制台输出）
 */
const LogLevelColors: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // 青色
  [LogLevel.INFO]: '\x1b[32m', // 绿色
  [LogLevel.WARN]: '\x1b[33m', // 黄色
  [LogLevel.ERROR]: '\x1b[31m', // 红色
  [LogLevel.SILENT]: '\x1b[0m', // 默认
};

/**
 * 重置颜色
 */
const ResetColor = '\x1b[0m';

/**
 * Logger 配置接口
 */
interface LoggerConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColor: boolean;
  prefix?: string;
  // 日志上报回调（可选）
  onReport?: (level: LogLevel, module: string, message: string, data?: unknown) => void;
}

/**
 * 默认配置
 */
const defaultConfig: LoggerConfig = {
  level: import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO,
  enableTimestamp: true,
  enableColor: true,
};

/**
 * Logger 类
 */
class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 设置模块前缀
   */
  setPrefix(prefix: string): void {
    this.config.prefix = prefix;
  }

  /**
   * 设置日志上报回调
   */
  setReportHandler(handler: LoggerConfig['onReport']): void {
    this.config.onReport = handler;
  }

  /**
   * 格式化时间戳
   */
  private formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, module: string, message: string): string {
    const parts: string[] = [];

    // 添加时间戳
    if (this.config.enableTimestamp) {
      parts.push(`[${this.formatTimestamp()}]`);
    }

    // 添加日志级别
    const levelName = LogLevelNames[level];
    if (this.config.enableColor) {
      const color = LogLevelColors[level];
      parts.push(`${color}[${levelName}]${ResetColor}`);
    } else {
      parts.push(`[${levelName}]`);
    }

    // 添加模块前缀
    const fullModule = this.config.prefix ? `${this.config.prefix}:${module}` : module;
    parts.push(`[${fullModule}]`);

    // 添加消息
    parts.push(message);

    return parts.join(' ');
  }

  /**
   * 内部日志方法
   */
  private log(level: LogLevel, module: string, message: string, data?: unknown): void {
    // 检查日志级别
    if (level < this.config.level) {
      return;
    }

    // 格式化消息
    const formattedMessage = this.formatMessage(level, module, message);

    // 输出到控制台
    switch (level) {
      case LogLevel.DEBUG:
        if (data !== undefined) {
          console.debug(formattedMessage, data);
        } else {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.INFO:
        if (data !== undefined) {
          console.info(formattedMessage, data);
        } else {
          console.info(formattedMessage);
        }
        break;
      case LogLevel.WARN:
        if (data !== undefined) {
          console.warn(formattedMessage, data);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case LogLevel.ERROR:
        if (data !== undefined) {
          console.error(formattedMessage, data);
        } else {
          console.error(formattedMessage);
        }
        break;
    }

    // 触发日志上报
    if (this.config.onReport) {
      this.config.onReport(level, module, message, data);
    }
  }

  /**
   * Debug 级别日志
   */
  debug(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, module, message, data);
  }

  /**
   * Info 级别日志
   */
  info(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  /**
   * Warn 级别日志
   */
  warn(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  /**
   * Error 级别日志
   */
  error(module: string, message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, module, message, data);
  }

  /**
   * 创建子 Logger（带固定模块名）
   */
  createModuleLogger(module: string) {
    return {
      debug: (message: string, data?: unknown) => this.debug(module, message, data),
      info: (message: string, data?: unknown) => this.info(module, message, data),
      warn: (message: string, data?: unknown) => this.warn(module, message, data),
      error: (message: string, data?: unknown) => this.error(module, message, data),
    };
  }
}

/**
 * 全局 Logger 实例
 */
export const logger = new Logger();

/**
 * 创建模块 Logger 的便捷函数
 */
export const createLogger = (module: string) => {
  return logger.createModuleLogger(module);
};

/**
 * 设置全局日志级别
 */
export const setLogLevel = (level: LogLevel) => {
  logger.setLevel(level);
};

/**
 * 设置全局日志上报回调
 */
export const setLogReportHandler = (handler: LoggerConfig['onReport']) => {
  logger.setReportHandler(handler);
};

// 导出 Logger 类供测试使用
export { Logger };

export default logger;
