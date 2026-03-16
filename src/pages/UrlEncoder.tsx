import React, { useState } from 'react';
import { Card, Input, Button, Row, Col, message, Space, Tabs, theme } from 'antd';
import { CopyOutlined, ClearOutlined } from '@ant-design/icons';
import { useClipboard } from '../hooks/useClipboard';

const { TextArea } = Input;

const UrlEncoder: React.FC = () => {
  const { token } = theme.useToken();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const { copy } = useClipboard();

  const handleEncode = () => {
    try {
      const encoded = encodeURIComponent(input);
      setOutput(encoded);
      message.success('URL 编码成功！');
    } catch (error) {
      message.error('URL 编码失败！');
    }
  };

  const handleDecode = () => {
    try {
      const decoded = decodeURIComponent(input);
      setOutput(decoded);
      message.success('URL 解码成功！');
    } catch (error) {
      message.error('URL 解码失败！请检查输入格式。');
    }
  };

  const handleBase64Encode = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
      message.success('Base64 编码成功！');
    } catch (error) {
      message.error('Base64 编码失败！');
    }
  };

  const handleBase64Decode = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
      message.success('Base64 解码成功！');
    } catch (error) {
      message.error('Base64 解码失败！请检查输入格式。');
    }
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
  };

  const swapInputOutput = () => {
    const temp = input;
    setInput(output);
    setOutput(temp);
  };

  const tabItems = [
    {
      key: 'url',
      label: 'URL 编解码',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Button type="primary" onClick={handleEncode}>
              URL 编码
            </Button>
            <Button onClick={handleDecode}>
              URL 解码
            </Button>
            <Button 
              icon={<CopyOutlined />} 
              onClick={() => copy(output)}
              disabled={!output}
            >
              复制结果
            </Button>
            <Button 
              onClick={swapInputOutput}
              disabled={!input || !output}
            >
              交换输入输出
            </Button>
            <Button 
              icon={<ClearOutlined />} 
              onClick={clearAll}
            >
              清空
            </Button>
          </Space>
          
          <Row gutter={16}>
            <Col span={12}>
              <Card title="输入内容" size="small">
                <TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入要编码或解码的文本..."
                  autoSize={{ minRows: 8, maxRows: 15 }}
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="转换结果" size="small">
                <TextArea
                  value={output}
                  readOnly
                  placeholder="转换结果将显示在这里..."
                  autoSize={{ minRows: 8, maxRows: 15 }}
                  style={{ 
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    backgroundColor: token.colorBgLayout
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: 'base64',
      label: 'Base64 编解码',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Button type="primary" onClick={handleBase64Encode}>
              Base64 编码
            </Button>
            <Button onClick={handleBase64Decode}>
              Base64 解码
            </Button>
            <Button 
              icon={<CopyOutlined />} 
              onClick={() => copy(output)}
              disabled={!output}
            >
              复制结果
            </Button>
            <Button 
              onClick={swapInputOutput}
              disabled={!input || !output}
            >
              交换输入输出
            </Button>
            <Button 
              icon={<ClearOutlined />} 
              onClick={clearAll}
            >
              清空
            </Button>
          </Space>
          
          <Row gutter={16}>
            <Col span={12}>
              <Card title="输入内容" size="small">
                <TextArea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="请输入要编码或解码的文本..."
                  autoSize={{ minRows: 8, maxRows: 15 }}
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="转换结果" size="small">
                <TextArea
                  value={output}
                  readOnly
                  placeholder="转换结果将显示在这里..."
                  autoSize={{ minRows: 8, maxRows: 15 }}
                  style={{ 
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    backgroundColor: token.colorBgLayout
                  }}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Tabs 
          defaultActiveKey="url" 
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
};

export default UrlEncoder;
