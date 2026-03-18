/* ============================================================
   debounce.js — 防抖工具函数
   所有实时计算工具统一使用此模块，延迟 300ms
   ============================================================ */
(function (global) {
  'use strict';

  /**
   * 创建防抖函数
   * @param {Function} fn - 需要防抖的函数
   * @param {number} delay - 延迟毫秒数（默认300ms）
   * @returns {Function} 防抖包装后的函数
   */
  function debounce(fn, delay) {
    delay = delay !== undefined ? delay : 300;
    var timer = null;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /**
   * 创建节流函数（限制调用频率，用于滚动等高频事件）
   * @param {Function} fn - 需要节流的函数
   * @param {number} limit - 最小间隔毫秒数
   * @returns {Function} 节流包装后的函数
   */
  function throttle(fn, limit) {
    limit = limit !== undefined ? limit : 100;
    var lastCall = 0;
    return function () {
      var now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        fn.apply(this, arguments);
      }
    };
  }

  global.Debounce = { debounce: debounce, throttle: throttle };

}(window));
