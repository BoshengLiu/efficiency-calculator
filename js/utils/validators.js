/* ============================================================
   validators.js — 输入验证工具
   包含：数字验证、文件验证（三重校验）、输入框错误高亮
   ============================================================ */
(function (global) {
  'use strict';

  /* ── 文件安全验证配置 ──────────────────────────────────── */

  /* 允许的文件扩展名白名单 */
  var ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.webp', '.bmp'];

  /* 文件大小上限：5MB */
  var MAX_FILE_SIZE = 5 * 1024 * 1024;

  /* MIME 类型对应的文件头字节（魔数）
   * 用于防止伪装扩展名的恶意文件 */
  var MAGIC_BYTES = {
    pdf:  { bytes: [0x25, 0x50, 0x44, 0x46], label: 'PDF' },         /* %PDF */
    docx: { bytes: [0x50, 0x4B, 0x03, 0x04], label: 'DOCX/ZIP' },    /* PK\x03\x04 */
    txt:  null,  /* 纯文本无固定魔数，跳过字节检测 */
    /* 图片魔数：防止伪装扩展名的恶意文件 */
    jpg:  { bytes: [0xFF, 0xD8, 0xFF], label: 'JPEG' },               /* JPEG SOI */
    jpeg: { bytes: [0xFF, 0xD8, 0xFF], label: 'JPEG' },               /* JPEG SOI */
    png:  { bytes: [0x89, 0x50, 0x4E, 0x47], label: 'PNG' },          /* \x89PNG */
    webp: { bytes: [0x52, 0x49, 0x46, 0x46], label: 'WEBP/RIFF' },   /* RIFF */
    bmp:  { bytes: [0x42, 0x4D], label: 'BMP' }                       /* BM */
  };

  /* ── 数字验证 ─────────────────────────────────────────── */

  /**
   * 验证数字是否在指定范围内
   * @param {*} value - 输入值
   * @param {number} min
   * @param {number} max
   * @param {string} label - 字段名称（用于错误文案）
   * @returns {{ valid: boolean, value: number, message: string }}
   */
  function validateNumber(value, min, max, label) {
    label = label || '该字段';
    var num = parseFloat(value);
    if (value === '' || value === null || value === undefined) {
      return { valid: false, value: null, message: label + ' 不能为空' };
    }
    if (isNaN(num)) {
      return { valid: false, value: null, message: label + ' 必须是有效数字' };
    }
    if (min !== undefined && num < min) {
      return { valid: false, value: num, message: label + ' 不能小于 ' + min };
    }
    if (max !== undefined && num > max) {
      return { valid: false, value: num, message: label + ' 不能大于 ' + max };
    }
    return { valid: true, value: num, message: '' };
  }

  /**
   * 验证整数
   */
  function validateInteger(value, min, max, label) {
    var result = validateNumber(value, min, max, label);
    if (!result.valid) return result;
    if (!Number.isInteger(result.value)) {
      return { valid: false, value: result.value, message: (label || '该字段') + ' 必须是整数' };
    }
    return result;
  }

  /* ── 文件安全验证 ─────────────────────────────────────── */

  /**
   * 第一重校验：扩展名白名单
   */
  function checkExtension(filename) {
    var name = filename.toLowerCase();
    for (var i = 0; i < ALLOWED_EXTENSIONS.length; i++) {
      if (name.endsWith(ALLOWED_EXTENSIONS[i])) return true;
    }
    return false;
  }

  /**
   * 第二重校验：文件大小
   */
  function checkSize(size) {
    return size <= MAX_FILE_SIZE;
  }

  /**
   * 第三重校验：文件头字节（MIME魔数）
   * 安全说明：即使攻击者修改扩展名，此检测也能识别真实文件类型
   * @param {File} file
   * @param {Function} callback - callback(result: { valid, message })
   */
  function checkMagicBytes(file, callback) {
    var ext = file.name.split('.').pop().toLowerCase();
    var magic = MAGIC_BYTES[ext];

    /* TXT 文件无固定魔数，改用内容扫描：检测头部是否含有 HTML/脚本特征 */
    if (!magic) {
      var txtReader = new FileReader();
      txtReader.onload = function (e) {
        var head = e.target.result.toLowerCase().trimStart();
        /* 检测常见的 HTML/脚本文件特征，防止将 .html/.js/.svg 伪装为 .txt 上传 */
        var SUSPICIOUS_PATTERNS = ['<!doctype', '<html', '<script', '<svg', '<?php', '<%'];
        for (var j = 0; j < SUSPICIOUS_PATTERNS.length; j++) {
          if (head.indexOf(SUSPICIOUS_PATTERNS[j]) === 0) {
            callback({
              valid: false,
              message: '文件内容疑似 HTML/脚本文件，已拒绝处理'
            });
            return;
          }
        }
        callback({ valid: true, message: '' });
      };
      txtReader.onerror = function () {
        callback({ valid: false, message: '文件读取失败，请重试' });
      };
      /* 只读取文件头部 256 字节用于特征检测 */
      txtReader.readAsText(file.slice(0, 256));
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var arr = new Uint8Array(e.target.result);
      for (var i = 0; i < magic.bytes.length; i++) {
        if (arr[i] !== magic.bytes[i]) {
          callback({
            valid: false,
            message: '文件内容与扩展名不符，疑似伪装文件，已拒绝处理'
          });
          return;
        }
      }
      callback({ valid: true, message: '' });
    };
    reader.onerror = function () {
      callback({ valid: false, message: '文件读取失败，请重试' });
    };
    /* 只读取文件头部 8 字节，最小化内存占用 */
    reader.readAsArrayBuffer(file.slice(0, 8));
  }

  /**
   * 完整文件三重验证（异步）
   * @param {File} file
   * @param {Function} callback - callback({ valid, message })
   */
  function validateFile(file, callback) {
    /* 第一重：扩展名 */
    if (!checkExtension(file.name)) {
      callback({
        valid: false,
        message: '不支持的文件格式，仅接受 PDF、DOCX、TXT、JPG、PNG、WEBP 文件'
      });
      return;
    }

    /* 第二重：文件大小 */
    if (!checkSize(file.size)) {
      var sizeMB = (file.size / 1024 / 1024).toFixed(1);
      callback({
        valid: false,
        message: '文件过大（' + sizeMB + 'MB），请上传 5MB 以内的文件'
      });
      return;
    }

    /* 第三重：MIME 字节头校验 */
    checkMagicBytes(file, callback);
  }

  /* ── UI 错误高亮工具 ─────────────────────────────────── */

  /**
   * 在输入框上显示错误状态
   * @param {HTMLElement} inputEl - 输入框元素
   * @param {string} message - 错误信息
   */
  function showInputError(inputEl, message) {
    if (!inputEl) return;
    inputEl.classList.add('form-control--error');
    inputEl.classList.add('shake');

    /* 移除已有错误提示 */
    var existingError = inputEl.parentElement.querySelector('.form-error');
    if (existingError) existingError.remove();

    /* 创建错误提示元素 */
    var errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    errorEl.textContent = message;
    inputEl.parentElement.appendChild(errorEl);

    /* 动画结束后移除 shake 类 */
    inputEl.addEventListener('animationend', function handler() {
      inputEl.classList.remove('shake');
      inputEl.removeEventListener('animationend', handler);
    });
  }

  /**
   * 清除输入框错误状态
   * @param {HTMLElement} inputEl
   */
  function clearInputError(inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove('form-control--error');
    var errorEl = inputEl.parentElement.querySelector('.form-error');
    if (errorEl) errorEl.remove();
  }

  /**
   * 批量清除表单错误
   * @param {HTMLElement} formEl
   */
  function clearFormErrors(formEl) {
    if (!formEl) return;
    formEl.querySelectorAll('.form-control--error').forEach(function (el) {
      el.classList.remove('form-control--error');
    });
    formEl.querySelectorAll('.form-error').forEach(function (el) {
      el.remove();
    });
  }

  global.Validators = {
    validateNumber: validateNumber,
    validateInteger: validateInteger,
    validateFile: validateFile,
    checkExtension: checkExtension,
    checkSize: checkSize,
    showInputError: showInputError,
    clearInputError: clearInputError,
    clearFormErrors: clearFormErrors,
    MAX_FILE_SIZE: MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS: ALLOWED_EXTENSIONS
  };

}(window));
