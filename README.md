<div align="center">

# ⚽ Football Tactics Board

**足球排兵布阵战术板**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Version](https://img.shields.io/badge/version-v0.2.0-2ea44f)](https://github.com/ygnehcz/Football-Tactics-Board/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

*A zero-dependency football tactics board — works on desktop and mobile.*

</div>

---

## 🌐 在线体验 | Online Demo

> 🚀 **[ygnehcz.github.io/Football-Tactics-Board](https://ygnehcz.github.io/Football-Tactics-Board/)**
>
> 部署于 GitHub Pages，打开即用。

---

## ✨ 功能 | Features

| 模块 | 说明 |
|------|------|
| 🏟️ 球场 | 草坪纹理 + 条纹背景，完整标线（边线 / 中线 / 中圈 / 禁区 / 小禁区 / 罚球点 / 罚球弧 / 角旗弧线） |
| 👕 阵型 | 5/7/8/11 人制，**36 种**预设阵型，球员自由拖动（鼠标 + 触摸） |
| ✏️ 编辑 | **双击**球员编辑号码、姓名、16 种位置（中英文切换显示） |
| ⚽ 足球 | 可拖动足球，默认在中圈，支持保存/恢复位置 |
| 📋 队伍 | 编辑队伍名称、对手、赛事、教练等 10 项信息，球场上方展示 |
| 🎨 队服 | 主队/客队两套配色，一键切换 |
| 💾 持久化 | localStorage 保存阵型、足球位置、队伍信息、语言设置 |
| 📸 导出 | 一键导出 PNG 图片（含队伍信息、阵型标签、足球） |
| 📱 适配 | 响应式布局，手机竖屏至桌面宽屏全平台可用 |

## 🧩 预设阵型 | Formations

| 人数 | 阵型 | 数量 |
|------|------|:--:|
| **5人制** | 1-2-1 · 2-1-1 · 1-1-2 · 2-2 · 3-1 · 1-3 | 6 |
| **7人制** | 2-3-1 · 3-2-1 · 2-2-2 · 3-1-2 · 2-1-2-1 · 1-3-2 · 4-1-1 | 7 |
| **8人制** | 2-3-2 · 3-3-1 · 2-4-1 · 3-2-2 · 2-2-2-1 · 4-2-1 · 1-4-2 · 3-1-3 | 8 |
| **11人制** | 4-3-3 · 4-2-3-1 · 4-4-2 · 3-5-2 · 4-1-4-1 · 4-5-1 · 4-3-1-2 · 4-4-1-1 · 3-4-3 · 3-4-2-1 · 5-3-2 · 5-4-1 · 4-2-2-2 · 4-1-2-1-2 · 3-1-4-2 | 15 |

## 📸 截图 | Screenshots

<div align="center">

| 桌面端 | 手机端 | 导出效果 |
|:---:|:---:|:---:|
| ![Desktop](docs/images/demo-desktop.png) | ![Mobile](docs/images/demo-mobile.png) | ![Export](docs/images/export-example.png) |

</div>

> 💡 以上为占位图，运行项目后可替换为实际截图。

## 🚀 快速开始 | Quick Start

```bash
git clone https://github.com/ygnehcz/Football-Tactics-Board.git
cd Football-Tactics-Board
# 双击 index.html，或：
python -m http.server 8080
```

> 无需 `npm install`，无需构建工具。

## 🎮 操作说明 | Usage

- **切换阵型** — 顶部下拉选择人数和阵型
- **拖动球员** — 鼠标/手指按住球员圆点拖到任意位置
- **编辑球员** — 双击球员圆点弹出编辑窗
- **拖动足球** — 按住足球拖到任意位置，点击「重置足球」回到中点
- **编辑队伍** — 点击「📋 队伍信息」填写比赛详情
- **切换语言** — 位置语言下拉选 EN 或 中文
- **导出图片** — 点击「📸 导出图片」下载 PNG

## 📁 项目结构 | Structure

```
Football-Tactics-Board
├── index.html          # 主页面
├── style.css           # 样式（移动端优先）
├── app.js              # 核心逻辑
├── docs/
│   ├── project_plan.md # 规划文档
│   ├── learning_summary.md
│   └── images/
└── assets/
```

## 🔧 技术栈 | Tech

| 层 | 技术 |
|----|------|
| 结构 | HTML5 |
| 样式 | CSS3 (Flexbox, Variables, Media Queries, Gradients) |
| 逻辑 | Vanilla JavaScript (ES5) |
| 交互 | Pointer Events (mouse + touch) |
| 导出 | html2canvas (CDN) |
| 存储 | localStorage |

## 🗺️ 路线图 | Roadmap

- [x] **V0.1** — 阵型系统、球员拖动、编辑、导出
- [x] **V0.1.1** — Toast 提示、脏状态确认、导出水印、队服切换
- [x] **V0.1.2** — 双击编辑替代单击、自定义 Modal
- [x] **V0.2** — 草坪纹理、完整标线、足球、队伍信息、36 种阵型、中英文切换
- [ ] **V0.3** — 战术箭头、传球路线、跑位路线
- [ ] **V0.4** — 替补席、球员名单管理、换人
- [ ] **V0.5** — 多阵型保存、JSON 导入导出
- [ ] **V0.6** — PWA 离线支持、添加到手机桌面

## 📄 许可 | License

MIT © [ygnehcz](https://github.com/ygnehcz)

---

<div align="center">
  <sub>Built with ❤️ and vanilla JavaScript</sub>
</div>