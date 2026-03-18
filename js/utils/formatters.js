/* ============================================================
   formatters.js — 数据格式化工具
   ============================================================ */
(function (global) {
  'use strict';

  /**
   * 货币格式化 → ¥1,234,567
   * @param {number} value
   * @param {boolean} [compact] - 是否使用紧凑形式（¥120万）
   */
  function currency(value, compact) {
    if (typeof value !== 'number' || isNaN(value)) return '¥0';
    if (compact && Math.abs(value) >= 10000) {
      if (Math.abs(value) >= 100000000) {
        return '¥' + (value / 100000000).toFixed(1) + '亿';
      }
      if (Math.abs(value) >= 10000) {
        return '¥' + (value / 10000).toFixed(1) + '万';
      }
    }
    return '¥' + Math.round(value).toLocaleString('zh-CN');
  }

  /**
   * 数字格式化（加千分符）
   * @param {number} value
   */
  function number(value) {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    return Math.round(value).toLocaleString('zh-CN');
  }

  /**
   * 百分比格式化 → 85.5%
   * @param {number} value - 0~100 的数值
   * @param {number} [decimals] - 小数位数
   */
  function percent(value, decimals) {
    decimals = decimals !== undefined ? decimals : 1;
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    return value.toFixed(decimals) + '%';
  }

  /**
   * 时间格式化
   * @param {number} hours - 小时数
   * @returns {string} 如 "1,200 小时" 或 "156 天"
   */
  function time(hours) {
    if (typeof hours !== 'number' || isNaN(hours)) return '0 小时';
    if (hours >= 24 * 30) {
      var months = (hours / (24 * 30)).toFixed(1);
      return months + ' 月';
    }
    if (hours >= 8) {
      var days = Math.round(hours / 8);
      return number(days) + ' 天';
    }
    return number(hours) + ' 小时';
  }

  /**
   * 时间详细格式化（带单位选择）
   */
  function timeDetailed(hours) {
    var days = Math.floor(hours / 8);
    var remainHours = Math.round(hours % 8);
    if (days > 0 && remainHours > 0) {
      return number(days) + ' 天 ' + remainHours + ' 小时';
    }
    if (days > 0) return number(days) + ' 个工作日';
    return number(hours) + ' 小时';
  }

  /**
   * 大数字简化显示
   * @param {number} value
   */
  function compact(value) {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    if (Math.abs(value) >= 100000000) return (value / 100000000).toFixed(1) + '亿';
    if (Math.abs(value) >= 10000) return (value / 10000).toFixed(1) + '万';
    return Math.round(value).toString();
  }

  /**
   * ROI 格式化 → 320%
   */
  function roi(value) {
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    if (value >= 1000) return (value / 100).toFixed(0) + 'x';
    return Math.round(value) + '%';
  }

  global.Formatters = {
    currency: currency,
    number: number,
    percent: percent,
    time: time,
    timeDetailed: timeDetailed,
    compact: compact,
    roi: roi
  };

}(window));
