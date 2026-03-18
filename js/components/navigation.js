/* ============================================================
   navigation.js — 导航组件
   功能：sticky导航 / 移动端汉堡菜单 / 滚动高亮 / localStorage状态持久化
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'avc_nav_active';

  var Navigation = {
    nav: null,
    hamburger: null,
    mobileMenu: null,
    links: [],
    sections: [],
    isMenuOpen: false,
    _scrollHandler: null,
    _resizeHandler: null,

    init: function () {
      this.nav = document.querySelector('.nav');
      if (!this.nav) return;

      this.hamburger = this.nav.querySelector('.nav__hamburger');
      this.links = Array.from(this.nav.querySelectorAll('.nav__link[data-section]'));
      this.sections = this.links.map(function (link) {
        return document.getElementById(link.dataset.section);
      }).filter(Boolean);

      this._buildMobileMenu();
      this._bindEvents();
      this._restoreActiveState();
      this._updateScrollState();
    },

    /* 构建移动端菜单（克隆链接） */
    _buildMobileMenu: function () {
      var self = this;
      var menu = document.createElement('div');
      menu.className = 'nav__mobile-menu';
      menu.style.display = 'none';
      menu.setAttribute('aria-hidden', 'true');

      this.links.forEach(function (link) {
        var clone = link.cloneNode(true);
        clone.addEventListener('click', function () { self.closeMobileMenu(); });
        menu.appendChild(clone);
      });

      /* CTA 按钮 */
      var ctaEl = this.nav.querySelector('.nav__cta');
      if (ctaEl) {
        var ctaClone = ctaEl.cloneNode(true);
        ctaClone.style.display = 'block';
        menu.appendChild(ctaClone);
      }

      document.body.appendChild(menu);
      this.mobileMenu = menu;
    },

    _bindEvents: function () {
      var self = this;

      /* 汉堡按钮 */
      if (this.hamburger) {
        this.hamburger.addEventListener('click', function () {
          self.toggleMobileMenu();
        });
      }

      /* 点击遮罩关闭 */
      document.addEventListener('click', function (e) {
        if (self.isMenuOpen &&
            !self.nav.contains(e.target) &&
            !self.mobileMenu.contains(e.target)) {
          self.closeMobileMenu();
        }
      });

      /* 滚动事件（节流） */
      this._scrollHandler = Debounce.throttle(function () {
        self._updateScrollState();
        self._highlightActiveSection();
      }, 80);
      window.addEventListener('scroll', this._scrollHandler, { passive: true });

      /* 窗口缩放：大屏时关闭移动菜单 */
      this._resizeHandler = Debounce.debounce(function () {
        if (window.innerWidth > 992 && self.isMenuOpen) {
          self.closeMobileMenu();
        }
      }, 200);
      window.addEventListener('resize', this._resizeHandler);

      /* 导航链接点击平滑滚动 */
      this.links.forEach(function (link) {
        link.addEventListener('click', function (e) {
          var sectionId = link.dataset.section;
          var target = document.getElementById(sectionId);
          if (target) {
            e.preventDefault();
            var navH = self.nav ? self.nav.offsetHeight : 68;
            var top = target.getBoundingClientRect().top + window.pageYOffset - navH - 8;
            window.scrollTo({ top: top, behavior: 'smooth' });
            self._setActive(link);
          }
        });
      });
    },

    toggleMobileMenu: function () {
      if (this.isMenuOpen) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    },

    openMobileMenu: function () {
      this.isMenuOpen = true;
      this.mobileMenu.style.display = 'flex';
      this.mobileMenu.setAttribute('aria-hidden', 'false');
      if (this.hamburger) this.hamburger.classList.add('nav__hamburger--active');
      document.body.style.overflow = 'hidden';
    },

    closeMobileMenu: function () {
      this.isMenuOpen = false;
      this.mobileMenu.style.display = 'none';
      this.mobileMenu.setAttribute('aria-hidden', 'true');
      if (this.hamburger) this.hamburger.classList.remove('nav__hamburger--active');
      document.body.style.overflow = '';
    },

    /* 滚动时更新导航阴影 */
    _updateScrollState: function () {
      if (!this.nav) return;
      if (window.pageYOffset > 10) {
        this.nav.classList.add('nav--scrolled');
      } else {
        this.nav.classList.remove('nav--scrolled');
      }
    },

    /* Intersection Observer 滚动高亮 */
    _highlightActiveSection: function () {
      var scrollY = window.pageYOffset;
      var navH = this.nav ? this.nav.offsetHeight : 68;

      var activeSection = null;
      for (var i = this.sections.length - 1; i >= 0; i--) {
        var section = this.sections[i];
        if (section && section.offsetTop - navH - 20 <= scrollY) {
          activeSection = section;
          break;
        }
      }

      var self = this;
      this.links.forEach(function (link) {
        link.classList.remove('nav__link--active');
        if (activeSection && link.dataset.section === activeSection.id) {
          link.classList.add('nav__link--active');
          self._saveActiveState(link.dataset.section);
        }
      });

      /* 同步更新移动端菜单 */
      if (this.mobileMenu) {
        var mobileLinks = this.mobileMenu.querySelectorAll('.nav__link');
        mobileLinks.forEach(function (link) {
          link.classList.remove('nav__link--active');
          if (activeSection && link.dataset.section === activeSection.id) {
            link.classList.add('nav__link--active');
          }
        });
      }
    },

    _setActive: function (link) {
      this.links.forEach(function (l) { l.classList.remove('nav__link--active'); });
      link.classList.add('nav__link--active');
      this._saveActiveState(link.dataset.section);
    },

    _saveActiveState: function (sectionId) {
      try { localStorage.setItem(STORAGE_KEY, sectionId); } catch (e) {}
    },

    _restoreActiveState: function () {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          var link = this.links.find(function (l) { return l.dataset.section === saved; });
          if (link) link.classList.add('nav__link--active');
        }
      } catch (e) {}
    },

    destroy: function () {
      if (this._scrollHandler) window.removeEventListener('scroll', this._scrollHandler);
      if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
      if (this.mobileMenu) this.mobileMenu.remove();
    }
  };

  global.Navigation = Navigation;

}(window));
