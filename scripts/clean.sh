#!/bin/bash

# MyToolkit 清理脚本
# 清理所有构建文件和缓存

echo "🧹 MyToolkit 清理脚本"
echo "⏰ $(date)"
echo ""

echo "🗑️  清理构建文件..."

# 清理前端构建文件
if [ -d "dist" ]; then
    rm -rf dist
    echo "   ✅ 清理前端构建文件 (dist/)"
fi

# 清理 Tauri 构建文件
if [ -d "src-tauri/target" ]; then
    rm -rf src-tauri/target
    echo "   ✅ 清理 Tauri 构建文件 (src-tauri/target/)"
fi

# 清理 Node.js 依赖（可选）
read -p "🤔 是否清理 Node.js 依赖？(y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        echo "   ✅ 清理 Node.js 依赖 (node_modules/)"
    fi
    if [ -f "package-lock.json" ]; then
        rm package-lock.json
        echo "   ✅ 清理包锁定文件 (package-lock.json)"
    fi
fi

# 清理 Cargo 缓存（可选）
read -p "🤔 是否清理 Cargo 缓存？(y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd src-tauri
    if command -v cargo &> /dev/null; then
        cargo clean
        echo "   ✅ 清理 Cargo 缓存"
    fi
    cd ..
fi

echo ""
echo "🎉 清理完成！"
echo "💡 提示：下次构建时需要重新安装依赖"
