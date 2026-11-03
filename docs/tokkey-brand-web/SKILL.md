---
name: "tokkey-brand-web"
description: "设计、生成或review Tokkey 品牌的官网页面、落地页区块与 UI 时使用。包含色彩、字体、logo、8px 网格与 padding、视觉节奏、产品图与图标的强制规则。"
---

# Tokkey 品牌网页设计

## 给同事的快速说明

用这个 skill 让 Claude 生成 Tokkey 品牌网页时，有两个**已知限制**需要提前了解：

1. **产品图需自备** — Skill 禁止 Claude 自行生成或使用图库产品图。生成页面时产品图板区域会留空或用占位色块，需要你手动提供实际图片链接或 base64。
2. **Commit Mono 在 Artifact 里必须 base64 内联** — Claude.ai Artifact 运行在沙盒 iframe 里，CSP 同时屏蔽外部字体 URL **和本机安装的系统字体**。即使在电脑上已安装 Commit Mono，Artifact 也无法访问，会自动降级为 Courier New。唯一可行方案：将所有 `.otf` 文件 base64 编码后内联到 `<style>` 块里（4 个字重合计 ~1.4MB，远低于 Artifact 16MB 上限）。本地项目（非 Artifact）不受此限制，直接放 `/fonts/` 目录即可。

**使用方式：** 直接把需求发给 Claude（"帮我做一个 Tokkey 的 Hero 区块"），skill 会自动引导 Claude 按照 Tokkey 规则生成。

---

## Overview

Tokkey 是面向开发者的 AI 硬件：插在 Mac/PC 上做本地推理。品牌定位是**工具，不是玩具**——对标 YubiKey、Framework、Teenage Engineering、Rams 时期 Braun，而不是消费类 AI 玩具。

核心判断标准：**克制不等于平淡。** 装饰减到最少，但尺度对比拉到最大。该大的地方大到近乎过分，其余全部安静。如果一个决策只是让页面更「热闹」而不是更「有落差」，它就是错的。

用词偏好：own、local、control、connect、hardware、inference、context——朴素、机械感的名词和动词。标题写短句，用句号断开，句末用绿点（Accent #4ABE18）。

---

## Colors

| Token | HEX | 用途 |
|---|---|---|
| Ink | `#111110` | 主文字、深色主题背景 |
| Black | `#000000` | 全幅黑底区块（Hero / 金句 / CTA） |
| White | `#FFFFFF` | 主背景；产品图板在深色主题下的底色 |
| Fog | `#F2F2F2` | 次级区块背景、卡片底 |
| Silver | `#DADAD6` | 1px 分隔发丝线，绝不用粗线或方框 |
| Ash | `#B0B0AC` | 禁用态、深底上的次级文字 |
| Graphite | `#5C5C58` | 次级文字、注释 |
| Accent | `#4ABE18` | 状态信号与句点，最多 5% 面积 |
| Studio | `#F4F4F2` | 产品图板在浅色主题下的底色 |
| Negative | `#F83830` | 仅用于 misuse 示例、禁止标注、comparison 中的「有害方」 |

**深色主题（重新指定，不是直接反转）：**
背景 `#111110` · 卡片 `#1A1A18` · 发丝线 `#2E2E2B` · 正文 `#F2F2F2` · 次级 `#B0B0AC`

**Accent 规则：** 来自 amis/cpilot 软件系统，让硬件与软件使用同一套信号语言。面积上限 5%，用在：状态点、chip 上的点、标题末句点、图表终点、focus/hover 反馈。不做整块绿底，不填整段标题。

**Negative 规则：** 必须搭配对比卡或 misuse 图使用，不得单独出现在正向内容里。

---

## Typography

**Inter** — 默认字体。标题、正文、导航、按钮全部用 Inter。只用 Regular 400 / Semibold 600 / Bold 700。

**Commit Mono** — 约占页面文字的 10%，只给机器输出和数据：eyebrow 小标签（大写，字距 +3%）、数据读数、表格取值列、CLI 输出、图表轴标签。不用在：导航、按钮、caption、段落、页脚。

