# MyTools - 开发指南

## 项目概述

MyTools 是一个基于 **Tauri 2.x + React 18 + Ant Design 5.x** 构建的跨平台桌面工具包，为开发者提供常用实用工具（URL编解码、JSON格式化、时间戳转换、Git批量操作等）。

**技术栈**: React 18 + TypeScript 5.6 + Vite 5 + Ant Design 5.20 + Tauri 2 + Rust

---

## 构建和运行命令

### 开发环境

```bash
# 安装依赖
npm install

# 启动前端开发服务器 (仅前端)
npm run dev

# 启动 Tauri 开发模式 (前端 + Rust 后端，推荐)
npm run dev:tauri
```

### 构建命令

```bash
# 构建前端
npm run build

# 构建完整应用 (生产版本)
npm run build:tauri

# 本地构建 (macOS ARM64)
npm run build:local

# 跨平台构建 (macOS + Windows)
npm run build:all

# 清理构建缓存
npm run clean
```

### 跨平台构建说明

> **重要**: Tauri 不支持交叉编译，必须在目标平台上构建。

| 目标平台 | 构建环境 | 输出格式 |
|---------|---------|---------|
| macOS ARM64 | macOS (Apple Silicon) | `.app`, `.dmg` |
| macOS x64 | macOS (Intel) | `.app`, `.dmg` |
| Windows x64 | Windows | `.exe`, `.msi` |

**本地构建** (当前平台):
```bash
npm run build:tauri
```

**自动化跨平台构建** (推荐):
- 使用 GitHub Actions 自动构建 macOS 和 Windows 版本
- 配置文件: `.github/workflows/build.yml`
- 推送标签触发: `git tag v0.1.0 && git push origin v0.1.0`
- 手动触发: GitHub → Actions → Build Release → Run workflow

**构建产物位置**:
- macOS: `src-tauri/target/release/bundle/macos/MyTools.app`
- macOS DMG: `src-tauri/target/release/bundle/dmg/MyTools_0.1.0_aarch64.dmg`
- Windows MSI: `src-tauri/target/release/bundle/msi/MyTools_0.1.0_x64.msi`
- Windows NSIS: `src-tauri/target/release/bundle/nsis/MyTools_0.1.0_x64-setup.exe`

### 测试命令

```bash
# 运行 Rust 后端测试
cd src-tauri
cargo test

# 运行单个测试
cargo test test_function_name

# 运行测试并显示输出
cargo test -- --nocapture
```

> **注意**: 前端目前没有配置测试框架。如需添加，推荐使用 Vitest。

### 代码检查

```bash
# TypeScript 类型检查
npx tsc --noEmit

# Rust 代码检查
cd src-tauri
cargo clippy
cargo check
```

---

## 项目结构

```
MyTools/
├── src/                      # React 前端代码
│   ├── components/           # 可复用组件
│   │   ├── Layout.tsx        # 主布局组件
│   │   └── Sidebar.tsx       # 侧边栏导航
│   ├── pages/                # 功能页面
│   │   ├── Home.tsx          # 主页
│   │   ├── UrlEncoder.tsx    # URL编解码
│   │   ├── JsonFormatter.tsx # JSON格式化
│   │   ├── TimestampConverter.tsx
│   │   ├── SnippetManager.tsx
│   │   ├── GitBatchTool.tsx
│   │   └── Settings.tsx
│   ├── types/                # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx               # 应用主组件
│   └── main.tsx              # React 入口
├── src-tauri/                # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs           # Tauri 主入口
│   │   └── lib.rs            # 库文件和 Tauri 命令
│   ├── Cargo.toml            # Rust 依赖配置
│   └── tauri.conf.json       # Tauri 应用配置
├── public/                   # 静态资源
├── scripts/                  # 构建脚本
└── package.json              # Node.js 依赖和脚本
```

---

## 代码风格指南

### 1. TypeScript/React 代码规范

#### 导入顺序

```tsx
// 1. React 相关
import React, { useState, useEffect } from 'react';

// 2. 第三方库 (react-router-dom, antd, dayjs)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Card, Button, message } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

// 3. Tauri APIs
import { Store } from '@tauri-apps/plugin-store';
import Database from '@tauri-apps/plugin-sql';

// 4. 本地导入 (类型、组件)
import { AppConfig } from './types';
import Layout from './components/Layout';

// 5. CSS 导入 (最后)
import './App.css';
```

#### 组件结构

```tsx
// 函数组件，使用 React.FC 类型
const ComponentName: React.FC = () => {
  // 1. State 声明
  const [state, setState] = useState<string>('');
  
  // 2. Effects
  useEffect(() => {
    // 副作用逻辑
  }, []);
  
  // 3. 事件处理函数
  const handleClick = () => {
    // 处理逻辑
  };
  
  // 4. 辅助函数
  const helperFunction = () => {
    // 辅助逻辑
  };
  
  // 5. 渲染
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

#### 类型定义

```tsx
// 使用 interface 定义数据结构 (不使用 type)
export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;  // 可选属性用 ?
  path: string;
}

