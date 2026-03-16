import React from 'react';
import { Card, Row, Col, Button, Typography } from 'antd';
import { 
  ToolOutlined, 
  LinkOutlined, 
  LockOutlined, 
  BarcodeOutlined,
  QrcodeOutlined,
  CalculatorOutlined,
  FontColorsOutlined,
  NumberOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const MoreTools: React.FC = () => {
  const comingSoonTools = [
    {
      icon: <LinkOutlined />,
      title: 'URL 编码/解码',
      description: '对 URL 进行编码和解码处理',
    },
    {
      icon: <LockOutlined />,
      title: 'Hash 生成器',
      description: 'MD5、SHA1、SHA256 等哈希值生成',
    },
    {
      icon: <BarcodeOutlined />,
      title: '条形码生成器',
      description: '生成各种格式的条形码',
    },
    {
      icon: <QrcodeOutlined />,
      title: '二维码生成器',
      description: '生成和解析二维码',
    },
    {
      icon: <CalculatorOutlined />,
      title: '进制转换器',
      description: '二进制、八进制、十进制、十六进制转换',
    },
    {
      icon: <FontColorsOutlined />,
      title: '颜色选择器',
      description: 'RGB、HSL、HEX 颜色转换工具',
    },
    {
      icon: <NumberOutlined />,
      title: '正则表达式测试',
      description: '正则表达式匹配测试工具',
    },
  ];

  return (
    <div>
      <Card title={<><ToolOutlined /> 更多工具</>}>
        <Title level={4}>即将推出的工具</Title>
        <Paragraph type="secondary">
          这些工具正在开发中，将在未来版本中陆续推出。
        </Paragraph>
        
        <Row gutter={[16, 16]}>
          {comingSoonTools.map((tool, index) => (
            <Col xs={24} sm={12} md={8} lg={6} key={index}>
              <Card 
                size="small"
                hoverable
                style={{ textAlign: 'center', height: '100%' }}
                bodyStyle={{ padding: '16px 12px' }}
              >
                <div style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }}>
                  {tool.icon}
                </div>
                <Title level={5} style={{ marginBottom: 8 }}>
                  {tool.title}
                </Title>
                <Paragraph 
                  style={{ 
                    fontSize: 12, 
                    color: '#666', 
                    marginBottom: 16,
                    minHeight: 40
                  }}
                >
                  {tool.description}
                </Paragraph>
                <Button type="dashed" size="small" disabled>
                  敬请期待
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Title level={4}>功能建议</Title>
          <Paragraph>
            如果您有其他工具需求或建议，欢迎通过 GitHub Issues 提交反馈。
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

export default MoreTools;
