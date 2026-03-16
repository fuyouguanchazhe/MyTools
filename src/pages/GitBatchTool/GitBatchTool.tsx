import React, { useState, useEffect } from 'react';
import {
  Card,
  Modal,
  Form,
  Input,
  Switch,
  Divider,
  Alert,
  Row,
  Col,
  message
} from 'antd';
import { open } from '@tauri-apps/plugin-dialog';
import {
  GitRepoConfig,
  ImportedRepoConfig,
  GitRepo,
  LogEntry,
  GitOperationResult,
  ValidationResult
} from '../../types/git';
import {
  getGitRepositories,
  saveAllGitRepositories,
  deleteGitRepositories
} from '../../hooks/useDatabase';
import { invoke } from '@tauri-apps/api/core';
import { createLogger } from '../../utils/logger';
import TopToolbar from './components/TopToolbar';
import RepoTable from './components/RepoTable';
import OperationPanel from './components/OperationPanel';
import ExecutionLog from './components/ExecutionLog';
import '../GitBatchTool.css';

const log = createLogger('GitBatchTool');

const GitBatchTool: React.FC = () => {
  // 状态管理
  const [repositories, setRepositories] = useState<GitRepoConfig[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [batchEditVisible, setBatchEditVisible] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState<string>('');

  // 操作选择状态
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);

  // 单独配置编辑状态
  const [configEditVisible, setConfigEditVisible] = useState(false);
  const [editingRepoConfig, setEditingRepoConfig] = useState<GitRepoConfig | null>(null);

  const [form] = Form.useForm();
  const [configForm] = Form.useForm();

  // 操作选项定义
  const operationOptions = [
    { value: '0', label: '验证配置', description: '仅验证Git配置有效性' },
    { value: '1', label: '切换分支并拉取', description: '切换到指定分支并拉取最新代码' },
    { value: '2', label: '合并分支', description: '将源分支合并到目标分支' },
    { value: '3', label: '推送分支', description: '推送目标分支到远程仓库' },
    { value: '4', label: '创建并推送标签', description: '创建标签并推送到远程仓库' }
  ];

  // 加载配置
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const savedRepos = await getGitRepositories();
      if (savedRepos && savedRepos.length > 0) {
        const validatedRepos = validateAndDeduplicateRepos(savedRepos);
        setRepositories(validatedRepos);
      }
    } catch (error) {
      log.error('Failed to load git configuration:', error);
    }
  };

  const saveConfiguration = async (repos: GitRepoConfig[]): Promise<GitRepoConfig[]> => {
    try {
      const validatedRepos = validateAndDeduplicateRepos(repos);
      log.info(`准备保存仓库配置: ${validatedRepos.length} 个`);
      const savedRepos = await saveAllGitRepositories(validatedRepos);
      log.info('仓库配置保存成功');
      return savedRepos;
    } catch (error) {
      log.error(`保存配置失败，详细错误: ${error}`);
      message.error(`保存配置失败: ${error}`);
      return repos;
    }
  };

  // 配置校验和去重
  const validateAndDeduplicateRepos = (repos: GitRepoConfig[]): GitRepoConfig[] => {
    const pathMap = new Map<string, GitRepoConfig>();
    const validRepos: GitRepoConfig[] = [];
    let duplicateCount = 0;

    repos.forEach(repo => {
      if (!repo.path || !repo.name) {
        return; // 跳过无效配置
      }

      // 检查路径是否重复
      if (pathMap.has(repo.path)) {
        duplicateCount++;
        addLog('warning', `发现重复路径，已跳过: ${repo.path}`);
        return;
      }

      // 设置默认值
      const validRepo: GitRepoConfig = {
        ...repo,
        id: repo.id || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source_branch: repo.source_branch || 'main',
        target_branch: repo.target_branch || 'main',
        remote: repo.remote === undefined ? 'origin' : repo.remote,
        force: Boolean(repo.force),
        enable: repo.enable !== false,
        discard_changes: Boolean(repo.discard_changes),
        username: repo.username || '',
        password: repo.password || ''
      };

      pathMap.set(repo.path, validRepo);
      validRepos.push(validRepo);
    });

    if (duplicateCount > 0) {
      message.warning(`已去除 ${duplicateCount} 个重复的仓库配置`);
    }

    return validRepos;
  };

  const addLog = (level: LogEntry['level'], message: string, repo?: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      repo
    };
    setLogs(prev => [...prev, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    if (logs.length === 0) {
      message.warning('没有可导出的日志');
      return;
    }

    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${log.repo ? ` [${log.repo}]` : ''}`
    ).join('\n');

    const dataBlob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `git-batch-log-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    message.success('日志已导出');
  };

  // 打开目录选择对话框
  const selectDirectory = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
        title: '选择要扫描Git仓库的目录',
        defaultPath: selectedDirectory || undefined,
      });

      if (selectedPath && typeof selectedPath === 'string') {
        setSelectedDirectory(selectedPath);
        addLog('info', `已选择目录: ${selectedPath}`);
      }
    } catch (error) {
      log.error('目录选择失败:', error);
      message.error('打开目录选择对话框失败');
    }
  };

  // 扫描Git仓库
  const scanGitRepositories = async () => {
    if (!selectedDirectory.trim()) {
      message.warning('请输入要扫描的目录路径');
      return;
    }

    setIsScanning(true);
    addLog('info', `开始扫描目录: ${selectedDirectory}`);

    try {
      const scannedRepos = await invoke<GitRepo[]>('scan_git_repositories', {
        directory: selectedDirectory
      });

      addLog('success', `扫描完成，发现 ${scannedRepos.length} 个Git仓库`);

      const newRepos: GitRepoConfig[] = scannedRepos.map(repo => ({
        id: Date.now().toString() + Math.random(),
        path: repo.path,
        name: repo.name,
        source_branch: 'main',
        target_branch: 'main',
        remote: 'origin',
        tag: '',
        force: false,
        enable: true,
        discard_changes: false,
        description: `扫描发现的Git仓库: ${repo.name}`,
        username: '',
        password: ''
      }));

      const allRepos = [...repositories, ...newRepos];
      const validatedRepos = await saveConfiguration(allRepos);
      setRepositories(validatedRepos);
      setSelectedRowKeys([]);

      message.success(`成功扫描到 ${scannedRepos.length} 个Git仓库`);
    } catch (error) {
      addLog('error', `扫描失败: ${error}`);
      message.error(`扫描Git仓库失败: ${error}`);
    } finally {
      setIsScanning(false);
    }
  };

  // 删除选中的仓库
  const deleteSelectedRepositories = async (ids: string[]) => {
    const deleteCount = ids.length;
    try {
      await deleteGitRepositories(ids);
      const updatedRepos = await getGitRepositories();
      setRepositories(updatedRepos);
      setSelectedRowKeys([]);
      message.success(`已删除 ${deleteCount} 个仓库配置`);
      addLog('success', `成功删除 ${deleteCount} 个仓库配置`);
    } catch (error) {
      log.error('删除仓库失败:', error);
      message.error(`删除仓库失败: ${error}`);
      addLog('error', `删除仓库失败: ${error}`);
    }
  };

  // 显示批量编辑对话框
  const showBatchEdit = () => {
    const selectedRepos = repositories.filter(repo => selectedRowKeys.includes(repo.id));
    const commonValues: Partial<Record<keyof GitRepoConfig, unknown>> = {};

    const fields: (keyof GitRepoConfig)[] = ['source_branch', 'target_branch', 'remote', 'tag', 'force', 'enable', 'discard_changes', 'username', 'password'];
    fields.forEach(field => {
      const values = selectedRepos.map(repo => repo[field]);
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length === 1) {
        commonValues[field] = uniqueValues[0];
      }
    });

    form.setFieldsValue(commonValues);
    setBatchEditVisible(true);
  };

  // 应用批量编辑
  const applyBatchEdit = async () => {
    try {
      const values = await form.validateFields();

      const newRepos = repositories.map(repo => {
        if (selectedRowKeys.includes(repo.id)) {
          return { ...repo, ...values };
        }
        return repo;
      });

      const validatedRepos = await saveConfiguration(newRepos);
      setRepositories(validatedRepos);
      setBatchEditVisible(false);

      addLog('info', `批量编辑完成，更新了 ${selectedRowKeys.length} 个仓库配置`);
      message.success(`已批量更新 ${selectedRowKeys.length} 个仓库配置`);
    } catch (error) {
      log.error('批量编辑失败:', error);
    }
  };

  // 打开单独配置编辑
  const openConfigEdit = (repo: GitRepoConfig) => {
    setEditingRepoConfig(repo);
    configForm.setFieldsValue({
      name: repo.name,
      description: repo.description || '',
      source_branch: repo.source_branch,
      target_branch: repo.target_branch,
      remote: repo.remote,
      tag: repo.tag || '',
      username: repo.username || '',
      password: repo.password || '',
      force: repo.force,
      enable: repo.enable,
      discard_changes: repo.discard_changes
    });
    setConfigEditVisible(true);
  };

  // 应用单独配置编辑
  const applyConfigEdit = async () => {
    try {
      if (!editingRepoConfig) return;

      const values = await configForm.validateFields();

      const updates: Partial<GitRepoConfig> = {};
      if (values.name !== undefined) updates.name = values.name;
      if (values.description !== undefined) updates.description = values.description;
      if (values.source_branch !== undefined) updates.source_branch = values.source_branch;
      if (values.target_branch !== undefined) updates.target_branch = values.target_branch;
      if (values.remote !== undefined) updates.remote = values.remote || '';
      if (values.tag !== undefined) updates.tag = values.tag;
      if (values.username !== undefined) updates.username = values.username;
      if (values.password !== undefined) updates.password = values.password;
      if (values.force !== undefined) updates.force = values.force;
      if (values.enable !== undefined) updates.enable = values.enable;
      if (values.discard_changes !== undefined) updates.discard_changes = values.discard_changes;

      await updateRepoConfig(editingRepoConfig.id, updates);

      setConfigEditVisible(false);
      setEditingRepoConfig(null);
      configForm.resetFields();

      addLog('info', `已更新仓库 ${editingRepoConfig.name} 的配置`, editingRepoConfig.path);
      message.success(`已更新仓库配置`);
    } catch (error) {
      log.error('仓库配置更新失败:', error);
      message.error('仓库配置更新失败');
    }
  };

  // 简化版导出配置
  const exportConfiguration = () => {
    if (repositories.length === 0) {
      message.warning('没有可导出的配置');
      return;
    }

    const config = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      repositories: repositories.map(({ id, ...repo }) => repo)
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `git-batch-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    addLog('success', '配置已导出到下载文件夹');
    message.success('配置导出成功');
  };

  // 处理配置文件上传
  const handleConfigUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const configText = e.target?.result as string;
        const config = JSON.parse(configText);

        if (!config.repositories || !Array.isArray(config.repositories)) {
          throw new Error('配置文件格式错误：缺少repositories字段');
        }

        const importedRepos: GitRepoConfig[] = config.repositories.map((repo: ImportedRepoConfig, index: number) => ({
          id: Date.now().toString() + index,
          path: repo.path || '',
          name: repo.name || `导入的仓库 ${index + 1}`,
          source_branch: repo.source_branch || 'main',
          target_branch: repo.target_branch || 'main',
          remote: repo.remote === undefined ? 'origin' : repo.remote,
          tag: repo.tag || '',
          force: Boolean(repo.force),
          enable: repo.enable !== false,
          discard_changes: Boolean(repo.discard_changes),
          description: repo.description || '',
          username: repo.username || '',
          password: repo.password || ''
        }));

        const allRepos = [...repositories, ...importedRepos];
        const validatedRepos = await saveConfiguration(allRepos);
        setRepositories(validatedRepos);

        addLog('success', `成功导入 ${importedRepos.length} 个仓库配置`);
        message.success(`成功导入 ${importedRepos.length} 个仓库配置`);
      } catch (error) {
        addLog('error', `导入失败: ${error}`);
        message.error('导入配置失败');
      }
    };
    reader.readAsText(file);
  };

  // 更新单个仓库配置
  const updateRepoConfig = async (repoId: string, updates: Partial<GitRepoConfig>) => {
    const newRepos = repositories.map(repo => {
      if (repo.id === repoId) {
        return { ...repo, ...updates };
      }
      return repo;
    });

    const validatedRepos = await saveConfiguration(newRepos);
    setRepositories(validatedRepos);

    const updatedFields = Object.keys(updates).join(', ');
    const repo = repositories.find(r => r.id === repoId);
    addLog('info', `已更新配置: ${updatedFields}`, repo?.path || '');

    if (updates.enable === true && repo && !repo.enable) {
      addLog('success', '✓ 仓库已重新启用，建议先验证配置', repo.path);
    }
  };

  // 验证单个仓库配置
  const validateRepoConfig = async (repo: GitRepoConfig): Promise<ValidationResult> => {
    try {
      const result = await invoke<ValidationResult>('validate_git_config', { config: repo });
      return result;
    } catch (error) {
      return {
        valid: false,
        message: `验证失败: ${error}`,
        repo_path: repo.path,
      };
    }
  };

  // 验证单个仓库（快速操作）
  const handleValidate = async (repo: GitRepoConfig) => {
    addLog('info', `验证配置: ${repo.name}`, repo.path);
    const result = await validateRepoConfig(repo);
    
    if (result.valid) {
      addLog('success', `✓ 验证成功: ${repo.name}`, repo.path);
      message.success(`仓库 ${repo.name} 验证成功`);
    } else {
      addLog('error', `✗ 验证失败: ${result.message}`, repo.path);
      message.error(`仓库 ${repo.name} 验证失败: ${result.message}`);
    }
  };

  // 根据操作编号执行对应操作
  const executeOperationByCode = async (repo: GitRepoConfig, operationCode: string): Promise<GitOperationResult> => {
    try {
      let result: GitOperationResult;

      switch (operationCode) {
        case '0': // 验证配置
          const validationResult = await validateRepoConfig(repo);
          result = {
            success: validationResult.valid,
            message: validationResult.message,
            repo_path: validationResult.repo_path,
            timestamp: new Date().toISOString(),
          };
          break;

        case '1': // 切换分支并拉取
          result = await invoke<GitOperationResult>('switch_and_pull', { config: repo });
          break;

        case '2': // 合并分支
          result = await invoke<GitOperationResult>('merge_branches', { config: repo });
          break;

        case '3': // 推送分支
          result = await invoke<GitOperationResult>('push_branch', { config: repo });
          break;

        case '4': // 创建并推送标签
          if (repo.tag && repo.tag.trim()) {
            result = await invoke<GitOperationResult>('create_and_push_tag', { config: repo });
          } else {
            result = {
              success: false,
              message: '未配置标签名，跳过标签操作',
              repo_path: repo.path,
              timestamp: new Date().toISOString(),
            };
          }
          break;

        default:
          throw new Error(`未知的操作编号: ${operationCode}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        message: `操作异常: ${error}`,
        repo_path: repo.path,
        timestamp: new Date().toISOString(),
      };
    }
  };

  // 执行选中的操作
  const executeSelectedOperations = async () => {
    if (selectedOperations.length === 0) {
      message.warning('请先选择要执行的操作');
      return;
    }

    const enabledRepos = repositories.filter(repo =>
      selectedRowKeys.includes(repo.id) && repo.enable
    );

    if (enabledRepos.length === 0) {
      message.warning('没有启用的仓库可以执行操作');
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);

    const operationNames = Object.fromEntries(operationOptions.map(op => [op.value, op.label]));
    const selectedOpNames = selectedOperations.map(code => operationNames[code]).join('、');

    addLog('info', `开始执行操作: ${selectedOpNames}`);
    addLog('info', `选中仓库: ${enabledRepos.length} 个`);

    let totalOperations = enabledRepos.length * selectedOperations.length;
    let currentOperation = 0;
    let successfulRepos = 0;

    const reposToDisable = new Set<string>();

    try {
      for (const repo of enabledRepos) {
        addLog('info', `处理仓库: ${repo.name}`, repo.path);

        let repoSuccess = true;
        let isValidationFailed = false;

        for (const operationCode of selectedOperations) {
          const operationName = operationNames[operationCode];
          addLog('info', `  执行: ${operationName}`, repo.path);

          try {
            const result = await executeOperationByCode(repo, operationCode);
            currentOperation++;

            if (result.success) {
              addLog('success', `  ✓ ${operationName} 成功`, repo.path);
            } else {
              addLog('error', `  ✗ ${operationName} 失败: ${result.message}`, repo.path);

              if (operationCode === '0') {
                reposToDisable.add(repo.id);
                addLog('warning', `  ⚠️ 验证失败，已标记为禁用，跳过后续操作`, repo.path);
                isValidationFailed = true;
                repoSuccess = false;
                currentOperation += selectedOperations.length - selectedOperations.indexOf(operationCode) - 1;
                break;
              }

              repoSuccess = false;
              if (operationCode !== '4') {
                addLog('warning', `  跳过仓库 ${repo.name} 的后续步骤`, repo.path);
                currentOperation += selectedOperations.length - selectedOperations.indexOf(operationCode) - 1;
                break;
              }
            }
          } catch (error) {
            addLog('error', `  ✗ ${operationName} 异常: ${error}`, repo.path);
            repoSuccess = false;
            currentOperation++;

            if (operationCode !== '4') {
              addLog('warning', `  跳过仓库 ${repo.name} 的后续步骤`, repo.path);
              currentOperation += selectedOperations.length - selectedOperations.indexOf(operationCode) - 1;
              break;
            }
          }

          setExecutionProgress(Math.round((currentOperation / totalOperations) * 100));
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (!isValidationFailed && repoSuccess) {
          addLog('success', `✅ 仓库 ${repo.name} 处理完成`, repo.path);
          successfulRepos++;
        } else if (!isValidationFailed) {
          addLog('error', `❌ 仓库 ${repo.name} 处理失败`, repo.path);
        }
      }

      if (reposToDisable.size > 0) {
        addLog('info', `批量禁用 ${reposToDisable.size} 个验证失败的仓库`);
        const newRepos = repositories.map(repo => {
          if (reposToDisable.has(repo.id)) {
            return { ...repo, enable: false };
          }
          return repo;
        });

        const validatedRepos = await saveConfiguration(newRepos);
        setRepositories(validatedRepos);

        addLog('success', `✓ 已批量禁用 ${reposToDisable.size} 个验证失败的仓库`);
      }

      const successRate = ((successfulRepos / enabledRepos.length) * 100).toFixed(1);
      addLog('info', `操作完成: ${successfulRepos}/${enabledRepos.length} 个仓库成功 (${successRate}%)`);

      if (reposToDisable.size > 0) {
        addLog('info', `💡 提示：可在表格中修改配置后重新开启已禁用的仓库`);
      }

      if (successfulRepos === enabledRepos.length) {
        addLog('success', '🎉 所有操作执行成功');
        message.success(`批量操作执行完成：${successfulRepos}/${enabledRepos.length} 个仓库成功`);
      } else if (successfulRepos > 0) {
        addLog('warning', `⚠️ 部分操作成功: ${successfulRepos}/${enabledRepos.length}`);
        message.warning(`部分操作成功：${successfulRepos}/${enabledRepos.length} 个仓库成功`);
      } else {
        addLog('error', '❌ 所有操作都失败了');
        message.error('批量操作执行失败：没有仓库成功完成');
      }

    } catch (error) {
      addLog('error', `批量操作异常: ${error}`);
      message.error('批量操作执行失败');
    } finally {
      setIsExecuting(false);
      setExecutionProgress(0);
    }
  };

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 顶部工具栏 */}
      <div style={{ flex: '0 0 auto' }}>
        <TopToolbar
          repositories={repositories}
          selectedCount={selectedRowKeys.length}
          selectedDirectory={selectedDirectory}
          isScanning={isScanning}
          onDirectoryChange={setSelectedDirectory}
          onScan={scanGitRepositories}
          onImport={handleConfigUpload}
          onExport={exportConfiguration}
          onSelectDirectory={selectDirectory}
        />
      </div>

      {/* 主体区域 - 左右分栏 */}
      <Row gutter={16} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* 左侧 - 仓库列表（60%） */}
        <Col span={14} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <RepoTable
              repositories={repositories}
              selectedRowKeys={selectedRowKeys}
              onSelectionChange={setSelectedRowKeys}
              onRepoEdit={openConfigEdit}
              onRepoDelete={deleteSelectedRepositories}
              onBatchEdit={showBatchEdit}
              onValidate={handleValidate}
            />
          </Card>
        </Col>

        {/* 右侧 - 操作配置 + 日志（40%） */}
        <Col span={10} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
            <div style={{ flex: '0 0 auto' }}>
              <OperationPanel
                selectedCount={selectedRowKeys.length}
                selectedOperations={selectedOperations}
                onOperationsChange={setSelectedOperations}
                onExecute={executeSelectedOperations}
                isExecuting={isExecuting}
                executionProgress={executionProgress}
              />
            </div>

            <div style={{ flex: '1 1 0', minHeight: 0, maxHeight: '100%', overflow: 'hidden' }}>
              <ExecutionLog
                logs={logs}
                onClear={clearLogs}
                onExport={exportLogs}
                isExecuting={isExecuting}
                executionProgress={executionProgress}
              />
            </div>
          </div>
        </Col>
      </Row>

      {/* 批量编辑对话框 */}
      <Modal
        title={`批量编辑配置 - 已选择 ${selectedRowKeys.length} 个仓库`}
        open={batchEditVisible}
        onOk={applyBatchEdit}
        onCancel={() => setBatchEditVisible(false)}
        width={600}
        destroyOnClose
        okText="应用"
        cancelText="取消"
      >
        <Alert
          type="info"
          message="只有填写的字段才会被更新，空字段将保持原值不变"
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="source_branch" label="源分支">
                <Input placeholder="例如: develop, feature/xxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="target_branch" label="目标分支">
                <Input placeholder="例如: main, master" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="remote" label="远程仓库">
                <Input placeholder="远程仓库名称 (默认: origin，可为空)" allowClear />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tag" label="标签">
                <Input placeholder="例如: v1.0.0" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">认证信息</Divider>

          <Alert
            type="warning"
            message="认证信息（可选）"
            description="如果您的Git仓库需要用户名密码认证（HTTPS），请填写下方信息。留空将使用系统SSH密钥或凭据存储。"
            style={{ marginBottom: 16 }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名">
                <Input placeholder="Git用户名 (HTTPS认证)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="password" label="密码/Token">
                <Input.Password placeholder="密码或Personal Access Token" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="enable" label="启用状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="force" label="强制推送" valuePropName="checked">
                <Switch checkedChildren="强制" unCheckedChildren="普通" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discard_changes" label="丢弃本地变更" valuePropName="checked">
                <Switch checkedChildren="丢弃" unCheckedChildren="保留" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 单独配置编辑对话框 */}
      <Modal
        title={`编辑仓库配置 - ${editingRepoConfig?.name || ''}`}
        open={configEditVisible}
        onOk={applyConfigEdit}
        onCancel={() => {
          setConfigEditVisible(false);
          setEditingRepoConfig(null);
          configForm.resetFields();
        }}
        width={800}
        destroyOnClose
        okText="保存配置"
        cancelText="取消"
      >
        <Form form={configForm} layout="vertical">
          {/* 仓库信息 */}
          <Divider orientation="left">仓库信息</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="仓库名称" rules={[{ required: true, message: '请输入仓库名称' }]}>
                <Input placeholder="仓库名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="description" label="描述">
                <Input placeholder="仓库描述（可选）" />
              </Form.Item>
            </Col>
          </Row>

          {/* 分支配置 */}
          <Divider orientation="left">分支配置</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="source_branch" label="源分支" rules={[{ required: true, message: '请输入源分支' }]}>
                <Input placeholder="例如: develop" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="target_branch" label="目标分支" rules={[{ required: true, message: '请输入目标分支' }]}>
                <Input placeholder="例如: main" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="remote" label="远程仓库">
                <Input placeholder="默认: origin，本地仓库可为空" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tag" label="标签">
                <Input placeholder="例如: v1.0.0" />
              </Form.Item>
            </Col>
          </Row>

          {/* 认证信息 */}
          <Divider orientation="left">认证信息</Divider>
          <Alert
            type="info"
            message="HTTPS认证配置（可选）"
            description="如果仓库需要用户名密码认证，请填写下方信息。留空将使用系统SSH密钥或凭据存储。"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="username" label="用户名">
                <Input placeholder="Git用户名 (HTTPS认证)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="password" label="密码/Token">
                <Input.Password placeholder="密码或Personal Access Token (推荐)" />
              </Form.Item>
            </Col>
          </Row>

          {/* 状态控制 */}
          <Divider orientation="left">状态控制</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="enable" label="启用状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="force" label="强制推送" valuePropName="checked">
                <Switch checkedChildren="强制" unCheckedChildren="普通" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="discard_changes" label="丢弃本地变更" valuePropName="checked">
                <Switch checkedChildren="丢弃" unCheckedChildren="保留" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default GitBatchTool;
