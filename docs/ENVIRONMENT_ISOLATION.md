# 环境配置隔离说明

## 概述

项目使用不同的 Tauri 配置文件来隔离开发环境和生产环境，确保数据和配置不互相影响。

## 配置文件

### 生产环境
- **配置文件**: `src-tauri/tauri.conf.json`
- **应用名称**: MyTools
- **标识符**: `com.virus.mytools`
- **数据目录**: `~/Library/Application Support/com.virus.mytools/`
- **构建命令**: `npm run build:tauri`

### 开发环境
- **配置文件**: `src-tauri/tauri.dev.conf.json`
- **应用名称**: MyTools Dev
- **标识符**: `com.virus.mytools.dev`
- **数据目录**: `~/Library/Application Support/com.virus.mytools.dev/`
- **开发命令**: `npm run dev:tauri`

## 使用方式

### 开发环境
```bash
# 启动开发环境（使用开发配置）
npm run dev:tauri

# 数据将存储在：
# ~/Library/Application Support/com.virus.mytools.dev/
#   ├── config.dev.dat
#   └── mytools-dev.db
```

### 生产环境
```bash
# 构建生产应用
npm run build:tauri

# 或使用本地构建脚本
npm run build:local

# 数据将存储在：
# ~/Library/Application Support/com.virus.mytools/
#   ├── config.dat
#   └── mytools.db
```

## 数据隔离效果

### 完全隔离
- ✅ 应用标识符不同（`com.virus.mytools.dev` vs `com.virus.mytools`）
- ✅ 应用名称不同（MyTools Dev vs MyTools）
- ✅ 数据目录完全分离
- ✅ 可以同时安装开发和生产版本
- ✅ 系统级隔离（缓存、权限、通知）

### 独立运行
```bash
# 可以同时运行两个版本进行对比测试
npm run dev:tauri          # 运行开发版本
open MyTools.app           # 运行生产版本
```

## 注意事项

1. **首次运行开发环境**会创建新的数据目录
2. **生产数据**不会影响开发环境
3. **开发数据**不会污染生产环境
4. **配置修改**在各自环境中独立生效

## 文件位置

```
src-tauri/
├── tauri.conf.json          # 生产环境配置
├── tauri.dev.conf.json      # 开发环境配置
└── ...
```

## 优势

- 🎯 符合行业标准（VSCode、Chrome 等都使用此方案）
- 🛡️ 保护生产数据不被开发 bug 破坏
- 🔄 可以同时运行两个版本进行测试
- 📦 系统级隔离更安全可靠
