import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme, Spin, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { AppProvider, useAppConfig } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import UrlEncoder from './pages/UrlEncoder';
import JsonFormatter from './pages/JsonFormatter';
import TimestampConverter from './pages/TimestampConverter';
import GitBatchTool from './pages/GitBatchTool';
import Settings from './pages/Settings';
import './App.css';

/**
 * 应用内容组件
 * 在 AppProvider 内部，可以使用 useAppConfig Hook
 */
function AppContent() {
  const { config, loading, error } = useAppConfig();
  const { token } = theme.useToken();

  // 加载中显示 Loading
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin size="large" tip="加载配置中..." />
      </div>
    );
  }

  // 加载失败显示错误
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ color: token.colorErrorText }}>配置加载失败: {error}</div>
        <div style={{ color: token.colorTextSecondary }}>应用将使用默认配置运行</div>
      </div>
    );
  }

  // 获取语言包
  const getLocale = () => {
    return config.language === 'en-US' ? enUS : zhCN;
  };

  // 获取主题算法
  const getThemeAlgorithm = () => {
    return config.theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;
  };

  return (
    <ConfigProvider
      locale={getLocale()}
      theme={{
        algorithm: getThemeAlgorithm(),
        token: {
          colorPrimary: config.primaryColor || '#1890ff',
        },
      }}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="url-encoder" element={<UrlEncoder />} />
            <Route path="json-formatter" element={<JsonFormatter />} />
            <Route path="timestamp-converter" element={<TimestampConverter />} />
            <Route path="git-batch-tool" element={<GitBatchTool />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

/**
 * 应用主组件
 * 包裹 AppProvider，提供全局配置管理
 */
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
