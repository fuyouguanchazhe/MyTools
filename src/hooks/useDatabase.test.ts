/**
 * useDatabase 数据库迁移逻辑测试
 * 直接测试核心函数，不依赖 React 渲染环境
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Database - 必须在 import 前定义
const mockExecute = vi.fn().mockResolvedValue(undefined);
const mockSelect = vi.fn().mockResolvedValue([]);

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockResolvedValue({
      execute: mockExecute,
      select: mockSelect,
    }),
  },
}));

// Mock logger
vi.mock('../utils/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock crypto
vi.mock('../utils/crypto', () => ({
  encrypt: vi.fn().mockImplementation((str: string) => `encrypted_${str}`),
  decrypt: vi.fn().mockImplementation((str: string) => str.replace('encrypted_', '')),
}));

describe('数据库迁移逻辑测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockResolvedValue(undefined);
    mockSelect.mockResolvedValue([]);
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('场景 1: 全新数据库初始化', () => {
    it('应该创建所有必需的表', async () => {
      // 模拟：没有任何表存在
      mockSelect
        .mockResolvedValueOnce([]) // tableExists('schema_version') = false
        .mockResolvedValueOnce([]); // tableExists('app_config') = false

      const { getDatabase, resetDatabaseInstance } = await import('./useDatabase');
      resetDatabaseInstance();
      
      await getDatabase();

      // 验证创建 schema_version 表
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE schema_version')
      );

      // 验证创建 app_config 表（key-value 结构）
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE app_config')
      );

      // 验证插入默认配置
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT OR IGNORE INTO app_config (key, value) VALUES ('theme', 'light')")
      );
    });
  });

  describe('场景 2: 旧版 app_config 表迁移', () => {
    it('应该检测旧表结构（有 id 列，无 key 列）并迁移到 key-value 结构', async () => {
      // 模拟：schema_version 存在，app_config 是旧结构
      mockSelect
        // getSchemaVersion 检查
        .mockResolvedValueOnce([{ name: 'schema_version' }]) // tableExists('schema_version') = true
        .mockResolvedValueOnce([{ version: 1 }]) // getSchemaVersion = 1
        // runMigrations 检查
        .mockResolvedValueOnce([{ name: 'app_config' }]) // tableExists('app_config') = true
        .mockResolvedValueOnce([]) // columnExists('app_config', 'key') = false（旧结构）
        // 读取旧配置
        .mockResolvedValueOnce([{
          id: 1,
          theme: 'dark',
          language: 'en-US',
          primary_color: '#ff0000',
          auto_save: 0,
          restore_state: 1,
          last_used_tool: '/json-formatter',
        }]);

      const { getDatabase, resetDatabaseInstance } = await import('./useDatabase');
      resetDatabaseInstance();
      
      await getDatabase();

      // 验证迁移步骤
      expect(mockExecute).toHaveBeenCalledWith('ALTER TABLE app_config RENAME TO app_config_old');
      
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE app_config')
      );

      // 验证数据迁移
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO app_config (key, value) VALUES ('theme'"),
        ['dark']
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO app_config (key, value) VALUES ('language'"),
        ['en-US']
      );

      // 验证删除旧表
      expect(mockExecute).toHaveBeenCalledWith('DROP TABLE IF EXISTS app_config_old');
    });

    it('应该在迁移后能够保存配置（updated_at 列存在）', async () => {
      // 模拟：app_config 已经是新结构
      mockSelect
        .mockResolvedValueOnce([{ name: 'schema_version' }]) // tableExists
        .mockResolvedValueOnce([{ version: 2 }]) // getSchemaVersion = 2
        .mockResolvedValueOnce([{ name: 'app_config' }]) // tableExists
        .mockResolvedValueOnce([{ name: 'key' }]); // columnExists('key') = true（新结构）

      const { updateAppConfig, resetDatabaseInstance } = await import('./useDatabase');
      resetDatabaseInstance();

      // 初始化数据库
      const { getDatabase } = await import('./useDatabase');
      await getDatabase();

      // 清空之前的调用记录
      mockExecute.mockClear();

      // 测试保存配置
      await updateAppConfig({
        theme: 'dark',
        language: 'zh-CN',
        primaryColor: '#1890ff',
        autoSave: true,
        restoreState: false,
      });

      // 验证 INSERT OR REPLACE 语句包含 updated_at
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO app_config (key, value, updated_at)'),
        expect.any(Array)
      );
    });
  });

  describe('场景 3: git_repositories 表迁移', () => {
    it('应该添加缺失的列（created_at, updated_at, is_deleted, password_encrypted）', async () => {
      // 模拟：版本 1，需要迁移到版本 2
      mockSelect
        .mockResolvedValueOnce([{ name: 'schema_version' }]) // tableExists
        .mockResolvedValueOnce([{ version: 1 }]) // getSchemaVersion = 1
        .mockResolvedValueOnce([{ name: 'app_config' }]) // tableExists
        .mockResolvedValueOnce([{ name: 'key' }]) // columnExists('key') = true
        .mockResolvedValueOnce([{ name: 'git_repositories' }]) // tableExists('git_repositories')
        .mockResolvedValueOnce([]) // columnExists('created_at') = false
        .mockResolvedValueOnce([]) // columnExists('updated_at') = false
        .mockResolvedValueOnce([]) // columnExists('is_deleted') = false
        .mockResolvedValueOnce([]); // columnExists('password_encrypted') = false

      const { getDatabase, resetDatabaseInstance } = await import('./useDatabase');
      resetDatabaseInstance();
      
      await getDatabase();

      // 验证添加列的 SQL 被调用
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE git_repositories ADD COLUMN created_at')
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE git_repositories ADD COLUMN updated_at')
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE git_repositories ADD COLUMN is_deleted')
      );
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('ALTER TABLE git_repositories ADD COLUMN password_encrypted')
      );
    });

    it('应该迁移旧密码字段到 password_encrypted', async () => {
      // 模拟：git_repositories 表存在，有 password 列
      mockSelect
        .mockResolvedValueOnce([{ name: 'schema_version' }]) // tableExists
        .mockResolvedValueOnce([{ version: 1 }]) // getSchemaVersion = 1
        .mockResolvedValueOnce([{ name: 'app_config' }]) // tableExists
        .mockResolvedValueOnce([{ name: 'key' }]) // columnExists('key') = true
        .mockResolvedValueOnce([{ name: 'git_repositories' }]) // tableExists
        .mockResolvedValueOnce([]) // columnExists('created_at') = false
        .mockResolvedValueOnce([]) // columnExists('updated_at') = false
        .mockResolvedValueOnce([]) // columnExists('is_deleted') = false
        .mockResolvedValueOnce([{ name: 'password_encrypted' }]) // columnExists('password_encrypted') = true（已添加）
        .mockResolvedValueOnce([{ name: 'password' }]) // columnExists('password') = true（旧字段）
        .mockResolvedValueOnce([{ name: 'password_encrypted' }]) // columnExists('password_encrypted') = true
        .mockResolvedValueOnce([
          { id: 1, password: 'oldpassword1' },
          { id: 2, password: 'oldpassword2' },
        ]); // 查询需要迁移的密码

      const { getDatabase, resetDatabaseInstance } = await import('./useDatabase');
      resetDatabaseInstance();
      
      await getDatabase();

      // 验证密码被加密并更新
      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE git_repositories SET password_encrypted = $1 WHERE id = $2',
        ['encrypted_oldpassword1', 1]
      );
      expect(mockExecute).toHaveBeenCalledWith(
        'UPDATE git_repositories SET password_encrypted = $1 WHERE id = $2',
        ['encrypted_oldpassword2', 2]
      );
    });
  });

  describe('场景 4: 正常数据库操作', () => {
    it('应该能够读取配置', async () => {
      // 模拟：已经是最新版本
      mockSelect
        .mockResolvedValueOnce([{ name: 'schema_version' }]) // tableExists
        .mockResolvedValueOnce([{ version: 2 }]) // getSchemaVersion = 2
        .mockResolvedValueOnce([{ name: 'app_config' }]) // tableExists
        .mockResolvedValueOnce([{ name: 'key' }]) // columnExists('key') = true
        // getAppConfig 调用
        .mockResolvedValueOnce([
          { key: 'theme', value: 'dark' },
          { key: 'language', value: 'en-US' },
          { key: 'primaryColor', value: '#ff0000' },
          { key: 'autoSave', value: 'true' },
          { key: 'restoreState', value: 'false' },
        ]);

      const { getAppConfig, resetDatabaseInstance } = await import('./useDatabase');
      resetDatabaseInstance();

      const config = await getAppConfig();

      expect(config.theme).toBe('dark');
      expect(config.language).toBe('en-US');
      expect(config.primaryColor).toBe('#ff0000');
      expect(config.autoSave).toBe(true);
      expect(config.restoreState).toBe(false);
    });

    it('应该能够保存 Git 仓库配置', async () => {
      // 模拟：已经是最新版本
      mockSelect
        .mockResolvedValueOnce([{ name: 'schema_version' }]) // tableExists
        .mockResolvedValueOnce([{ version: 2 }]) // getSchemaVersion = 2
        .mockResolvedValueOnce([{ name: 'app_config' }]) // tableExists
        .mockResolvedValueOnce([{ name: 'key' }]) // columnExists('key') = true
        // saveGitRepository 插入
        .mockResolvedValueOnce([{ id: 123 }]);

      const { saveGitRepository, resetDatabaseInstance } = await import('./useDatabase');
      resetDatabaseInstance();

      const repo = await saveGitRepository({
        id: 'temp_1',
        path: '/path/to/repo',
        name: 'MyRepo',
        source_branch: 'main',
        target_branch: 'develop',
        remote: 'origin',
        force: false,
        enable: true,
        discard_changes: false,
        password: 'mypassword',
      });

      expect(repo.id).toBe('123');
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO git_repositories'),
        expect.arrayContaining([
          '/path/to/repo',
          'MyRepo',
          'main',
          'develop',
          'origin',
          'encrypted_mypassword',
        ])
      );
    });
  });
});
