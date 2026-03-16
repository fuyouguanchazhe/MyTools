import React, { useEffect, useRef } from 'react';
import {
  Collapse,
  List,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  Progress,
  theme
} from 'antd';
import { ClearOutlined, DownloadOutlined } from '@ant-design/icons';
import { LogEntry } from '../../../types/git';

const { Text } = Typography;
const { Panel } = Collapse;

interface ExecutionLogProps {
  logs: LogEntry[];
  onClear: () => void;
  onExport: () => void;
  isExecuting: boolean;
  executionProgress: number;
}

const ExecutionLog: React.FC<ExecutionLogProps> = ({
  logs,
  onClear,
  onExport,
  isExecuting,
  executionProgress
}) => {
  const { token } = theme.useToken();
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 自动滚动到日志底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'green';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getLevelText = (level: LogEntry['level']) => {
    return level.toUpperCase();
  };

  return (
    <Collapse
      defaultActiveKey={['1']}
      className="execution-log-collapse"
      style={{ 
        marginTop: 0, 
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Panel
        header={`执行日志 (${logs.length})`}
        key="1"
        style={{ 
          height: '100%',
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden'
        }}
        extra={
          <Space onClick={(e) => e.stopPropagation()}>
            {isExecuting && (
              <Progress
                type="circle"
                percent={executionProgress}
                size={24}
              />
            )}
            <Button
              icon={<DownloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              disabled={logs.length === 0}
              size="small"
            >
              导出
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              disabled={logs.length === 0}
              size="small"
            >
              清空
            </Button>
          </Space>
        }
      >
        <div
          ref={logContainerRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            backgroundColor: token.colorBgLayout,
            border: `1px solid ${token.colorBorder}`,
            borderRadius: '6px',
            padding: '8px'
          }}
        >
          {logs.length === 0 ? (
            <Empty
              description="暂无操作日志"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={logs}
              renderItem={(log) => (
                <List.Item style={{ padding: '4px 0', borderBottom: 'none' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 2 }}>
                      <Text type="secondary" style={{ fontSize: 11, minWidth: '60px' }}>
                        {log.timestamp}
                      </Text>
                      <Tag
                        color={getLevelColor(log.level)}
                        style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
                      >
                        {getLevelText(log.level)}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 12, marginLeft: 8 }}>
                      {log.message}
                      {log.repo && (
                        <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                          [{log.repo.split('/').pop()}]
                        </Text>
                      )}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </Panel>
    </Collapse>
  );
};

export default ExecutionLog;
