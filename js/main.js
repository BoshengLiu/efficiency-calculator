/* ============================================================
   main.js — 主入口逻辑
   功能：导航初始化 / 滚动入场动画 / 数字计数器 / 案例动态加载 / 工具卡片预览
   ============================================================ */
(function (global) {
  'use strict';

  /* ── 工具卡片预览配置（主页简版） ────────────────────────── */
  var TOOL_PREVIEWS = [
    {
      id: 'preview-cost',
      toolKey: 'cost',
      calculator: null,
      defaultLabel: '年节省人力成本',
      defaultValue: '¥0',
      compute: function (val) {
        /* 简版：员工数滑块 */
        var employees = parseInt(val, 10);
        var saving = employees * 8000 * 0.25 * 12 * 0.8;
        return Formatters.currency(saving, true);
      }
    },
    {
      id: 'preview-time',
      toolKey: 'time',
      defaultLabel: '每年节省工时',
      defaultValue: '0 小时',
      compute: function (val) {
        var teamSize = parseInt(val, 10);
        var hours = teamSize * 10 * 52 * 0.85;
        return Formatters.number(Math.round(hours)) + ' 小时';
      }
    },
    {
      id: 'preview-error',
      toolKey: 'error',
      defaultLabel: '年节省错误成本',
      defaultValue: '¥0',
      compute: function (val) {
        var rate = parseFloat(val);
        var saving = 1000 * 12 * (rate / 100) * 700 * 0.9;
        return Formatters.currency(saving, true);
      }
    }
  ];

  /* ── 初始化入口 ──────────────────────────────────────────── */
  function init() {
    /* 统计：首页浏览 */
    if (typeof Analytics !== 'undefined') Analytics.trackPageView();

    /* 页面入场动画 */
    PageTransition.pageEnter();

    /* 初始化导航 */
    if (typeof Navigation !== 'undefined') Navigation.init();

    /* 滚动入场动画（Intersection Observer） */
    initRevealAnimations();

    /* 数字计数器 */
    initCounters();

    /* 工具卡片预览 */
    initToolPreviews();

    /* 动态加载案例数据 */
    loadCasesData();
  }

  /* ── 滚动入场动画 ─────────────────────────────────────────── */
  function initRevealAnimations() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      elements.forEach(function (el) { observer.observe(el); });
    } else {
      /* 回退：直接显示 */
      elements.forEach(function (el) { el.classList.add('reveal--visible'); });
    }
  }

  /* ── 数字计数器动画 ─────────────────────────────────────── */
  function initCounters() {
    var counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(function (el) { observer.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  function animateCounter(el) {
    var target = parseFloat(el.dataset.counter);
    var suffix = el.dataset.suffix || '';
    var prefix = el.dataset.prefix || '';
    var duration = parseInt(el.dataset.duration, 10) || 1800;
    var isFloat = el.dataset.float === 'true';
    var start = 0;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      /* 缓动函数 */
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = start + (target - start) * eased;
      el.textContent = prefix + (isFloat ? current.toFixed(1) : Formatters.number(Math.round(current))) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + (isFloat ? target.toFixed(1) : Formatters.number(target)) + suffix;
    }

    requestAnimationFrame(step);
  }

  /* ── 工具卡片预览（主页简版交互） ───────────────────────── */
  function initToolPreviews() {
    var cards = document.querySelectorAll('[data-tool-preview]');
    cards.forEach(function (card) {
      var slider = card.querySelector('.tool-card__slider');
      var display = card.querySelector('.tool-card__preview-value');
      if (!slider || !display) return;

      var toolKey = card.dataset.toolPreview;
      var config = TOOL_PREVIEWS.find(function (t) { return t.toolKey === toolKey; });
      if (!config) return;

      /* 初始显示 */
      display.textContent = config.compute(slider.value);

      /* 防抖实时计算 */
      slider.addEventListener('input', Debounce.debounce(function () {
        display.textContent = config.compute(slider.value);
        display.classList.remove('result-updated');
        void display.offsetWidth;
        display.classList.add('result-updated');
      }, 300));
    });

    /* 工具卡片"完整体验"按钮 */
    var ctaBtns = document.querySelectorAll('[data-tool-link]');
    ctaBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var url = btn.dataset.toolLink;
        var card = btn.closest('.tool-card');
        PageTransition.navigateTo(url, card);
      });
    });
  }

  /* ── 动态加载案例数据 ─────────────────────────────────────── */
  function loadCasesData() {
    var container = document.getElementById('cases-container');
    if (!container) return;

    /* 显示骨架屏占位 */
    container.innerHTML = renderSkeletons(3);

    /* 构建 JSON 路径（兼容本地file://和http服务器） */
    var basePath = getBasePath();
    var jsonUrl = basePath + 'data/cases.json';

    fetch(jsonUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        renderCases(container, data.cases || []);
      })
      .catch(function () {
        /* fetch 失败时（如 file:// 协议），使用内置数据 */
        renderCases(container, getFallbackCases());
      });
  }

  function getBasePath() {
    var path = window.location.pathname;
    var parts = path.split('/');
    parts[parts.length - 1] = '';
    return parts.join('/');
  }

  function renderCases(container, cases) {
    if (!cases.length) {
      container.innerHTML = '<p class="text-center text-muted">暂无案例数据</p>';
      return;
    }

    container.innerHTML = '<div class="cases-grid">' + cases.slice(0, 6).map(function (c) {
      return [
        '<article class="case-card reveal">',
        '  <div class="case-card__image">' + (c.emoji || '📊') + '</div>',
        '  <div class="case-card__body">',
        '    <div class="case-card__industry">' + c.industry + '</div>',
        '    <h3 class="case-card__title">' + c.title + '</h3>',
        '    <p class="case-card__desc">' + c.challenge + '</p>',
        '    <div class="case-card__metrics">',
        '      <div>',
        '        <div class="case-card__metric-value">' + c.results.timeSaved + '</div>',
        '        <div class="case-card__metric-label">时间节省</div>',
        '      </div>',
        '      <div>',
        '        <div class="case-card__metric-value">' + c.results.errorRate + '</div>',
        '        <div class="case-card__metric-label">错误率</div>',
        '      </div>',
        '      <div>',
        '        <div class="case-card__metric-value" style="font-size:1rem;">' + c.results.annualSaving + '</div>',
        '        <div class="case-card__metric-label">年节省</div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('') + '</div>';

    /* 为新渲染的卡片启用入场动画 */
    initRevealAnimations();
  }

  function renderSkeletons(count) {
    var html = '<div class="cases-grid">';
    for (var i = 0; i < count; i++) {
      html += [
        '<div class="case-card">',
        '  <div class="skeleton skeleton--rect"></div>',
        '  <div class="case-card__body">',
        '    <div class="skeleton skeleton--text" style="width:30%;"></div>',
        '    <div class="skeleton skeleton--title"></div>',
        '    <div class="skeleton skeleton--text"></div>',
        '    <div class="skeleton skeleton--text" style="width:70%;"></div>',
        '  </div>',
        '</div>'
      ].join('');
    }
    html += '</div>';
    return html;
  }

  /* 内置备用案例数据（fetch失败时使用） */
  function getFallbackCases() {
    return [
      {
        industry: '金融行业', emoji: '🏦', title: '银行报表自动化处理',
        challenge: '每月需人工汇整来自 12 个系统的 5000+ 份业绩报表，平均耗时 3 周，人工录入错误率高达 8%。',
        results: { timeSaved: '95%', errorRate: '0.2%', annualSaving: '¥86万' }
      },
      {
        industry: '制造业', emoji: '🏭', title: '供应链文档智能解析',
        challenge: '每日收到 200+ 份来自不同供应商格式各异的采购单据，人工录入系统需要 4 名专职员工。',
        results: { timeSaved: '88%', errorRate: '1.5%', annualSaving: '¥52万' }
      },
      {
        industry: '法律服务', emoji: '⚖️', title: '合同智能审查系统',
        challenge: '每月审查 500+ 份商业合同，初审平均耗时 2 小时/份，律师大量时间花费在格式审查上。',
        results: { timeSaved: '70%', errorRate: '漏项减少98%', annualSaving: '¥68万' }
      }
    ];
  }

  /* ── CTA 按钮绑定 ─────────────────────────────────────────── */
  function initCTAButtons() {
    document.querySelectorAll('[data-action="consult"]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (typeof Analytics !== 'undefined') Analytics.trackConsultClick();
        if (typeof Modal !== 'undefined') Modal.openConsult();
      });
    });
  }

  /* ── DOMContentLoaded ─────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      initCTAButtons();
    });
  } else {
    init();
    initCTAButtons();
  }

}(window));