| 角色 | 字号/行高 | 字体与字重 | 移动端 |
|---|---|---|---|
| Hero | 160/152 | Inter Bold，字距 -2% | 48/56 |
| Display | 96/104 | Inter Bold，字距 -2% | 40/48 |
| H2 | 64/72 | Inter Bold，字距 -2% | 40/48 |
| Figure | 64/64 | Inter Bold | 48/48 |
| H3 | 32/40 | Inter Semibold | — |
| Lead | 24/32 | Inter Regular | — |
| Body | 16/24 | Inter Regular | — |
| Caption | 16/24 | Inter Regular，Graphite 色 | — |
| Label | 16/24 | Commit Mono，大写，字距 +3% | — |
| Data | 16/24 | Commit Mono | — |

### 字体加载

**Inter（Google Fonts，粘到 `<head>` 最前）：**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
```

**Commit Mono — 本地项目（非 Artifact）：**

下载地址：https://commitmono.com — 免费，OFL 许可，下载 zip 解压得到 `.otf` 文件。

放入项目 `/fonts/` 目录后，用以下 `@font-face` 声明：

```css
@font-face {
  font-family: 'Commit Mono';
  src: url('/fonts/CommitMono-400-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Commit Mono';
  src: url('/fonts/CommitMono-400-Italic.otf') format('opentype');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'Commit Mono';
  src: url('/fonts/CommitMono-700-Regular.otf') format('opentype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Commit Mono';
  src: url('/fonts/CommitMono-700-Italic.otf') format('opentype');
  font-weight: 700;
  font-style: italic;
  font-display: swap;
}
```

**Commit Mono — Artifact（claude.ai 托管页面）：**

⚠️ **重要：** Artifact 沙盒 iframe 的 CSP 同时屏蔽外部 URL **和系统字体**——即使用户在本机安装了 Commit Mono，Artifact 也访问不到。必须将字体文件 base64 编码后直接内联到 `<style>` 块。

用 Python 生成 @font-face CSS（把 4 个 .otf 文件放在同一目录下运行）：

```python
import base64

fonts = {
    ("400", "normal"): "CommitMono-400-Regular.otf",
    ("400", "italic"): "CommitMono-400-Italic.otf",
    ("700", "normal"): "CommitMono-700-Regular.otf",
    ("700", "italic"): "CommitMono-700-Italic.otf",
}
css = ""
for (weight, style), path in fonts.items():
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    css += f"""@font-face {{
  font-family: 'Commit Mono';
  src: url('data:font/otf;base64,{b64}') format('opentype');
  font-weight: {weight};
  font-style: {style};
  font-display: swap;
}}\n"""
print(css)  # 粘到 HTML <style> 最前面
```

文件大小参考：每个 .otf 约 268KB，base64 后约 358KB，4 个合计 ~1.4MB（Artifact 上限 16MB，完全可接受）。OFL 许可允许 base64 内联和再分发。

降级栈写法（用于 CSS 变量）：

```css
--mono: 'Commit Mono', 'Courier New', monospace;
```

OpenType 特性（推荐开启，让等号、箭头等符号正确显示）：

```css
.mono-text {
  font-family: var(--mono);
  font-feature-settings: 'ss03', 'ss04', 'ss05';
}
```

---

## Layout

**网格：** 容器 1200px，外边距 40px，12 列，24px 间距。产品图板和黑底区块满宽，不受容器限制。

**断点：** Mobile < 768 / Tablet 768–1199 / Desktop ≥ 1200

**间距只从这套里取：** 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128 / 160px。一切尺寸是 8 的倍数（唯一例外：描边宽度 1px / 1.5px）。

**Padding 层级（从外到内递减，内层不得大于外层）：**

| 元素 | Padding |
|---|---|
| 页面容器左右 | 40px（移动端 16px） |
| 普通区块上下 | 128px（移动端 96px） |
| 金句 / 全幅黑底区块上下 | 160px |
| 产品图板上下 | 64px（紧凑位置 48 或 32） |
| 规格条整条上下 | 96px / 32px |
| 规格条单格 | 上下 48，左右 32；首格左 0，末格右 0 |
| 深色卡片 / dashboard | 24px |
| 表格行上下 | 24px |
| 图表外框 | 32px |
| 页头高度 | 72px |
| 页脚上下 | 48px |

**内部间距：** 图标→标题 32 · 标题→副标题 8 · 标题→正文 24 · 正文→下一组 48 · 图→caption 16

---

## Components

### Button

按钮颜色必须用 token，不能硬编码颜色值——硬编码在暗色模式下会消失。

```css
.btn {
  height: 48px;
  padding: 0 24px;
  border-radius: 16px;
  background: var(--text);
  color: var(--bg);
  font-family: Inter;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid var(--text);
  cursor: pointer;
}
.btn.ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--hair);
}
.btn.sm {
  height: 40px;
  padding: 0 16px;
}
.btn:hover { opacity: 0.88; }

