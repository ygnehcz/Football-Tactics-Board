# Football Tactics Board ⚽

一个支持手机和电脑使用的足球排兵布阵网页战术板。

## 项目简介

Football Tactics Board 是一个纯前端网页应用，帮助教练和球迷快速布置足球阵型、调整球员站位，并导出战术图。

- 🖥️ 电脑端 + 📱 手机端 都能流畅使用
- 🚫 零依赖构建工具，纯 HTML + CSS + JS
- 🔧 代码结构清晰，适合初学者学习

## 当前功能（V0.1）

- ✅ 支持 **5人制 / 7人制 / 8人制 / 11人制** 切换
- ✅ 内置常见预设阵型（如 4-3-3、4-4-2、3-5-2 等）
- ✅ 球员圆点可**自由拖动**（鼠标 + 触摸）
- ✅ 点击球员可**编辑号码、姓名和位置**
- ✅ 使用 localStorage **保存和加载**阵型
- ✅ 一键**导出 PNG 图片**
- ✅ 响应式设计，手机竖屏完美适配

## 使用方式

1. 直接用浏览器打开 `index.html` 即可使用
2. 或部署到任意静态服务器（GitHub Pages、Netlify 等）

```bash
# 本地快速预览（Python 3）
python -m http.server 8080
# 然后打开 http://localhost:8080
```

## 项目结构

```
Football-Tactics-Board
├── index.html          # 主页面
├── style.css           # 样式（移动端优先，响应式）
├── app.js              # 核心逻辑（阵型、拖动、编辑、保存/加载、导出）
├── README.md           # 项目说明
├── docs
│   └── project_plan.md # 项目规划文档
└── assets
    └── .gitkeep
```

## 技术栈

- **HTML5** — 语义化结构
- **CSS3** — Flexbox、CSS Variables、Media Queries、渐变
- **JavaScript (ES5)** — 原生 DOM 操作，兼容性好
- **Pointer Events** — 统一鼠标和触摸事件
- **html2canvas** — 导出 PNG（CDN 引入）
- **localStorage** — 本地数据持久化

## 后续计划

- [ ] V0.2：战术箭头、传球路线、跑位路线
- [ ] V0.3：替补席、球员名单管理、换人功能
- [ ] V0.4：多阵型保存、JSON 导入导出
- [ ] V0.5：PWA 支持（添加到手机桌面）、GitHub Pages 部署
- [ ] 分享链接功能

## License

MIT