// 组件 Props 类型
interface ComponentProps {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}

// 枚举类型 (如果需要)
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}
```

#### 命名约定

- **组件**: PascalCase (例如 `UrlEncoder`, `JsonFormatter`)
- **函数/方法**: camelCase (例如 `handleEncode`, `copyToClipboard`)
- **常量**: SCREAMING_SNAKE_CASE (例如 `API_BASE_URL`)
- **文件名**: 
  - 组件: PascalCase (例如 `Home.tsx`)
  - 工具函数: camelCase (例如 `helpers.ts`)
- **CSS 类**: kebab-case (例如 `.card-container`)

#### 错误处理

```tsx
// 使用 try-catch 包裹异步操作
const handleAsyncOperation = async () => {
  try {
    const result = await someAsyncFunction();
    message.success('操作成功！');
  } catch (error) {
    console.error('操作失败:', error);
    message.error('操作失败！请重试。');
  }
};

// Rust 后端返回 Result<T, String>
// 前端需要处理可能的错误
const result = await invoke<string>('some_command');
if (typeof result === 'string' && result.startsWith('Error:')) {
  // 处理错误
}
```

#### 格式化

- **缩进**: 2 空格
- **引号**: 优先使用单引号，JSX 属性使用双引号
- **分号**: 可选 (保持一致性即可)
- **尾随逗号**: 多行数组和对象使用尾随逗号
- **最大行宽**: 100 字符

```tsx
// ✅ 好的示例
const config = {
  theme: 'light',
  language: 'zh-CN',
  primaryColor: '#1890ff',
};

const items = [
  'item1',
  'item2',
  'item3',
];
```

### 2. Rust 代码规范

#### 错误处理

```rust
// 使用 thiserror 定义自定义错误类型
#[derive(Debug, Error)]
pub enum GitOperationError {
    #[error("Git仓库错误: {0}")]
    GitError(#[from] git2::Error),
    
    #[error("仓库路径不存在: {path}")]
    PathNotExists { path: String },
}

// Tauri 命令返回 Result<T, String>
#[tauri::command]
fn some_command() -> Result<String, String> {
    // 业务逻辑
    Ok("Success".to_string())
}
```

#### 代码组织

```rust
// 使用注释分隔符组织代码
// ======== 错误类型定义 ========
// ======== 数据结构定义 ========
// ======== Tauri命令 ========
// ======== 单元测试 ========
```

#### 日志记录

```rust
use log::{info, error};

info!("开始执行操作: {}", operation);
error!("操作失败: {}", error);
```

---

## 开发最佳实践

### 添加新工具页面

1. 在 `src/pages/` 创建新的页面组件 (例如 `NewTool.tsx`)
2. 在 `src/types/index.ts` 添加相关类型定义
3. 在 `src/components/Sidebar.tsx` 添加菜单项
4. 在 `src/App.tsx` 添加路由配置:
   ```tsx
   <Route path="new-tool" element={<NewTool />} />
   ```
5. 如需后端支持，在 `src-tauri/src/lib.rs` 添加 Tauri 命令

### 数据存储

**SQLite 数据库** (结构化数据):
```tsx
import Database from '@tauri-apps/plugin-sql';

const db = await Database.load('sqlite:data.db');
await db.execute('CREATE TABLE IF NOT EXISTS ...');
const results = await db.select('SELECT * FROM table');
```

**键值存储** (配置数据):
```tsx
import { Store } from '@tauri-apps/plugin-store';

const store = await Store.load('config.dat');
await store.set('key', value);
await store.save();
const value = await store.get('key');
```

### Ant Design 使用

- 优先使用 Ant Design 组件
- 使用 `message` API 显示操作反馈
- 使用 `theme.useToken()` 获取主题 token (颜色、间距等)
- 表单使用 Ant Design Form 组件

### Git 操作

- **禁止 force push** 到 main/master 分支
- 提交信息格式: `type: 描述` (例如 `feat: 添加新工具`, `fix: 修复Bug`)
- 保持 `core.filemode = false` 以避免 macOS 文件权限噪音

---

## 测试

### Rust 测试

```bash
# 运行所有测试
cd src-tauri && cargo test

# 运行单个测试
cargo test test_function_name

# 运行测试并显示 println! 输出
cargo test -- --nocapture

# 运行特定模块的测试
cargo test module_name::
```

### 前端测试 (推荐 Vitest)

如需添加前端测试:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

创建 `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
});
```

---

## 调试技巧

### 前端调试

- 使用浏览器开发者工具
- `console.log()` / `console.error()` 输出调试信息
- React DevTools 检查组件状态

### Rust 调试

- 使用 `log::info!()` / `log::error!()` 记录日志
- 运行 `cargo test -- --nocapture` 查看测试输出
- 使用 `RUST_BACKTRACE=1` 获取详细错误堆栈

### Tauri 调试

- 开发模式下使用 `npm run dev:tauri`
- 检查 Tauri 控制台输出
- 使用 `tauri.conf.json` 中的 `devUrl` 配置

---

## 性能优化

- 使用 React.memo 避免不必要的重新渲染
- 使用 useCallback 和 useMemo 优化回调函数和计算
- 大列表使用虚拟滚动 (Ant Design List 组件)
- 图片压缩后再存储或传输
- Rust 后端处理 CPU 密集型任务

---

## 注意事项

1. **数据安全**: 所有数据本地存储，不上传云端
2. **类型安全**: TypeScript strict 模式已启用，避免使用 `any`
3. **错误处理**: 所有异步操作必须使用 try-catch
4. **代码质量**: 保持函数简短 (通常不超过 50 行)
5. **注释**: 使用中文注释说明业务逻辑，代码本身应自文档化
6. **Git**: 确保 `core.filemode = false` 避免文件权限噪音

---

## 敏感信息处理规范 (重要！)

### 1. 禁止硬编码敏感信息

**❌ 禁止事项**:
- 硬编码 API Keys、密码、Token
- 硬编码特定用户的文件路径
- 在测试代码中使用真实路径

**✅ 正确做法**:
- 使用环境变量或配置文件
- 使用 Tauri API 动态获取路径
- 测试代码使用临时目录

### 2. 跨平台路径处理

**❌ 错误示例** (macOS 专用):
```rust
let home = std::env::var("HOME").unwrap_or_else(|_| "/Users/".to_string());
```

**✅ 正确示例** (跨平台):
```rust
let home = dirs::home_dir()
    .map(|p| p.to_string_lossy().to_string())
    .unwrap_or_else(|| ".".to_string());
