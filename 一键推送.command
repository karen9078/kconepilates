#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 正在推送到 GitHub..."
echo ""

git add -A
git commit -m "update $(date +'%Y-%m-%d %H:%M')" || true
echo "🔄 拉取远程更新..."
git pull origin main --rebase
echo "🚀 推送中..."
git -c http.timeout=120 -c http.postBuffer=524288000 push origin main

echo ""
echo "✅ 推送完成！"
echo "🌐 https://kconepilates.com"
echo ""
echo "按 Enter 键关闭"
read
