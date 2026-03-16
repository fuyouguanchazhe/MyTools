import { useState, useEffect } from 'react';
import Database from '@tauri-apps/plugin-sql';
import { createLogger } from '../utils/logger';
import { AppConfig } from '../types';
import { DEFAULT_APP_CONFIG } from '../constants/app';
import { encrypt, decrypt } from '../utils/crypto';
import type { GitRepoConfig } from '../types/git';

const log = createLogger('Database');

/**
 * 数据库类型定义
 */
type Db = Awaited<ReturnType<typeof Database.load>>;

/**
 * 当前 Schema 版本
 */
const CURRENT_SCHEMA_VERSION = 2;

/**
 * 配置项行类型（key-value 形式）
 */
interface DbConfigItem {
  key: string;
  value: string;
  updated_at: string;
}

/**
 * Git 仓库行类型
 */
interface DbGitRepoRow {
  id: number;
  path: string;
  name: string;
  source_branch: string;
  target_branch: string;
  remote: string;
  tag: string | null;
  force: number;
  enable: number;
  discard_changes: number;
  description: string | null;
  username: string | null;
  password_encrypted: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: number;
}

/**
 * 全局数据库实例（单例）
 */
let dbInstance: Db | null = null;
let initPromise: Promise<Db> | null = null;

/**
 * 检查表是否存在
 */
async function tableExists(db: Db, tableName: string): Promise<boolean> {
  const rows = await db.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=$1",
    [tableName]
  );
  return rows.length > 0;
}

/**
 * 检查列是否存在
 */
async function columnExists(db: Db, tableName: string, columnName: string): Promise<boolean> {
  const rows = await db.select<{ name: string }[]>(
    `PRAGMA table_info(${tableName})`
  );
  return rows.some(row => row.name === columnName);
}

/**
 * 获取当前 Schema 版本
 */
async function getSchemaVersion(db: Db): Promise<number> {
  const tableExistsResult = await tableExists(db, 'schema_version');
  if (!tableExistsResult) {
    return 0;
  }
  
  const rows = await db.select<{ version: number }[]>(
    'SELECT MAX(version) as version FROM schema_version'
  );
  return rows[0]?.version || 0;
}

/**
 * 设置 Schema 版本
 */
async function setSchemaVersion(db: Db, version: number, description: string): Promise<void> {
  await db.execute(
    'INSERT INTO schema_version (version, description) VALUES ($1, $2)',
    [version, description]
  );
}

/**
 * 执行 Schema 迁移
 */