.btn-on-black {
  background: #fff;
  color: #000;
  border-color: #fff;
}
```

### Chip / Capsule Tag

```css
.chip {
  height: 48px;
  padding: 0 24px;
  border-radius: 24px;
  border: 1px solid rgba(242,242,242,0.24);
  background: rgba(0,0,0,0.56);
  font-size: 16px;
  font-weight: 600;
  color: #F2F2F2;
}
```

产品图下或图上的 chip 最多 3 个，布局不对称散落，不整齐排一列。

### Input

```css
input {
  height: 48px;
  padding: 0 16px;
  border-radius: 0;
  border: 1px solid var(--hair);
  font-size: 16px;
}
```

### Spec Strip（规格条）

所有格 `padding: 48px 32px`，首格 `padding-left: 0`，末格 `padding-right: 0`，格间用 1px Silver 竖线分隔。数字用 Figure（64px Bold），标签用 Label（Commit Mono）。

### Card

圆角 16px 或 24px（不要用 20px）。卡片底色浅色主题用 Fog `#F2F2F2`，深色主题用 `#1A1A18`。内部 padding 24px。用 1px Silver 发丝线分隔，不做整块边框。

---

## Visual Rhythm

**尺度跳跃要狠。** 主标题和正文至少差 6 倍（160 对 16）。不要用 32/24/20 这种温和递减——那是后台系统的字阶。

**明暗区块交替。** 全幅黑底区块和浅色区块交替出现。黑底区块（Hero / 金句 / 结尾 CTA）在明暗两个主题下都保持黑色——它们是结构，不是主题。

**大图要真的大。** 产品图做满宽图板，高度至少 480px。小小的产品图放在栏格里会把硬件品牌做成 SaaS 页。

**绿点当句点。** 标题句末的句号用 Accent 色（`Less Cloud. More Control.`）。标题必须写成短句、用句号断开才能用这个细节。

**大数字配小说明。** 规格内容用 64px 数字 + 16px 解释，左右分栏，发丝线分隔，不把参数写成段落。

**居中限制。** 只有 Hero 和金句区块可以居中（全幅黑底 + 超大字）。其余区块左对齐，多状态内容永远并排比较。

---

## Hero — Apple Depth Effect

Hero 区块是整页最重要的视觉事件，用负 margin + `mix-blend-mode` 实现产品图浮在标题上方的 Apple 式前后景深。

**z-index 层级：**

| 层 | 元素 | z-index |
|---|---|---|
| 最上 | `header` | 30 |
| 中上 | `.shot`（产品图） | 1 |
| 底层 | `.hero` / `.hero-foot`（标题） | 0 或负值 |

**方式 A — 黑底图（推荐，Tokkey Hero 专用）**

```html
<div class="band">
  <div class="wrap hero-eye">
    <div class="eyebrow"><span class="dot"></span> Tokkey AI Computing Device</div>
  </div>
  <div class="hero-title wrap">
    <h1>Skip the Cloud<span class="period">.</span><br>Run AI Locally<span class="period">.</span></h1>
  </div>
  <div class="shot"><img src="..." alt="Tokkey — concept render"></div>
  <div class="wrap hero-foot"></div>
</div>
```

```css
h1 {
  font-size: 160px; line-height: 152px; font-weight: 700;
  letter-spacing: -0.02em; color: #fff;
  max-width: 13ch; margin-inline: auto; text-align: center;
}
@media (max-width:1439px) { h1 { font-size:120px; line-height:120px; } }
@media (max-width:1199px) { h1 { font-size:96px;  line-height:104px; } }
@media (max-width:767px)  { h1 { font-size:48px;  line-height:56px;  } }
.hero-title { position: relative; z-index: 0; text-align: center; }
.shot {
  position: relative; z-index: 1;
  text-align: center;
  margin-top: -48px;
  pointer-events: none;
}
.shot img {
  display: inline-block;
  width: 52%; max-width: 580px; min-width: 260px;
  height: auto;
  mix-blend-mode: screen;
}
```

