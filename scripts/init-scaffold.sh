#!/bin/bash

# MyToolkit 脚手架初始化脚本
# 用于快速配置新项目

echo "🚀 MyToolkit 脚手架初始化"
echo "========================"
echo ""

# 检查是否存在配置文件
if [ ! -f "scaffold.config.json" ]; then
    if [ -f "scaffold.config.example.json" ]; then
        echo "📋 复制配置模板..."
        cp scaffold.config.example.json scaffold.config.json
        echo "✅ 已创建配置文件 scaffold.config.json"
        echo "💡 请编辑此文件来自定义你的应用"
    else
        echo "❌ 找不到配置模板文件"
        exit 1
    fi
else
    echo "📋 使用现有配置文件 scaffold.config.json"
fi

echo ""
echo "🔧 应用配置向导"
echo "==============="

# 读取用户输入
read -p "📱 应用名称 (英文): " app_name
read -p "📱 应用显示名称 (中文): " product_name
read -p "👤 作者名称: " author
read -p "🏢 公司标识符 (com.company.app): " identifier

# 更新配置文件
if command -v jq &> /dev/null; then
    echo ""
    echo "📝 更新配置文件..."
    
    jq --arg name "$app_name" \
       --arg productName "$product_name" \
       --arg author "$author" \
       --arg identifier "$identifier" \
       '.app.name = $name | .app.productName = $productName | .app.author = $author | .app.identifier = $identifier' \
       scaffold.config.json > temp.json && mv temp.json scaffold.config.json
    
    echo "✅ 配置文件已更新"
else
    echo "⚠️  jq 未安装，请手动编辑 scaffold.config.json 文件"
fi

echo ""
echo "📝 需要手动更新的文件："
echo "  1. package.json - 更新项目信息"
echo "  2. src-tauri/tauri.conf.json - 更新应用配置"
echo "  3. src-tauri/Cargo.toml - 更新 Rust 项目信息"
echo "  4. src/components/Layout.tsx - 更新应用标题"

echo ""
echo "🎨 推荐的下一步："
echo "  1. 替换 src-tauri/icons/ 中的图标文件"
echo "  2. 修改 src/pages/ 中的页面内容"
echo "  3. 运行 npm run dev:tauri 开始开发"
echo "  4. 运行 npm run build:local 构建应用"

echo ""
echo "✅ 脚手架初始化完成！"
echo "📖 查看 SCAFFOLD-GUIDE.md 获取详细文档"