```

### 3. 加密模块使用

项目使用设备唯一密钥加密敏感数据（如 Git 密码）。

**初始化** (应用启动时调用):
```tsx
import { initCrypto } from './utils/crypto';

// 在 App.tsx 或入口文件中
useEffect(() => {
  initCrypto();
}, []);
```

**加密/解密**:
```tsx
import { encrypt, decrypt } from './utils/crypto';

// 加密
const encryptedPassword = encrypt(password);

// 解密
const password = decrypt(encryptedPassword);
```

**密钥存储位置**:
- macOS: `~/Library/Application Support/com.virus.mytools/.key`
- Windows: `%APPDATA%\com.virus.mytools\.key`

### 4. 数据库路径获取

**❌ 错误做法** (硬编码路径):
```tsx
const dbPath = '~/Library/Application Support/com.virus.mytools/mytools.db';
```

**✅ 正确做法** (动态获取):
```tsx
import { appDataDir } from '@tauri-apps/api/path';

const dataDir = await appDataDir();
const dbPath = dataDir + 'mytools.db';
```

### 5. 敏感信息审计清单

在提交代码前，检查以下内容：

- [ ] 无硬编码的 API Keys / Tokens / 密码
- [ ] 无硬编码的用户特定路径（如 `/Users/xxx/`）
- [ ] 测试代码使用临时目录而非真实路径
- [ ] 加密密钥使用动态生成而非固定值
- [ ] 数据库路径通过 Tauri API 获取

---

## 数据库开发约束 (重要！)

> **血泪教训**: 以下是实际踩坑总结的约束，必须严格遵守！

### 1. 数据库调试工作流

**❌ 错误做法**: 看到报错就改代码，反复尝试
**✅ 正确做法**: 先诊断，再一次性修复

```bash
# 第一步：找到实际的数据库文件
# 开发环境: ~/Library/Application Support/com.virus.mytools.dev/
# 生产环境: ~/Library/Application Support/com.virus.mytools/

# 第二步：检查表结构
sqlite3 ~/Library/Application\ Support/com.virus.mytools.dev/mytools.db "
  .tables
  PRAGMA table_info(git_repositories);
  SELECT * FROM git_repositories LIMIT 3;
"

# 第三步：列出所有问题，一次性修复
```

### 2. Tauri SQL 插件限制

| 功能 | 是否支持 | 替代方案 |
|------|---------|---------|
| `RETURNING` 子句 | ❌ 不支持 | 使用 `SELECT last_insert_rowid()` |
| `last_insert_rowid()` | ⚠️ 仅对 `INTEGER PRIMARY KEY AUTOINCREMENT` 有效 | 确保 id 列是整数自增主键 |
| 批量 SQL 语句 | ❌ 不支持 | 逐条执行 `db.execute()` |
| `BEGIN TRANSACTION` | ❌ 不支持 | 依赖 SQLite 自动事务 |

**错误示例**:
```tsx
// ❌ 错误：RETURNING 不支持
const result = await db.select(
  `INSERT INTO table (name) VALUES ($1) RETURNING id`,
  ['test']
);