**方式 B — 白底图（白色图板区块用）**

```css
.shot-board {
  background: #fff;
  margin-top: -88px;
  position: relative; z-index: 1;
}
.shot-board img {
  width: 100%;
  height: min(64vh, 760px);
  object-fit: cover;
  object-position: 50% 34%;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 22%);
  mask-image: linear-gradient(to bottom, transparent 0, #000 22%);
}
```

---

## Visual Patterns

### Page Skeleton（区块骨架）

每个功能区块固定三层递进：

```
Label  (Commit Mono, uppercase, Graphite)  <- eyebrow，绝不跳过
H2     (Inter Bold 64/72)                  <- 核心主张，句末绿点
Body   (Inter Regular 16/24)               <- 2-3 句，不超过 4 行
```

eyebrow -> H2: 16px · H2 -> Body: 24px · Body -> CTA: 32px

### Comparison Cards（对比卡）

- 两卡并排，1px Silver 发丝线竖向分隔，不做整块边框
- 左卡（弱势方）用 Graphite 文字；右卡（Tokkey）用 Ink + Accent 句点
- 关键优势行用加粗标题突出，其余 Body 16px Regular
- 表头用 Label（Commit Mono 大写）
- **不用红/绿两色做对比卡的区分手段**，字重和尺寸才是叙事方式

### Floating Capsule Annotations（浮动胶囊注解）

- 圆角 24px，高 48px，左右 padding 24px
- 浅色主题底色 White / Fog；深色主题 `#1A1A18`，1px Silver 描边，不做阴影
- `position: absolute`，叠在图的 1/3 处，不遮住设备核心区域
- 每张图最多 3 个，布局不对称，不整齐排一列
- 内容：绿点（8px，Accent）+ Label 文字

### Connection Line Diagrams（连接线图）

- 1.5px 描边线（Ink 或 White），线端 4px Accent 圆点标注节点
- 文字标注紧贴线旁，Caption 样式，不做气泡包裹
- 纯 SVG 实现，背景空旷，不堆满元素

---

## Logo

| 形态 | 比例 | 用在哪 |
|---|---|---|
| Logo（图标+字标） | 约 5.2:1 | 默认，页头、页脚 |
| Wordmark（纯字标） | 约 5.5:1 | 已有图标在场时 |
| Symbol（图形标志） | 1:1 | favicon、头像、加载态 |
| App Icon | 1:1，圆角 16.4% | 只在应用场景要求时 |

网页显示高度：页头 32px · 页脚 24px · Hero 64 或 72px · 最小 24px

**图标颜色规则：**
- Symbol 背景（外圆角矩形）：`fill="black"` — 永远黑色，不跟随主题
- Symbol 内部形状（白色剪影）：`fill="white"` — 永远白色
- 字标（Wordmark）：`fill="currentColor"` — 跟随文字色，浅色主题黑、深色主题白
- 深色背景上使用完整 Logo 时无需修改，黑色图标方块自然显示
- 如在纯黑/接近黑的背景（如 `#000` 或 `#111110`）上单独使用 Symbol，需给外矩形加 1px `#2E2E2B` 描边或换用白底版本，保持可辨识

**完整 Logo SVG（图标 + 字标，直接内联使用）：**

`<a class="brand">` 必须设置 `color: var(--text)`——浏览器默认链接色是蓝色，`currentColor` 会让字标变蓝。

