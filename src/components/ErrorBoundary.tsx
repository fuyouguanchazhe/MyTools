import { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { createLogger } from '../utils/logger';

const log = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的 JavaScript 错误，记录错误并显示降级 UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新 state 以便下一次渲染显示降级 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误信息
    log.error('=== Error Boundary Caught an Error ===');
    log.error('Error:', error.toString());
    log.error('Error Stack:', error.stack);
    log.error('Component Stack:', errorInfo.componentStack);
    log.error('====================================');

    // 保存错误信息到 state
    this.setState({
      error,
      errorInfo,
    });

    // TODO: 可以在这里添加错误上报逻辑
    // 例如：发送到日志服务或错误追踪平台
  }

  handleReload = (): void => {
    // 重新加载应用
    window.location.reload();
  };

  handleReset = (): void => {
    // 重置错误状态，尝试恢复
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '24px',
            background: 'var(--ant-color-bg-layout, #f0f2f5)',
          }}
        >
          <Result
            status="error"
            title="应用程序遇到了问题"
            subTitle="抱歉，应用程序发生了意外错误。您可以尝试重新加载或重置应用。"
            extra={[
              <Button type="primary" key="reload" onClick={this.handleReload}>
                重新加载
              </Button>,
              <Button key="reset" onClick={this.handleReset}>
                重置应用
              </Button>,
            ]}
          >
            {/* 开发环境显示详细错误信息 */}
            {import.meta.env.DEV && error && (
              <div
                style={{
                  marginTop: '24px',
                  textAlign: 'left',
                  background: 'var(--ant-color-bg-container, #fff)',
                  padding: '16px',
                  borderRadius: '8px',
                  maxWidth: '800px',
                }}
              >
                <details style={{ whiteSpace: 'pre-wrap' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                    查看错误详情（仅开发环境可见）
                  </summary>
                  <div style={{ color: 'var(--ant-color-error, #ff4d4f)', fontSize: '12px' }}>
                    <p>
                      <strong>错误信息：</strong>
                    </p>
                    <p>{error.toString()}</p>
                    {error.stack && (
                      <>
                        <p style={{ marginTop: '12px' }}>
                          <strong>错误堆栈：</strong>
                        </p>
                        <div
                          style={{
                            background: 'var(--ant-color-bg-layout, #f5f5f5)',
                            padding: '12px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '400px',
                          }}
                        >
                          {error.stack}
                        </div>
                      </>
                    )}
                  </div>
                </details>
              </div>
            )}
          </Result>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
