# 📘 Football Tactics Board — 学习复盘文档

> 本文档面向初学者，用通俗语言复盘整个项目的技术要点，帮助你在面试或答辩时有话可讲。

---

## 1. 这个项目解决了什么问题？

足球教练、球迷、业余球队管理者在日常沟通阵型时，往往只能用纸笔或 WhatsApp 截图。本项目提供了一个**无需安装、打开即用**的网页战术板工具：

- 选择人数（5/7/8/11人制）后自动生成预设阵型
- 手指或鼠标拖动球员到任意位置
- 编辑号码、姓名、位置，个性化每个球员
- 一键导出 PNG 发给队友/教练
- 关闭浏览器后能重新加载上次保存的阵型

一句话概括：**用原生 Web 技术，让足球排兵布阵变得简单直观。**

---

## 2. V0.1 和 V0.1.1 分别完成了什么？

### V0.1 — 核心功能搭建

| 模块 | 完成内容 |
|------|----------|
| 球场绘制 | 纯 CSS 画出绿色草坪 + 白色边线/禁区/中圈 |
| 阵型系统 | 4 种人数 × 3~4 种阵型，共 13 种预设 |
| 球员渲染 | DOM 动态生成圆点，显示号码和位置 |
| 拖动逻辑 | Pointer Events 统一鼠标 + 触摸，百分比坐标 |
| 编辑球员 | prompt 弹窗编辑号码/姓名/位置 |
| 保存加载 | localStorage 持久化当前阵型 |
| 导出图片 | html2canvas CDN 导出球场区域 PNG |
| 响应式布局 | 手机竖屏、平板、桌面均可用 |

### V0.1.1 — 体验打磨

| 优化 | 说明 |
|------|------|
| Toast 提示 | 替换 `alert()`，带入场/退场动画，不打断操作 |
| 脏状态确认 | 切换阵型前如果改过球员，弹出确认框防止误操作 |
| 导出水印 | PNG 顶部带阵型标签（如 "11人制 4-3-3"） |
| 队服切换 | 主队/客队两套配色，一键切换 |
| README 展示 | 添加 Badge、截图区、Online Demo 链接 |

---

## 3. 我应该重点理解的前端知识

下面按照项目实际用到的顺序，逐一解释每个知识点的**核心概念**和**在项目中怎么用的**。

---

### 3.1 HTML 页面结构

**是什么：** HTML 是网页的骨架。它用标签（tag）告诉浏览器"这里放标题、这里放按钮、这里是球场"。

**本项目怎么用：**
```html
<header>          → 顶部标题栏
<section>         → 控制区（人数/阵型下拉、按钮）
<div class="field"> → 球场区域
<footer>          → 底部操作提示
```

**关键理解：**
- `<meta name="viewport">` 让手机端正确缩放，`user-scalable=no` 防止拖动球员时页面跟着缩放
- `<script src="app.js">` 放在 `<body>` 末尾，确保 DOM 加载完再执行 JS
- 每个 `<button>` 和 `<select>` 都有 `id`，方便 JS 通过 `getElementById` 找到它

**一句话：** HTML 负责"放什么"，所有可见元素都是标签嵌套出来的。

---

### 3.2 CSS 响应式布局

**是什么：** CSS 控制"长什么样"。响应式就是同一个页面在不同屏幕上都好看。

**本项目怎么用：**
```css
/* 手机优先（默认样式） */
.player { width: 44px; height: 44px; }  /* 手指能点到 */

/* 平板及以上 */
@media (min-width: 768px) {
  .player { width: 50px; height: 50px; }
}

/* 大屏桌面：控制栏从顶部移到左侧 */
@media (min-width: 1024px) {
  body { flex-direction: row; }
  .controls { flex-basis: 250px; }
}
```

**关键理解：**
- **Mobile-first**：先写手机样式，再用 `@media` 逐级增强大屏
- **Flexbox**：`display: flex` 让元素自动排列，不用手动算位置
- **CSS Variables**（`--player-size`）：改一处，所有球员圆点同步变大小
- **`aspect-ratio: 9/14`**：球场保持窄长比例，不用手动算高度

**一句话：** CSS 负责"长什么样"，`@media` + Flexbox 让一套代码适配所有屏幕。

---

### 3.3 DOM 渲染

**是什么：** DOM 是浏览器把 HTML 变成的内存树。JavaScript 可以动态增删改这棵树上的任何节点。

