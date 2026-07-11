// Blog RSS Worker — 拉取 Jant RSS feed 返回 JSON
// 部署: Cloudflare Dashboard → Workers & Pages → 创建 Worker → 粘贴此代码

const BLOG_FEED = 'https://karentalk.jant.blog/feed';

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 从缓存获取
    const cache = caches.default;
    const cacheKey = new Request(request.url);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(BLOG_FEED);
      const xml = await response.text();

      // 简单解析 Atom feed 为 JSON
      const posts = [];
      const itemRegex = /<entry>([\s\S]*?)<\/entry>/g;
      let match;

      while ((match = itemRegex.exec(xml)) !== null) {
        const entry = match[1];
        const title = extractTag(entry, 'title');
        const link = extractLink(entry);
        const published = extractTag(entry, 'published') || extractTag(entry, 'updated');
        const summary = extractTag(entry, 'summary') || extractTag(entry, 'content');
        const id = extractTag(entry, 'id');

        if (title) {
          posts.push({
            id,
            title: decodeEntities(title),
            link,
            date: published ? formatDate(published) : '',
            summary: summary ? stripHtml(decodeEntities(summary)).slice(0, 300) : '',
          });
        }
      }

      const json = JSON.stringify({ posts, updated: new Date().toISOString() });

      const res = new Response(json, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=600', // 缓存10分钟
        },
      });

      // 存入缓存
      await cache.put(cacheKey, res.clone());
      return res;
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, posts: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = re.exec(xml);
  return m ? m[1].trim() : '';
}

function extractLink(xml) {
  const re = /<link[^>]*href="([^"]+)"/;
  const m = re.exec(xml);
  return m ? m[1] : '';
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateStr.slice(0, 10);
  }
}

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