```html
<a class="brand" href="#top" aria-label="Tokkey">
  <svg class="logo" viewBox="0 0 586 111" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="110.032" height="110.032" rx="18.0521" fill="black"/>
    <rect x="44.1279" y="81.9507" width="32.0926" height="32.0926" rx="4.58466" transform="rotate(-180 44.1279 81.9507)" fill="white"/>
    <rect x="86.5356" y="92.2662" width="32.0926" height="32.0926" rx="16.0463" transform="rotate(-180 86.5356 92.2662)" fill="white"/>
    <rect x="97.9976" y="49.8582" width="55.0159" height="32.0926" rx="4.58466" transform="rotate(-180 97.9976 49.8582)" fill="white"/>
    <path d="M47.5317 49.873C45.6249 50.0358 44.1276 51.634 44.1274 53.5829C44.1274 53.7107 44.1334 53.8374 44.146 53.9619L42.9614 55.0156L38.9702 50.4316L39.48 49.8505C41.4332 49.735 42.9819 48.115 42.9819 46.1328C42.9819 46.0481 42.9777 45.9641 42.9722 45.8808L43.0024 45.8466L47.5317 49.873Z" fill="white"/>
    <path d="M510.351 16.0464H529.373L547.69 50.6405H548.475L566.792 16.0464H585.814L556.515 67.9768V96.3737H539.65V67.9768L510.351 16.0464Z" fill="currentColor"/>
    <path d="M439.889 96.3737V16.0464H494.016V30.0488H456.872V49.1893H491.231V63.1916H456.872V82.3714H494.173V96.3737H439.889Z" fill="currentColor"/>
    <path d="M303.783 55.016C303.783 63.7757 302.123 71.2279 298.802 77.3727C295.507 83.5176 291.01 88.2112 285.309 91.4536C279.635 94.6698 273.255 96.2779 266.169 96.2779C259.03 96.2779 252.624 94.6567 246.95 91.4143C241.276 88.172 236.791 83.4783 233.497 77.3335C230.202 71.1887 228.555 63.7495 228.555 55.016C228.555 46.2563 230.202 38.8041 233.497 32.6593C236.791 26.5144 241.276 21.8339 246.95 18.6177C252.624 15.3753 259.03 13.7541 266.169 13.7541C273.255 13.7541 279.635 15.3753 285.309 18.6177C291.01 21.8339 295.507 26.5144 298.802 32.6593C302.123 38.8041 303.783 46.2563 303.783 55.016ZM286.565 55.016C286.565 49.3418 285.715 44.5567 284.015 40.6606C282.342 36.7645 279.975 33.8098 276.916 31.7964C273.856 29.783 270.274 28.7763 266.169 28.7763C262.064 28.7763 258.481 29.783 255.422 31.7964C252.363 33.8098 249.983 36.7645 248.284 40.6606C246.61 44.5567 245.773 49.3418 245.773 55.016C245.773 60.6902 246.61 65.4753 248.284 69.3714C249.983 73.2675 252.363 76.2222 255.422 78.2356C258.481 80.249 262.064 81.2557 266.169 81.2557C270.274 81.2557 273.856 80.249 276.916 78.2356C279.975 76.2222 282.342 73.2675 284.015 69.3714C285.715 65.4753 286.565 60.6902 286.565 55.016Z" fill="currentColor"/>
    <path d="M150.979 30.0488V16.0464H216.95V30.0488H192.358V96.3737H175.571V30.0488H150.979Z" fill="currentColor"/>
    <rect x="371.673" y="96.8224" width="18.4848" height="18.4848" rx="9.24238" transform="rotate(-180 371.673 96.8224)" fill="currentColor"/>
    <path d="M372.267 68.7234L377.867 77.7806L378.434 78.7826L390.302 95.0697C390.868 95.8475 391.773 96.3076 392.735 96.3076H405.618C408.077 96.3076 409.499 93.5194 408.055 91.5286L391.964 69.3382C391.157 68.2254 391.206 66.7074 392.083 65.649L416.313 36.4132C417.94 34.4504 416.544 31.4805 413.995 31.4805H401.474C400.57 31.4805 399.713 31.887 399.141 32.5877L372.495 65.2358C371.683 66.2307 371.591 67.6311 372.267 68.7234Z" fill="currentColor"/>
    <path d="M325.068 16.0468V96.3741H342.051V75.0902L351.248 64.8074L362.564 52.0136L392.373 16.0468H372.017L343.11 51.4645H342.051V16.0468H325.068Z" fill="currentColor"/>
  </svg>
</a>
```

**Symbol-only SVG（favicon、头像、加载态）：**