async function runMigrations(db: Db, currentVersion: number): Promise<void> {
  log.info(`当前 Schema 版本: ${currentVersion}, 目标版本: ${CURRENT_SCHEMA_VERSION}`);
  
  // ======== 检查并修复 app_config 表结构 ========
  // 无论版本号是多少，都要检查 app_config 表结构是否正确
  const appConfigExists = await tableExists(db, 'app_config');
  if (appConfigExists) {
    const hasKeyColumn = await columnExists(db, 'app_config', 'key');
    
    if (!hasKeyColumn) {
      // 旧结构（有 id 列），需要迁移到 key-value 结构
      log.info('检测到旧版本 app_config 表结构，执行迁移...');
      
      // 读取旧配置
      const oldConfig = await db.select<{
        theme: string;
        language: string;
        primary_color: string;
        auto_save: number;
        restore_state: number;
        last_used_tool: string | null;
      }[]>('SELECT * FROM app_config WHERE id = 1');
      
      // 备份旧表
      await db.execute('ALTER TABLE app_config RENAME TO app_config_old');
      
      // 创建新表（key-value 结构）
      await db.execute(`
        CREATE TABLE app_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 迁移数据
      if (oldConfig.length > 0) {
        const config = oldConfig[0];
        await db.execute(`INSERT INTO app_config (key, value) VALUES ('theme', $1)`, [config.theme || 'light']);
        await db.execute(`INSERT INTO app_config (key, value) VALUES ('language', $1)`, [config.language || 'zh-CN']);
        await db.execute(`INSERT INTO app_config (key, value) VALUES ('primaryColor', $1)`, [config.primary_color || '#1890ff']);
        await db.execute(`INSERT INTO app_config (key, value) VALUES ('autoSave', $1)`, [config.auto_save ? 'true' : 'false']);
        await db.execute(`INSERT INTO app_config (key, value) VALUES ('restoreState', $1)`, [config.restore_state ? 'true' : 'false']);
        if (config.last_used_tool) {
          await db.execute(`INSERT INTO app_config (key, value) VALUES ('lastUsedTool', $1)`, [config.last_used_tool]);
        }
        log.info('旧配置迁移完成');
      }
      
      // 删除旧表
      await db.execute('DROP TABLE IF EXISTS app_config_old');
      
      // 更新版本号（如果还没有）
      if (currentVersion < 1) {
        // 创建 schema_version 表（如果不存在）
        const schemaVersionExists = await tableExists(db, 'schema_version');
        if (!schemaVersionExists) {
          await db.execute(`
            CREATE TABLE schema_version (
              version INTEGER PRIMARY KEY,
              applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              description TEXT
            )
          `);
        }
        await setSchemaVersion(db, 1, 'Migrated old app_config to key-value');
      }
    }
  }
  
  // ======== 版本 0 -> 1: 初始化（全新数据库） ========
  if (currentVersion < 1) {
    log.info('执行迁移: v0 -> v1 (初始化)');
    
    // 创建 schema_version 表（如果不存在）
    const schemaVersionExists = await tableExists(db, 'schema_version');
    if (!schemaVersionExists) {
      await db.execute(`
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        )
      `);
    }
    
    // 创建 app_config 表（如果不存在）
    if (!appConfigExists) {
      await db.execute(`
        CREATE TABLE app_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // 插入默认配置
      await db.execute(`INSERT OR IGNORE INTO app_config (key, value) VALUES ('theme', 'light')`);
      await db.execute(`INSERT OR IGNORE INTO app_config (key, value) VALUES ('language', 'zh-CN')`);
      await db.execute(`INSERT OR IGNORE INTO app_config (key, value) VALUES ('primaryColor', '#1890ff')`);
      await db.execute(`INSERT OR IGNORE INTO app_config (key, value) VALUES ('autoSave', 'true')`);
      await db.execute(`INSERT OR IGNORE INTO app_config (key, value) VALUES ('restoreState', 'true')`);
    }
    
    await setSchemaVersion(db, 1, 'Initial schema');
  }
  
  // ======== 版本 1 -> 2: 添加 Git 仓库字段和索引 ========
  if (currentVersion < 2) {
    log.info('执行迁移: v1 -> v2 (添加字段和索引)');
    
    const reposTableExists = await tableExists(db, 'git_repositories');
    
    if (reposTableExists) {
      // 添加缺失的列
      const columnsToAdd = [
        { name: 'created_at', sql: 'ALTER TABLE git_repositories ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP' },
        { name: 'updated_at', sql: 'ALTER TABLE git_repositories ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP' },
        { name: 'is_deleted', sql: 'ALTER TABLE git_repositories ADD COLUMN is_deleted INTEGER DEFAULT 0' },
        { name: 'password_encrypted', sql: 'ALTER TABLE git_repositories ADD COLUMN password_encrypted TEXT' },
      ];
      
      for (const col of columnsToAdd) {
        const exists = await columnExists(db, 'git_repositories', col.name);
        if (!exists) {
          log.info(`添加列: ${col.name}`);
          try {
            await db.execute(col.sql);
          } catch (e) {
            log.warn(`添加列 ${col.name} 失败（可能已存在）: ${e}`);
          }
        }
      }
      
      // 迁移旧密码数据（password -> password_encrypted）
      const hasPassword = await columnExists(db, 'git_repositories', 'password');
      const hasPasswordEncrypted = await columnExists(db, 'git_repositories', 'password_encrypted');
      
      if (hasPassword && hasPasswordEncrypted) {
        log.info('迁移密码数据...');
        try {
          const repos = await db.select<{ id: number; password: string | null }[]>(
            'SELECT id, password FROM git_repositories WHERE password IS NOT NULL AND password != ""'
          );
          
          for (const repo of repos) {
            if (repo.password) {
              const encrypted = encrypt(repo.password);
              await db.execute(
                'UPDATE git_repositories SET password_encrypted = $1 WHERE id = $2',
                [encrypted, repo.id]
              );
            }
          }
          log.info('密码迁移完成');
        } catch (e) {
          log.warn(`密码迁移失败: ${e}`);
        }
      }
    } else {
      // 创建 git_repositories 表
      await db.execute(`
        CREATE TABLE IF NOT EXISTS git_repositories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          path TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          source_branch TEXT DEFAULT 'main',
          target_branch TEXT DEFAULT 'main',
          remote TEXT DEFAULT 'origin',
          tag TEXT,
          force INTEGER DEFAULT 0,
          enable INTEGER DEFAULT 1,
          discard_changes INTEGER DEFAULT 0,
          description TEXT,
          username TEXT,
          password_encrypted TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_deleted INTEGER DEFAULT 0
        )
      `);
    }
    
    // 创建索引
    try {
      await db.execute('CREATE INDEX IF NOT EXISTS idx_git_repos_path ON git_repositories(path)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_git_repos_enable ON git_repositories(enable)');
      await db.execute('CREATE INDEX IF NOT EXISTS idx_git_repos_deleted ON git_repositories(is_deleted)');
    } catch (e) {
      log.warn(`创建索引时出现警告: ${e}`);
    }
    
    await setSchemaVersion(db, 2, 'Add timestamps, soft delete, and indexes');
  }
  
  log.info('Schema 迁移完成');
}

