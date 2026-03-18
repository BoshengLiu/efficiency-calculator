# 自动化价值展示中心

一个用于展示 Python 自动化服务能力和价值的专业网站。该网站旨在通过互动式工具和清晰的价值主张，吸引潜在客户并引导其进行咨询。

## 项目概述

**目标**: 打造一个专业、清晰、可信的数字名片，集中展示自动化服务能力。

**核心理念**: 通过互动式工具量化自动化带来的效率提升、成本节约和错误减少，吸引潜在客户。

**设计风格**: 现代、简洁、科技感。主色调为蓝色、白色、灰色，辅以橙色/绿色作为强调色。

## 功能模块

### 1. 首页 Banner

- **功能**: 吸引眼球，明确传达网站主旨。
- **内容**:
    - 主标题: `让重复工作自动化，让您的团队专注核心价值`
    - 副标题: `Python自动化专家 | 专注文档处理与AI应用 | 为您量化效率提升`
    - 主行动按钮: `开始探索您的自动化潜力`

### 2. 核心价值主张

- **功能**: 清晰阐述目标客户痛点，并提出解决方案。
- **内容**: 对比展示客户面临的挑战（如重复处理文档、数据利用率低）与提供的自动化解决方案（如文档智能解析、AI辅助决策）。

### 3. 互动工具展示区 (核心)

- **功能**: 网站的核心区域，提供6个互动式计算器和演示器。
- **工具列表**:
    - **节省成本计算器**: 量化自动化为您节省的人力成本。
    - **时间解放计算器**: 看看自动化能为您释放多少宝贵时间。
    - **错误率降低计算器**: 量化自动化在提升精确性上的优势。
    - **自动化可行性评估器**: 快速判断您的需求是否适合自动化。
    - **AI应用潜力探测器**: 探索AI如何为您的业务赋能。
    - **文档解析能力演示器**: (安全)在线演示核心文档处理能力。

### 4. 案例与成果展示

- **功能**: 用真实的案例或模拟结果增强说服力。
- **内容**: 展示行业场景、面临挑战、解决方案及最终效果。

### 5. 行动召唤 (CTA)

- **功能**: 引导访客采取下一步行动（如咨询、下载资料）。
- **内容**:
    - 标题: `准备好让您的业务更高效了吗？`
    - 主行动按钮: `立即咨询`

### 6. 页脚

- **功能**: 提供基础联系信息和版权声明。

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **设计**: **PC端优先，兼顾移动端自适应**。确保所有交互工具在桌面端和手机上都能顺畅使用。
- **性能**: 注重加载速度和跨浏览器兼容性
- **安全**: 对于文档上传功能，实施严格的文件类型、大小检查和即时清理机制。

## 目录结构

```markdown
automation-value-center/
├── index.html # 主页面入口
├── css/
│ ├── style.css # 主样式文件
│ ├── responsive.css # 响应式设计样式
│ └── animations.css # 动画效果样式
├── js/
│ ├── main.js # 主JavaScript逻辑
│ ├── tools/
│ │ ├── cost-calculator.js # 节省成本计算器逻辑
│ │ ├── time-calculator.js # 时间解放计算器逻辑
│ │ ├── error-calculator.js # 错误率降低计算器逻辑
│ │ ├── feasibility-assessor.js # 自动化可行性评估器逻辑
│ │ ├── ai-potential-detector.js # AI应用潜力探测器逻辑
│ │ └── document-parser-demo.js # 文档解析能力演示器逻辑
│ ├── utils/
│ │ ├── validators.js # 输入验证工具
│ │ ├── formatters.js # 数据格式化工具
│ │ └── analytics.js # 统计埋点（page_view / calculator_use / consult_click）
│ └── components/
│ ├── navigation.js # 导航组件
│ └── modal.js # 弹窗组件
├── assets/
│ ├── icons/
│ │ ├── calculator.svg # 计算器图标
│ │ ├── timer.svg # 计时器图标
│ │ ├── shield.svg # 盾牌图标
│ │ ├── assessment.svg # 评估图标
│ │ ├── ai.svg # AI图标
│ │ └── document.svg # 文档图标
│ ├── images/
│ │ ├── banner-bg.jpg # Banner背景图
│ │ ├── problem-solution-bg.jpg # 问题解决方案背景
│ │ ├── case-study-1.jpg # 案例展示图1
│ │ ├── case-study-2.jpg # 案例展示图2
│ │ ├── cta-bg.jpg # 行动召唤背景图
│ │ └── wechat-qr.png # 微信咨询二维码（「立即咨询」弹窗中展示，见 js/components/modal.js）
│ └── fonts/
│ └── (字体文件)
├── tools/
│ ├── cost-calculator/
│ │ └── index.html # 节省成本计算器独立页面
│ ├── time-calculator/
│ │ └── index.html # 时间解放计算器独立页面
│ ├── error-calculator/
│ │ └── index.html # 错误率降低计算器独立页面
│ ├── feasibility-assessment/
│ │ └── index.html # 自动化可行性评估器独立页面
│ ├── ai-potential-detection/
│ │ └── index.html # AI应用潜力探测器独立页面
│ └── document-parser-demo/
│ └── index.html # 文档解析能力演示器独立页面
├── data/
│ └── events.jsonl # 统计事件日志（运行 server.py 后自动生成，可加入 .gitignore）
├── admin/
│ └── stats.html # 统计看板（仅管理员使用）
├── docs/
│ ├── DESIGN.md # 设计方案与修改指南（本文档）
│ └── capability-introduction.pdf # 能力介绍PDF文档
├── server.py # 本地开发服务器（含统计 API 与热重载提示）
├── favicon.ico # 网站图标
└── README.md # 项目说明（本仓库）
```