```html
<svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="110.032" height="110.032" rx="18.0521" fill="black"/>
  <rect x="44.1279" y="81.9507" width="32.0926" height="32.0926" rx="4.58466" transform="rotate(-180 44.1279 81.9507)" fill="white"/>
  <rect x="86.5356" y="92.2662" width="32.0926" height="32.0926" rx="16.0463" transform="rotate(-180 86.5356 92.2662)" fill="white"/>
  <rect x="97.9976" y="49.8582" width="55.0159" height="32.0926" rx="4.58466" transform="rotate(-180 97.9976 49.8582)" fill="white"/>
  <path d="M47.5317 49.873C45.6249 50.0358 44.1276 51.634 44.1274 53.5829C44.1274 53.7107 44.1334 53.8374 44.146 53.9619L42.9614 55.0156L38.9702 50.4316L39.48 49.8505C41.4332 49.735 42.9819 48.115 42.9819 46.1328C42.9819 46.0481 42.9777 45.9641 42.9722 45.8808L43.0024 45.8466L47.5317 49.873Z" fill="white"/>
</svg>
```

```css
.brand {
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  color: var(--text);
}
.brand svg.logo { height: 32px; width: auto; }
```

**禁止：** 拉伸变形、换色、加阴影或发光、放在花哨背景上、重排图标和字标相对位置、用 Inter 排「TOKKEY」冒充字标、删减或修改任何 path 数据。

---

## Photography

| 镜头 | 用在哪 |
|---|---|
| 黑底戏剧光，设备从端口斜插出 | Hero，全页只用这一张黑底图 |
| 白底 45° 俯视，键盘一角 + 机身侧边 | 「插上就能用」主叙事图 |
| 白底侧面平视，设备坐在端口里 | 规格 / 兼容性区块 |
| 白底边角俯视，机身边缘大面积留白 | 过渡、分隔 |
| 单体 3/4 角、单体正面 | 工艺、细节区块 |
| 端面正视（露出 USB-C） | 接口、便携性 |
| 四色并排 | 只用在 finishes / 颜色区块 |

**硬规则：** 背景只有纯白无缝或纯黑戏剧光。白底图放白色图板（深色主题也固定白底）。叙事图统一用银色版。产品占画面 1/4 到 1/3，其余留白。一屏一张，不做拼贴墙。手部只出现在尺度参考图，全页最多一张。渲染图标注「Concept renders」。

---

## Icons

用 **pixelarticons** 风格的内联 SVG（`fill="currentColor"`），跟随明暗主题。尺寸：24px 栅格，只按 24 的倍数缩放，规格条用 48px。

同一区块内只用一个图标家族。绿色只点状态，不填整个图标。

**例外：Hero「powerFlow」场景整块用线性图标（legacy 页面原图形，不用 pixelarticons）**：24×24、`fill="none"`、`stroke-width="1.6"`、圆角端点，图形定义在 `src/config/power.ts` 的 `ICONS`。With Tokkey 卡片与底部条的图标描边用渐变 `stroke="url(#渐变)"`，渐变从左下到右上（`gradientUnits="userSpaceOnUse" x1="2" y1="22" x2="22" y2="2"`），只用下面四组，定义在 `src/config/power.ts` 的 `ICON_GRADIENTS`：

| Tone | 色标 | 用于 |
|---|---|---|
| orange | `#FF6A00` → `#FFB63D` | Tokkey Flash、No precision loss |
| ai | `#FFB49A` · `#E8D58A` (.3) · `#9FE0A8` (.55) · `#8CC4FF` (.8) · `#D3A8FF` | Schedule Compute、Run bigger models |
| green | `#6FE08A` → `#D2F58C` | Unified Memory、Plug in |
| pink | `#FF3D8F` → `#C645FF` | SSD / Storage、No new computer |

规则：渐变图标只出现在深色背景的「Tokkey 方」；「Without Tokkey」一侧和玻璃 chip 里的图标描边用 `currentColor`（灰或白）。其他区块不用线性图标和渐变图标。

**直接可用的 SVG path（24×24 viewBox）：**

