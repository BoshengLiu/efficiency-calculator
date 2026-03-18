/* ============================================================
   modal.js — 通用弹窗组件
   功能：打开/关闭 / 点击外部关闭 / ESC关闭 / 可复用
   ============================================================ */
(function (global) {
  'use strict';

  var Modal = {
    _overlay: null,
    _currentModal: null,
    _onClose: null,

    /**
     * 初始化：创建遮罩层（单例）
     */
    init: function () {
      if (this._overlay) return;
      var overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.style.cssText = [
        'position:fixed;inset:0;z-index:2000;',
        'background:rgba(0,0,0,.55);',
        'display:flex;align-items:center;justify-content:center;',
        'padding:20px;',
        'opacity:0;pointer-events:none;',
        'transition:opacity 0.25s ease;'
      ].join('');
      document.body.appendChild(overlay);

      var self = this;
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) self.close();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self._currentModal) self.close();
      });

      this._overlay = overlay;
    },

    /**
     * 打开弹窗
     * @param {Object} options
     * @param {string} options.title - 标题
     * @param {string|HTMLElement} options.content - 内容
     * @param {Function} [options.onClose] - 关闭回调
     * @param {string} [options.size] - 'sm' | 'md' | 'lg'
     */
    open: function (options) {
      this.init();
      var self = this;
      options = options || {};

      /* 构建弹窗 HTML */
      var modal = document.createElement('div');
      modal.className = 'modal modal--' + (options.size || 'md');
      modal.style.cssText = [
        'background:#fff;border-radius:16px;',
        'max-width:' + (options.size === 'lg' ? '800px' : options.size === 'sm' ? '400px' : '560px') + ';',
        'width:100%;max-height:90vh;overflow-y:auto;',
        'box-shadow:0 20px 60px rgba(0,0,0,.2);',
        'transform:scale(0.94);opacity:0;',
        'transition:transform 0.25s ease,opacity 0.25s ease;'
      ].join('');

      /* 标题栏 */
      var header = document.createElement('div');
      header.style.cssText = 'padding:20px 24px;border-bottom:1px solid #eef1f7;display:flex;justify-content:space-between;align-items:center;';

      var title = document.createElement('h3');
      title.textContent = options.title || '';
      title.style.cssText = 'font-size:1.125rem;font-weight:700;color:#1a1a2e;margin:0;';

      var closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&#x2715;';
      closeBtn.style.cssText = [
        'border:none;background:none;cursor:pointer;',
        'font-size:1.25rem;color:#8a94a6;',
        'width:44px;height:44px;display:flex;align-items:center;justify-content:center;',
        'border-radius:8px;transition:background 0.15s;'
      ].join('');
      closeBtn.addEventListener('mouseenter', function () { closeBtn.style.background = '#f4f7fc'; });
      closeBtn.addEventListener('mouseleave', function () { closeBtn.style.background = 'none'; });
      closeBtn.addEventListener('click', function () { self.close(); });

      header.appendChild(title);
      header.appendChild(closeBtn);

      /* 内容区 */
      var body = document.createElement('div');
      body.style.cssText = 'padding:24px;';
      if (typeof options.content === 'string') {
        body.innerHTML = options.content;
      } else if (options.content instanceof HTMLElement) {
        body.appendChild(options.content);
      }

      modal.appendChild(header);
      modal.appendChild(body);

      /* 清空遮罩并添加新弹窗 */
      this._overlay.innerHTML = '';
      this._overlay.appendChild(modal);

      this._currentModal = modal;
      this._onClose = options.onClose || null;

      /* 禁止背景滚动 */
      document.body.style.overflow = 'hidden';

      /* 淡入动效 */
      requestAnimationFrame(function () {
        self._overlay.style.opacity = '1';
        self._overlay.style.pointerEvents = 'all';
        requestAnimationFrame(function () {
          modal.style.transform = 'scale(1)';
          modal.style.opacity = '1';
        });
      });
    },

    /**
     * 关闭弹窗
     */
    close: function () {
      var self = this;
      if (!this._overlay || !this._currentModal) return;

      this._overlay.style.opacity = '0';
      this._overlay.style.pointerEvents = 'none';
      this._currentModal.style.transform = 'scale(0.94)';
      this._currentModal.style.opacity = '0';

      setTimeout(function () {
        if (self._overlay) {
          self._overlay.innerHTML = '';
        }
        self._currentModal = null;
        document.body.style.overflow = '';
        if (typeof self._onClose === 'function') {
          self._onClose();
        }
      }, 250);
    },

    /**
     * 打开咨询弹窗（预设内容）
     */
    openConsult: function () {
      this.open({
        title: '立即咨询',
        size: 'sm',
        content: [
          '<p style="color:#555e7a;margin-bottom:20px;line-height:1.7;">',
          '感谢您的关注！请通过以下方式联系我们，我们将在 24 小时内回复您。',
          '</p>',
          '<div style="display:flex;flex-direction:column;gap:12px;">',
          '  <a href="mailto:contact@autovalue.cn" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f4f7fc;border-radius:10px;text-decoration:none;color:#1a1a2e;">',
          '    <span style="font-size:1.5rem;">📧</span>',
          '    <div><div style="font-weight:600;font-size:0.9rem;">邮件咨询</div><div style="font-size:0.8rem;color:#8a94a6;">contact@autovalue.cn</div></div>',
          '  </a>',
          '  <a href="tel:+8618888888888" style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f4f7fc;border-radius:10px;text-decoration:none;color:#1a1a2e;">',
          '    <span style="font-size:1.5rem;">📞</span>',
          '    <div><div style="font-weight:600;font-size:0.9rem;">电话咨询</div><div style="font-size:0.8rem;color:#8a94a6;">+86 188 8888 8888</div></div>',
          '  </a>',
          '  <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f4f7fc;border-radius:10px;">',
          '    <span style="font-size:1.5rem;">💬</span>',
          '    <div>',
          '      <div style="font-weight:600;font-size:0.9rem;">微信咨询</div>',
          '      <div style="font-size:0.8rem;color:#8a94a6;">扫描二维码添加好友</div>',
          '      <img src="assets/images/wechat-qr.png" alt="微信二维码" style="width:120px;height:120px;margin-top:8px;display:block;" />',
          '    </div>',
          '  </div>',
          '</div>'
        ].join('')
      });
    }
  };

  global.Modal = Modal;

}(window));
