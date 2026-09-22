/* KCONE AI 询盘助手 · 网站挂件
 * 用法：在页面 </body> 前加 <script src="ai-widget.js" defer></script>
 * 后端：Cloudflare Worker（见 ai-assistant-demo/ai-worker.js）
 * 部署后把下面 WORKER_URL 改成你的 Worker 地址即可。
 */
(function () {
  'use strict';

  // ⚠️ 部署 Worker 后替换成你的地址（例如 https://kcone-ai.<你的账号>.workers.dev）
  var WORKER_URL = window.KCONE_AI_ENDPOINT || 'https://kcone-ai.karendong5886.workers.dev';
  // 尚未配置真实 Worker 地址时不初始化，避免访客看到无法使用的入口
  if (!WORKER_URL || WORKER_URL.indexOf('WORKER.workers.dev') !== -1) { return; }
  var MAX_HISTORY = 10;
  var STORE_KEY = 'kcone_ai_chat';

  if (!document.body) { document.addEventListener('DOMContentLoaded', init); return; }
  init();

  function init() {
    if (document.getElementById('kcone-ai-fab')) return;

    var css = document.createElement('style');
    css.textContent = [
      /* 容器：绝对定位 → 随页面滚动（不再固定在屏幕底部）*/
      '#kcone-ai-root{position:absolute;right:20px;top:50vh;z-index:9998;}',
      '#kcone-ai-fab{display:block;margin-left:auto;width:56px;height:56px;border-radius:50%;',
      'background:#0f0f0f;color:#fff;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.22);',
      'align-items:center;justify-content:center;transition:transform .2s ease;padding:0;}',
      '#kcone-ai-fab:hover{transform:scale(1.06);}',
      '#kcone-ai-fab svg{width:26px;height:26px;display:block;margin:auto;}',
      '#kcone-ai-panel{position:absolute;right:0;bottom:68px;top:auto;z-index:9997;width:360px;max-width:calc(100vw - 32px);',
      'height:520px;max-height:calc(50vh - 90px);background:#fff;border-radius:14px;overflow:hidden;display:none;',
      'flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.18);border:1px solid #e8e6e1;}',
      '#kcone-ai-panel.open{display:flex;}',
      '#kcone-ai-head{background:#0f0f0f;color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px;}',
      '#kcone-ai-head .dot{width:9px;height:9px;border-radius:50%;background:#4ade80;flex-shrink:0;}',
      '#kcone-ai-head h3{font-size:14px;font-weight:600;margin:0;letter-spacing:.01em;}',
      '#kcone-ai-head p{font-size:10.5px;color:#b8b6b2;margin:2px 0 0;}',
      '#kcone-ai-close{margin-left:auto;background:none;border:none;color:#b8b6b2;font-size:20px;line-height:1;cursor:pointer;padding:0 2px;}',
      '#kcone-ai-msgs{flex:1;overflow-y:auto;padding:16px;background:#fafaf8;display:flex;flex-direction:column;gap:10px;}',
      '.kcone-ai-msg{max-width:86%;padding:9px 13px;border-radius:13px;font-size:13.5px;line-height:1.6;white-space:pre-wrap;word-break:break-word;}',
      '.kcone-ai-bot{background:#f2f1ed;color:#222;align-self:flex-start;border-bottom-left-radius:4px;}',
      '.kcone-ai-user{background:#0f0f0f;color:#fff;align-self:flex-end;border-bottom-right-radius:4px;}',
      '.kcone-ai-typing{color:#8a8880;font-style:italic;font-size:12px;align-self:flex-start;}',
      '#kcone-ai-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;background:#fafaf8;}',
      '.kcone-ai-chip{font-size:11.5px;padding:5px 11px;border:1px solid #ddd9d2;background:#fff;border-radius:14px;cursor:pointer;color:#444;}',
      '.kcone-ai-chip:hover{border-color:#0f0f0f;color:#0f0f0f;}',
      '#kcone-ai-row{display:flex;gap:8px;padding:12px;border-top:1px solid #ecebe6;background:#fff;}',
      '#kcone-ai-input{flex:1;border:1px solid #ddd9d2;border-radius:9px;padding:9px 12px;font-size:13.5px;font-family:inherit;outline:none;}',
      '#kcone-ai-input:focus{border-color:#0f0f0f;}',
      '#kcone-ai-send{background:#0f0f0f;color:#fff;border:none;border-radius:9px;padding:0 16px;font-size:13px;cursor:pointer;font-family:inherit;}',
      '#kcone-ai-send:disabled{opacity:.4;cursor:default;}',
      '@media(max-width:520px){#kcone-ai-root{right:14px;top:50vh;}#kcone-ai-fab{width:52px;height:52px;}',
      '#kcone-ai-panel{right:0;width:calc(100vw - 44px);bottom:64px;top:auto;height:auto;max-height:calc(50vh - 80px);}}'
    ].join('');
    document.head.appendChild(css);

    var fab = document.createElement('button');
    fab.id = 'kcone-ai-fab';
    fab.setAttribute('aria-label', 'Open AI assistant');
    fab.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg>';

    var panel = document.createElement('div');
    panel.id = 'kcone-ai-panel';
    panel.innerHTML =
      '<div id="kcone-ai-head"><span class="dot"></span><div><h3>KCONE Assistant</h3><p>Pilates equipment · B2B factory-direct</p></div><button id="kcone-ai-close" aria-label="Close">×</button></div>' +
      '<div id="kcone-ai-msgs"></div>' +
      '<div id="kcone-ai-chips">' +
        '<button class="kcone-ai-chip">What is your MOQ?</button>' +
        '<button class="kcone-ai-chip">FOB terms?</button>' +
        '<button class="kcone-ai-chip">Equipment for a new studio</button>' +
        '<button class="kcone-ai-chip">Are you a manufacturer?</button>' +
      '</div>' +
      '<div id="kcone-ai-row"><input id="kcone-ai-input" type="text" placeholder="Type your question…" autocomplete="off"><button id="kcone-ai-send">Send</button></div>';

    var root = document.createElement('div');
    root.id = 'kcone-ai-root';
    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(root);

    var msgs = panel.querySelector('#kcone-ai-msgs');
    var input = panel.querySelector('#kcone-ai-input');
    var send = panel.querySelector('#kcone-ai-send');

    var history = [];
    try { history = JSON.parse(localStorage.getItem(STORE_KEY) || '[]') || []; } catch (e) { history = []; }
    history = history.slice(-MAX_HISTORY);

    function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); } catch (e) {} }
    function bubble(text, cls) {
      var d = document.createElement('div');
      d.className = 'kcone-ai-msg ' + cls;
      d.textContent = text;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    }

    if (!history.length) {
      bubble("Hello! I'm the KCONE assistant. Ask about our professional Pilates equipment — models and specifications, FOB terms, MOQ, lead time, or planning a studio order.", 'kcone-ai-bot');
    } else {
      history.forEach(function (m) { bubble(m.content, m.role === 'user' ? 'kcone-ai-user' : 'kcone-ai-bot'); });
    }

    function ask(text) {
      var q = (text || '').trim();
      if (!q) return;
      bubble(q, 'kcone-ai-user');
      history.push({ role: 'user', content: q });
      save();
      input.value = '';
      send.disabled = true;
      var typing = bubble('Thinking…', 'kcone-ai-typing');

      fetch(WORKER_URL.replace(/\/$/, '') + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: history.slice(0, -1) })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          typing.remove();
          var reply = (d && d.reply) || d.error || "Sorry, I couldn't reach the assistant. Please email karen@kconepilates.com or WhatsApp +86 18550508086.";
          bubble(reply, 'kcone-ai-bot');
          history.push({ role: 'assistant', content: reply });
          save();
        })
        .catch(function () {
          typing.remove();
          bubble('Connection issue — please try again, or contact karen@kconepilates.com / WhatsApp +86 18550508086.', 'kcone-ai-bot');
        })
        .then(function () { send.disabled = false; input.focus(); });
    }

    fab.addEventListener('click', function () {
      panel.classList.toggle('open');
      if (panel.classList.contains('open')) input.focus();
    });
    panel.querySelector('#kcone-ai-close').addEventListener('click', function () { panel.classList.remove('open'); });
    send.addEventListener('click', function () { ask(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') ask(input.value); });
    panel.querySelectorAll('.kcone-ai-chip').forEach(function (c) {
      c.addEventListener('click', function () { ask(c.textContent); });
    });
  }
})();
