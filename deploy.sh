#!/bin/bash
# KCONE 一键推送 - 把改动推送到 GitHub
echo "🚀 正在推送更新到 GitHub..."

git add -A
git commit -m "update $(date +'%Y-%m-%d %H:%M')"
git push origin main

echo "✅ 推送完成！"
echo "🌐 https://karen9078.github.io/kconepilates/"
