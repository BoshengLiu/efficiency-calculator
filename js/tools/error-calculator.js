/* ============================================================
   error-calculator.js — 错误率降低计算器
   公式：年节省 = 月处理量 × 12 × 错误率% × 修复成本 × 0.9
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'avc_error_calc';

  var DEFAULTS = {
    monthlyVolume: 1000,
    errorRate: 5,
    repairCost: 200,
    penaltyCost: 500
  };

  var ErrorCalculator = {
    chart: null,
    values: {},

    init: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      this._restoreOrDefault();
      this._renderUI(container);
      this._bindEvents(container);
      this._calculate();
    },

    _restoreOrDefault: function () {
      try {
        var saved = localStorage.getItem(STORAGE_KEY);
        this.values = saved ? JSON.parse(saved) : Object.assign({}, DEFAULTS);
      } catch (e) {
        this.values = Object.assign({}, DEFAULTS);
      }
    },

    _save: function () {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.values)); } catch (e) {}
    },

    _renderUI: function (container) {
      container.innerHTML = [
        '<div class="tool-panel">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">⚙️</span><span class="tool-panel__title">输入参数</span></div>',
        '  <div class="tool-panel__body">',
        this._sliderGroup('err-volume', '月处理文档/任务量（件）', this.values.monthlyVolume, 100, 100000, 100),
        this._sliderGroup('err-rate', '当前人工错误率（%）', this.values.errorRate, 0.1, 30, 0.1),
        this._sliderGroup('err-repair', '每次错误修复成本（元）', this.values.repairCost, 50, 5000, 50),
        this._sliderGroup('err-penalty', '每次错误间接损失（元）', this.values.penaltyCost, 0, 10000, 100),
        '  </div>',
        '</div>',
        '<div class="tool-panel">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">📊</span><span class="tool-panel__title">计算结果</span></div>',
        '  <div class="tool-panel__body">',
        '    <div class="result-card" id="err-main-result">',
        '      <div class="result-card__value" id="err-annual-saving">¥0</div>',
        '      <div class="result-card__label">预计年节省错误成本</div>',
        '    </div>',
        '    <div class="result-grid">',
        '      <div class="result-metric"><div class="result-metric__value" id="err-count-before">0</div><div class="result-metric__label">自动化前年错误量</div></div>',
        '      <div class="result-metric"><div class="result-metric__value" id="err-count-after">0</div><div class="result-metric__label">自动化后年错误量</div></div>',
        '      <div class="result-metric"><div class="result-metric__value" id="err-rate-after">0%</div><div class="result-metric__label">残余错误率</div></div>',
        '    </div>',
        '    <div class="chart-container"><canvas id="err-chart"></canvas></div>',
        '  </div>',
        '</div>'
      ].join('');
    },

    _sliderGroup: function (id, label, val, min, max, step) {
      return [
        '<div class="form-group">',
        '  <label class="form-label" for="' + id + '">',
        '    <span>' + label + '</span>',
        '    <span class="form-label__value" id="' + id + '-display">' + val + '</span>',
        '  </label>',
        '  <input type="range" class="slider" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '">',
        '  <input type="number" class="form-control" id="' + id + '-num" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" style="margin-top:6px;">',
        '</div>'
      ].join('');
    },

    _bindEvents: function (container) {
      var self = this;
      var debouncedCalc = Debounce.debounce(function () {
        self._calculate();
        if (typeof Analytics !== 'undefined') Analytics.track('calculator_use', { tool_id: 'error-calculator' });
      }, 300);

      var fields = [
        { id: 'err-volume', key: 'monthlyVolume', min: 100, max: 100000, label: '月处理量' },
        { id: 'err-rate', key: 'errorRate', min: 0.1, max: 30, label: '错误率' },
        { id: 'err-repair', key: 'repairCost', min: 50, max: 5000, label: '修复成本' },
        { id: 'err-penalty', key: 'penaltyCost', min: 0, max: 10000, label: '间接损失' }
      ];

      fields.forEach(function (field) {
        var slider = container.querySelector('#' + field.id);
        var numInput = container.querySelector('#' + field.id + '-num');
        var display = container.querySelector('#' + field.id + '-display');
        if (!slider || !numInput) return;

        slider.addEventListener('input', function () {
          self.values[field.key] = parseFloat(slider.value);
          numInput.value = slider.value;
          display.textContent = slider.value;
          Validators.clearInputError(numInput);
          debouncedCalc();
        });

        numInput.addEventListener('input', function () {
          var result = Validators.validateNumber(numInput.value, field.min, field.max, field.label);
          if (result.valid) {
            self.values[field.key] = result.value;
            slider.value = result.value;
            display.textContent = result.value;
            Validators.clearInputError(numInput);
            debouncedCalc();
          } else {
            Validators.showInputError(numInput, result.message);
          }
        });
      });
    },

    _calculate: function () {
      var v = this.values;
      var automationErrorReduction = 0.90;
      var annualVolume = v.monthlyVolume * 12;
      var errorsPerYear = annualVolume * (v.errorRate / 100);
      var costPerError = v.repairCost + v.penaltyCost;
      var totalErrorCostBefore = errorsPerYear * costPerError;
      var errorsAfter = errorsPerYear * (1 - automationErrorReduction);
      var totalErrorCostAfter = errorsAfter * costPerError;
      var annualSaving = totalErrorCostBefore - totalErrorCostAfter;
      var newErrorRate = v.errorRate * (1 - automationErrorReduction);

      this._setText('err-annual-saving', Formatters.currency(annualSaving, true));
      this._setText('err-count-before', Formatters.number(Math.round(errorsPerYear)));
      this._setText('err-count-after', Formatters.number(Math.round(errorsAfter)));
      this._setText('err-rate-after', Formatters.percent(newErrorRate));
      this._animateResult('err-main-result');

      this._updateChart(totalErrorCostBefore, totalErrorCostAfter);
      this._save();
    },

    _updateChart: function (before, after) {
      var canvas = document.getElementById('err-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      var data = {
        labels: ['自动化前', '自动化后'],
        datasets: [{
          label: '年错误成本（元）',
          data: [Math.round(before), Math.round(after)],
          backgroundColor: ['rgba(220,53,69,0.8)', 'rgba(40,167,69,0.8)'],
          borderColor: ['#dc3545', '#28a745'],
          borderWidth: 2,
          borderRadius: 8
        }]
      };

      if (this.chart) {
        this.chart.data.datasets[0].data = data.datasets[0].data;
        this.chart.update('active');
        return;
      }

      this.chart = new Chart(canvas, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) { return ' ' + Formatters.currency(ctx.raw, true); }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: function (v) { return Formatters.currency(v, true); } },
              grid: { color: 'rgba(0,0,0,.06)' }
            },
            x: { grid: { display: false } }
          }
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

  global.ErrorCalculator = ErrorCalculator;

}(window));
