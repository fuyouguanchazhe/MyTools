# MyTools

一个基于 **Tauri 2.x + React 18 + Ant Design 5.x** 构建的跨平台桌面工具包，为开发者提供常用的实用工具。

## ✨ 特性

- 🚀 **轻量高效**: 基于 Tauri 2.x，体积小，性能优异
- ⚡ **现代技术栈**: React 18 + TypeScript + Vite + Ant Design 5.x
- 💾 **本地存储**: SQLite 数据库 + 键值对存储，数据完全本地化
- 🔒 **隐私保护**: 所有数据存储在本地，不会上传到云端
- 📱 **跨平台**: 支持 macOS (ARM64/Intel) 和 Windows x64
- 🎨 **美观界面**: 基于 Ant Design 的现代化 UI 设计
- 🌓 **主题切换**: 支持明暗主题切换和自定义主色调

## 🛠️ 内置工具

### 核心功能

1. **URL 编解码器**
   - URL 编码/解码
   - Base64 编码/解码
   - 输入输出一键交换
   - 支持批量处理

2. **JSON 格式化器**
   - JSON 数据格式化和压缩
   - 语法错误检测和智能提示
   - JSON 统计信息（键数量、层级深度）
   - 可配置缩进大小

3. **时间戳转换器**
   - 时间戳与日期时间相互转换
   - 支持秒级和毫秒级时间戳
   - 实时显示当前时间
   - 智能时间戳格式识别

4. **Git 批量操作工具**
   - 批量管理多个 Git 仓库
   - 支持分支切换、合并、推送
   - 标签创建和推送
   - 仓库配置持久化存储

5. **设置中心**
   - 明暗主题切换
   - 自定义主色调
   - 窗口尺寸配置
   - 配置导入导出

---

## 🚀 快速开始

### 环境要求

#### 通用要求
| 工具 | 版本 | 说明 |
|------|------|------|
| Node.js | 18.0+ | 推荐使用 LTS 版本 |
| npm | 9.0+ | 或 yarn/pnpm |
| Git | 2.0+ | 版本控制 |

#### macOS 额外要求
| 工具 | 版本 | 说明 |
|------|------|------|
| Xcode Command Line Tools | 最新 | `xcode-select --install` |
| Rust | 1.70+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` |

#### Windows 额外要求
| 工具 | 版本 | 说明 |
|------|------|------|
| Microsoft Visual Studio C++ Build Tools | 最新 | [下载地址](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| WebView2 | 最新 | Windows 10/11 已预装 |
| Rust | 1.70+ | [下载地址](https://rustup.rs/) |

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd MyTools

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run dev:tauri
```

### 可用脚本

```bash
# 开发
npm run dev              # 启动前端开发服务器 (仅前端)
npm run dev:tauri        # 启动 Tauri 开发模式 (推荐)

# 构建
npm run build            # 构建前端
npm run build:tauri      # 构建完整应用 (生产版本)
npm run build:local      # 本地构建 (macOS ARM64)
npm run build:all        # 跨平台构建 (macOS + Windows)

# 其他
npm run clean            # 清理构建缓存
npm run test             # 运行测试
```

---

## 📦 构建和打包

### macOS 构建

**前置条件**：
- macOS 10.15+ (Catalina) 或更高版本
- Xcode Command Line Tools
- 已安装 Rust 和 Node.js

```bash
# 开发构建
npm run dev:tauri

# 生产构建
npm run build:tauri
```

**构建产物**：
- **App**: `src-tauri/target/release/bundle/macos/MyTools.app`
- **DMG**: `src-tauri/target/release/bundle/dmg/MyTools_0.1.0_aarch64.dmg`

### Windows 构建

**前置条件**：
- Windows 10/11
- Microsoft Visual Studio C++ Build Tools (含 "Desktop development with C++" 工作负载)
- WebView2 运行时 (Windows 10/11 已预装)
- 已安装 Rust 和 Node.js

```bash
# 在 Windows 上执行
npm install
npm run build:tauri
```

**构建产物**：
- **MSI 安装包**: `src-tauri/target/release/bundle/msi/MyTools_0.1.0_x64.msi`
- **NSIS 安装包**: `src-tauri/target/release/bundle/nsis/MyTools_0.1.0_x64-setup.exe`

### 跨平台构建说明

> ⚠️ **重要**: Tauri **不支持交叉编译**，必须在目标平台上构建。

| 目标平台 | 构建环境 | 说明 |
|---------|---------|------|
| macOS | macOS 机器 | 支持 ARM64 (M1/M2) 和 x64 (Intel) |
| Windows | Windows 机器或虚拟机 | 仅支持 x64 |

