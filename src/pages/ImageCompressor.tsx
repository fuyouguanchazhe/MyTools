import React from 'react';
import { Card, Result } from 'antd';
import { CompressOutlined } from '@ant-design/icons';

const ImageCompressor: React.FC = () => {
  return (
    <div>
      <Card title={<><CompressOutlined /> 图片压缩工具</>}>
        <Result
          status="info"
          title="图片压缩功能"
          subTitle="此功能正在开发中，敬请期待！"
          extra={
            <div style={{ textAlign: 'left', maxWidth: 600, margin: '0 auto' }}>
              <h4>计划功能：</h4>
              <ul>
                <li>支持 JPEG、PNG、WebP 等格式</li>
                <li>批量压缩处理</li>
                <li>自定义压缩质量</li>
                <li>尺寸调整功能</li>
                <li>格式转换</li>
              </ul>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default ImageCompressor;
