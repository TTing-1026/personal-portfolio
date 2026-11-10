/* ==========================================================================
   script.js — 全站共享脚本库
   任务：组件开发与样式统一 ｜ 对应交付物清单「共享脚本库 (JS)」
   职责：① 汉堡菜单展开 / 收起（含点击外部、Esc、点击链接、断点切换）
         ② 窗口变化与页面滚动效果（sticky 页头阴影）
         ③ 当前区块 / 当前页 aria-current 高亮
         ④ 页脚年份、演示表单的 aria-live 反馈
   规范：无框架依赖、无全局变量污染（IIFE + 严格模式）；渐进增强，
         关闭 JavaScript 时导航仍以可换行列表完整可读；事件委托绑定；
         所有查询均做存在性判断，组件缺失的页面不会报错。
   ========================================================================== */
(function () {
  'use strict';

  /* 在 CSS 之前标记 JS 可用，导航才折叠为汉堡菜单（渐进增强） */
  document.documentElement.classList.add('has-js');

  var MOBILE_BREAKPOINT = 768;
  var SCROLL_THRESHOLD = 8;
  var LABEL_OPEN = '展开导航菜单';
  var LABEL_CLOSE = '收起导航菜单';

  function queryOne(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function queryAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /* ---------- ① 导航交互：DOM 操作 classList.add/remove 控制显示隐藏 ---------- */
  function initNav() {
    var nav = queryOne('.site-nav');
    var toggle = queryOne('.site-nav__toggle');
    var list = queryOne('.site-nav__list');
    if (!nav || !toggle || !list) {
      return; /* 页面未引入 MainNav 组件时静默跳过 */
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setMenu(open) {
      list.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? LABEL_CLOSE : LABEL_OPEN);
    }

    /* 事件委托：一次绑定覆盖按钮、菜单链接与「点击外部收起」 */
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) {
        return;
      }
      if (toggle.contains(target)) {
        setMenu(!isOpen());
        return;
      }
      if (nav.contains(target)) {
        if (target.closest('.site-nav__link')) {
          setMenu(false);
        }
        return;
      }
      if (isOpen()) {
        setMenu(false); /* 点击菜单外部收起 */
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setMenu(false);
        toggle.focus(); /* 焦点还给触发按钮，键盘操作不迷路 */
      }
    });

    /* 监听窗口大小变化：变宽时清理移动端展开状态，
       变窄时由 CSS 媒体查询自动折叠成图标，二者配合保证状态一致 */
    var wideScreen = window.matchMedia('(min-width: ' + MOBILE_BREAKPOINT + 'px)');
    function onBreakpointChange() {
      if (wideScreen.matches) {
        setMenu(false);
      }
    }
    if (typeof wideScreen.addEventListener === 'function') {
      wideScreen.addEventListener('change', onBreakpointChange);
    } else if (typeof wideScreen.addListener === 'function') {
      wideScreen.addListener(onBreakpointChange); /* 旧浏览器回退 */
    }
    window.addEventListener('resize', onBreakpointChange);

    setMenu(false);
  }

  /* ---------- ② 页面滚动效果：16ms 定时器节流 + passive 监听 ----------
     用 setTimeout 而非 rAF，兼顾不支持 rAF 的环境与后台/无绘制场景，
     保证滚动状态始终能被更新，同时避免每个 scroll 事件都读写 class。 */
  function initScrollEffects() {
    var header = queryOne('.site-header');
    if (!header) {
      return;
    }
    var timer = null;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
    }
    window.addEventListener('scroll', function () {
      if (timer !== null) {
        return;
      }
      /* 首次事件立即同步，避免依赖定时器在后台标签页被延迟节流；
         其后 16ms 内的连续事件合并为一次，达到节流效果。 */
      update();
      timer = window.setTimeout(function () {
        timer = null;
      }, 16);
    }, { passive: true });
    update();
  }

  /* ---------- ③ 当前页 / 当前区块高亮 ---------- */
  function initCurrentPage() {
    var key = document.body.getAttribute('data-page');
    if (!key) {
      return;
    }
    var link = queryOne('.site-nav__link[data-page-key="' + key + '"]');
    if (link) {
      link.setAttribute('aria-current', 'page');
    }
  }

  function initCurrentSection() {
    var links = queryAll('.site-nav__link[data-anchor]');
    if (!links.length || !('IntersectionObserver' in window)) {
      return;
    }
    var linkMap = {};
    links.forEach(function (link) {
      linkMap[link.getAttribute('data-anchor')] = link;
    });
    var sections = queryAll('main section[id]').filter(function (section) {
      return Boolean(linkMap[section.id]);
    });
    if (!sections.length) {
      return; /* 例如 about.html：没有锚点区块，直接跳过 */
    }

    var ratios = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        ratios[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
      });
      var activeId = null;
      var best = 0;
      Object.keys(ratios).forEach(function (id) {
        if (ratios[id] > best) {
          best = ratios[id];
          activeId = id;
        }
      });
      links.forEach(function (link) {
        if (link.getAttribute('aria-current') === 'page') {
          return; /* 页面级高亮优先，不被区块高亮覆盖 */
        }
        if (link.getAttribute('data-anchor') === activeId && best > 0) {
          link.setAttribute('aria-current', 'location');
        } else if (link.getAttribute('aria-current') === 'location') {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ---------- ④ 小工具：年份与演示表单反馈 ---------- */
  function initYear() {
    queryAll('[data-year]').forEach(function (element) {
      element.textContent = String(new Date().getFullYear());
    });
  }

  function initContactForm() {
    var form = queryOne('form[data-contact]');
    if (!form) {
      return;
    }
    var status = queryOne('.form-status', form);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (status) {
        status.textContent = '演示页面：表单未连接后端，请替换为本人真实联系方式或提交接口。';
      }
    });
  }

  function init() {
    initNav();
    initScrollEffects();
    initCurrentPage();
    initCurrentSection();
    initYear();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
