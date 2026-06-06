# Football Tactics Board - 项目规划文档

## 1. 项目目标

构建一个跨平台（PC 浏览器 + 手机浏览器）的足球战术板工具，让教练和球迷可以快速摆出阵型、调整球员位置，并导出战术图用于分享和讨论。

## 2. V0.1 功能范围

| 功能 | 描述 | 状态 |
|------|------|------|
| 人数/阵型切换 | 支持 5/7/8/11 人制，内置多种预设阵型 | ✅ |
| 球员拖动 | 鼠标和触摸拖动，Pointer Events 统一处理 | ✅ |
| 球员编辑 | 点击编辑号码、姓名、位置（prompt 实现） | ✅ |
| 保存/加载 | localStorage 持久化当前阵型 | ✅ |
| 导出图片 | html2canvas 导出球场区域为 PNG | ✅ |
| 响应式设计 | 手机竖屏 + 桌面端布局适配 | ✅ |

## 3. 技术路线

- **纯静态网页**：HTML + CSS + JavaScript，零构建工具
- **Pointer Events**：统一鼠标和触摸事件处理
- **百分比坐标**：球员位置使用百分比，自适应不同屏幕
- **CSS 绘制球场**：绿色渐变背景 + 白色边线/禁区（CSS border）
- **html2canvas CDN**：按需加载导出功能
- **localStorage**：轻量级本地持久化

## 4. 数据结构设计

### 球员对象

```javascript
{
  id: number,        // 唯一标识
  number: number,    // 球衣号码 (1-99)
  name: string,      // 球员姓名
  position: string,  // 位置缩写 (GK/DF/MF/FW/CM/ST 等)
  x: number,         // 百分比横坐标 (0-100)
  y: number          // 百分比纵坐标 (0-100)
}
```

### 保存数据结构

```javascript
{
  playerCount: number,      // 当前人数
  formationIndex: number,   // 阵型索引
  players: Player[]         // 球员数组
}
```

### localStorage key

```
football_tactics_board_saved_lineup
```

## 5. 阵型设计

### 5 人制（1 GK + 4 外场）

| 阵型 | 排列 |
|------|------|
| 1-2-1 | GK → 1 DF → 2 MF → 1 FW |
| 2-1-1 | GK → 2 DF → 1 MF → 1 FW |
| 1-1-2 | GK → 1 DF → 1 MF → 2 FW |

### 7 人制（1 GK + 6 外场）

| 阵型 | 排列 |
|------|------|
| 2-3-1 | GK → 2 DF → 3 MF → 1 FW |
| 3-2-1 | GK → 3 DF → 2 MF → 1 FW |
| 2-2-2 | GK → 2 DF → 2 MF → 2 FW |

### 8 人制（1 GK + 7 外场）

| 阵型 | 排列 |
|------|------|
| 2-3-2 | GK → 2 DF → 3 MF → 2 FW |
| 3-3-1 | GK → 3 DF → 3 MF → 1 FW |
| 2-4-1 | GK → 2 DF → 4 MF → 1 FW |

### 11 人制（1 GK + 10 外场）

| 阵型 | 排列 |
|------|------|
| 4-3-3 | GK → 4 DF → 3 MF → 3 FW |
| 4-2-3-1 | GK → 4 DF → 2 MF → 3 AM → 1 FW |
| 4-4-2 | GK → 4 DF → 4 MF → 2 FW |
| 3-5-2 | GK → 3 DF → 5 MF → 2 FW |

## 6. 后续版本规划

### V0.2 — 战术标记

- 战术箭头（传球路线）
- 跑位路线（虚线箭头）
- 球员间连线

### V0.3 — 球队管理

- 替补席区域
- 球员名单管理（增删改）
- 换人拖拽操作

### V0.4 — 多方案管理

- 多套阵型保存/切换
- JSON 文件导入/导出
- 阵型模板库

### V0.5 — 正式发布

- PWA 支持（manifest.json + Service Worker）
- 添加到手机桌面（离线可用）
- GitHub Pages 部署
- 分享链接功能
