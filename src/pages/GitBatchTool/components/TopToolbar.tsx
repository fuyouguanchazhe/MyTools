import React, { useRef } from 'react';
import {
  Space,
  Input,
  Button,
  Tag,
  Typography,
  Row,
  Col
} from 'antd';
import {
  FolderOpenOutlined,
  DownloadOutlined,
  UploadOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined
} from '@ant-design/icons';
import { GitRepoConfig } from '../../../types/git';

const { Text } = Typography;

interface TopToolbarProps {
  repositories: GitRepoConfig[];
  selectedCount: number;
  selectedDirectory: string;
  isScanning: boolean;
  onDirectoryChange: (path: string) => void;
  onScan: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onSelectDirectory: () => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
  repositories,
  selectedCount,
  selectedDirectory,
  isScanning,
  onDirectoryChange,
  onScan,
  onImport,
  onExport,
  onSelectDirectory
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = '';
    }
  };

  const enabledCount = repositories.filter(r => r.enable).length;
  const disabledCount = repositories.filter(r => !r.enable).length;
  const authCount = repositories.filter(r => r.username && r.password).length;

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={16} align="middle">
        {/* 左侧 - 标题 */}
        <Col flex="none">
          <Space>
            <BranchesOutlined style={{ fontSize: 20 }} />
            <Text strong style={{ fontSize: 16 }}>Git批处理工具</Text>
          </Space>
        </Col>

        {/* 右侧 - 操作和统计 */}
        <Col flex="auto">
          <Space style={{ float: 'right' }}>
            {/* 扫描输入和按钮 */}
            <Space.Compact>
              <Input
                value={selectedDirectory}
                onChange={(e) => onDirectoryChange(e.target.value)}
                placeholder="目录路径"
                style={{ width: 300 }}
                size="middle"
              />
              <Button
                icon={<FolderOpenOutlined />}
                onClick={onSelectDirectory}
                size="middle"
              >
                选择
              </Button>
              <Button
                type="primary"
                onClick={onScan}
                loading={isScanning}
                disabled={!selectedDirectory.trim()}
                size="middle"
              >
                {isScanning ? '扫描中...' : '扫描'}
              </Button>
            </Space.Compact>

            {/* 导入导出 */}
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <Button
              icon={<UploadOutlined />}
              onClick={() => fileInputRef.current?.click()}
              size="middle"
            >
              导入
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={onExport}
              disabled={repositories.length === 0}
              size="middle"
            >
              导出
            </Button>

            {/* 统计信息 */}
            {repositories.length > 0 && (
              <>
                <Tag icon={<CheckCircleOutlined />} color="success">
                  启用 {enabledCount}
                </Tag>
                {disabledCount > 0 && (
                  <Tag icon={<StopOutlined />} color="error">
                    禁用 {disabledCount}
                  </Tag>
                )}
                {authCount > 0 && (
                  <Tag icon={<LockOutlined />} color="processing">
                    认证 {authCount}
                  </Tag>
                )}
                <Tag color={selectedCount > 0 ? "blue" : "default"} style={{ opacity: selectedCount > 0 ? 1 : 0.5 }}>
                  已选择 {selectedCount}
                </Tag>
              </>
            )}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default TopToolbar;
