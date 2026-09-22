#!/usr/bin/env node
/**
 * KCONE AI 询盘助手 Demo 后端
 * 用法: DEEPSEEK_API_KEY=sk-xxx node server.js  (默认端口 8787)
 * 说明: key 只存在于服务端环境变量，前端页面不含 key。
 * 知识库从 kb.md 读取注入 system prompt，再转发 DeepSeek API。
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const API_KEY = process.env.DEEPSEEK_API_KEY || "";
const KB_FILE = path.join(__dirname, "kb.md");
const KB = fs.readFileSync(KB_FILE, "utf-8");
const LEADS_FILE = path.join(__dirname, "leads.jsonl");

// 会话历史（内存态 demo）：sessionId -> [{role, content}]
// 上限保留最近 MAX_ROUNDS 轮（每轮含 user + assistant 两条）
const MAX_ROUNDS = 8;
const conversations = new Map();

function pruneHistory(history) {
  // 超出轮数时裁掉最旧的 user/assistant 对
  while (history.length > MAX_ROUNDS * 2) {
    // 保证删除从 user 开始的一对
    let removed = 0;
    for (let i = 0; i < history.length && removed < 2; i++) {
      if (history[i].role === "user" || history[i].role === "assistant") {
        history.splice(i, 1);
        removed++;
        i--;
      }
    }
    if (removed === 0) history.shift(); // 兜底
  }
  return history;
}

/** 从 AI 回复中提取 LEAD 结构化数据并剥离标记；成功则追加进 leads.jsonl */
function extractLead(replyText, sessionId) {
  const m = replyText.match(/<LEAD>(\{.*?\})<\/LEAD>/s);
  if (!m) return { clean: replyText, lead: null };
  try {
    const lead = JSON.parse(m[1]);
    // 有效询盘标准：有明确购买意向字段 —— role 或 categories，且已有 quantity 或 contact（避免信息不足就标记已记录）
    const hasIntent = lead.role || lead.categories;
    const hasCommit = lead.quantity || lead.contact;
    if (!lead || !hasIntent || !hasCommit) {
      return { clean: replyText.replace(/<LEAD>.*?<\/LEAD>/s, "").trim(), lead: null };
    }
    const record = {
      ts: new Date().toISOString(),
      sessionId,
      ...lead
    };
    fs.appendFileSync(LEADS_FILE, JSON.stringify(record) + "\n");
    console.log(`[LEAD] ${lead.role || "?"} | ${lead.categories || "?"} | ${lead.contact || "no-contact"}`);
    const clean = replyText.replace(/<LEAD>.*?<\/LEAD>/s, "").trim();
    return { clean, lead: record };
  } catch (e) {
    return { clean: replyText.replace(/<LEAD>.*?<\/LEAD>/s, "").trim(), lead: null };
  }
}

const SYSTEM_PROMPT = `You are the KCONE Pilates official B2B inquiry assistant on kconepilates.com.
Answer overseas buyers (studios, distributors, chains, training facilities) professionally and concisely.
Rules:
- Answer primarily in English; match the buyer's language if they write in another language.
- Position KCONE equipment as professional / studio-grade equipment. Do NOT describe the brand or product line as "commercial" in introductions or positioning. The word "commercial" is allowed only when answering about usage intensity (e.g. "home or commercial use", "commercial-grade means it withstands high-frequency use").
- Base answers ONLY on the knowledge base below. Never invent prices, specs, certifications, lead times or promises.
- If the buyer asks for a quotation, MOQ numbers, lead time or customization cost, politely ask them to submit their needs by email (karen@kconepilates.com), the Contact form, or WhatsApp (+86 18550508086) so KCONE can confirm accurately.
- Keep answers under ~120 words unless more is genuinely needed.
- Lead capture: when the buyer shows purchasing intent (asking about prices, quotation, MOQ, ordering, quantities, buying for a studio/distributor), naturally ask for the key fields one at a time across turns: business role, target product categories, estimated quantity, preferred FOB port, and their email or WhatsApp. Be conversational, never interrogate all at once.
- Lead handoff: output the <LEAD> block only when you have gathered enough to follow up — at least the buyer's role/categories AND either an estimated quantity or their contact (email/WhatsApp). Until then keep asking naturally and never output <LEAD>. When you do output it, end your reply with the line:
  <LEAD>{"role":"...","categories":"...","quantity":"...","port":"...","contact":"...","summary":"one-line summary"}</LEAD>
  Fill only the fields you actually know; leave others empty "". Do not fabricate contact details the buyer never gave.

=== KCONE KNOWLEDGE BASE ===
${KB}`;

