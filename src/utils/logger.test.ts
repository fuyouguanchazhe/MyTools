/**
 * logger.ts 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger, LogLevel, createLogger, setLogLevel, logger } from '../utils/logger';

describe('Logger', () => {
  let consoleDebug: ReturnType<typeof vi.spyOn>;
  let consoleInfo: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock console 方法
    consoleDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Logger 类', () => {
    it('应该正确输出 debug 日志', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      logger.debug('TestModule', 'Test message');

      expect(consoleDebug).toHaveBeenCalled();
      const call = consoleDebug.mock.calls[0][0];
      expect(call).toContain('[DEBUG]');
      expect(call).toContain('[TestModule]');
      expect(call).toContain('Test message');
    });

    it('应该正确输出 info 日志', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.info('TestModule', 'Test message');

      expect(consoleInfo).toHaveBeenCalled();
      const call = consoleInfo.mock.calls[0][0];
      expect(call).toContain('[INFO]');
      expect(call).toContain('[TestModule]');
    });

    it('应该正确输出 warn 日志', () => {
      const logger = new Logger({ level: LogLevel.WARN });
      logger.warn('TestModule', 'Test message');

      expect(consoleWarn).toHaveBeenCalled();
      const call = consoleWarn.mock.calls[0][0];
      expect(call).toContain('[WARN]');
      expect(call).toContain('[TestModule]');
    });

    it('应该正确输出 error 日志', () => {
      const logger = new Logger({ level: LogLevel.ERROR });
      logger.error('TestModule', 'Test message');

      expect(consoleError).toHaveBeenCalled();
      const call = consoleError.mock.calls[0][0];
      expect(call).toContain('[ERROR]');
      expect(call).toContain('[TestModule]');
    });

    it('应该根据日志级别过滤日志', () => {
      const logger = new Logger({ level: LogLevel.WARN });

      logger.debug('TestModule', 'Debug message');
      logger.info('TestModule', 'Info message');
      logger.warn('TestModule', 'Warn message');
      logger.error('TestModule', 'Error message');

      expect(consoleDebug).not.toHaveBeenCalled();
      expect(consoleInfo).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
    });

    it('应该支持日志数据', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      const data = { key: 'value' };
      
      logger.info('TestModule', 'Test message', data);

      expect(consoleInfo).toHaveBeenCalled();
      expect(consoleInfo.mock.calls[0][1]).toBe(data);
    });

    it('应该包含时间戳', () => {
      const logger = new Logger({ level: LogLevel.INFO, enableTimestamp: true });
      logger.info('TestModule', 'Test message');

      const call = consoleInfo.mock.calls[0][0];
      // 时间戳格式: YYYY-MM-DD HH:mm:ss.SSS
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\]/);
    });

    it('应该支持禁用时间戳', () => {
      const logger = new Logger({ level: LogLevel.INFO, enableTimestamp: false });
      logger.info('TestModule', 'Test message');

      const call = consoleInfo.mock.calls[0][0];
      // 不应该包含日期格式
      expect(call).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('应该支持模块前缀', () => {
      const logger = new Logger({ level: LogLevel.INFO, prefix: 'App' });
      logger.info('TestModule', 'Test message');

      const call = consoleInfo.mock.calls[0][0];
      expect(call).toContain('[App:TestModule]');
    });

    it('应该支持日志上报回调', () => {
      const onReport = vi.fn();
      const logger = new Logger({ level: LogLevel.INFO, onReport });
      
      logger.info('TestModule', 'Test message', { data: 'test' });

      expect(onReport).toHaveBeenCalledWith(
        LogLevel.INFO,
        'TestModule',
        'Test message',
        { data: 'test' }
      );
    });

    it('应该支持动态修改日志级别', () => {
      const logger = new Logger({ level: LogLevel.INFO });

      logger.debug('TestModule', 'Debug 1');
      expect(consoleDebug).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.DEBUG);
      logger.debug('TestModule', 'Debug 2');
      expect(consoleDebug).toHaveBeenCalled();
    });
  });

  describe('createModuleLogger', () => {
    it('应该创建带固定模块名的 logger', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      const moduleLogger = logger.createModuleLogger('TestModule');

      moduleLogger.info('Test message');

      expect(consoleInfo).toHaveBeenCalled();
      const call = consoleInfo.mock.calls[0][0];
      expect(call).toContain('[TestModule]');
    });

    it('模块 logger 应该支持所有日志级别', () => {
      const logger = new Logger({ level: LogLevel.DEBUG });
      const moduleLogger = logger.createModuleLogger('TestModule');

      moduleLogger.debug('Debug message');
      moduleLogger.info('Info message');
      moduleLogger.warn('Warn message');
      moduleLogger.error('Error message');

      expect(consoleDebug).toHaveBeenCalled();
      expect(consoleInfo).toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalled();
    });
  });

  describe('全局 logger', () => {
    it('应该导出全局 logger 实例', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('createLogger 应该创建模块 logger', () => {
      const moduleLogger = createLogger('TestModule');
      
      expect(moduleLogger).toHaveProperty('debug');
      expect(moduleLogger).toHaveProperty('info');
      expect(moduleLogger).toHaveProperty('warn');
      expect(moduleLogger).toHaveProperty('error');
    });

    it('setLogLevel 应该设置全局日志级别', () => {
      setLogLevel(LogLevel.WARN);
      
      logger.debug('Test', 'Debug');
      logger.info('Test', 'Info');
      logger.warn('Test', 'Warn');

      expect(consoleDebug).not.toHaveBeenCalled();
      expect(consoleInfo).not.toHaveBeenCalled();
      expect(consoleWarn).toHaveBeenCalled();

      // 恢复默认级别
      setLogLevel(LogLevel.DEBUG);
    });
  });

  describe('日志格式', () => {
    it('日志应该包含所有必要的信息', () => {
      const logger = new Logger({ level: LogLevel.INFO });
      logger.info('TestModule', 'Test message');

      const call = consoleInfo.mock.calls[0][0];
      
      expect(call).toContain('[INFO]');
      expect(call).toContain('[TestModule]');
      expect(call).toContain('Test message');
    });

    it('日志格式应该是可读的', () => {
      const logger = new Logger({ level: LogLevel.INFO, enableColor: false });
      logger.info('TestModule', 'Test message');

      const call = consoleInfo.mock.calls[0][0];
      
      // 不应该包含颜色代码
      expect(call).not.toContain('\x1b[');
    });
  });
});
