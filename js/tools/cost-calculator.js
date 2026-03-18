/* ============================================================
   cost-calculator.js — 节省成本计算器
   公式：年节省 = 员工数 × 月薪 × 重复工时占比 × 12 × 0.8
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'avc_cost_calc';

  /* 默认示例值 */
  var DEFAULTS = {
    employees: 10,
    avgSalary: 8000,
    repeatHoursPerDay: 2,
    workDaysPerMonth: 22
  };

  var CostCalculator = {
    chart: null,
    inputs: {},
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
        '  <div class="tool-panel__header">',
        '    <span style="font-size:1.25rem;">⚙️</span>',
        '    <span class="tool-panel__title">输入参数</span>',
        '  </div>',
        '  <div class="tool-panel__body" id="cost-form">',
        this._sliderGroup('cost-employees', '团队规模（人）', this.values.employees, 1, 500, 1),
        this._sliderGroup('cost-salary', '平均月薪（元）', this.values.avgSalary, 3000, 50000, 500),
        this._sliderGroup('cost-hours', '每天重复工作时长（小时）', this.values.repeatHoursPerDay, 0.5, 8, 0.5),
        this._sliderGroup('cost-days', '每月工作天数', this.values.workDaysPerMonth, 15, 26, 1),
        '  </div>',
        '</div>',
        '<div class="tool-panel">',
        '  <div class="tool-panel__header">',
        '    <span style="font-size:1.25rem;">📊</span>',
        '    <span class="tool-panel__title">计算结果</span>',
        '  </div>',
        '  <div class="tool-panel__body">',
        '    <div class="result-card" id="cost-main-result">',
        '      <div class="result-card__value" id="cost-annual-saving">¥0</div>',
        '      <div class="result-card__label">预计年节省人力成本</div>',
        '    </div>',
        '    <div class="result-grid">',
        '      <div class="result-metric"><div class="result-metric__value" id="cost-monthly">¥0</div><div class="result-metric__label">月节省</div></div>',
        '      <div class="result-metric"><div class="result-metric__value" id="cost-roi">0%</div><div class="result-metric__label">自动化ROI</div></div>',
        '      <div class="result-metric"><div class="result-metric__value" id="cost-hours-saved">0 小时</div><div class="result-metric__label">年节省工时</div></div>',
        '    </div>',
        '    <div class="chart-container"><canvas id="cost-chart"></canvas></div>',
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
        if (typeof Analytics !== 'undefined') Analytics.track('calculator_use', { tool_id: 'cost-calculator' });
      }, 300);

      var fields = [
        { id: 'cost-employees', key: 'employees', min: 1, max: 500, label: '团队规模' },
        { id: 'cost-salary', key: 'avgSalary', min: 3000, max: 50000, label: '平均月薪' },
        { id: 'cost-hours', key: 'repeatHoursPerDay', min: 0.5, max: 8, label: '重复工作时长' },
        { id: 'cost-days', key: 'workDaysPerMonth', min: 15, max: 26, label: '工作天数' }
      ];

      fields.forEach(function (field) {
        var slider = container.querySelector('#' + field.id);
        var numInput = container.querySelector('#' + field.id + '-num');
        var display = container.querySelector('#' + field.id + '-display');

        if (slider && numInput) {
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
        }
      });
    },

    _calculate: function () {
      var v = this.values;
      var automationEfficiency = 0.80;
      var investmentRatio = 0.15;

      var dailyRepeatCost = v.employees * (v.avgSalary / v.workDaysPerMonth / 8) * v.repeatHoursPerDay;
      var monthlyRepeatCost = dailyRepeatCost * v.workDaysPerMonth;
      var annualRepeatCost = monthlyRepeatCost * 12;
      var annualSaving = annualRepeatCost * automationEfficiency;
      var annualInvestment = annualSaving * investmentRatio;
      var netSaving = annualSaving - annualInvestment;
      var roi = (netSaving / annualInvestment) * 100;
      var hoursSaved = v.employees * v.repeatHoursPerDay * v.workDaysPerMonth * 12 * automationEfficiency;

      /* 更新 DOM */
      this._setText('cost-annual-saving', Formatters.currency(netSaving, true));
      this._setText('cost-monthly', Formatters.currency(netSaving / 12, true));
      this._setText('cost-roi', Formatters.roi(roi));
      this._setText('cost-hours-saved', Formatters.timeDetailed(hoursSaved));
      this._animateResult('cost-main-result');

      /* 更新图表 */
      this._updateChart(annualRepeatCost, annualSaving, annualInvestment);
      this._save();
    },

    _updateChart: function (totalCost, saving, investment) {
      var canvas = document.getElementById('cost-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      var labels = ['自动化前年成本', '自动化节省', '自动化投入', '净节省'];
      var data = [totalCost, saving, investment, saving - investment];
      var colors = ['#dc3545', '#28a745', '#ffc107', '#1a6fc4'];

      if (this.chart) {
        this.chart.data.datasets[0].data = data;
        this.chart.update('active');
        return;
      }

      this.chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '金额（元）',
            data: data,
            backgroundColor: colors.map(function (c) { return c + 'cc'; }),
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return ' ' + Formatters.currency(ctx.raw, true);
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (val) { return Formatters.currency(val, true); }
              },
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
      if (el) {
        el.classList.remove('result-updated');
        void el.offsetWidth;
        el.classList.add('result-updated');
      }
    }
  };

  global.CostCalculator = CostCalculator;

}(window));