```html
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v12H3V3zm2 2v8h14V5H5zM1 17h22v2H1v-2z"/></svg>
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6v2h2v2h2v6h-2v2h-2v2H9v-2H7v-2H5V6h2V4h2V2zm0 4v8h6V6H9zM7 7H5v2h2V7zm10 0v2h2V7h-2zM7 11H5v2h2v-2zm10 0v2h2v-2h-2z"/></svg>
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 2h2v2h2v2h2v2h-4V6h-2v4h2v2h2v2h2v2h-2v2h-2v2h-2v-2H9v-2H7v-2h4v2h2v-4h-2v-2H9V8H7V6h4V4h2V2z"/></svg>
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h2v5H3V4zm2 5h4v2H5V9zm4-5h2v16H9V4zm-2 0H3v2h4V4zm8 8h2v6h-2v-6zm2-2h-4v2h4v-2zm-4-6h-2v8h2V4zm2 0h2v2h-2V4z"/></svg>
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 2h20v8H2V2zm0 12h20v8H2v-8zm2 2v4h16v-4H4zm0-12v4h16V4H4zm14 2h2v2h-2V6zm0 12h2v2h-2v-2z"/></svg>
<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 2h12v2l-4 6 4 6v2H6v-2l4-6-4-6V2zm2 2v.5L12 10l4-5.5V4H8zm0 14h8v-.5L12 14l-4 5.5V18z"/></svg>
```

---

## Do's and Don'ts

### Do

- 所有间距、字号、行高、圆角是 8 的倍数
- 层级靠字重和尺度建立（不靠颜色）
- 黑底区块和浅色区块交替出现
- 每个区块都有 eyebrow 锚点标签（Commit Mono 大写）
- 标题写短句 + 句号，句末用 Accent 绿点
- 图标用 pixelarticons 风格内联 SVG，尺寸 24 的倍数（powerFlow 场景例外：用线性图标，Tokkey 方可用四组渐变，见 Icons）
- Logo 直接使用本 skill 中的 SVG 代码，不重新绘制
- 发丝线分隔用 1px Silver，不做方框
- 产品图占画面 1/4 到 1/3，其余留白
- 图表下方写明计算假设，标注为估算而非承诺
- padding 从外到内递减，同层级元素完全一致
- `.brand` 必须写 `color: var(--text)`（防止字标变蓝）
- 按钮颜色用 `background: var(--text); color: var(--bg)` 自动适应主题
- 黑底区块内 CTA 用 `.btn-on-black`（`#fff` 底 `#000` 字）
- 页面 `<head>` 第一行 JS 初始化主题：`document.documentElement.setAttribute('data-theme','dark')`
- **Artifact 用 Commit Mono 时必须 base64 内联所有 4 个 .otf 文件**

### Don't

