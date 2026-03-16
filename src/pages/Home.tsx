import React from 'react';
import { Card, Row, Col, Typography, theme } from 'antd';
import { 
  LinkOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const quickTools = [
    {
      icon: <LinkOutlined />,
      title: 'URL 编解码',
      description: 'URL 和 Base64 编解码',
      path: '/url-encoder',
      color: token.colorWarning,
    },
    {
      icon: <CodeOutlined />,
      title: 'JSON 格式化器',
      description: '格式化和验证 JSON',
      path: '/json-formatter',
      color: token.colorSuccess,
    },
    {
      icon: <ClockCircleOutlined />,
      title: '时间戳转换器',
      description: '时间戳与日期转换',
      path: '/timestamp-converter',
      color: token.colorInfo,
    },
    {
      icon: <BranchesOutlined />,
      title: 'Git 批处理',
      description: '批量操作 Git 仓库',
      path: '/git-batch-tool',
      color: token.colorPrimary,
    },
  ];

  return (
    <div>
      {/* 简洁的欢迎区域 */}
      <div style={{ textAlign: 'center', marginBottom: 32, paddingTop: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          欢迎使用 MyTools
        </Title>
        <Paragraph style={{ color: token.colorTextSecondary, margin: 0 }}>
          一个简洁的开发者工具集合，数据本地存储，保护隐私
        </Paragraph>
      </div>

      {/* 工具网格 */}
      <Row gutter={[16, 16]}>
        {quickTools.map((tool, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              hoverable
              style={{ 
                textAlign: 'center',
                borderColor: tool.color + '30',
              }}
              bodyStyle={{ padding: '24px 16px' }}
              onClick={() => navigate(tool.path)}
            >
              <div 
                style={{ 
                  fontSize: 40, 
                  color: tool.color, 
                  marginBottom: 16 
                }}
              >
                {tool.icon}
              </div>
              <Title level={5} style={{ marginBottom: 8 }}>
                {tool.title}
              </Title>
              <Paragraph 
                style={{ 
                  fontSize: 13, 
                  color: token.colorTextSecondary, 
                  margin: 0,
                }}
              >
                {tool.description}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Home;
