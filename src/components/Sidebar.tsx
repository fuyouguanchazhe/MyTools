import React from 'react';
import { Menu, Layout, theme } from 'antd';
import {
  HomeOutlined,
  LinkOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  BranchesOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppConfig } from '../context/AppContext';
import { MenuItem } from '../types';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

// 导出菜单项供 Layout 使用
export const menuItems: MenuItem[] = [
  {
    key: 'home',
    label: '主页',
    icon: <HomeOutlined />,
    path: '/home',
  },
  {
    key: 'url-encoder',
    label: 'URL 编解码',
    icon: <LinkOutlined />,
    path: '/url-encoder',
  },
  {
    key: 'json-formatter',
    label: 'JSON 格式化器',
    icon: <CodeOutlined />,
    path: '/json-formatter',
  },
  {
    key: 'timestamp-converter',
    label: '时间戳转换器',
    icon: <ClockCircleOutlined />,
    path: '/timestamp-converter',
  },
  {
    key: 'git-batch-tool',
    label: 'Git 批处理',
    icon: <BranchesOutlined />,
    path: '/git-batch-tool',
  },
  {
    key: 'settings',
    label: '设置',
    icon: <SettingOutlined />,
    path: '/settings',
  },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useAppConfig();
  const { token } = theme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = menuItems.find(item => item.key === key);
    if (item) {
      navigate(item.path);
    }
  };

  const selectedKey = menuItems.find(item => item.path === location.pathname)?.key || 'home';
  
  // 根据用户配置决定主题
  const siderTheme = config.theme === 'dark' ? 'dark' : 'light';

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed}
      width={200}
      collapsedWidth={80}
      theme={siderTheme}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
        borderRight: `1px solid ${token.colorBorder}`,
        overflow: 'auto',
        zIndex: 100,
      }}
    >
      <div 
        style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          fontWeight: 'bold',
          fontSize: collapsed ? 16 : 18,
          color: token.colorPrimary,
        }}
      >
        MyTools
      </div>
      <Menu
        theme={siderTheme}
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
        items={menuItems.map(item => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
        }))}
      />
    </Sider>
  );
};

export default Sidebar;