## 开发指南

1. **本地运行**:
   - 推荐使用项目自带的开发服务器：在项目根目录执行 `python server.py`，浏览器会打开 http://localhost:8000 。
   - 也可使用 Live Server 插件或 Python 的 `python -m http.server` 预览；使用 `server.py` 时才会启用统计 API 与热重载提示。

2. **样式定制**:
   所有主要样式定义在 `css/style.css` 中，可根据需要调整颜色变量、布局和组件样式。响应式断点定义在 `css/responsive.css` 中。

3. **工具开发**:
   每个互动工具的逻辑位于 `js/tools/` 目录下，可在对应文件中修改计算逻辑和交互行为。

## 统计与日志查看

网站内置轻量级统计功能，用于了解各计算器的访问与使用情况，并识别「用过计算器后点击咨询」的高意向线索。

### 数据如何产生

- **页面浏览 (page_view)**：打开首页或任意工具页时自动上报。
- **计算器使用 (calculator_use)**：用户在各计算器中调整参数或完成一次计算/评估/解析时上报（同一工具约 5 秒内只计一次）。
- **咨询点击 (consult_click)**：用户点击「立即咨询」时上报，并附带本会话内使用过的工具列表（`last_tools`），便于优先跟进「热」线索。

数据仅存储在本地，不依赖第三方统计平台。

### 查看统计看板

1. 确保使用 `python server.py` 启动（统计 API 仅在此服务器下可用）。
2. 在浏览器中打开 **统计看板**：**http://localhost:8000/admin/stats.html**
3. 看板提供：
   - **按日统计**：每日的页面浏览、计算器使用、咨询点击数量。
   - **事件汇总**：各事件类型的总次数。
   - **按工具统计**：各计算器（工具）的访问/使用次数。
   - **最近咨询点击**：时间、来源页面、使用过的工具列表，用于优先跟进高意向访客。

可设置「从」「到」日期后点击「刷新」筛选时间段。

### 原始数据与 API

- **存储位置**：`data/events.jsonl`（每行一条 JSON，由 server.py 在首次上报时自动创建 `data/` 目录）。
- **上报接口**：`POST /api/track`（前端埋点脚本 `js/utils/analytics.js` 调用）。
- **查询接口**：`GET /api/stats`，支持查询参数 `from`、`to`、`event`、`tool_id`、`limit`，返回聚合后的 JSON，供看板或自行脚本/Excel 分析使用。

部署到公网时，建议对 `/api/stats` 做简单鉴权（如 query 密钥或 Basic Auth），避免他人随意查看。

## 安全说明

网站特别注重安全性，尤其是在“文档解析能力演示器”中。我们已规划实施以下安全措施：

- 严格的文件类型和大小限制。
- 文件上传后即时处理与清理。
- （待实现）使用隔离环境处理上传文件，防止恶意代码执行。

## 部署

将整个项目文件夹部署到任何支持静态网站托管的服务商即可（如 Vercel, Netlify, GitHub Pages 或传统虚拟主机）。若需保留统计功能，部署时需使用支持自定义 API 的托管方式（如自建服务器运行 `python server.py`），并确保可写目录 `data/` 存在；纯静态托管（如 GitHub Pages）下统计 API 不可用，看板无法拉取数据。

## 对外展示内容修改指南

所有需要修改的内容分为 **5 个类别**，共涉及 **3 个文件**。

---

### 第一类：联系方式（最需要修改）

需要同时修改 **2 个文件**，因为联系方式在"页脚"和"立即咨询弹窗"两处都有。

**文件 1：`index.html`，第 466~468 行**

```466:468:index.html
<a href="mailto:contact@autovalue.cn" class="footer__link">📧 contact@autovalue.cn</a>
<a href="tel:+8618888888888" class="footer__link">📞 +86 188 8888 8888</a>
<button class="footer__link" ...>💬 微信在线咨询</button>
```

