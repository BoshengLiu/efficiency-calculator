/* ============================================================
   document-parser-demo.js — 文档解析能力演示器
   ⚠️ 安全说明：文件仅在用户浏览器本地处理，不上传至任何服务器。
      使用三重安全校验：① 扩展名白名单 ② 文件大小限制 ③ MIME字节头校验
   ============================================================ */
(function (global) {
  'use strict';

  var DocumentParserDemo = {
    _container: null,

    init: function (containerId) {
      var container = document.getElementById(containerId);
      if (!container) return;
      this._container = container;
      this._renderUI(container);
      this._bindEvents(container);
    },

    _renderUI: function (container) {
      container.innerHTML = [
        /* 安全说明 */
        '<div style="display:flex;align-items:center;justify-content:center;margin-bottom:16px;">',
        '  <div class="security-badge">🔒 文件仅在本地浏览器处理，不上传服务器</div>',
        '</div>',

        /* 工具面板：上传区 */
        '<div class="tool-panel" style="max-width:680px;margin:0 auto;">',
        '  <div class="tool-panel__header"><span style="font-size:1.25rem;">📤</span><span class="tool-panel__title">上传文档（演示解析）</span></div>',
        '  <div class="tool-panel__body">',
        '    <div class="file-upload" id="doc-dropzone">',
        '      <div class="file-upload__icon">📄</div>',
        '      <div class="file-upload__title">拖放文件到此处，或点击选择</div>',
        '      <div class="file-upload__hint">支持 PDF · DOCX · TXT · JPG · PNG · WEBP &nbsp;|&nbsp; 最大 5MB</div>',
        '      <input type="file" class="file-upload__input" id="doc-file-input" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,.bmp">',
        '    </div>',
        '    <div id="doc-error" style="display:none;" class="form-error" style="margin-top:8px;"></div>',
        '    <div id="doc-progress-area" style="display:none;margin-top:16px;">',
        '      <div style="display:flex;justify-content:space-between;font-size:0.875rem;color:var(--color-text-secondary);margin-bottom:8px;">',
        '        <span id="doc-status-text">正在分析...</span>',
        '        <span id="doc-progress-pct">0%</span>',
        '      </div>',
        '      <div class="progress"><div class="progress__bar" id="doc-progress-bar" style="width:0%"></div></div>',
        '    </div>',
        '  </div>',
        '</div>',

        /* 解析结果（初始隐藏） */
        '<div id="doc-result-area" style="display:none;max-width:680px;margin:16px auto 0;">',
        '  <div class="tool-panel">',
        '    <div class="tool-panel__header"><span style="font-size:1.25rem;">🔍</span><span class="tool-panel__title">解析结果预览</span></div>',
        '    <div class="tool-panel__body" id="doc-result-content"></div>',
        '  </div>',
        '</div>'
      ].join('');
    },

    _bindEvents: function (container) {
      var self = this;
      var dropzone = container.querySelector('#doc-dropzone');
      var fileInput = container.querySelector('#doc-file-input');

      /* 点击上传 */
      dropzone.addEventListener('click', function () { fileInput.click(); });

      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files[0]) {
          self._processFile(fileInput.files[0]);
          fileInput.value = '';
        }
      });

      /* 拖放上传 */
      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropzone.classList.add('file-upload--dragover');
      });

      dropzone.addEventListener('dragleave', function () {
        dropzone.classList.remove('file-upload--dragover');
      });

      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropzone.classList.remove('file-upload--dragover');
        var files = e.dataTransfer.files;
        if (files && files[0]) self._processFile(files[0]);
      });
    },

    /**
     * 处理文件（含三重安全校验）
     * ⚠️ 安全关键点：在读取任何文件内容前先完成所有校验
     */
    _processFile: function (file) {
      var self = this;
      this._hideError();
      this._hideResult();

      /* 三重校验（Validators模块）*/
      Validators.validateFile(file, function (result) {
        if (!result.valid) {
          self._showError(result.message);
          return;
        }

        /* 校验通过，开始模拟解析 */
        self._simulateParsing(file);
        if (typeof Analytics !== 'undefined') Analytics.track('calculator_use', { tool_id: 'document-parser-demo' });
      });
    },

    _simulateParsing: function (file) {
      var self = this;
      var progressArea = this._container.querySelector('#doc-progress-area');
      var progressBar = this._container.querySelector('#doc-progress-bar');
      var progressPct = this._container.querySelector('#doc-progress-pct');
      var statusText = this._container.querySelector('#doc-status-text');

      progressArea.style.display = 'block';

      var ext = file.name.split('.').pop().toLowerCase();
      var isImage = ['jpg', 'jpeg', 'png', 'webp', 'bmp'].indexOf(ext) !== -1;

      var steps = isImage ? [
        { pct: 15, text: '读取图像元数据...' },
        { pct: 35, text: '分析图像色彩和构成...' },
        { pct: 55, text: '检测文字区域...' },
        { pct: 75, text: '识别图像内容...' },
        { pct: 90, text: '生成分析报告...' },
        { pct: 100, text: '分析完成！' }
      ] : [
        { pct: 15, text: '读取文件元信息...' },
        { pct: 35, text: '识别文档结构...' },
        { pct: 55, text: '提取文本内容...' },
        { pct: 75, text: '分析关键段落...' },
        { pct: 90, text: '生成结构化数据...' },
        { pct: 100, text: '解析完成！' }
      ];

      var stepIdx = 0;

      function nextStep() {
        if (stepIdx >= steps.length) {
          /* 解析"完成"后展示结果 */
          setTimeout(function () {
            progressArea.style.display = 'none';
            self._showResult(file);
          }, 400);
          return;
        }

        var step = steps[stepIdx++];
        progressBar.style.width = step.pct + '%';
        progressPct.textContent = step.pct + '%';
        statusText.textContent = step.text;

        var delay = step.pct < 90 ? 400 + Math.random() * 300 : 600;
        setTimeout(nextStep, delay);
      }

      nextStep();
    },

    /**
     * 对字符串进行 HTML 转义，防止 XSS 注入
     * ⚠️ 安全关键：所有来自用户输入（如文件名）在插入 innerHTML 前必须经过此函数处理
     */
    _escapeHtml: function (str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * 展示模拟解析结果
     * 注：所有结果均为模拟数据，用于演示目的
     */
    _showResult: function (file) {
      var resultArea = this._container.querySelector('#doc-result-area');
      var resultContent = this._container.querySelector('#doc-result-content');
      var ext = file.name.split('.').pop().toLowerCase();
      var sizekb = (file.size / 1024).toFixed(1);

      /* 根据文件类型生成不同模拟结果 */
      var mockData = this._generateMockData(ext, file.name, sizekb);

      /* ⚠️ 安全关键：file.name 来自用户，必须转义后才能用于 innerHTML */
      var safeName = this._escapeHtml(file.name);

      resultContent.innerHTML = [
        /* 文件信息 */
        '<div class="parse-item">',
        '  <div class="parse-item__icon">📋</div>',
        '  <div class="parse-item__content">',
        '    <div class="parse-item__label">文件信息</div>',
        '    <div class="parse-item__value">',
        '      <strong>' + safeName + '</strong> &nbsp;|&nbsp; ',
        '      类型：' + ext.toUpperCase() + ' &nbsp;|&nbsp; ',
        '      大小：' + sizekb + ' KB',
        '    </div>',
        '  </div>',
        '</div>',

        /* 文档统计 */
        '<div class="parse-item">',
        '  <div class="parse-item__icon">📊</div>',
        '  <div class="parse-item__content">',
        '    <div class="parse-item__label">文档统计</div>',
        '    <div class="parse-item__value">' + mockData.stats + '</div>',
        '  </div>',
        '</div>',

        /* 识别到的结构 */
        '<div class="parse-item">',
        '  <div class="parse-item__icon">🔖</div>',
        '  <div class="parse-item__content">',
        '    <div class="parse-item__label">文档结构</div>',
        '    <div class="parse-item__value">' + mockData.structure + '</div>',
        '  </div>',
        '</div>',

        /* 关键信息提取 */
        '<div class="parse-item">',
        '  <div class="parse-item__icon">🔑</div>',
        '  <div class="parse-item__content">',
        '    <div class="parse-item__label">关键信息提取（示例）</div>',
        '    <div class="parse-item__value">' + mockData.keywords + '</div>',
        '  </div>',
        '</div>',

        /* 自动化建议 */
        '<div class="parse-item" style="border-left-color:var(--color-success);">',
        '  <div class="parse-item__icon">🚀</div>',
        '  <div class="parse-item__content">',
        '    <div class="parse-item__label">自动化处理建议</div>',
        '    <div class="parse-item__value">' + mockData.suggestion + '</div>',
        '  </div>',
        '</div>',

        '<p style="font-size:0.75rem;color:var(--color-text-muted);text-align:center;margin-top:12px;">',
        '  ℹ️ 以上为演示结果，实际部署后将通过服务端 AI 引擎进行真实解析',
        '</p>'
      ].join('');

      resultArea.style.display = 'block';
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    _generateMockData: function (ext, filename, sizekb) {
      /* 图片类型：模拟图像分析结果 */
      var IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'bmp'];
      if (IMAGE_EXTS.indexOf(ext) !== -1) {
        /* 用文件大小估算分辨率（经验系数）：JPG 压缩比约1:10，PNG/BMP 约1:3 */
        var compressionRatio = (ext === 'png' || ext === 'bmp') ? 3 : 10;
        var estimatedPixels = Math.round(parseFloat(sizekb) * 1024 * compressionRatio);
        var estimatedW = Math.round(Math.sqrt(estimatedPixels * 1.33));
        var estimatedH = Math.round(estimatedW / 1.33);
        return {
          stats: '预计分辨率：约 ' + estimatedW + ' × ' + estimatedH + ' 像素'
                 + ' &nbsp;|&nbsp; 色彩模式：RGB（模拟识别）'
                 + ' &nbsp;|&nbsp; 格式：' + ext.toUpperCase(),
          structure: '图像区域分割：前景主体 / 背景 / 文字区域（模拟识别）',
          keywords: '检测到文字区域：约 ' + Math.ceil(parseFloat(sizekb) / 20) + ' 行'
                    + ' &nbsp;|&nbsp; 置信度 &gt;92%（模拟）',
          suggestion: '该图片适合使用 Python Pillow + Tesseract OCR 进行文字提取，'
                      + '或使用 OpenCV 进行目标检测与区域识别，批量处理效率提升约 80%'
        };
      }

      if (ext === 'pdf') {
        return {
          stats: '预计页数：' + Math.ceil(parseFloat(sizekb) / 50) + ' 页 &nbsp;|&nbsp; 预计字数：约 ' + (Math.ceil(parseFloat(sizekb) / 50) * 800) + ' 字',
          structure: '封面 → 目录 → 正文（3章）→ 附录 → 参考文献（模拟识别）',
          keywords: '合同金额、甲方、乙方、签署日期、违约条款（模拟提取）',
          suggestion: '该文档适合使用 Python pdfplumber 提取结构化数据，可自动建立索引数据库，批量处理效率提升约 85%'
        };
      }
      if (ext === 'docx') {
        return {
          stats: '预计段落数：' + Math.ceil(parseFloat(sizekb) / 3) + ' 段 &nbsp;|&nbsp; 预计字数：约 ' + Math.ceil(parseFloat(sizekb) * 120) + ' 字',
          structure: '标题 → 摘要 → 正文段落 → 表格（2个）→ 结论（模拟识别）',
          keywords: '项目名称、负责人、截止日期、预算、里程碑（模拟提取）',
          suggestion: '该文档适合使用 python-docx 进行批量信息提取，可与 Excel/数据库联动，人工录入时间节省约 90%'
        };
      }
      return {
        stats: '行数：约 ' + Math.ceil(parseFloat(sizekb) * 40) + ' 行 &nbsp;|&nbsp; 字符数：约 ' + Math.ceil(parseFloat(sizekb) * 1000),
        structure: '纯文本结构，检测到标题行、数据行和分隔符（模拟识别）',
        keywords: '日期、金额、状态、编号等结构化字段（模拟提取）',
        suggestion: '该文本文件适合使用正则表达式或 NLP 进行信息提取，可与 pandas 结合进行批量数据清洗'
      };
    },

    _showError: function (msg) {
      var errEl = this._container.querySelector('#doc-error');
      if (errEl) { errEl.textContent = msg; errEl.style.display = 'flex'; }
      var dropzone = this._container.querySelector('#doc-dropzone');
      if (dropzone) dropzone.classList.add('shake');
      setTimeout(function () { if (dropzone) dropzone.classList.remove('shake'); }, 400);
    },

    _hideError: function () {
      var errEl = this._container.querySelector('#doc-error');
      if (errEl) errEl.style.display = 'none';
    },

    _hideResult: function () {
      var area = this._container.querySelector('#doc-result-area');
      if (area) area.style.display = 'none';
    }
  };

  global.DocumentParserDemo = DocumentParserDemo;

}(window));
