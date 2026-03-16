import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Row, Col, DatePicker, Space, message, Typography, theme } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useClipboard } from '../hooks/useClipboard';

const { Text } = Typography;

const TimestampConverter: React.FC = () => {
  const { token } = theme.useToken();
  const [timestamp, setTimestamp] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const { copy } = useClipboard();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const convertFromTimestamp = () => {
    try {
      const ts = parseInt(timestamp);
      if (isNaN(ts)) {
        message.error('请输入有效的时间戳！');
        return;
      }
      
      // 判断是秒还是毫秒
      const timestampMs = ts.toString().length === 10 ? ts * 1000 : ts;
      const date = dayjs(timestampMs);
      
      if (!date.isValid()) {
        message.error('无效的时间戳！');
        return;
      }
      
      setSelectedDate(date);
      message.success('时间戳转换成功！');
    } catch (err) {
      message.error('转换失败！');
    }
  };

  const convertToTimestamp = () => {
    const ts = selectedDate.valueOf();
    setTimestamp(ts.toString());
    message.success('日期转换成功！');
  };

  const setCurrentTime = () => {
    setSelectedDate(dayjs());
    setTimestamp(Date.now().toString());
  };

  return (
    <div>
      <Card>
        <Row gutter={[16, 16]}>
          {/* 当前时间显示 */}
          <Col span={24}>
            <Card title="当前时间" size="small" style={{ backgroundColor: token.colorSuccessBg }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Row>
                  <Col span={12}>
                    <Text strong>当前时间戳（毫秒）：</Text>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Text code>{currentTimestamp}</Text>
                      <Button 
                        size="small" 
                        icon={<CopyOutlined />}
                        onClick={() => copy(currentTimestamp.toString())}
                      />
                    </Space>
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <Text strong>当前时间戳（秒）：</Text>
                  </Col>
                  <Col span={12}>
                    <Space>
                      <Text code>{Math.floor(currentTimestamp / 1000)}</Text>
                      <Button 
                        size="small" 
                        icon={<CopyOutlined />}
                        onClick={() => copy(Math.floor(currentTimestamp / 1000).toString())}
                      />
                    </Space>
                  </Col>
                </Row>
                <Row>
                  <Col span={12}>
                    <Text strong>当前日期时间：</Text>
                  </Col>
                  <Col span={12}>
                    <Text code>{dayjs(currentTimestamp).format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>

          {/* 时间戳转日期 */}
          <Col span={12}>
            <Card title="时间戳转日期" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="请输入时间戳（支持秒和毫秒）"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                />
                <Button type="primary" onClick={convertFromTimestamp} block>
                  转换为日期
                </Button>
                {selectedDate && (
                  <div>
                    <Text strong>转换结果：</Text>
                    <br />
                    <Text code>{selectedDate.format('YYYY-MM-DD HH:mm:ss')}</Text>
                  </div>
                )}
              </Space>
            </Card>
          </Col>

          {/* 日期转时间戳 */}
          <Col span={12}>
            <Card title="日期转时间戳" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <DatePicker
                  showTime
                  value={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm:ss"
                />
                <Space style={{ width: '100%' }}>
                  <Button type="primary" onClick={convertToTimestamp}>
                    转换为时间戳
                  </Button>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={setCurrentTime}
                  >
                    设为当前时间
                  </Button>
                </Space>
                {timestamp && (
                  <div>
                    <Text strong>毫秒时间戳：</Text>
                    <br />
                    <Space>
                      <Text code>{timestamp}</Text>
                      <Button 
                        size="small" 
                        icon={<CopyOutlined />}
                        onClick={() => copy(timestamp)}
                      />
                    </Space>
                    <br />
                    <Text strong>秒时间戳：</Text>
                    <br />
                    <Space>
                      <Text code>{Math.floor(parseInt(timestamp) / 1000)}</Text>
                      <Button 
                        size="small" 
                        icon={<CopyOutlined />}
                        onClick={() => copy(Math.floor(parseInt(timestamp) / 1000).toString())}
                      />
                    </Space>
                  </div>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default TimestampConverter;
