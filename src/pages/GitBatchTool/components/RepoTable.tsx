import React, { useState } from 'react';
import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Tag,
  Tooltip,
  Popconfirm,
  Empty,
  Card,
  Row,
  Col
} from 'antd';
import {
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  WarningOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { GitRepoConfig, FilterStatus } from '../../../types/git';
import { theme } from 'antd';

const { Text } = Typography;
const { Option } = Select;

interface RepoTableProps {
  repositories: GitRepoConfig[];
  selectedRowKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onRepoEdit: (repo: GitRepoConfig) => void;
  onRepoDelete: (ids: string[]) => void;
  onBatchEdit: () => void;
  onValidate: (repo: GitRepoConfig) => void;
}

const RepoTable: React.FC<RepoTableProps> = ({
  repositories,
  selectedRowKeys,
  onSelectionChange,
  onRepoEdit,
  onRepoDelete,
  onBatchEdit,
  onValidate
}) => {
  const { token } = theme.useToken();
  
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // 筛选仓库列表
  const filteredRepositories = repositories.filter(repo => {
    // 搜索文本筛选
    const searchMatch = searchText === '' ||
      repo.name.toLowerCase().includes(searchText.toLowerCase()) ||
      repo.path.toLowerCase().includes(searchText.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchText.toLowerCase());

    if (!searchMatch) return false;

    // 状态筛选
    switch (filterStatus) {
      case 'enabled':
        return repo.enable;
      case 'disabled':
        return !repo.enable;
      case 'with_auth':
        return repo.username && repo.password;
      default:
        return true;
    }
  });

  // 表格列定义
  const columns = [
    {
      title: '仓库信息',
      key: 'repo_info',
      width: 280,
      fixed: 'left' as const,
      render: (_: unknown, record: GitRepoConfig) => (
        <div>
          <div>
            <Text strong>{record.name}</Text>
            {!record.enable && (
              <Tag color="red" style={{ marginLeft: 8, fontSize: 10 }}>禁用</Tag>
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
            {record.path}
          </Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 2 }}>
              {record.description}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'Git配置',
      key: 'git_config',
      width: 220,
      render: (_: unknown, record: GitRepoConfig) => (
        <Space direction="vertical" size={2}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag color="blue" style={{ fontSize: 11 }}>{record.source_branch}</Tag>
            <span style={{ fontSize: 11 }}>→</span>
            <Tag color="green" style={{ fontSize: 11 }}>{record.target_branch}</Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            远程: {record.remote}
            {record.tag && <span style={{ marginLeft: 8 }}>| 标签: {record.tag}</span>}
          </Text>
        </Space>
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (_: unknown, record: GitRepoConfig) => (
        <Space size={4}>
          <Tooltip title={record.enable ? '已启用' : '已禁用'}>
            {record.enable ? (
              <CheckCircleOutlined style={{ color: token.colorSuccess, fontSize: 14 }} />
            ) : (
              <StopOutlined style={{ color: token.colorError, fontSize: 14 }} />
            )}
          </Tooltip>
          {record.username && record.password && (
            <Tooltip title="已配置认证">
              <LockOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
            </Tooltip>
          )}
          {record.force && (
            <Tooltip title="强制推送模式">
              <WarningOutlined style={{ color: token.colorWarning, fontSize: 14 }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '快速操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: GitRepoConfig) => (
        <Space size={4}>
          <Button
            size="small"
            onClick={() => onValidate(record)}
            disabled={!record.enable}
          >
            验证
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onRepoEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个仓库配置吗？"
            onConfirm={() => onRepoDelete([record.id])}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 搜索和筛选 */}
      {repositories.length > 0 && (
        <Card size="small" style={{ marginBottom: 0, flex: '0 0 auto' }}>
          <Row gutter={16} align="middle">
            <Col span={8}>
              <Input.Search
                placeholder="搜索仓库名称、路径或描述"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(value) => setSearchText(value)}
                allowClear
                size="small"
              />
            </Col>
            <Col span={6}>
              <Select
                value={filterStatus}
                onChange={setFilterStatus}
                size="small"
                style={{ width: '100%' }}
              >
                <Option value="all">全部仓库</Option>
                <Option value="enabled">仅启用</Option>
                <Option value="disabled">仅禁用</Option>
                <Option value="with_auth">有认证配置</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                显示 {filteredRepositories.length} / {repositories.length}
              </Text>
            </Col>
            <Col span={6} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  size="small"
                  onClick={() => onSelectionChange(filteredRepositories.filter(r => r.enable).map(r => r.id))}
                  disabled={filteredRepositories.length === 0}
                >
                  选择启用的
                </Button>
                <Button
                  size="small"
                  onClick={() => onSelectionChange([])}
                  disabled={selectedRowKeys.length === 0}
                >
                  取消选择
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 批量操作 */}
      <div style={{ flex: '0 0 auto' }}>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={onBatchEdit}
            disabled={selectedRowKeys.length === 0}
          >
            批量编辑配置
          </Button>
          <Popconfirm
            title="确认删除"
            description={`确定要删除选中的 ${selectedRowKeys.length} 个仓库配置吗？`}
            onConfirm={() => onRepoDelete(selectedRowKeys)}
            okText="确定"
            cancelText="取消"
            disabled={selectedRowKeys.length === 0}
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              disabled={selectedRowKeys.length === 0}
            >
              删除选中
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* 表格 */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: '6px'
      }}>
        <Table
          columns={columns}
          dataSource={filteredRepositories}
          rowKey="id"
          size="small"
          scroll={{ x: 800, y: 450 }}
          pagination={false}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: React.Key[]) => onSelectionChange(keys as string[]),
            getCheckboxProps: (record: GitRepoConfig) => ({
              name: record.name
            })
          }}
          rowClassName={(record: GitRepoConfig) => record.enable ? '' : 'disabled-row'}
          locale={{
            emptyText: (
              <Empty
                description="暂无Git仓库配置"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <div>
                  <Text type="secondary">请输入目录路径并点击"扫描"</Text>
                </div>
              </Empty>
            )
          }}
          sticky={{ offsetHeader: 0 }}
        />
      </div>

      {/* 统计信息 */}
      {repositories.length > 0 && (
        <div style={{
          flex: '0 0 auto',
          padding: '8px 12px',
          backgroundColor: token.colorBgLayout,
          borderRadius: '4px',
          fontSize: '12px',
          color: token.colorTextSecondary
        }}>
          <Space>
            <Text type="secondary">共 {repositories.length} 个仓库</Text>
            {filteredRepositories.length !== repositories.length && (
              <Text type="secondary">• 筛选显示 {filteredRepositories.length} 个</Text>
            )}
            <Text type="secondary">• 启用 {filteredRepositories.filter(r => r.enable).length} 个</Text>
            <Text type="secondary">• 有认证 {filteredRepositories.filter(r => r.username && r.password).length} 个</Text>
            {selectedRowKeys.length > 0 && (
              <Text type="secondary" style={{ color: token.colorPrimary }}>
                • 已选择 {selectedRowKeys.length} 个
              </Text>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default RepoTable;
