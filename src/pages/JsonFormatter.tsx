import React, { useState } from 'react';
import { Card, Input, Button, Row, Col, message, Space, Select, Typography, Alert, theme } from 'antd';
import { CopyOutlined, ClearOutlined, CompressOutlined, ExpandAltOutlined, SwapOutlined } from '@ant-design/icons';
import { useClipboard } from '../hooks/useClipboard';
import { getJsonStats, checkJsonSize } from '../utils/jsonHelpers';
import { createLogger } from '../utils/logger';

const log = createLogger('JsonFormatter');
const { TextArea } = Input;
const { Text } = Typography;

const JsonFormatter: React.FC = () => {
  const { token } = theme.useToken();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [stats, setStats] = useState({ keys: 0, lines: 0, size: 0 });
  const [sizeWarning, setSizeWarning] = useState<{ level: string; message: string } | null>(null);
  const { copy } = useClipboard();

  const formatJson = () => {
    try {
      // 自动转换中文引号为英文引号
      const normalizedInput = input
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'");
      
      // 如果有转换，更新输入框
      if (normalizedInput !== input) {
        setInput(normalizedInput);
        message.info('已自动将中文引号转换为英文引号', 2);
      }

      // 检查JSON大小
      const sizeInfo = checkJsonSize(new Blob([normalizedInput]).size);
      if (sizeInfo.level !== 'safe') {
        setSizeWarning(sizeInfo);
      } else {
        setSizeWarning(null);
      }

      const parsed = JSON.parse(normalizedInput);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setOutput(formatted);
      setError('');
      
      // 使用优化的统计函数
      const jsonStats = getJsonStats(formatted);
      setStats({
        keys: jsonStats.keys,
        lines: jsonStats.lines,
        size: jsonStats.size,
      });
      
      if (jsonStats.fromCache) {
        log.debug('使用缓存数据');
      }
      
      message.success('JSON 格式化成功！');
    } catch (err) {
      setError('JSON 格式错误: ' + (err as Error).message);
      setOutput('');
      setStats({ keys: 0, lines: 0, size: 0 });
      setSizeWarning(null);
      message.error('JSON 格式化失败！');
    }
  };

  const minifyJson = () => {
    try {
      // 自动转换中文引号为英文引号
      const normalizedInput = input
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'");
      
      // 如果有转换，更新输入框
      if (normalizedInput !== input) {
        setInput(normalizedInput);
        message.info('已自动将中文引号转换为英文引号', 2);
      }

      // 检查JSON大小
      const sizeInfo = checkJsonSize(new Blob([normalizedInput]).size);
      if (sizeInfo.level !== 'safe') {
        setSizeWarning(sizeInfo);
      } else {
        setSizeWarning(null);
      }

      const parsed = JSON.parse(normalizedInput);
      const minified = JSON.stringify(parsed);
      setOutput(minified);
      setError('');
      
      // 使用优化的统计函数
      const jsonStats = getJsonStats(minified);
      setStats({
        keys: jsonStats.keys,
        lines: jsonStats.lines,
        size: jsonStats.size,
      });
      
      message.success('JSON 压缩成功！');
    } catch (err) {
      setError('JSON 格式错误: ' + (err as Error).message);
      setOutput('');
      setStats({ keys: 0, lines: 0, size: 0 });
      setSizeWarning(null);
      message.error('JSON 压缩失败！');
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
    setStats({ keys: 0, lines: 0, size: 0 });
    setSizeWarning(null);
  };

  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
  };

  return (
    <div>
      <Card>
        {/* 大 JSON 警告提示 */}
        {sizeWarning && (
          <Alert
            message={sizeWarning.level === 'danger' ? '警告：JSON 文件过大' : '提示：JSON 文件较大'}
            description={sizeWarning.message}
            type={sizeWarning.level === 'danger' ? 'error' : 'warning'}
            closable
            onClose={() => setSizeWarning(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Space style={{ marginBottom: 16 }} wrap>
          <Button type="primary" icon={<ExpandAltOutlined />} onClick={formatJson}>
            格式化
          </Button>
          <Button icon={<CompressOutlined />} onClick={minifyJson}>
            压缩
          </Button>
          <Button 
            icon={<SwapOutlined />}
            onClick={swapInputOutput}
            disabled={!input || !output}
          >
            交换输入输出
          </Button>
          <Button 
            icon={<CopyOutlined />} 
            onClick={() => copy(output)}
            disabled={!output}
          >
            复制结果
          </Button>
          <Button 
            icon={<ClearOutlined />} 
            onClick={clearAll}
          >
            清空
          </Button>
          
          <span style={{ marginLeft: 16 }}>缩进大小:</span>
          <Select
            value={indentSize}
            onChange={setIndentSize}
            style={{ width: 80 }}
            size="small"
          >
            <Select.Option value={2}>2</Select.Option>
            <Select.Option value={4}>4</Select.Option>
            <Select.Option value={8}>8</Select.Option>
          </Select>
        </Space>
        
        <Row gutter={16}>
          <Col span={12}>
            <Card title="输入 JSON" size="small">
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="请输入要格式化的 JSON 字符串..."
                autoSize={{ minRows: 10, maxRows: 20 }}
                style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              title="格式化结果" 
              size="small"
              extra={
                output && (
                  <Space size="large">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      键: {stats.keys}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      行: {stats.lines}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      大小: {stats.size}B
                    </Text>
                  </Space>
                )
              }
            >
              {error && (
                <div style={{ 
                  color: token.colorErrorText, 
                  marginBottom: 8, 
                  fontSize: '12px',
                  padding: '8px 12px',
                  backgroundColor: token.colorErrorBg,
                  border: `1px solid ${token.colorErrorBorder}`,
                  borderRadius: '4px'
                }}>
                  {error}
                </div>
              )}
              <TextArea
                value={output}
                readOnly
                placeholder="格式化后的 JSON 将显示在这里..."
                autoSize={{ minRows: 10, maxRows: 20 }}
                style={{ 
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                  backgroundColor: token.colorBgLayout
                }}
                spellCheck={false}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default JsonFormatter;
