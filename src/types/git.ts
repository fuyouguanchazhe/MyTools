/**
 * Git 批量操作相关类型定义
 */

// Git仓库配置接口
export interface GitRepoConfig {
  id: string;  // 前端生成临时ID，保存后由数据库替换为真实ID
  path: string;
  name: string;
  source_branch: string;
  target_branch: string;
  remote: string;
  tag?: string;
  force: boolean;
  enable: boolean;
  discard_changes: boolean;
  description?: string;
  username?: string;
  password?: string;
}

// 导入的仓库配置接口（部分字段可选）
export interface ImportedRepoConfig {
  path?: string;
  name?: string;
  source_branch?: string;
  target_branch?: string;
  remote?: string;
  tag?: string;
  force?: boolean;
  enable?: boolean;
  discard_changes?: boolean;
  description?: string;
  username?: string;
  password?: string;
}

// 后端返回的Git仓库接口
export interface GitRepo {
  path: string;
  name: string;
}

// 日志条目接口
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  repo?: string;
}

// Git操作结果接口
export interface GitOperationResult {
  success: boolean;
  message: string;
  repo_path: string;
  timestamp: string;
}

// 验证结果接口
export interface ValidationResult {
  valid: boolean;
  message: string;
  repo_path: string;
}

// 筛选状态类型
export type FilterStatus = 'all' | 'enabled' | 'disabled' | 'with_auth';
