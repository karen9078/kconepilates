#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""推送前自动升级缓存版本号
用法：python3 _bump_versions.py
作用：把所有 HTML 里 site.css / blog-article.css / ai-widget.js / site.js 的 ?v= 改成当前时间戳
这样浏览器一定会拿到最新文件，用户不用手动清缓存。
"""
import re, glob, time, os

STAMP = str(int(time.time()))[-6:]          # 6 位时间戳，简短且唯一
TARGETS = ['site.css', 'blog-article.css', 'ai-widget.js', 'site.js', 'blog-rss-worker.js']

changed = 0
files = [f for f in sorted(glob.glob('*.html')) if not f.startswith(('font-', 'google'))]
for f in files:
    try:
        h = open(f, encoding='utf-8').read()
    except Exception:
        continue
    b = h
    for t in TARGETS:
        pat = re.compile(r'(%s)(\?v=[^"\']*)?(")' % re.escape(t))
        h = pat.sub(lambda m: '%s?v=%s%s' % (m.group(1), STAMP, m.group(3)), h)
    if h != b:
        open(f, 'w', encoding='utf-8').write(h)
        changed += 1

print('✅ 已升级 %d 个页面的资源版本号 → ?v=%s' % (changed, STAMP))