把 `contact@autovalue.cn` 换成你的真实邮箱，`+8618888888888` 换成真实电话。

**文件 2：`js/components/modal.js`，第 159~169 行**

```159:169:js/components/modal.js
'  <a href="mailto:contact@autovalue.cn" ...>',
'    ...contact@autovalue.cn</div>',
'  <a href="tel:+8618888888888" ...>',
'    ...+86 188 8888 8888</div>',
'  <div ...>微信咨询</div><div ...>扫描二维码添加好友</div>',
```

和 index.html 保持一致，修改同样的邮箱、电话，微信处的"扫描二维码添加好友"可改为你的微信号。

**微信二维码图片**：路径为 **`assets/images/wechat-qr.png`**。将你的微信二维码图片放到该路径即可，`modal.js` 中已引用该图片，弹窗中会自动展示。更换二维码时只需替换此文件。

---

### 第二类：品牌名称与标语

只需修改 **`index.html`**：

| 行号          | 内容                                                               | 说明             |
|-------------|------------------------------------------------------------------|----------------|
| 第 6 行       | `<title>自动化价值展示中心 - Python自动化专家 \| 文档处理与AI应用</title>`            | 浏览器标签页标题 + SEO |
| 第 7 行       | `<meta name="description" content="专注文档处理与AI应用的Python自动化专家...">` | 搜索引擎摘要         |
| 第 35 行      | `<span>自动化价值中心</span>`                                           | 导航栏 Logo 文字    |
| 第 69 行      | `Python 自动化专家 · 专注效率提升`                                          | Banner 顶部小标签   |
| 第 72~73 行   | `让重复工作自动化，让您的团队专注核心价值`                                           | Banner 主标题     |
| 第 76 行      | `Python自动化专家 \| 专注文档处理与AI应用 \| 为您量化效率提升`                         | Banner 副标题     |
| 第 441 行     | `⚡ 自动化价值展示中心`                                                    | 页脚品牌名          |
| 第 442~444 行 | `专注 Python 自动化开发，为企业提供文档处理...`                                   | 页脚品牌介绍         |
| 第 473 行     | `© 2024 自动化价值展示中心. All rights reserved.`                         | 版权年份和名称        |

---

### 第三类：首页 Banner 统计数字

**`index.html`，第 91~111 行**，共 4 组数字，修改 `data-counter` 的值：

```91:112:index.html
<span data-counter="85" data-suffix="%" ...>  <!-- 平均时间节省 -->
<span data-counter="50" data-suffix="+" ...>  <!-- 成功项目数 -->
<span data-counter="90" data-suffix="%" ...>  <!-- 错误率降低 -->
<span data-counter="300" data-suffix="%" ...> <!-- 平均 ROI -->
```

直接修改 `data-counter="85"` 里的数字即可，标签文字（如"平均时间节省"）在下一行。

---

### 第四类：CTA 行动召唤区文案

**`index.html`，第 409~427 行**：

```409:427:index.html
<h2 ...>准备好让您的业务更高效了吗？</h2>
<p ...>从一次免费的需求评估开始，我们将为您制定专属的自动化方案</p>
<!-- 信任标签（4个） -->
<span>✅ 免费需求评估</span>
<span>✅ 24小时响应</span>
<span>✅ 提供方案原型</span>
<span>✅ 灵活合作模式</span>
```

---

### 第五类：案例数据

修改 **`data/cases.json`**，每个案例的结构如下，可增删/修改任意一条，主页会自动重新渲染：

```json
{
  "industry": "金融行业",
  // 行业标签
  "emoji": "🏦",
  // 显示的 emoji
  "title": "银行报表自动化处理",
  // 案例标题
  "challenge": "...",
  // 挑战描述
  "solution": "...",
  // 解决方案
  "results": {
    "timeSaved": "95%",
    // 时间节省
    "errorRate": "0.2%",
    // 错误率
    "annualSaving": "¥86万"
    // 年节省金额
  }
}
```

---

### 汇总

| 优先级    | 修改项         | 文件                                      | 行号                |
|--------|-------------|-----------------------------------------|-------------------|
| ⭐⭐⭐ 必改 | 邮箱、电话       | `index.html` + `js/components/modal.js` | 466~468 / 159~169 |
| ⭐⭐⭐ 必改 | 版权年份        | `index.html`                            | 473               |
| ⭐⭐ 建议改 | 品牌名/标语/副标题  | `index.html`                            | 6, 35, 69, 76     |
| ⭐⭐ 建议改 | 案例数据        | `data/cases.json`                       | 全文件               |
| ⭐ 按需改  | Banner 统计数字 | `index.html`                            | 91~111            |
| ⭐ 按需改  | CTA 信任标签    | `index.html`                            | 424~427           |
