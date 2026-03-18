# 自动化价值展示中心

作者：[BoshengLau]

您是否被重复的文档处理工作所困扰？来这里，看看自动化如何为您节省时间与成本。

用互动式计算器展示 Python 自动化服务价值、吸引咨询的专业站点。纯前端 + 可选本地统计，无后端依赖即可部署为静态站。

## 快速开始a

```bash
# 项目根目录
python server.py
```

浏览器会打开 **http://localhost:8000**。

首页提供 6 个互动工具入口与案例展示，点击「立即咨询」可打开联系弹窗。

- 可选依赖（热重载提示）：`pip install watchdog`
- 仅静态预览：也可用 `python -m http.server` 或 Live Server；统计 API 仅在 `server.py` 下可用。

## 主要功能

| 模块 | 说明 |
|------|------|
| 首页 | Banner、核心价值、工具卡片预览、案例、CTA |
| 6 个互动工具 | 节省成本 / 时间解放 / 错误率 / 可行性评估 / AI 潜力 / 文档解析演示 |
| 统计 | 页面浏览、计算器使用、咨询点击写入 `data/events.jsonl`，看板查看聚合与热线索 |

**统计看板**（需先 `python server.py`）：  
**http://localhost:8000/admin/stats.html**  
可看按日/按工具/按事件统计，以及「最近咨询点击」及使用过的工具列表，便于优先跟进高意向访客。

## 目录概览

```
├── index.html          # 首页
├── server.py           # 本地开发服务器（静态 + /api/track、/api/stats）
├── css/                # 样式
├── js/
│   ├── main.js         # 首页逻辑
│   ├── tools/          # 各计算器/演示器逻辑
│   ├── utils/          # validators, formatters, analytics
│   └── components/     # navigation, modal, page-transition
├── tools/              # 6 个工具独立页（各目录下 index.html）
├── admin/stats.html    # 统计看板
├── data/               # 运行后自动生成，存 events.jsonl
├── assets/             # 图标、图片、字体
├── data/cases.json     # 首页案例数据（可编辑）
├── docs/               # 文档
│   └── DESIGN.md      # 设计方案、目录结构、统计说明、对外内容修改指南
└── README.md           # 本文件
```

## 技术栈

HTML5 / CSS3 / JavaScript（ES5+，无构建）。`server.py` 为 Python 3 标准库 + 可选 watchdog。

## 修改与部署

- **联系方式、品牌、案例、Banner 数字、CTA 文案**等对外展示内容的修改位置与步骤见 **[docs/DESIGN.md](docs/DESIGN.md)** 中的「对外展示内容修改指南」。
- **部署**：整站可当静态站部署（如 Vercel、Netlify、GitHub Pages）。若需保留统计，需能运行 `python server.py` 并保证 `data/` 可写；纯静态托管下看板无数据。