/**
 * 初始化数据库（单例模式）
 */
async function initDatabase(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      log.info('初始化数据库连接...');
      
      const db = await Database.load('sqlite:mytools.db');
      
      // 获取当前版本
      let currentVersion = await getSchemaVersion(db);
      
      // 强制检查：如果 app_config 表存在但结构不对，重置版本号强制迁移
      const appConfigExists = await tableExists(db, 'app_config');
      if (appConfigExists) {
        const hasKeyColumn = await columnExists(db, 'app_config', 'key');
        if (!hasKeyColumn && currentVersion >= 1) {
          log.warn('检测到旧版本 app_config 表结构，强制执行迁移');
          currentVersion = 0;
        }
      }
      
      // 执行迁移
      await runMigrations(db, currentVersion);
      
      dbInstance = db;
      
      log.info('数据库初始化成功');
      return db;
    } catch (error) {
      log.error(`初始化失败: ${error}`);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

// ======== 应用配置操作 ========

/**
 * 获取单个配置项
 */
export async function getConfigValue(key: string): Promise<string | null> {
  const db = await initDatabase();
  const rows = await db.select<DbConfigItem[]>(
    'SELECT value FROM app_config WHERE key = $1',
    [key]
  );
  return rows.length > 0 ? rows[0].value : null;
}

/**
 * 设置单个配置项
 */
async function setConfigValue(key: string, value: string): Promise<void> {
  const db = await initDatabase();
  await db.execute(
    `INSERT OR REPLACE INTO app_config (key, value, updated_at) 
     VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [key, value]
  );
}

/**
 * 获取所有配置项
 */
async function getAllConfigValues(): Promise<Record<string, string>> {
  const db = await initDatabase();
  const rows = await db.select<DbConfigItem[]>('SELECT key, value FROM app_config');
  return Object.fromEntries(rows.map(row => [row.key, row.value]));
}

/**
 * 获取应用配置
 */
export async function getAppConfig(): Promise<AppConfig> {
  const values = await getAllConfigValues();
  
  // 解析自定义窗口尺寸
  let customWindowSize: { width: number; height: number } | undefined;
  if (values['customWindowSize']) {
    try {
      customWindowSize = JSON.parse(values['customWindowSize']);
    } catch {
      customWindowSize = undefined;
    }
  }
  
  return {
    theme: (values['theme'] as 'light' | 'dark') || DEFAULT_APP_CONFIG.theme,
    language: (values['language'] as 'zh-CN' | 'en-US') || DEFAULT_APP_CONFIG.language,
    primaryColor: values['primaryColor'] || DEFAULT_APP_CONFIG.primaryColor,
    autoSave: values['autoSave'] === 'true',
    restoreState: values['restoreState'] === 'true',
    lastUsedTool: values['lastUsedTool'] || undefined,
    windowSize: (values['windowSize'] as AppConfig['windowSize']) || DEFAULT_APP_CONFIG.windowSize,
    customWindowSize,
  };
}

/**
 * 更新应用配置
 */
export async function updateAppConfig(config: AppConfig): Promise<void> {
  const updates: Promise<void>[] = [];
  
  updates.push(setConfigValue('theme', config.theme));
  updates.push(setConfigValue('language', config.language));
  updates.push(setConfigValue('primaryColor', config.primaryColor || '#1890ff'));
  updates.push(setConfigValue('autoSave', config.autoSave ? 'true' : 'false'));
  updates.push(setConfigValue('restoreState', config.restoreState ? 'true' : 'false'));
  if (config.lastUsedTool) {
    updates.push(setConfigValue('lastUsedTool', config.lastUsedTool));
  }
  if (config.windowSize) {
    updates.push(setConfigValue('windowSize', config.windowSize));
  }
  if (config.customWindowSize) {
    updates.push(setConfigValue('customWindowSize', JSON.stringify(config.customWindowSize)));
  }
  
  await Promise.all(updates);
  log.debug('配置已更新');
}

// ======== Git 仓库操作 ========

/**
 * 数据库行转 GitRepoConfig
 */
function rowToGitRepo(row: DbGitRepoRow): GitRepoConfig {
  return {
    id: row.id.toString(),
    path: row.path,
    name: row.name,
    source_branch: row.source_branch,
    target_branch: row.target_branch,
    remote: row.remote,
    tag: row.tag || undefined,
    force: row.force === 1,
    enable: row.enable === 1,
    discard_changes: row.discard_changes === 1,
    description: row.description || undefined,
    username: row.username || undefined,
    password: row.password_encrypted ? decrypt(row.password_encrypted) : undefined,
  };
}

/**
 * GitRepoConfig 转数据库行（用于插入/更新）
 */
function gitRepoToRow(repo: GitRepoConfig): Omit<DbGitRepoRow, 'id' | 'created_at' | 'updated_at' | 'is_deleted'> & { is_deleted?: number } {
  return {
    path: repo.path,
    name: repo.name,
    source_branch: repo.source_branch,
    target_branch: repo.target_branch,
    remote: repo.remote,
    tag: repo.tag || null,
    force: repo.force ? 1 : 0,
    enable: repo.enable ? 1 : 0,
    discard_changes: repo.discard_changes ? 1 : 0,
    description: repo.description || null,
    username: repo.username || null,
    password_encrypted: repo.password ? encrypt(repo.password) : null,
  };
}

/**
 * 获取所有 Git 仓库配置（排除已删除）
 */
export async function getGitRepositories(): Promise<GitRepoConfig[]> {
  const db = await initDatabase();
  const rows = await db.select<DbGitRepoRow[]>(
    'SELECT * FROM git_repositories WHERE is_deleted = 0 ORDER BY created_at DESC'
  );
  return rows.map(rowToGitRepo);
}

/**
 * 根据 ID 获取单个仓库
 */
export async function getGitRepositoryById(id: number): Promise<GitRepoConfig | null> {
  const db = await initDatabase();
  const rows = await db.select<DbGitRepoRow[]>(
    'SELECT * FROM git_repositories WHERE id = $1 AND is_deleted = 0',
    [id]
  );
  return rows.length > 0 ? rowToGitRepo(rows[0]) : null;
}

/**
 * 保存 Git 仓库配置（插入或更新）
 */
export async function saveGitRepository(repo: GitRepoConfig): Promise<GitRepoConfig> {
  const db = await initDatabase();
  const row = gitRepoToRow(repo);
  
  // 判断是否为临时 ID（以 temp_ 开头的是临时 ID）
  const isTemporaryId = repo.id.startsWith('temp_');
  
  if (repo.id && !isTemporaryId) {
    // 更新现有记录（非临时 ID）
    await db.execute(
      `UPDATE git_repositories SET 
        path = $1, name = $2, source_branch = $3, target_branch = $4, 
        remote = $5, tag = $6, force = $7, enable = $8, discard_changes = $9,
        description = $10, username = $11, password_encrypted = $12, updated_at = CURRENT_TIMESTAMP
      WHERE id = $13`,
      [row.path, row.name, row.source_branch, row.target_branch, row.remote,
       row.tag, row.force, row.enable, row.discard_changes, row.description,
       row.username, row.password_encrypted, parseInt(repo.id)]
    );
    return repo;
  } else {
    // 插入新记录（临时 ID 或无 ID）
    await db.execute(
      `INSERT INTO git_repositories 
      (path, name, source_branch, target_branch, remote, tag, force, enable, discard_changes, description, username, password_encrypted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [row.path, row.name, row.source_branch, row.target_branch, row.remote,
       row.tag, row.force, row.enable, row.discard_changes, row.description,
       row.username, row.password_encrypted]
    );
    
    // 获取最后插入的 ID
    const result = await db.select<{ id: number }[]>(
      'SELECT last_insert_rowid() as id'
    );
    
    if (!result || result.length === 0 || !result[0]) {
      throw new Error('无法获取插入的记录 ID');
    }
    
    return { ...repo, id: result[0].id.toString() };
  }
}

/**
 * 软删除 Git 仓库
 */
export async function deleteGitRepository(id: string): Promise<void> {
  const db = await initDatabase();
  await db.execute(
    'UPDATE git_repositories SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [parseInt(id)]
  );
  log.debug(`仓库已软删除: ${id}`);
}

/**
 * 批量软删除 Git 仓库
 */
export async function deleteGitRepositories(ids: string[]): Promise<void> {
  const db = await initDatabase();
  
  for (const id of ids) {
    await db.execute(
      'UPDATE git_repositories SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [parseInt(id)]
    );
  }
  log.debug(`批量软删除仓库: ${ids.length} 个`);
}

/**
 * 批量保存 Git 仓库配置（替换现有）
 */
export async function saveAllGitRepositories(repos: GitRepoConfig[]): Promise<GitRepoConfig[]> {
  const db = await initDatabase();
  
  log.info(`开始批量保存仓库配置，共 ${repos.length} 个`);
  
  // 硬删除所有现有记录（包括软删除的），避免 UNIQUE 约束冲突
  await db.execute('DELETE FROM git_repositories');
  
  // 插入新记录
  const savedRepos: GitRepoConfig[] = [];
  
  for (const repo of repos) {
    const row = gitRepoToRow(repo);
    
    await db.execute(
      `INSERT INTO git_repositories 
      (path, name, source_branch, target_branch, remote, tag, force, enable, discard_changes, description, username, password_encrypted)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [row.path, row.name, row.source_branch, row.target_branch, row.remote,
       row.tag, row.force, row.enable, row.discard_changes, row.description,
       row.username, row.password_encrypted]
    );
    
    // 获取最后插入的 ID
    const result = await db.select<{ id: number }[]>(
      'SELECT last_insert_rowid() as id'
    );
    
    if (result && result.length > 0 && result[0]) {
      savedRepos.push({ ...repo, id: result[0].id.toString() });
    }
  }
  
  log.info(`批量保存仓库配置完成: ${savedRepos.length} 个`);
  return savedRepos;
}

/**
 * 恢复已删除的仓库
 */
export async function restoreGitRepository(id: string): Promise<void> {
  const db = await initDatabase();
  await db.execute(
    'UPDATE git_repositories SET is_deleted = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [parseInt(id)]
  );
  log.debug(`仓库已恢复: ${id}`);
}

/**
 * 永久删除所有软删除的记录（清理）
 */
export async function purgeDeletedRepositories(): Promise<void> {
  const db = await initDatabase();
  await db.execute('DELETE FROM git_repositories WHERE is_deleted = 1');
  log.info('已清理所有软删除的仓库记录');
}

// ======== Hook ========

/**
 * 数据库 Hook 返回类型
 */
interface UseDatabaseReturn {
  db: Db | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * 使用数据库的 Hook
 */
export const useDatabase = (): UseDatabaseReturn => {
  const [db, setDb] = useState<Db | null>(dbInstance);
  const [loading, setLoading] = useState(!dbInstance);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dbInstance) {
      setDb(dbInstance);
      setLoading(false);
      return;
    }

    initDatabase()
      .then((database) => {
        setDb(database);
        setError(null);
      })
      .catch((err) => {
        log.error(`初始化失败: ${err}`);
        setError((err as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const retry = () => {
    setLoading(true);
    setError(null);
    dbInstance = null;
    initPromise = null;
    
    initDatabase()
      .then((database) => {
        setDb(database);
        setError(null);
      })
      .catch((err) => {
        log.error(`重试失败: ${err}`);
        setError((err as Error).message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return { db, loading, error, retry };
};

/**
 * 获取数据库实例（非 Hook 方式）
 */
export const getDatabase = async (): Promise<Db> => {
  return initDatabase();
};

/**
 * 重置数据库单例（仅用于测试）
 */
export const resetDatabaseInstance = (): void => {
  dbInstance = null;
  initPromise = null;
};

export default useDatabase;
