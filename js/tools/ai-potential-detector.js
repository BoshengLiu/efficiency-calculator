/* ============================================================
   ai-potential-detector.js — AI应用潜力探测器
   业务类型多选 → 匹配AI应用场景推荐矩阵 → 水平柱状图
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'avc_ai_detector';

  /* AI 应用场景推荐矩阵
   * 每个业务类型对不同AI场景的权重贡献 */
  var BUSINESS_TYPES = [
    { id: 'document', label: '📄 文档处理', icon: '📄' },
    { id: 'data',     label: '📊 数据分析', icon: '📊' },
    { id: 'customer', label: '👥 客户服务', icon: '👥' },
    { id: 'finance',  label: '💰 财务管理', icon: '💰' },
    { id: 'hr',       label: '👔 人力资源', icon: '👔' },
    { id: 'supply',   label: '🚚 供应链', icon: '🚚' },
    { id: 'marketing',label: '📣 市场营销', icon: '📣' },
    { id: 'it',       label: '💻 IT运维', icon: '💻' }
  ];

  var AI_SCENARIOS = [
    {
      id: 'nlp',
      label: '智能文档解析',
      desc: '自动提取合同、报告、表单中的关键信息',
      weights: { document: 5, finance: 3, hr: 3, supply: 2, marketing: 1, data: 1, customer: 1, it: 0 }
    },
    {
      id: 'prediction',
      label: '预测性分析',
      desc: '基于历史数据预测销售、需求、风险趋势',
      weights: { data: 5, finance: 4, supply: 4, marketing: 3, customer: 2, document: 1, hr: 2, it: 1 }
    },
    {
      id: 'chatbot',
      label: 'AI智能客服',
      desc: '7×24小时自动回答常见问题，提升响应速度',
      weights: { customer: 5, marketing: 3, hr: 3, finance: 1, document: 1, data: 0, supply: 1, it: 2 }
    },
    {
      id: 'rpa',
      label: 'RPA流程自动化',
      desc: '自动化重复性系统操作，替代人工录入',
      weights: { finance: 5, hr: 4, supply: 4, it: 3, document: 3, data: 2, customer: 2, marketing: 1 }
    },
    {
      id: 'vision',
      label: '计算机视觉',
      desc: '自动识别图片、票据、证件中的信息',
      weights: { document: 4, finance: 4, supply: 3, hr: 2, customer: 2, marketing: 2, data: 1, it: 1 }
    },
    {
      id: 'recommendation',
      label: '智能推荐引擎',
      desc: '个性化产品/内容推荐，提升转化率',
      weights: { marketing: 5, customer: 4, data: 3, supply: 2, finance: 1, document: 0, hr: 0, it: 1 }
    }
  ];

  var AIPotentialDetector = {
    chart: null,
    selectedTypes: [],

    init: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      this._restore();
      this._renderUI(container);
      this._bindEvents(container);
      this._calculate();
    },

    _restore: function () {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        this.selectedTypes = saved ? JSON.parse(saved) : ['document', 'data'];
      } catch (e) {
        this.selectedTypes = ['document', 'data'];
      }
    },

    _save: function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.selectedTypes)); } catch (e) {}
    },

    _renderUI: function (container) {
      var self = this;
      var tagsHtml = BUSINESS_TYPES.map(function (bt) {
        var selected = self.selectedTypes.indexOf(bt.id) !== -1 ? ' tag-option--selected' : '';
        return '<div class="tag-option' + selected + '" data-type="' + bt.id + '">' + bt.label + '</div>';
      }).join('');

      container.innerHTML = [
        '<div class="tool-panel">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">🎯</span><span class="tool-panel__title">选择您的业务类型（可多选）</span></div>',
        '  <div class="tool-panel__body">',
        '    <div class="tag-selector" id="ai-type-selector">' + tagsHtml + '</div>',
        '    <p style="font-size:0.8rem;color:var(--color-text-muted);margin-top:8px;">已选 <span id="ai-selected-count">' + this.selectedTypes.length + '</span> 项业务类型</p>',
        '    <div id="ai-no-selection" style="display:' + (this.selectedTypes.length ? 'none' : 'block') + ';padding:20px;text-align:center;color:var(--color-text-muted);">',
        '      请至少选择一个业务类型',
        '    </div>',
        '  </div>',
        '</div>',
        '<div class="tool-panel">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">🤖</span><span class="tool-panel__title">AI应用场景推荐</span></div>',
        '  <div class="tool-panel__body">',
        '    <div class="chart-container"><canvas id="ai-chart"></canvas></div>',
        '    <div id="ai-recommendations" style="margin-top:16px;display:flex;flex-direction:column;gap:10px;"></div>',
        '  </div>',
        '</div>'
      ].join('');
    },

    _bindEvents: function (container) {
      var self = this;
      container.addEventListener('click', function (e) {
        var tag = e.target.closest('.tag-option');
        if (!tag) return;

        var type = tag.dataset.type;
        var idx = self.selectedTypes.indexOf(type);

        if (idx !== -1) {
          self.selectedTypes.splice(idx, 1);
          tag.classList.remove('tag-option--selected');
        } else {
          self.selectedTypes.push(type);
          tag.classList.add('tag-option--selected');
        }

        var countEl = container.querySelector('#ai-selected-count');
        if (countEl) countEl.textContent = self.selectedTypes.length;

        var noSel = container.querySelector('#ai-no-selection');
        if (noSel) noSel.style.display = self.selectedTypes.length ? 'none' : 'block';

        self._calculate();
        self._save();
        if (typeof Analytics !== 'undefined') Analytics.track('calculator_use', { tool_id: 'ai-potential-detection' });
      });
    },

    _calculate: function () {
      if (!this.selectedTypes.length) return;

      var scores = AI_SCENARIOS.map(function (scenario) {
        var total = 0;
        var maxPossible = 0;
        this.selectedTypes.forEach(function (type) {
          total += (scenario.weights[type] || 0);
          maxPossible += 5;
        });
        return {
          scenario: scenario,
          score: maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0
        };
      }, this);

      scores.sort(function (a, b) { return b.score - a.score; });

      this._updateChart(scores);
      this._updateRecommendations(scores);
    },

    _updateChart: function (scores) {
      var canvas = document.getElementById('ai-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      var labels = scores.map(function (s) { return s.scenario.label; });
      var data = scores.map(function (s) { return s.score; });
      var colors = data.map(function (v) {
        if (v >= 70) return 'rgba(40,167,69,0.85)';
        if (v >= 40) return 'rgba(26,111,196,0.85)';
        return 'rgba(138,148,166,0.7)';
      });

      if (this.chart) {
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.data.datasets[0].backgroundColor = colors;
        this.chart.update('active');
        return;
      }

      this.chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '匹配度',
            data: data,
            backgroundColor: colors,
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) { return ' 匹配度：' + ctx.raw + '%'; }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              ticks: { callback: function (v) { return v + '%'; } },
              grid: { color: 'rgba(0,0,0,.06)' }
            },
            y: { grid: { display: false } }
          }
        }
      });
    },

    _updateRecommendations: function (scores) {
      var container = document.getElementById('ai-recommendations');
      if (!container) return;

      var topScores = scores.slice(0, 3);
      container.innerHTML = topScores.map(function (item) {
        var color = item.score >= 70 ? '#28a745' : item.score >= 40 ? '#1a6fc4' : '#8a94a6';
        var badge = item.score >= 70 ? '强烈推荐' : item.score >= 40 ? '值得探索' : '潜力一般';
        return [
          '<div style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:var(--color-bg-alt);border-radius:10px;border-left:4px solid ' + color + ';">',
          '  <div style="font-size:1.5rem;line-height:1;">🤖</div>',
          '  <div style="flex:1;">',
          '    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">',
          '      <span style="font-weight:700;font-size:0.95rem;">' + item.scenario.label + '</span>',
          '      <span style="font-size:0.75rem;font-weight:600;color:' + color + ';background:' + color + '20;padding:2px 8px;border-radius:20px;">' + badge + ' ' + item.score + '%</span>',
          '    </div>',
          '    <div style="font-size:0.85rem;color:var(--color-text-secondary);">' + item.scenario.desc + '</div>',
          '  </div>',
          '</div>'
        ].join('');
      }).join('');
    }
  };

  global.AIPotentialDetector = AIPotentialDetector;

}(window));
