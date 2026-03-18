/* ============================================================
   page-transition.js — 页面跳转过渡动画
   三阶段沉浸式过渡：卡片放大 → 页面淡出 → 加载圈 → 跳转
   ============================================================ */
(function (global) {
  'use strict';

  var PageTransition = {
    _overlay: null,
    _spinner: null,
    _active: false,

    /**
     * 初始化遮罩层和加载圈（首次调用时创建）
     */
    _init: function () {
      if (this._overlay) return;

      var overlay = document.createElement('div');
      overlay.className = 'page-transition-overlay';

      var spinner = document.createElement('div');
      spinner.className = 'page-transition-spinner';
      spinner.innerHTML = [
        '<div class="page-transition-spinner__ring"></div>',
        '<div class="page-transition-spinner__text">正在进入...</div>'
      ].join('');

      overlay.appendChild(spinner);
      document.body.appendChild(overlay);

      this._overlay = overlay;
      this._spinner = spinner;
    },

    /**
     * 执行三阶段跳转过渡
     * @param {string} url - 目标 URL
     * @param {HTMLElement} [cardEl] - 触发跳转的卡片元素
     */
    navigateTo: function (url, cardEl) {
      if (this._active) return;
      this._active = true;
      this._init();

      var self = this;

      /* 阶段1 (0–200ms)：卡片放大 + 光晕 */
      if (cardEl) {
        cardEl.classList.add('card-zoom--stage1');
      }

      setTimeout(function () {
        /* 阶段2 (200–500ms)：遮罩淡入 */
        self._overlay.classList.add('page-transition-overlay--active');

        setTimeout(function () {
          /* 阶段3 (500–700ms)：加载圈出现 */
          self._spinner.classList.add('page-transition-spinner--visible');

          setTimeout(function () {
            /* 执行跳转 */
            window.location.href = url;
          }, 200);

        }, 200);

      }, 200);
    },

    /**
     * 工具页面入场动画（在目标页面的 DOMContentLoaded 中调用）
     */
    pageEnter: function () {
      document.body.classList.add('page-entering');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.body.classList.remove('page-entering');
          document.body.classList.add('page-visible');
        });
      });
    },

    /**
     * 返回主页（带淡出过渡）
     * @param {string} [url] - 主页地址，默认 '../../index.html' 或 '/'
     */
    goBack: function (url) {
      var target = url || this._resolveHomePath();
      this.navigateTo(target, null);
    },

    /**
     * 自动推断主页路径（基于当前 URL 深度）
     */
    _resolveHomePath: function () {
      var path = window.location.pathname;
      var depth = (path.match(/\//g) || []).length;
      if (depth <= 1) return 'index.html';
      if (depth === 2) return '../index.html';
      return '../../index.html';
    }
  };

  global.PageTransition = PageTransition;

}(window));
