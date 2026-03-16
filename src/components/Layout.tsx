import React, { useState } from 'react';
import { Layout as AntdLayout, Button, theme } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar, { menuItems } from './Sidebar';

const { Header, Content } = AntdLayout;

// 侧边栏宽度常量
const SIDEBAR_WIDTH = 200;
const SIDEBAR_COLLAPSED_WIDTH = 80;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG, colorBorder, colorText },
  } = theme.useToken();

  // 获取当前页面的菜单项
  const currentItem = menuItems.find(item => item.path === location.pathname);

  return (
    <AntdLayout style={{ minHeight: '100vh' }}>
      {/* 固定侧边栏 */}
      <Sidebar collapsed={collapsed} />
      
      {/* 右侧布局：添加 margin-left 避免被侧边栏遮挡 */}
      <AntdLayout 
        style={{ 
          marginLeft: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          transition: 'margin-left 0.2s ease-in-out',
        }}
      >
        {/* Header 固定在顶部 */}
        <Header 
          style={{ 
            padding: 0,
            background: colorBgContainer,
            borderBottom: `1px solid ${colorBorder}`,
            display: 'flex',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            height: 64,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          {/* 显示当前页面标题 */}
          {currentItem && currentItem.key !== 'home' && (
            <div style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              marginLeft: 8,
              color: colorText,
            }}>
              {currentItem.label}
            </div>
          )}
        </Header>
        
        {/* Content 独立滚动 */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 64px - 48px)',
          }}
        >
          <Outlet />
        </Content>
      </AntdLayout>
    </AntdLayout>
  );
};

export default Layout;