**本项目怎么用：**
```javascript
function renderPlayers() {
  playersContainer.innerHTML = '';  // 清空所有球员圆点

  players.forEach(function (player) {
    var dot = document.createElement('div');   // 创建一个 div
    dot.className = 'player player-def';       // 设置样式类
    dot.style.left = player.x + '%';           // 设置位置
    dot.style.top = player.y + '%';
    dot.textContent = player.number;           // 设置文本

    playersContainer.appendChild(dot);         // 添加到页面
  });
}
```

**关键理解：**
- `createElement` → 创建新标签（但还不可见）
- 设置属性和样式 → 配置外观和位置
- `appendChild` → 插入 DOM 树，浏览器立即渲染
- 每次阵型切换或拖完球员，都重新调 `renderPlayers()` 刷新界面

**一句话：** DOM 是 JS 和 HTML 的桥梁，JS 通过 DOM API 动态操作页面内容。

---

### 3.4 JavaScript 对象和数组

**是什么：** 对象（Object）存储"键值对"，数组（Array）存储有序列表。

**本项目怎么用：**

球员在 JS 里是一个对象数组：
```javascript
var players = [
  { id: 0, number: 1, name: '', position: 'GK', x: 50, y: 90 },
  { id: 1, number: 2, name: '', position: 'DF', x: 12, y: 72 },
  { id: 2, number: 3, name: '', position: 'DF', x: 37, y: 72 },
  // ...
];
```

操作这个数组的常用方法：
```javascript
// 查找某个球员
var player = players.find(function(p) { return p.id === 3; });

// 遍历所有球员
players.forEach(function(p) { /* 处理每个 p */ });

// 生成新数组（保存时过滤字段）
var saveData = players.map(function(p) {
  return { id: p.id, number: p.number, x: p.x, y: p.y };
});
```

**关键理解：**
- `find` 找到第一个匹配的元素（适合"找到了就停"的场景）
- `forEach` 对每个元素执行操作（适合渲染、打印）
- `map` 返回一个新的数组（适合数据转换）
- `x, y` 用百分比（0-100）存储，适配不同屏幕不用重新算

**一句话：** 对象存特征，数组存列表，`find/forEach/map` 是处理它们的三个核心工具。

---

### 3.5 Pointer Events 拖动逻辑

**是什么：** Pointer Events 是 W3C 标准，一个 API 同时处理鼠标和触摸，不用分别写两套代码。

**本项目怎么用：**

```javascript
// 1. 按下时：记录起始位置
function onPointerDown(e) {
  dragState = {
    playerId: player.id,
    startX: e.clientX,           // 手指/鼠标的初始X
    startY: e.clientY,           // 手指/鼠标的初始Y
    playerStartX: player.x,      // 球员当前的 X%
    playerStartY: player.y,      // 球员当前的 Y%
    fieldWidth: field.offsetWidth,  // 球场宽度
    fieldHeight: field.offsetHeight // 球场高度
  };
}

// 2. 移动时：计算偏移，更新球员位置
function onPointerMove(e) {
  var dx = e.clientX - dragState.startX;       // 手指移动了多少像素
  var dxPercent = (dx / dragState.fieldWidth) * 100;  // 转成百分比

  player.x = dragState.playerStartX + dxPercent;  // 更新坐标
  player.y = dragState.playerStartY + dyPercent;

  dot.style.left = player.x + '%';   // 实时更新 DOM
  dot.style.top = player.y + '%';
}

// 3. 松开时：结束拖动
function onPointerUp(e) {
  dragState = null;  // 清空状态
}
```

**关键理解：**
- **像素 → 百分比**：`dx / fieldWidth * 100`，这样球员位置在大小屏幕上都对
- **边界限制**：`Math.max(3, Math.min(97, x))` 让球员不会拖出场外
- **只绑定一次**：`pointerdown/move/up` 绑定在球场容器上，所有球员共享

**一句话：** Pointer Events = 一套代码适配鼠标和触摸，"按→移→松"三步走，像素换成百分比做到屏幕自适应。

---

### 3.6 localStorage 保存和加载

**是什么：** `localStorage` 是浏览器提供的永久存储，数据存到用户硬盘，关电脑也不会丢。

**本项目怎么用：**

```javascript
// 保存：JS 对象 → JSON 字符串 → 存入 localStorage
function saveLineup() {
  var data = {
    playerCount: currentPlayerCount,
    formationIndex: currentFormationIndex,
    players: players  // 整个球员数组
  };
  localStorage.setItem('football_tactics_board_saved_lineup', JSON.stringify(data));
}

// 加载：localStorage → JSON 字符串 → JS 对象
function loadLineup() {
  var raw = localStorage.getItem('football_tactics_board_saved_lineup');
  var data = JSON.parse(raw);    // 字符串变回对象
  players = data.players;         // 恢复球员数组
  renderPlayers();                // 刷新界面
}
```

