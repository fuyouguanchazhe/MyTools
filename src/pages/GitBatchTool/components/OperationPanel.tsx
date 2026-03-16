import React from 'react';
import {
  Card,
  Checkbox,
  Button,
  Space,
  Typography,
  Alert,
  Popconfirm,
  Progress,
  theme
} from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

// 操作选项定义
const operationOptions = [
  { value: '0', label: '验证配置', description: '仅验证Git配置有效性' },
  { value: '1', label: '切换分支并拉取', description: '切换到指定分支并拉取最新代码' },
  { value: '2', label: '合并分支', description: '将源分支合并到目标分支' },
  { value: '3', label: '推送分支', description: '推送目标分支到远程仓库' },
  { value: '4', label: '创建并推送标签', description: '创建标签并推送到远程仓库' }
];

interface OperationPanelProps {
  selectedCount: number;
  selectedOperations: string[];
  onOperationsChange: (operations: string[]) => void;
  onExecute: () => void;
  isExecuting: boolean;
  executionProgress: number;
}

const OperationPanel: React.FC<OperationPanelProps> = ({
  selectedCount,
  selectedOperations,
  onOperationsChange,
  onExecute,
  isExecuting,
  executionProgress
}) => {
  const { token } = theme.useToken();

  const operationNames = Object.fromEntries(operationOptions.map(op => [op.value, op.label]));

  return (
    <Card
      title="操作配置"
      size="small"
      style={{ marginTop: 0 }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {/* 操作选择 */}
        <div>
          <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
            选择操作：
          </Text>
          <Checkbox.Group
            value={selectedOperations}
            onChange={(values) => onOperationsChange(values as string[])}
            style={{ width: '100%' }}
          >
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {operationOptions.map(option => (
                <Card
                  key={option.value}
                  hoverable
                  size="small"
                  style={{
                    borderColor: selectedOperations.includes(option.value)
                      ? token.colorPrimary
                      : token.colorBorder,
                    backgroundColor: selectedOperations.includes(option.value)
                      ? token.colorPrimaryBg
                      : token.colorBgContainer,
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  bodyStyle={{ padding: '8px 12px' }}
                >
                  <Checkbox value={option.value}>
                    <Text strong style={{ fontSize: 12 }}>{option.label}</Text>
                  </Checkbox>
                </Card>
              ))}
            </div>
          </Checkbox.Group>
        </div>

        {/* 操作预览 */}
        {selectedOperations.length > 0 && (
          <Alert
            type="info"
            showIcon
            message={
              <span style={{ fontSize: 12 }}>
                执行顺序：{selectedOperations.map(code =>
                  operationNames[code]
                ).join(' → ')}
              </span>
            }
            style={{ padding: '6px 10px', fontSize: 12 }}
          />
        )}

        {/* 执行信息 */}
        <div style={{
          padding: '10px 12px',
          backgroundColor: token.colorInfoBg,
          borderRadius: '6px',
          border: `1px solid ${token.colorInfoBorder}`
        }}>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {selectedOperations.length > 0 ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  将对 <Text strong>{selectedCount}</Text> 个仓库执行 <Text strong>{selectedOperations.length}</Text> 个操作
                </Text>
              ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  请选择操作
                </Text>
              )}
            </div>
            
            {isExecuting && (
              <Progress
                type="circle"
                percent={executionProgress}
                size={28}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size="small">
              <Button
                onClick={() => onOperationsChange([])}
                disabled={selectedOperations.length === 0 || isExecuting}
                size="small"
              >
                清空
              </Button>
              <Button
                onClick={() => onOperationsChange(operationOptions.map(op => op.value))}
                disabled={isExecuting}
                size="small"
              >
                全选
              </Button>
            </Space>
            
            <Popconfirm
              title="确认执行"
              description={
                <div>
                  <div>即将对 {selectedCount} 个仓库执行操作</div>
                  <div style={{ marginTop: 8, color: token.colorWarningText, fontSize: 12 }}>
                    请确保配置正确
                  </div>
                </div>
              }
              onConfirm={onExecute}
              disabled={selectedOperations.length === 0 || selectedCount === 0 || isExecuting}
              okText="确定"
              cancelText="取消"
            >
              <Button
                icon={<PlayCircleOutlined />}
                type="primary"
                size="middle"
                disabled={selectedOperations.length === 0 || selectedCount === 0 || isExecuting}
                loading={isExecuting}
              >
                执行
              </Button>
            </Popconfirm>
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default OperationPanel;