- 不用拟物图标（锁、钥匙、盾牌、云朵、齿轮）
- 不用 Commit Mono 写导航、按钮、caption、段落、页脚（>10% 会变终端截图）
- 不用红/绿两色做对比卡的区分手段
- Negative (#F83830) 不出现在正向内容里
- Accent 面积不超过 5%，不做整块绿底，**不用 Accent 做主题 switch 的选中色**
- 不自己生成产品图、不用图库图
- 不把两张产品图并排或做拼贴墙
- 不用 20px 圆角（只用 16 或 24）
- 不用 Inter 排「TOKKEY」冒充字标
- 不修改 Logo SVG 的任何 path 数据或颜色值
- 不在 Hero 和金句区块以外的区块居中
- 不做均匀平铺、每个区块长得一样的页面
- 不加阴影、不加渐变底色到产品图背景
- 不省略 `.brand` 的 `color` 属性（否则字标在 `<a>` 标签下会变浏览器蓝）
- 不用硬编码颜色写按钮（`background: #111110` 在深色模式下与背景融合消失）
- **不假设系统字体在 Artifact 里可用**——即使用户已本机安装 Commit Mono，Artifact 沙盒也访问不到

---

## CSS Variables

**深色优先（Dark-first）四段式写法。** Tokkey 官网 prioritize dark mode，`:root` 默认写深色 token，浅色作为 override。

```css
:root {
  --ink: #111110;
  --silver: #DADAD6;
  --ash: #B0B0AC;
  --graphite: #5C5C58;
  --accent: #4ABE18;
  --negative: #F83830;
  --studio: #F4F4F2;
  --sans: 'Inter', sans-serif;
  --mono: 'Commit Mono', 'Courier New', monospace;
  --mono-feat: 'ss03', 'ss04', 'ss05';
  --bg: #111110;
  --bg-2: #1A1A18;
  --card: #1A1A18;
  --hair: #2E2E2B;
  --text: #F2F2F2;
  color-scheme: dark;
}
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg: #FFFFFF; --bg-2: #F2F2F2; --card: #F2F2F2;
    --hair: #DADAD6; --text: #111110; color-scheme: light;
  }
}
:root[data-theme="light"] {
  --bg: #FFFFFF; --bg-2: #F2F2F2; --card: #F2F2F2;
  --hair: #DADAD6; --text: #111110; color-scheme: light;
}
:root[data-theme="dark"] {
  --bg: #111110; --bg-2: #1A1A18; --card: #1A1A18;
  --hair: #2E2E2B; --text: #F2F2F2; color-scheme: dark;
}
```

初始化（必须在 `<head>` 最前面）：

```html
<script>document.documentElement.setAttribute('data-theme','dark');</script>
```

主题切换 JS：

```js
const root = document.documentElement;
const sw = document.getElementById('themeBtn');
function isDark() { return root.getAttribute('data-theme') === 'dark'; }
function sync() { sw.setAttribute('aria-checked', isDark() ? 'true' : 'false'); }
sw.addEventListener('click', () => { root.setAttribute('data-theme', isDark() ? 'light' : 'dark'); sync(); });
sync();
```

Pill Switch 按钮：

```html
<button class="theme-switch" id="themeBtn" role="switch" aria-checked="true" aria-label="Toggle dark mode"><span class="thumb"></span></button>
```

```css
.theme-switch {
  position: relative; width: 44px; height: 26px;
  border-radius: 13px; background: var(--graphite);
  border: none; cursor: pointer; flex: none; transition: background 0.2s;
}
[data-theme="dark"] .theme-switch { background: var(--text); }
[data-theme="light"] .theme-switch { background: var(--graphite); }
.theme-switch .thumb {
  position: absolute; top: 3px; left: 3px;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--bg); transition: transform 0.18s ease;
}
[data-theme="dark"] .theme-switch .thumb { transform: translateX(18px); }
```

---

## Checklist

- [ ] 所有间距、padding、字号、行高、圆角能被 8 整除
- [ ] padding 从外到内递减，同层级元素完全一致
- [ ] 主标题和正文尺度差距达到 6 倍
- [ ] 黑底区块和浅色区块交替出现
- [ ] 每张产品图 logo 面朝向观众、插接处看得清楚
- [ ] 白底图在白色图板上（包括深色主题）
- [ ] 叙事图全是银色版，四色图只在 finishes 区块
- [ ] Accent 绿色面积未超过 5%，未用于 Switch 选中色
- [ ] Commit Mono 未超过文字量的 10%，导航 / caption / 段落未误用等宽
- [ ] 除 Hero 和金句区块外，其余区块左对齐
- [ ] 图标全是 pixelarticons 风格、24 的倍数，同区块只用一个家族
- [ ] 线性 / 渐变图标只出现在 powerFlow 场景，渐变只在 Tokkey 方且只用 Icons 里的四组
- [ ] 分隔是 1px 发丝线，不是方框或粗线
- [ ] Logo SVG 直接从 skill 复制，未修改任何 path 或颜色
- [ ] `<head>` 第一行有 `setAttribute('data-theme','dark')` 初始化
- [ ] 主题 JS 用 `=== 'dark'` 判断而非 `!== 'light'`
- [ ] Hero 黑底图用 `mix-blend-mode: screen`；白底图用 mask-image
- [ ] Negative (#F83830) 只出现在对比 / misuse 场景
- [ ] 图表下写了计算假设
- [ ] `.brand` 设了 `color: var(--text)`，字标不是蓝色
- [ ] 按钮用 `background: var(--text); color: var(--bg)`，深色模式下可见
- [ ] 黑底区块内 CTA 用 `.btn-on-black`（白底黑字）
- [ ] 明暗两个主题都检查过一遍（页面默认深色）
- [ ] **Artifact 页面：Commit Mono 已 base64 内联（不依赖系统字体）**