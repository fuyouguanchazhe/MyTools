#!/bin/bash

# MyToolkit 本地构建脚本
# 快速构建当前平台版本

echo "🏗️  MyToolkit 本地构建"
echo "⏰ $(date)"
echo ""

# 清理并构建
echo "🧹 清理构建文件..."
rm -rf src-tauri/target/release/bundle
rm -rf dist
echo ""

echo "📦 安装依赖..."
npm install --silent
echo ""

echo "🏗️  构建前端..."
npm run build
echo ""

echo "📱 构建应用..."
npm run tauri build
echo ""

# 输出结果
BUNDLE_DIR="src-tauri/target/release/bundle"
if [ -d "$BUNDLE_DIR" ]; then
    echo "🎉 构建成功！"
    echo ""
    echo "📁 构建文件："
    find "$BUNDLE_DIR" -name "*.app" -o -name "*.dmg" -o -name "*.exe" -o -name "*.msi" | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        echo "   📦 $(basename "$file") ($size)"
        echo "      路径: $file"
    done
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo ""
echo "✅ 本地构建完成！"
