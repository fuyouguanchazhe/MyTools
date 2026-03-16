#!/bin/bash

# MyToolkit 多平台构建脚本
# 用于在 macOS 上构建 macOS 和 Windows 版本

echo "🚀 开始构建 MyToolkit 多平台版本..."
echo "⏰ $(date)"
echo ""

# 检查是否安装了必要的工具
echo "🔍 检查构建环境..."
if ! command -v npm &> /dev/null; then
    echo "❌ NPM 未安装"
    exit 1
fi

if ! command -v cargo &> /dev/null; then
    echo "❌ Rust Cargo 未安装"
    exit 1
fi

if ! command -v tauri &> /dev/null; then
    echo "❌ Tauri CLI 未安装，尝试安装..."
    npm install -g @tauri-apps/cli
fi

echo "✅ 构建环境检查完成"
echo ""

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf src-tauri/target/release/bundle
rm -rf dist
echo "✅ 清理完成"
echo ""

# 安装依赖
echo "📦 安装前端依赖..."
npm install
echo "✅ 前端依赖安装完成"
echo ""

# 构建前端
echo "🏗️  构建前端..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi
echo "✅ 前端构建完成"
echo ""

# 构建 macOS 版本
echo "🍎 构建 macOS 版本..."
npm run tauri build
if [ $? -ne 0 ]; then
    echo "❌ macOS 构建失败"
    exit 1
fi
echo "✅ macOS 构建完成"
echo ""

# 添加 Windows 构建目标（如果尚未添加）
echo "🪟 准备 Windows 构建环境..."
rustup target add x86_64-pc-windows-msvc 2>/dev/null || true
echo "✅ Windows 构建环境准备完成"
echo ""

# 构建 Windows 版本
echo "🪟 构建 Windows 版本..."
echo "⚠️  注意：Windows 构建需要适当的工具链，可能需要额外配置"
npm run tauri build -- --target x86_64-pc-windows-msvc 2>/dev/null || {
    echo "⚠️  Windows 构建跳过（需要额外配置或在 Windows 系统上构建）"
    echo "💡 提示：可以在 Windows 系统上运行此脚本来构建 Windows 版本"
}
echo ""

# 输出构建结果
echo "📋 构建结果摘要："
echo "===================="

# 检查 macOS 构建结果
MACOS_BUNDLE_DIR="src-tauri/target/release/bundle/macos"
if [ -d "$MACOS_BUNDLE_DIR" ]; then
    echo "✅ macOS 构建成功："
    find "$MACOS_BUNDLE_DIR" -name "*.app" -o -name "*.dmg" | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        echo "   📱 $(basename "$file") ($size)"
    done
else
    echo "❌ macOS 构建未找到"
fi

# 检查 Windows 构建结果
WINDOWS_BUNDLE_DIR="src-tauri/target/x86_64-pc-windows-msvc/release/bundle"
if [ -d "$WINDOWS_BUNDLE_DIR" ]; then
    echo "✅ Windows 构建成功："
    find "$WINDOWS_BUNDLE_DIR" -name "*.exe" -o -name "*.msi" | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        echo "   🪟 $(basename "$file") ($size)"
    done
else
    echo "⚠️  Windows 构建未找到（可能需要在 Windows 系统上构建）"
fi

# 输出路径信息
echo ""
echo "📁 构建文件位置："
echo "   macOS: $(pwd)/src-tauri/target/release/bundle/"
echo "   Windows: $(pwd)/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/"
echo ""

echo "🎉 构建流程完成！"
echo "⏰ $(date)"
