/* ============================================================
   time-calculator.js — 时间解放计算器
   公式：年节省人时 = 团队规模 × 周重复小时 × 52 × 0.85
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'avc_time_calc';

  var DEFAULTS = {
    teamSize: 8,
    weeklyRepeatHours: 10,
    tasksPerDay: 5,
    minutesPerTask: 20
  };

  var TimeCalculator = {
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
        this._sliderGroup('time-teamsize', '团队规模（人）', this.values.teamSize, 1, 200, 1),
        this._sliderGroup('time-weekly', '每人每周重复任务时长（小时）', this.values.weeklyRepeatHours, 1, 40, 0.5),
        this._sliderGroup('time-tasks', '每天处理的重复任务数', this.values.tasksPerDay, 1, 50, 1),
        this._sliderGroup('time-minutes', '每个任务平均耗时（分钟）', this.values.minutesPerTask, 5, 120, 5),
        '  </div>',
        '</div>',
        '<div class="tool-panel">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">📊</span><span class="tool-panel__title">计算结果</span></div>',
        '  <div class="tool-panel__body">',
        '    <div class="result-card" id="time-main-result">',
        '      <div class="result-card__value" id="time-annual-hours">0 小时</div>',
        '      <div class="result-card__label">每年节省总工时</div>',
        '    </div>',
        '    <div class="result-grid">',
        '      <div class="result-metric"><div class="result-metric__value" id="time-work-days">0 天</div><div class="result-metric__label">等效工作日</div></div>',
        '      <div class="result-metric"><div class="result-metric__value" id="time-per-person">0 小时</div><div class="result-metric__label">人均年节省</div></div>',
        '      <div class="result-metric"><div class="result-metric__value" id="time-efficiency">0%</div><div class="result-metric__label">效率提升</div></div>',
        '    </div>',
        '    <div class="chart-container"><canvas id="time-chart"></canvas></div>',
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
        if (typeof Analytics !== 'undefined') Analytics.track('calculator_use', { tool_id: 'time-calculator' });
      }, 300);

      var fields = [
        { id: 'time-teamsize', key: 'teamSize', min: 1, max: 200, label: '团队规模' },
        { id: 'time-weekly', key: 'weeklyRepeatHours', min: 1, max: 40, label: '周重复时长' },
        { id: 'time-tasks', key: 'tasksPerDay', min: 1, max: 50, label: '每日任务数' },
        { id: 'time-minutes', key: 'minutesPerTask', min: 5, max: 120, label: '任务耗时' }
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
      var automationRate = 0.85;
      var weeksPerYear = 52;
      var workHoursPerYear = v.teamSize * v.weeklyRepeatHours * weeksPerYear;
      var savedHours = workHoursPerYear * automationRate;
      var savedPerPerson = savedHours / v.teamSize;
      var workDays = Math.round(savedHours / 8);
      var totalWorkHoursYear = v.teamSize * 8 * 5 * 50;
      var efficiencyGain = (savedHours / totalWorkHoursYear) * 100;
      var remainingHours = workHoursPerYear - savedHours;

      this._setText('time-annual-hours', Formatters.number(Math.round(savedHours)) + ' 小时');
      this._setText('time-work-days', Formatters.number(workDays) + ' 天');
      this._setText('time-per-person', Formatters.number(Math.round(savedPerPerson)) + ' 小时');
      this._setText('time-efficiency', Formatters.percent(efficiencyGain));
      this._animateResult('time-main-result');

      this._updateChart(savedHours, remainingHours);
      this._save();
    },

    _updateChart: function (saved, remaining) {
      var canvas = document.getElementById('time-chart');
      if (!canvas || typeof Chart === 'undefined') return;

      var data = {
        labels: ['自动化节省工时', '仍需人工工时'],
        datasets: [{
          data: [Math.round(saved), Math.round(remaining)],
          backgroundColor: ['rgba(26,111,196,0.85)', 'rgba(238,241,247,0.9)'],
          borderColor: ['#1a6fc4', '#dde3ef'],
          borderWidth: 2
        }]
      };

      if (this.chart) {
        this.chart.data.datasets[0].data = data.datasets[0].data;
        this.chart.update('active');
        return;
      }

      this.chart = new Chart(canvas, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 20, font: { size: 13 } } },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  return ' ' + Formatters.number(ctx.raw) + ' 小时';
                }
              }
            }
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

  global.TimeCalculator = TimeCalculator;

}(window));