// ❌ 错误：id 是 TEXT 类型，last_insert_rowid() 返回 0
CREATE TABLE git_repositories (
  id TEXT PRIMARY KEY,  // 应该是 INTEGER PRIMARY KEY AUTOINCREMENT
  ...
);
```

**正确示例**:
```tsx
// ✅ 正确：分两步获取 ID
await db.execute(`INSERT INTO table (name) VALUES ($1)`, ['test']);
const result = await db.select<{ id: number }[]>(
  'SELECT last_insert_rowid() as id'
);

// ✅ 正确：表结构定义
CREATE TABLE git_repositories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 必须是整数自增
  path TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 开发环境与生产环境差异

| 环境 | 数据库路径 (macOS) | 数据库路径 (Windows) | 标识符 |
|------|-------------------|---------------------|--------|
| 开发环境 | `~/Library/Application Support/com.virus.mytools.dev/` | `%APPDATA%\com.virus.mytools.dev\` | `.dev` 后缀 |
| 生产环境 | `~/Library/Application Support/com.virus.mytools/` | `%APPDATA%\com.virus.mytools\` | 无后缀 |

**调试时务必检查正确的目录！**

**跨平台路径获取**:
```tsx
import { appDataDir } from '@tauri-apps/api/path';

// 动态获取当前平台的数据目录
const dataDir = await appDataDir();
console.log('数据库路径:', dataDir + 'mytools.db');
```

### 4. 数据库迁移检查清单

在修改数据库结构前，必须检查：

- [ ] 确认实际的数据库路径（开发 vs 生产）
- [ ] 检查现有表结构 `PRAGMA table_info(table_name)`
- [ ] 检查现有数据 `SELECT * FROM table LIMIT 5`
- [ ] 确认 id 列是 `INTEGER PRIMARY KEY AUTOINCREMENT`
- [ ] 确认时间戳列有默认值 `DEFAULT CURRENT_TIMESTAMP`
- [ ] 测试：保存数据 → 重启应用 → 验证数据存在

### 5. 常见错误速查表

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `no such column: xxx` | 表缺少列 | `ALTER TABLE ADD COLUMN xxx` |
| `UNIQUE constraint failed` | 软删除后路径仍唯一 | 改用硬删除 `DELETE FROM` |
| `result[0].id.toString()` null | RETURNING 不支持 | 改用 `last_insert_rowid()` |
| `last_insert_rowid()` 返回 0 | id 是 TEXT 类型 | 重建表，id 改为 INTEGER |
| 重启后数据丢失 | id 列为空 | 修复表结构，确保 id 自增 |

---

## 相关资源

- [Tauri 2.x 文档](https://v2.tauri.app/)
- [React 18 文档](https://react.dev/)
- [Ant Design 5.x 文档](https://ant.design/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Rust 程序设计语言](https://doc.rust-lang.org/book/)
- [SQLite 语法参考](https://www.sqlite.org/lang.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

---

## 环境配置速查

### macOS 环境配置

```bash
# 1. 安装 Xcode Command Line Tools
xcode-select --install

# 2. 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 3. 安装 Node.js (推荐使用 nvm)
brew install nvm
nvm install 20
nvm use 20

# 4. 验证安装
node --version   # v20.x.x
npm --version    # 10.x.x
rustc --version  # 1.7x.x
cargo --version  # 1.7x.x
```

### Windows 环境配置

```powershell
# 1. 安装 Visual Studio Build Tools
# 下载地址: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# 选择 "Desktop development with C++" 工作负载

# 2. 安装 Rust
# 下载地址: https://rustup.rs/
# 运行 rustup-init.exe

# 3. 安装 Node.js
# 下载地址: https://nodejs.org/
# 选择 LTS 版本

# 4. 验证安装 (重启终端后)
node --version
npm --version
rustc --version
cargo --version
```

### 常见构建问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| `cargo not found` | Rust 未安装或未添加到 PATH | 安装 Rust 并重启终端 |
| `linker 'link.exe' not found` | Windows 缺少 Build Tools | 安装 VS Build Tools |
| `WebView2 not found` | Windows 缺少 WebView2 | 安装 WebView2 Runtime |
| `xcrun: error` | macOS 缺少 Xcode Tools | 运行 `xcode-select --install` |
| 构建超时 | 网络问题或依赖过多 | 使用国内镜像或增加超时时间 |