function json(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  // CORS 预检
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  // 提供前端 widget 页面
  if (req.method === "GET" && (req.url === "/" || req.url === "/widget.html")) {
    const html = fs.readFileSync(path.join(__dirname, "widget.html"), "utf-8");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(html);
  }

  if (req.method === "POST" && req.url === "/api/chat") {
    let body = "";
    for await (const chunk of req) body += chunk;
    let msg = "", sessionId = "";
    try {
      const parsed = JSON.parse(body);
      msg = (parsed.message || "").toString().trim();
      sessionId = (parsed.sessionId || "").toString().trim() || "default";
    } catch (e) { /* ignore */ }
    if (!msg) return json(res, 400, { error: "empty message" });
    if (!API_KEY) return json(res, 500, { error: "server missing DEEPSEEK_API_KEY" });

    // 读取/初始化本会话历史
    let history = conversations.get(sessionId) || [];
    // 当前提问先进历史（用于构建上下文）
    const workingHistory = [...history, { role: "user", content: msg }];

    // 重试：DeepSeek 偶发返回空 content 或网络抖动，最多试 3 次
    const FALLBACK = "Thanks for your message! For accurate pricing, MOQ, lead time and product details, please contact KCONE directly by email (karen@kconepilates.com), the inquiry form, or WhatsApp (+86 18550508086) — our team responds within 1-2 business days with the exact information for your project.";

    let reply = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const upstream = await fetch("https://api.deepseek.com/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
          body: JSON.stringify({
            model: "deepseek-v4-flash-vision-exp",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...workingHistory
            ],
            max_tokens: 800,
            temperature: 0.3
          })
        });
        const data = await upstream.json();
        const c = (data?.choices?.[0]?.message?.content || "").trim();
        if (c) { reply = c; break; }
        console.warn(`attempt ${attempt}: empty content from upstream`);
      } catch (e) {
        console.error(`attempt ${attempt}: upstream error ${e.message}`);
      }
      // 失败后等待再试
      if (attempt < 3) await new Promise(r => setTimeout(r, 800 * attempt));
    }

    if (!reply) {
      return json(res, 200, { reply: FALLBACK });
    }

    // 提取 LEAD(如有)，剥离标记；询盘记录写入 leads.jsonl
    const { clean, lead } = extractLead(reply, sessionId);
    reply = clean || reply;

    // 记录本轮对话进历史（user 已含，补 assistant 回复）
    history.push({ role: "user", content: msg });
    history.push({ role: "assistant", content: reply });
    conversations.set(sessionId, pruneHistory(history));

    return json(res, 200, { reply, leadCaptured: !!lead, lead });
  }

  // 查看已收集询盘（demo 调试用）
  if (req.method === "GET" && req.url === "/api/leads") {
    try {
      const lines = fs.existsSync(LEADS_FILE)
        ? fs.readFileSync(LEADS_FILE, "utf-8").trim().split("\n").filter(Boolean).map(l => JSON.parse(l))
        : [];
      return json(res, 200, { count: lines.length, leads: lines });
    } catch (e) {
      return json(res, 200, { count: 0, leads: [], error: e.message });
    }
  }

  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`KCONE AI assistant demo → http://127.0.0.1:${PORT}/`);
});