**推荐方案**：

1. **GitHub Actions** (推荐)
   - 免费自动化构建
   - 同时生成 macOS 和 Windows 安装包
   - 详见 `.github/workflows/build.yml`

2. **虚拟机**
   - Parallels Desktop (macOS 上运行 Windows)
   - VMware Fusion / VirtualBox

3. **云主机**
   - AWS EC2 / Azure VM / 阿里云 ECS (Windows)

---

## 📁 项目结构

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
│   │   ├── GitBatchTool/     # Git批量操作
│   │   └── Settings.tsx      # 设置页面
│   ├── hooks/                # React Hooks
│   ├── utils/                # 工具函数
│   ├── types/                # TypeScript 类型定义
│   └── App.tsx               # 应用主组件
├── src-tauri/                # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs           # Tauri 主入口
│   │   └── lib.rs            # 库文件和命令
│   ├── Cargo.toml            # Rust 依赖配置
│   ├── tauri.conf.json       # Tauri 应用配置
│   └── icons/                # 应用图标资源
├── .github/workflows/        # GitHub Actions CI/CD
├── public/                   # 静态资源
├── scripts/                  # 构建脚本
└── dist/                     # 前端构建输出
```

---

## 💾 数据存储

### 存储位置

| 平台 | 数据库路径 |
|------|-----------|
| **macOS** | `~/Library/Application Support/com.virus.mytools/` |
| **Windows** | `%APPDATA%\com.virus.mytools\` |
| **Linux** | `~/.config/com.virus.mytools/` |

### 存储内容

| 文件 | 用途 |
|------|------|
| `mytools.db` | SQLite 数据库（仓库配置、用户数据） |
| `config.dat` | 应用配置（主题、偏好设置） |
| `.key` | 加密密钥（用于密码加密） |

### 数据安全

- **本地加密**: Git 仓库密码使用设备唯一密钥加密存储
- **不联网**: 所有数据完全本地化，无网络传输
- **用户控制**: 用户可随时删除数据文件

---

## 🔧 技术栈

| 组件 | 版本 | 用途 |
|------|------|------|
| **前端框架** |
| React | ^18.3.1 | UI 框架 |
| TypeScript | ~5.6.3 | 类型系统 |
| Ant Design | ^5.20.6 | UI 组件库 |
| React Router | ^6.26.2 | 前端路由 |
| Day.js | ^1.11.18 | 时间处理 |
| **构建工具** |
| Vite | ^5.4.8 | 前端构建工具 |
| Tauri CLI | ^2 | 应用构建工具 |
| **后端框架** |
| Tauri | ^2.8.4 | 桌面应用框架 |
| Rust | 1.70+ | 后端语言 |
| **插件系统** |
| tauri-plugin-sql | ^2.3.0 | SQLite 数据库 |
| tauri-plugin-dialog | ^2.3.3 | 文件对话框 |
| tauri-plugin-fs | ^2.4.2 | 文件系统 |
| tauri-plugin-opener | ^2.5.0 | 系统交互 |

---

## 🎯 开发指南

### 添加新工具页面

1. 在 `src/pages/` 创建新的页面组件
2. 在 `src/components/Sidebar.tsx` 添加菜单项
3. 在 `src/App.tsx` 添加路由配置
4. 如需后端支持，在 `src-tauri/src/lib.rs` 添加 Tauri 命令

### 代码风格

- **TypeScript**: 严格模式，避免使用 `any`
- **React**: 函数组件 + Hooks
- **命名**: 组件使用 PascalCase，函数使用 camelCase
- **注释**: 使用中文注释说明业务逻辑

### Git 提交规范

```
feat: 添加新功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

---

## 🐛 常见问题

### 构建失败

**问题**: Rust 编译错误
```bash
# 解决方案：更新 Rust 工具链
rustup update stable
```

**问题**: 找不到 cargo 命令
```bash
# 解决方案：确保 Rust 已安装并添加到 PATH
# macOS/Linux
source $HOME/.cargo/env

# Windows: 重启终端或重新安装 Rust
```

### 运行时问题

**问题**: 数据库路径不存在
- Tauri 会自动创建数据目录，首次运行可能需要几秒钟

**问题**: Windows 上 WebView2 缺失
- 下载并安装 [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目：

- [Tauri](https://tauri.app/) - 出色的桌面应用框架
- [React](https://reactjs.org/) - 强大的前端框架  
- [Ant Design](https://ant.design/) - 优秀的 UI 组件库
- [Vite](https://vitejs.dev/) - 快速的构建工具

---

**MyTools** - 让开发更高效 🚀
