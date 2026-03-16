import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  Button, 
  Space, 
  Divider, 
  message,
  Typography,
  Row,
  Col,
  ColorPicker,
  Radio,
  InputNumber,
  theme
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { appDataDir } from '@tauri-apps/api/path';
import { useAppConfig } from '../context/AppContext';
import { AppConfig, WindowSizeType, CustomWindowSize } from '../types';
import { WINDOW_SIZE_OPTIONS } from '../constants/app';
import { createLogger } from '../utils/logger';

const log = createLogger('Settings');
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const { token } = theme.useToken();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1890ff');
  const [windowSize, setWindowSize] = useState<WindowSizeType>('standard');
  const [customSize, setCustomSize] = useState<CustomWindowSize>({ width: 1200, height: 800 });
  const [dbPath, setDbPath] = useState<string>('');
  
  // 使用全局配置 Hook
  const { config, updateConfig } = useAppConfig();

  // 获取应用数据目录
  useEffect(() => {
    const fetchDataDir = async () => {
      try {
        const dataDir = await appDataDir();
        setDbPath(dataDir + 'mytools.db');
      } catch (error) {
        log.error('获取数据目录失败:', error);
        // 降级显示提示
        setDbPath('[应用数据目录]/mytools.db');
      }
    };
    fetchDataDir();
  }, []);

  // 同步配置到表单
  useEffect(() => {
    form.setFieldsValue(config);
    if (config.primaryColor) {
      setPrimaryColor(config.primaryColor);
    }
    if (config.windowSize) {
      setWindowSize(config.windowSize);
    }
    if (config.customWindowSize) {
      setCustomSize(config.customWindowSize);
    }
  }, [config, form]);

  // 保存配置
  const handleSave = async (values: AppConfig) => {
    setLoading(true);
    try {
      const newConfig: AppConfig = {
        ...values,
        primaryColor: primaryColor,
        windowSize: windowSize,
        customWindowSize: windowSize === 'custom' ? customSize : undefined,
      };
      
      await updateConfig(newConfig);
      
      // 应用窗口尺寸
      await applyWindowSize(windowSize, windowSize === 'custom' ? customSize : undefined);
      
      message.success('设置保存成功！');
    } catch (error) {
      log.error('保存配置失败:', error);
      message.error('保存设置失败！');
    } finally {
      setLoading(false);
    }
  };

  // 应用窗口尺寸
  const applyWindowSize = async (size: WindowSizeType, custom?: CustomWindowSize) => {
    try {
      await invoke('set_window_size', {
        size: size,
        width: custom?.width,
        height: custom?.height,
      });
    } catch (error) {
      log.error('应用窗口尺寸失败:', error);
    }
  };

  // 窗口尺寸变更处理
  const handleWindowSizeChange = (value: WindowSizeType) => {
    setWindowSize(value);
  };

  // 重置配置
  const handleReset = async () => {
    try {
      const defaultConfig: AppConfig = {
        theme: 'light',
        language: 'zh-CN',
        primaryColor: '#1890ff',
        windowSize: 'standard',
      };
      
      await updateConfig(defaultConfig);
      setPrimaryColor('#1890ff');
      setWindowSize('standard');
      
      // 应用默认窗口尺寸
      await applyWindowSize('standard');
      
      message.success('设置已重置为默认值！');
    } catch (error) {
      log.error('重置配置失败:', error);
      message.error('重置设置失败！');
    }
  };

  return (
    <div>
      <Card>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Title level={4}>外观设置</Title>
              
              <Form.Item
                label="主题模式"
                name="theme"
                extra="选择应用的主题外观"
              >
                <Select>
                  <Option value="light">浅色主题</Option>
                  <Option value="dark">深色主题</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="主题色彩"
                extra="选择应用的主色调"
              >
                <Space>
                  <ColorPicker
                    value={primaryColor}
                    onChange={(color) => setPrimaryColor(color.toHexString())}
                    showText
                    presets={[
                      {
                        label: '推荐色彩',
                        colors: [
                          '#1890ff', // 蓝色
                          '#52c41a', // 绿色
                          '#fa541c', // 红色
                          '#faad14', // 黄色
                          '#722ed1', // 紫色
                          '#13c2c2', // 青色
                          '#eb2f96', // 品红
                        ],
                      },
                    ]}
                  />
                  <Button
                    size="small"
                    onClick={() => setPrimaryColor('#1890ff')}
                  >
                    重置默认
                  </Button>
                </Space>
              </Form.Item>

              <Form.Item
                label="语言设置"
                name="language"
                extra="选择应用的显示语言"
              >
                <Select>
                  <Option value="zh-CN">简体中文</Option>
                  <Option value="en-US">English</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Title level={4}>窗口设置</Title>
              
              <Form.Item
                label="窗口尺寸"
                extra="选择应用的默认窗口大小"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio.Group 
                    value={windowSize} 
                    onChange={(e) => handleWindowSizeChange(e.target.value)}
                    buttonStyle="solid"
                  >
                    {WINDOW_SIZE_OPTIONS.map(option => (
                      <Radio.Button key={option.value} value={option.value}>
                        {option.label} ({option.description})
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                  
                  {windowSize === 'custom' && (
                    <Space style={{ marginTop: 8 }}>
                      <span>宽度:</span>
                      <InputNumber
                        min={800}
                        max={3840}
                        value={customSize.width}
                        onChange={(value) => setCustomSize({ ...customSize, width: value || 1200 })}
                        style={{ width: 100 }}
                      />
                      <span>高度:</span>
                      <InputNumber
                        min={600}
                        max={2160}
                        value={customSize.height}
                        onChange={(value) => setCustomSize({ ...customSize, height: value || 800 })}
                        style={{ width: 100 }}
                      />
                    </Space>
                  )}
                </Space>
              </Form.Item>

              <Divider />

              <Form.Item>
                <Space>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                  >
                    保存设置
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={handleReset}
                  >
                    重置为默认
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="关于应用" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <strong>应用名称：</strong>MyTools
                </div>
                <div>
                  <strong>版本：</strong>1.0.0
                </div>
                <div>
                  <strong>技术栈：</strong>
                  <ul style={{ marginTop: 8, marginBottom: 0 }}>
                    <li>Tauri 2.x</li>
                    <li>React 18</li>
                    <li>TypeScript</li>
                    <li>Ant Design 5.x</li>
                    <li>SQLite</li>
                  </ul>
                </div>
              </Space>
            </Card>

            <Card title="数据存储" size="small" style={{ marginTop: 16 }}>
              <Paragraph style={{ fontSize: 12, margin: 0 }}>
                <strong>数据库文件：</strong><br />
                <Text copyable style={{ fontSize: 11, wordBreak: 'break-all' }}>
                  {dbPath || '加载中...'}
                </Text>
              </Paragraph>
              <Paragraph style={{ fontSize: 12, margin: '8px 0 0 0', color: token.colorTextSecondary }}>
                <strong>表结构：</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                  <li>schema_version - 数据库版本控制</li>
                  <li>app_config - 应用配置（key-value）</li>
                  <li>git_repositories - Git 仓库配置</li>
                </ul>
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Settings;