**关键理解：**
- `JSON.stringify(obj)` → 对象转字符串（才能存）
- `JSON.parse(str)` → 字符串转回对象（才能用）
- localStorage 的 key 用项目前缀命名，避免和别的网站冲突
- 存的是字符串，不是文件，所以只有几 KB，很快

**一句话：** localStorage = 浏览器的迷你数据库，`JSON.stringify` 存，`JSON.parse` 取。

---

### 3.7 html2canvas 导出图片

**是什么：** html2canvas 是一个 JS 库，能把网页上的任意区域截成 PNG 图片。

**本项目怎么用：**

```html
<!-- CDN 引入，不下载文件 -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

```javascript
function exportPNG() {
  // 显示阵型标签
  exportLabel.textContent = '11人制 4-3-3';
  exportLabel.classList.add('visible');

  // 截图球场区域
  html2canvas(fieldEl, { scale: 2 }).then(function (canvas) {
    // 转成下载链接
    var link = document.createElement('a');
    link.download = 'football_lineup.png';
    link.href = canvas.toDataURL('image/png');
    link.click();  // 自动触发下载

    // 隐藏标签
    exportLabel.classList.remove('visible');
  });
}
```

**关键理解：**
- `scale: 2` 导出 2 倍分辨率，在高清屏上也清晰
- `canvas.toDataURL()` 把截图转成 Base64 数据，赋给 `<a>` 的 href
- 导出前先显示水印标签，截图完再隐藏，无缝衔接
- CDN 是"别人的服务器帮你托管文件"，打开网页时自动下载

**一句话：** html2canvas = 网页截图工具，`html2canvas(元素)` → 得到图片 → 触发下载。

---

### 3.8 Git 和 GitHub Pages 部署

**是什么：** Git 是版本管理工具，记录每次改了什么。GitHub Pages 是免费的静态网页托管。

**本项目怎么用：**

```bash
# 初始化本地仓库
git init

# 提交所有文件
git add .                      # 暂存所有改动
git commit -m "init football tactics board"  # 创建快照

# 推送到 GitHub
git push origin main
```

**关键理解：**
- **git add** → 告诉 Git "我要记录这些文件"
- **git commit** → 拍一张快照，附上说明文字
- **git push** → 把本地快照发到 GitHub 服务器
- GitHub Pages 会自动把仓库根目录的 `index.html` 变成网页

**部署步骤：**
1. 代码推送到 GitHub 仓库的 `main` 分支
2. 仓库 Settings → Pages → Source 选 `main` → Save
3. 几分钟后 `https://用户名.github.io/仓库名/` 即可访问

**一句话：** Git 管历史版本，GitHub Pages 管公网访问，提交代码 = 更新网站。

---

## 4. 简历/作品集描述

> 以下可直接用于简历、GitHub Profile 或答辩 PPT：

### 中文版

**Football Tactics Board — 足球排兵布阵网页战术板**

一个纯前端、零依赖的足球战术工具，使用原生 HTML + CSS + JavaScript 开发。支持 5/7/8/11 人制阵型切换、球员自由拖动（Pointer Events 统一鼠标与触摸）、球员信息编辑、localStorage 阵型持久化，以及一键导出带水印的战术图。响应式设计适配手机至桌面全平台，已部署于 GitHub Pages。

**技术关键词：** HTML5 · CSS3 Flexbox · JavaScript ES5 · Pointer Events · localStorage · html2canvas · GitHub Pages · 响应式设计

### English Version

**Football Tactics Board — An Interactive Tactics Board for Coaches & Fans**

A zero-dependency, vanilla JavaScript web app for football lineup planning. Features include formation selection for 5/7/8/11-a-side, drag-and-drop player positioning via Pointer Events, player info editing, localStorage persistence, and one-click PNG export with formation watermark. Fully responsive from mobile to desktop. Deployed on GitHub Pages.

**Tech Stack:** HTML5 · CSS3 Flexbox · Vanilla JavaScript · Pointer Events · localStorage · html2canvas · GitHub Pages · Responsive Design

---

<div align="center">
  <sub>📅 项目起步：2026-06-06 · 版本：V0.1.1 · 仓库：<a href="https://github.com/ygnehcz/Football-Tactics-Board">ygnehcz/Football-Tactics-Board</a></sub>
</div>