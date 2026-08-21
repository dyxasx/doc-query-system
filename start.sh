#!/bin/bash
# H5 文档查询系统 - 本地启动脚本
echo "=============================="
echo "  H5 文档查询系统"
echo "=============================="
echo ""
echo "正在安装依赖..."
npm install 2>/dev/null
echo ""
echo "启动开发服务器..."
echo "访问地址: http://localhost:8888"
echo "管理员: admin / admin123"
echo ""
npx netlify-cli dev
