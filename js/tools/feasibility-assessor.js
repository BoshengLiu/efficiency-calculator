/* ============================================================
   feasibility-assessor.js — 自动化可行性评估器
   问卷5题×20分，输出低/中/高可行性 + 雷达图
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'avc_feasibility';

  var QUESTIONS = [
    {
      id: 'frequency',
      title: '任务执行频率',
      dimension: '频率',
      options: [
        { value: 4, label: '每天多次（≥3次/天）' },
        { value: 3, label: '每天1-2次' },
        { value: 2, label: '每周数次' },
        { value: 1, label: '每月数次或更低' }
      ]
    },
    {
      id: 'rule',
      title: '任务规则性',
      dimension: '规则性',
      options: [
        { value: 4, label: '完全规则，有固定流程和标准' },
        { value: 3, label: '大部分规则，少量例外情况' },
        { value: 2, label: '有一定规则，但存在较多变化' },
        { value: 1, label: '高度依赖人工判断' }
      ]
    },
    {
      id: 'dataVolume',
      title: '数据处理规模',
      dimension: '数据量',
      options: [
        { value: 4, label: '大量（每次处理>100条记录/文件）' },
        { value: 3, label: '中等（10-100条）' },
        { value: 2, label: '少量（<10条）' },
        { value: 1, label: '极少（单一记录）' }
      ]
    },
    {
      id: 'currentTool',
      title: '当前工具的数字化程度',
      dimension: '数字化',
      options: [
        { value: 4, label: '完全数字化（Excel/系统操作）' },
        { value: 3, label: '主要数字化，少量纸质' },
        { value: 2, label: '混合（数字+纸质各半）' },
        { value: 1, label: '主要依赖纸质/手工' }
      ]
    },
    {
      id: 'impact',
      title: '错误带来的影响',
      dimension: '影响度',
      options: [
        { value: 4, label: '非常高（错误导致严重损失/合规风险）' },
        { value: 3, label: '较高（明显影响业务效率或质量）' },
        { value: 2, label: '一般（可快速纠正）' },
        { value: 1, label: '较低（错误影响可忽略）' }
      ]
    }
  ];

  var LEVELS = [
    { min: 0,  max: 39,  label: '较低可行性', color: '#dc3545', icon: '🔍', desc: '当前场景自动化改造难度较大，建议先进行流程梳理和数字化改造。' },
    { min: 40, max: 59,  label: '中等可行性', color: '#ffc107', icon: '⚡', desc: '有一定自动化潜力，可从规则性强的环节切入，逐步推进。' },
    { min: 60, max: 79,  label: '较高可行性', color: '#17a2b8', icon: '🚀', desc: '自动化可行性较高，建议尽快启动 POC 验证，预期收益显著。' },
    { min: 80, max: 100, label: '强烈推荐', color: '#28a745', icon: '✅', desc: '非常适合自动化！此类场景投入产出比极高，建议立即行动。' }
  ];

  var FeasibilityAssessor = {
    chart: null,
    answers: {},

    init: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      this._restoreAnswers();
      this._renderUI(container);
      this._bindEvents(container);
      this._calculate();
    },

    _restoreAnswers: function () {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        this.answers = saved ? JSON.parse(saved) : {};
        /* 默认值：每题选第二项（中等）*/
        QUESTIONS.forEach(function (q) {
          if (this.answers[q.id] === undefined) this.answers[q.id] = 3;
        }, this);
      } catch (e) {
        var self = this;
        this.answers = {};
        QUESTIONS.forEach(function (q) { self.answers[q.id] = 3; });
      }
    },

    _save: function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.answers)); } catch (e) {}
    },

    _renderUI: function (container) {
      var questionsHtml = QUESTIONS.map(function (q, idx) {
        var optionsHtml = q.options.map(function (opt) {
          var selected = (this.answers[q.id] === opt.value) ? ' question-option--selected' : '';
          return [
            '<div class="question-option' + selected + '" data-q="' + q.id + '" data-v="' + opt.value + '">',
            '  <div class="question-option__radio"></div>',
            '  <span class="question-option__label">' + opt.label + '</span>',
            '</div>'
          ].join('');
        }, this).join('');

        return [
          '<div class="question-group">',
          '  <div class="question-group__title">Q' + (idx + 1) + '. ' + q.title + '</div>',
          '  <div class="question-options">' + optionsHtml + '</div>',
          '</div>'
        ].join('');
      }, this).join('');

      container.innerHTML = [
        '<div class="tool-panel">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">📋</span><span class="tool-panel__title">评估问卷（5题）</span></div>',
        '  <div class="tool-panel__body" id="feasibility-questions">' + questionsHtml + '</div>',
        '</div>',
        '<div class="tool-panel">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">📊</span><span class="tool-panel__title">评估结果</span></div>',
        '  <div class="tool-panel__body">',
        '    <div id="feasibility-result-card" class="result-card">',
        '      <div class="result-card__value" id="feasibility-score">0 分</div>',
        '      <div class="result-card__label" id="feasibility-level">待评估</div>',
        '    </div>',
        '    <div class="level-indicator" id="feasibility-level-bars">',
        '      <div class="level-bar" id="fb-bar-0"></div>',
        '      <div class="level-bar" id="fb-bar-1"></div>',
        '      <div class="level-bar" id="fb-bar-2"></div>',
        '      <div class="level-bar" id="fb-bar-3"></div>',
        '    </div>',
        '    <div id="feasibility-desc" style="padding:14px;background:var(--color-bg-alt);border-radius:10px;font-size:0.9rem;color:var(--color-text-secondary);line-height:1.7;"></div>',
        '    <div class="chart-container"><canvas id="feasibility-chart"></canvas></div>',
        '  </div>',
        '</div>'
      ].join('');
    },

    _bindEvents: function (container) {
      var self = this;
      container.addEventListener('click', function (e) {
        var option = e.target.closest('.question-option');
        if (!option) return;

        var qId = option.dataset.q;
        var val = parseInt(option.dataset.v, 10);
        self.answers[qId] = val;

        /* 更新选中状态 */
        var group = option.closest('.question-options');
        group.querySelectorAll('.question-option').forEach(function (el) {
          el.classList.remove('question-option--selected');
        });
        option.classList.add('question-option--selected');

        self._calculate();
        self._save();
        if (typeof Analytics !== 'undefined') Analytics.track('calculator_use', { tool_id: 'feasibility-assessment' });
      });
    },

    _calculate: function () {
      var totalScore = 0;
      var dimensionScores = [];
      var self = this;

      QUESTIONS.forEach(function (q) {
        var val = self.answers[q.id] || 1;
        var score = (val / 4) * 100;
        totalScore += val;
        dimensionScores.push(score);
      });

      var maxScore = QUESTIONS.length * 4;
      var percent = Math.round((totalScore / maxScore) * 100);

      var level = LEVELS[0];
      for (var i = LEVELS.length - 1; i >= 0; i--) {
        if (percent >= LEVELS[i].min) { level = LEVELS[i]; break; }
      }

      /* 更新结果卡片 */
      var card = document.getElementById('feasibility-result-card');
      if (card) card.style.background = 'linear-gradient(135deg, ' + level.color + ', ' + level.color + 'cc)';

      this._setText('feasibility-score', level.icon + ' ' + percent + ' 分');
      this._setText('feasibility-level', level.label);

      var desc = document.getElementById('feasibility-desc');
      if (desc) desc.textContent = level.desc;

      /* 进度条 */
      var levelIdx = LEVELS.indexOf(level);
      for (var j = 0; j < 4; j++) {
        var bar = document.getElementById('fb-bar-' + j);
        if (!bar) continue;
        bar.className = 'level-bar';
        if (j <= levelIdx) {
          if (levelIdx === 0) bar.classList.add('level-bar--active-low');
          else if (levelIdx <= 1) bar.classList.add('level-bar--active-medium');
          else bar.classList.add('level-bar--active-high');
        }
      }

      this._updateChart(dimensionScores);
      this._animateResult('feasibility-result-card');
    },

    _updateChart: function (scores) {
      var canvas = document.getElementById('feasibility-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      var labels = QUESTIONS.map(function (q) { return q.dimension; });

      if (this.chart) {
        this.chart.data.datasets[0].data = scores;
        this.chart.update('active');
        return;
      }

      this.chart = new Chart(canvas, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: '可行性得分',
            data: scores,
            backgroundColor: 'rgba(26,111,196,0.2)',
            borderColor: '#1a6fc4',
            borderWidth: 2,
            pointBackgroundColor: '#1a6fc4',
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 25, font: { size: 11 } },
              grid: { color: 'rgba(0,0,0,.08)' },
              pointLabels: { font: { size: 12, weight: '600' } }
            }
          },
          plugins: { legend: { display: false } }
        }
      });
    },

    _setText: function (id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    },

    _animateResult: function (id) {
      var el = document.getElementById(id);
      if (el) { el.classList.remove('result-updated'); void el.offsetWidth; el.classList.add('result-updated'); }
    }
  };

  global.FeasibilityAssessor = FeasibilityAssessor;

}(window));
