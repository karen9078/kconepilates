/* ============================================================
   KCONE 全站统一框架脚本 (site.js)
   包含：导航滚动阴影 / 下拉关闭 / 手机菜单 / 滚动渐显 / 微信复制
   所有页面共用，改一处全站生效
   ============================================================ */
(function () {
  'use strict';

  /* ── 导航滚动阴影 ── */
  var nav = document.getElementById('main-nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', (window.pageYOffset || 0) > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 下拉菜单：点击内部链接后收起 ── */
  window.closeDrop = function () {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  };

  /* ── 手机菜单开合 ── */
  window.toggleMenu = function () {
    var menu = document.getElementById('mobileMenu');
    var btn = document.getElementById('hamburgerBtn');
    if (!menu || !btn) return;
    menu.classList.toggle('open');
    btn.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
  };

  /* 点击菜单外部关闭（更好的移动端体验） */
  document.addEventListener('click', function (e) {
    var menu = document.getElementById('mobileMenu');
    var btn = document.getElementById('hamburgerBtn');
    if (!menu || !btn || !menu.classList.contains('open')) return;
    if (menu.contains(e.target) || btn.contains(e.target)) return;
    window.toggleMenu();
  });

  /* ── 微信 ID 复制 ── */
  window.copyWechat = function () {
    var id = 'KarenTalk666';
    var el = document.getElementById('wechat-copy');
    var done = function () {
      if (!el) return;
      el.textContent = 'COPIED!';
      setTimeout(function () { el.textContent = 'COPY'; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(done).catch(done);
    } else {
      done();
    }
  };

  /* ── 滚动渐显（.fade-in → .visible）── */
  function initFadeIn() {
    var items = document.querySelectorAll('.fade-in');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '240px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ── 本地 file:// 预览时补 .html 后缀（方便双击打开测试）── */
  function initLocalPreviewLinks() {
    if (window.location.protocol !== 'file:') return;
    document.querySelectorAll('a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href || /^(https?:|mailto:|tel:|#|\/)/.test(href)) return;
      if (/\.html?$/.test(href)) return;
      link.setAttribute('href', href + '.html');
    });
  }

  function boot() {
    initFadeIn();
    initLocalPreviewLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
