/**
 * Git 相关常量
 */

/**
 * Git 操作选项
 */
export const GIT_OPERATION_OPTIONS = [
  {
    value: '0',
    label: '验证配置',
    description: '仅验证Git配置有效性',
  },
  {
    value: '1',
    label: '切换分支并拉取',
    description: '切换到指定分支并拉取最新代码',
  },
  {
    value: '2',
    label: '合并分支',
    description: '将源分支合并到目标分支',
  },
  {
    value: '3',
    label: '推送分支',
    description: '推送目标分支到远程仓库',
  },
  {
    value: '4',
    label: '创建并推送标签',
    description: '创建标签并推送到远程仓库',
  },
] as const;

/**
 * 默认 Git 远程仓库名称
 */
export const DEFAULT_GIT_REMOTE = 'origin';

/**
 * 默认 Git 分支名称
 */
export const DEFAULT_GIT_BRANCH = 'main';

/**
 * Git 配置存储键名
 */
export const GIT_REPOSITORIES_KEY = 'gitRepositories';

/**
 * 日志级别
 */
export const LOG_LEVELS = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;
