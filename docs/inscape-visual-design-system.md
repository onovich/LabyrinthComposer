# Inscape 视觉系统设计文档

状态：当前实现归纳 + 可复刻规范

本文描述当前 Inscape SelfHostedEditor 与 HTML 调试预览的视觉系统。它不是品牌营销稿，而是一份可交给其他项目复刻相似效果的美术与前端约束文档。

## 设计目标

Inscape 的界面首先是叙事写作工作台，其次才是工具面板集合。视觉目标是让作者大部分时间感觉自己在写一份干净、安静、有层次的叙事文稿，同时保留 VSCode 级别的导航、诊断、补全、引用和预览能力。

核心气质：

- 暖白纸面：接近纸张和轻量文稿，而不是冷硬 IDE。
- 低干扰工具层：按钮、状态、路径、计数和元信息默认退后，hover / focus / selection 时再增强。
- 双栏写作闭环：左侧写作，右侧阅读预览；预览不是装饰，而是写作反馈的一半。
- 作者优先：正文、角色、选项和标题是主视觉；line id、anchor、provider、session、diagnostics 属于提示层。
- 可解释的工程感：界面可以显示诊断、图、CSV review 和 runtime 状态，但必须保持克制、轻、薄、可扫描。

参考融合方向：

- Inky 的“边写边玩”双栏骨架。
- Notion / Medium 的正文优先、块级层次和低干扰控制。
- VSCode / Monaco 的语言能力、补全、hover、定义/引用和诊断。
- Yarn Spinner Graph View 的节点图阅读方式，但图位置只是展示元数据，不是逻辑真相。

## 美术风格约束

### 必须保持

- 使用 light theme 作为当前默认和唯一已定稿主题。
- 主背景使用接近白纸的暖白，不使用纯灰工业界面。
- 主文字使用暖黑，不使用纯黑。
- 交互强调色使用低饱和橄榄灰，不使用高饱和蓝、紫、绿。
- 元信息使用蓝灰或淡灰，不能抢正文。
- 危险、冲突、移除状态使用低饱和红棕；新增、变更、警告使用低饱和赭棕。
- 大部分分割线、hover、选区、面板边框都应低于 12% 不透明度。
- 常驻 chrome 尽量弱化，通过 hover / focus 提升可见度。
- 正文区域不能被标签墙、强背景块、过多边框或重阴影破坏阅读节奏。

### 必须避免

- 避免深色赛博、霓虹、高饱和渐变、玻璃拟态和强装饰背景。
- 避免把编辑器做成传统 IDE：多面板常亮、线号常驻、高对比控件密集堆叠。
- 避免把预览做成游戏最终 UI：当前预览是调试阅读面板，不模拟 Unity 演出、不加载复杂素材。
- 避免卡片套卡片。页面级区域应该是无框布局或整面板，卡片只用于图节点、浮层、对话框和重复项。
- 避免把辅助状态放在主视图中央长期常驻。不能帮助用户两秒内继续阅读或写作的信息，应放在边缘层、切换面板或 hover 层。

## 色彩系统

当前主 token 位于 `src/ExternalSupport/SelfHostedEditor/Resources/Styles/SelfHostedEditorBase.css`。复刻时应先复制这套语义 token，再让各 feature CSS 消费 token。

### 基础色

| 用途 | Token | 色值 | 说明 |
| --- | --- | --- | --- |
| 页面背景 | `--page` | `#fbfbfa` | 整体暖白，不偏蓝 |
| 侧边栏 | `--sidebar` | `#f6f6f4` | 比页面略深的纸灰 |
| 主表面 | `--surface` | `#ffffff` | 编辑器、预览、面板底 |
| 柔和表面 | `--surface-soft` | `#fbfbf9` | 次级区域 |
| 弱表面 | `--surface-muted` | `#f0f0ec` | 低层级控件背景 |
| 暖纸面 | `--surface-warm` | `#fffdfb` | 写作区渐变终点 |
| 图画布 | `--graph-canvas` | `#fbfaf7` | 节点图背景 |
| 主文字 | `--text` | `#27241f` | 暖黑 |
| 弱文字 | `--muted` | `#938b7d` | 边缘提示 |
| 强弱文字 | `--muted-strong` | `#655f54` | 可读但仍退后的文字 |
| 主强调 | `--accent` | `#6a6d57` | 橄榄灰 |
| 危险 | `--danger` | `#a55e52` | 红棕 |
| 警告 | `--warning` | `#98753b` | 赭棕 |
| 角色点缀 | `--story-speaker-accent` | `#7c6540` | 温暖棕色 |

### 透明度规则

Inscape 大量使用同一暖黑与橄榄灰的 alpha token。复刻时不要随手写新颜色。

- 结构分割线：`rgba(39, 36, 31, 0.018)` 到 `0.04`。
- 常态 hover / item active：`rgba(39, 36, 31, 0.016)` 到 `0.055`。
- 浮层边框：`rgba(39, 36, 31, 0.06)` 到 `0.095`。
- 浮层阴影：`rgba(39, 36, 31, 0.045)` 到 `0.13`。
- 选区 / block active：`rgba(106, 109, 87, 0.035)` 到 `0.08`。
- 强 focus ring：`rgba(106, 109, 87, 0.08)` 到 `0.09`，通常 3px。
- metadata / query 底色：`rgba(123, 143, 158, 0.07)` 到 `0.105`。

### 语义色用法

- 正文、标题、对白：暖黑系。
- 旁白：暖黑 68% 左右。
- 选项、prompt：暖灰棕 84% 左右。
- 元信息 `@...`：弱灰棕 42% 左右。
- 查询插值 `[query]`：蓝灰底 + 蓝灰文字。
- speaker 名称：低饱和棕色，只作为轻点缀。
- 诊断错误、冲突、移除：红棕，但背景保持 8% 到 12%。
- 新增、变更、warning：赭棕，但不得像警告横幅一样抢眼。

## 字体与排版

### 字体栈

SelfHostedEditor 使用：

```css
font-family: "Inter", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
```

要求：

- 中英文混排必须自然，不使用等宽字体作为正文。
- 正文和预览 letter spacing 为 `0`。
- 小号 chrome 标签可使用 `0.04em` 到 `0.08em` 的 uppercase letter spacing。
- 静态 HTML 调试预览中的 meta pill / query token 可使用 `"Cascadia Mono", Consolas, monospace`，但 SelfHostedEditor 主写作面不应被等宽代码感主导。

### 主要字号

| 场景 | 字号 / 行高 | 说明 |
| --- | --- | --- |
| 预览标题 | `34px / 1.05`, weight `720` | 短标题，最大宽约 `9.5em` |
| 预览正文行 | `20px / 1.88` | 阅读感优先 |
| 预览选项文本 | `13px / 1.74` | 小而清晰 |
| 预览 speaker label | `8px`, uppercase | 作为提示，不当正文 |
| provider / pane label | `8px-9px`, uppercase | 默认低透明 |
| 侧边栏项 | `9px-10px` | 密但安静 |
| 表格正文 | `12px-14px` | 本地化 review 可扫描 |
| 图节点标题 | `13px / 1.35` | 紧凑节点卡 |
| 行号 rail | `8px-11px` | hover / active 才显著 |

静态 HTML 调试预览的默认 story line 是 `28px / 1.84`，比 SelfHostedEditor 当前阅读面板更大、更像独立故事卡。复刻桌面工作台时应优先参考 SelfHostedEditor；复刻单页预览导出时再参考静态 HTML 预览。

## 布局系统

### 总体壳

当前工作台布局：

- App shell：`216px` 侧边栏 + 剩余主区。
- Top bar：最小高度 `40px`，半透明白底，底部分割线 2.6% 暖黑。
- Workbench body：桌面端 `78px clamp(56px, 7vw, 124px) 104px`。
- 默认 workspace：左写作 `minmax(620px, 1fr)`，右预览 `minmax(360px, 0.72fr)`。
- 双栏间距：`clamp(56px, 7vw, 96px)`。
- 预览栏左侧有极淡分割线，并有 `clamp(44px, 5vw, 76px)` 左内距。
- `900px` 以下进入单栏，侧边栏变顶部区域，预览在写作区下方。

### 内容宽度

- 写作正文最大宽：`--editor-width: 700px`。
- 预览正文最大宽：`--preview-width: 560px`。
- 预览 story line 最大宽：`24em`。
- 预览 choice list 最大宽：`24rem`。

这些宽度是视觉系统的一部分。不要让正文横跨整个大屏，也不要让预览变成窄手机卡片。

### 滚动规则

- 编辑器和预览是独立 scroll containers。
- 外层 workbench body 不应成为共享滚动面。
- Monaco sticky scroll 在写作面中禁用，标题和 prompt 应像普通文稿一样滚走。
- 引用 / 跳转候选应使用浮层，不应像 Monaco peek 一样插入并撑开正文排版。

## 组件规范

### 通用按钮

默认按钮：

- 背景透明。
- `border-radius: 10px`；模式切换、pill、状态胶囊使用 `999px`。
- 最小高度 `28px`。
- padding 通常 `6px 8px`。
- hover 背景约 `rgba(39, 36, 31, 0.032)`。
- transition `140ms ease`。
- 不使用重边框、重阴影或高饱和填充。

主确认按钮可使用 `--accent-a-920` 背景与白字，但应只出现在对话框或明确提交动作中。

### 顶栏

顶栏不是主视觉。它应像玻璃纸一样轻：

- 背景 `rgba(255, 255, 255, 0.82)`。
- 内容默认 opacity 较低，hover 后增强。
- layout switcher 是小号 pill 控件，常态 opacity 约 `0.54`。
- Syntax / Node Map 等工具按钮默认 opacity 约 `0.48`，hover 到 `0.88`。

### 侧边栏

侧边栏是安静索引层：

- 宽 `216px`。
- 背景 `--sidebar`。
- 文件、Outline、session facts 分区内部滚动。
- 文件名 / outline title 使用 `9px`，路径或 provider 使用 `7px`。
- 路径、空状态、provider 默认透明，hover 或 active 才出现。
- section label 默认 opacity `0.2`，sidebar hover 后约 `0.56`。

### 写作编辑器

写作面是核心。实现要求：

- Monaco 背景、margin、editor background 全部透明。
- Monaco line number margin 默认 opacity `0`。
- 当前行 border 不显示。
- hoverHighlight、rangeHighlight、selectionHighlight、wordHighlight 使用极淡橄榄底，radius `5px`，无阴影。
- `.view-lines` 居中并限制最大宽 `700px`。
- 字体渲染使用 `optimizeLegibility`。
- hover 和 suggest widget 使用白色半透明浮层、8px radius、轻阴影。
- detected link 只在 Ctrl/Cmd hover 这类语义状态下表达链接感；不要常驻下划线。

语义样式：

- 标题：`#241f18`，weight `720`。
- 对白：主暖黑 92%，weight `440`。
- 旁白：主暖黑 68%。
- prompt / choice：暖灰棕 84%，weight `480`。
- metadata：弱灰棕 42%，`0.93em`，weight `420`。
- query token：蓝灰底，5px radius，weight `520`。

### 行号与身份提示 rail

左侧 hint rail 是“安静注解”，不是 IDE 行号栏：

- 宽 `132px`。
- 常态颜色极淡。
- block 内行号只在 hover 或 active 时显示。
- 标题行不显示正文行号。
- stable line id 只有 Tooling 提供 `line_...` 可用状态时才显示。
- 不允许伪造 stable id；未加载时保持安静，必要时只显示占位状态。
- stable id 在行号左侧展开，不改变正文排版。
- 标题 hover 时出现新增 block、引用计数、拖拽把手等轻量操作入口。

### 阅读预览

预览面应像安静阅读页，而不是游戏 UI：

- 背景白色。
- 桌面端 padding：顶部 `116px`，底部 `150px`。
- provider label：9px uppercase，opacity 约 `0.62`。
- story title：34px、短行宽、大下间距 `58px`。
- story line：20px / 1.88，padding `10px 0`，hover 极淡背景。
- metadata tag：蓝灰无边框 pill，非点击、不可选择。
- query token：蓝灰小 chip。
- speaker label：8px uppercase，角色名用低饱和棕色。
- choice list：正文后 `64px`，gap `12px`。
- choice button：透明底、1px 极淡边框、8px radius、hover 极淡暖黑底。
- choice number 使用 `decimal-leading-zero`，8px，低透明。
- choice target 常态隐藏，hover / focus 才显示；Flow 模式可保持约 68% 可见。

预览支持 Static 和 Flow：

- Static：完整显示 active block。
- Flow：从标题开始，点击逐行推进；speaker 快速 fade in，正文 typewriter，choice group 一次性出现。
- metadata 不消耗 Flow click。
- 鼠标滚轮只在预览 pane 到达顶部或底部后接管阅读步进。

### 节点图

图视图是结构阅读 / 受控编辑界面，应比正文更工具化，但仍保留暖白低饱和风格。

画布：

- 背景 `--graph-canvas`。
- 使用 1px radial grid，grid size `22px`。
- Graph view 激活时 workbench body 缩小 padding，图面板填满主区。
- 空画布拖拽 pan，滚轮 zoom。

节点：

- 宽 `220px`，最小高 `156px`。
- 背景 `rgba(255,255,255,0.96)`。
- radius `7px`，轻边框，轻阴影。
- hover / selected / connection target 只增强边框和外圈，不大面积变色。
- reference node 使用更淡 canvas 背景，并带 `reference` 小标签；它是视图层快捷方式，不是语义节点。

边：

- 默认 stroke 是橄榄灰 42%，宽 `1.8`。
- reference edge 使用 dashed line。
- hover edge 使用 slate blue-gray，略加粗。
- preview edge 使用 dashed accent。

端口：

- 圆形 10px，橄榄边框，白色外圈。
- output row hover 时只轻标 source / target / edge，不改变 selection。

### 本地化与审校表格

本地化 UI 是生产面板，不是通用 spreadsheet：

- 表格字体 `12px`，源文本 `14px / 1.6`。
- 表头 11px uppercase，弱灰。
- 行 hover 用 3% 暖黑底。
- 输入框 7px radius，focus 用橄榄 3px ring。
- 状态 pill 使用语义色，但背景不超过 12%。
- review action 是小按钮，24px 最小高度，6px radius。
- draft fallback、hosted provider、export readiness 等状态要清楚，但不能压过文本本身。

## 浮层与对话框

引用浮层、rename dialog、Monaco hover/suggest 是当前主要浮层类型。

约束：

- 背景用 `rgba(255,253,249,0.98)` 或 `rgba(255,255,255,0.98)`。
- 边框 6% 到 8% 暖黑。
- radius 通常 8px 到 16px。
- 阴影应轻：大阴影 8% 到 13%，小阴影 4% 到 6%。
- 浮层覆盖在正文之上，不应改变正文文稿流。
- 浮层内容要优先显示上下文预览和命中高亮，而不是只显示原始文件路径。

## 动效系统

动效用于解释状态，不用于装饰。

- 通用 hover / focus transition：`120ms` 到 `160ms ease`。
- speaker enter：`160ms ease-out`，轻微 `translateY(2px)`。
- typewriter caret：`900ms ease-in-out infinite`，低透明闪烁。
- loading 状态应 quiet，不打断主布局。
- 禁止大面积页面转场、弹跳、抖动、复杂装饰粒子或强烈视差。

## 视觉相关技术约束

### Token 与文件组织

- 颜色、透明度、宽度等基础视觉变量集中在 `SelfHostedEditorBase.css`。
- feature CSS 应消费 token；长期不要重新引入 feature hard-coded colors。
- `check:style-structure` 用于守住样式结构，不应被忽略。
- Workbench CSS 只负责 import，各 feature 文件保持边界清楚。

### Monaco 约束

- Monaco 是文本能力载体，不是目标视觉风格本身。
- 需要覆盖 Monaco 默认背景、margin、current-line、selection、hover、suggest，使其融入纸面写作。
- 行号、sticky scroll、peek 等 IDE 默认行为要被重审；不符合文稿流的默认关闭或替换为浮层。
- 语义样式来自 LanguageServer / Tooling / Compiler 的契约或受控 UI model，不在浏览器里重写语义真相。

### 预览约束

- SelfHostedEditor 预览正常路径应消费 Compiler / Runtime provider；UI-only draft model 只作为明确 offline fallback。
- 如果 Compiler graph payload malformed，应显示显式错误，不能用 draft 内容静默补齐。
- 预览 choice click 是产品不变量：点击选项必须推进阅读预览到目标 block，并在编辑器 reveal 目标标题。
- 预览与编辑器滚动独立，不互相拖动。

### 节点图约束

- 图中位置是展示元数据或 session memory，不改变逻辑语义。
- 图边来自 Compiler project graph 或受控文本 patch，不由前端猜测语义。
- edge drawing 读取真实 port center，不能用固定猜测坐标。
- back edge / cycle reference node 是视图层投影，不能生成新的语义节点。

### 状态与数据约束

- UI 可以 trim payload、relativize path、投影状态，但不能成为 Compiler / Tooling / Runtime / LanguageServer 的第二份真相。
- session status 不暴露文档正文、CSV、line-map 或 Runtime snapshot 本体。
- stable line id 只在 Tooling line sidecar 可用时显示。
- 本地化 review rows 正常消费 Tooling presenter；draft table 只在 review-unavailable fallback 使用。

### 响应式约束

- `900px` 以下切为单栏。
- 图视图要有独立 viewport，不能被普通双栏压缩成难读小图。
- 预览移动端降低顶部/底部 padding，但保持正文宽度和阅读节奏。
- 不使用 viewport width 缩放字体；用布局断点调整间距和列结构。

### 安全与载体约束

- 当前 desktop shell v0 决策为 Electron + embedded EditorBackend。
- Renderer 不直接访问 Node / 文件系统 / shell；通过 preload 白名单 editor command。
- Dev server 静态资源只允许 Workbench 所需目录，workbench page 有 CSP、no-store、nosniff 等边界。
- 静态 HTML 预览通过 `PreviewStyleSheetModel` 注入 CSS variables，适合导出和外部调试；SelfHostedEditor 工作台通过 `SelfHostedEditorBase.css` 管理 token。

## 静态 HTML 预览的兼容视觉

静态预览用于 CLI 导出与无编辑器环境调试。它比 SelfHostedEditor 更像一张可交互 story card。

默认 token：

- page background：`#f6f4ee`
- text：`#211d18`
- card：`#fbfaf6`
- node title / muted：`#8d846f` / `#8d8068`
- toolbar button：`#ece7db`
- source / meta / choice background：`#efeadf`
- speaker：`#7d5a34`
- query：`#e7f0ed` + `#2f675a`
- diagnostic：`#f2e6de` + `#7f2f18`
- story font：`28px / 1.84`
- card radius：`24px`
- choice radius：`16px`

复刻 SelfHostedEditor 桌面工作台时，不要直接把静态预览的大卡片感搬进主工作台；它只适合独立预览页面。

## 可复刻实施清单

1. 先建立 light-only 暖白 token 系统，并把所有 feature color 收敛到基础 token。
2. 搭建 216px quiet sidebar + 40px translucent topbar + 双栏 writing/preview body。
3. 将正文宽度限制在 700px，预览宽度限制在 560px。
4. 覆盖 Monaco 默认 IDE 视觉：透明背景、隐藏行号、禁用 sticky scroll、弱化 selection/highlight。
5. 实现左侧 hint rail：行号 hover 可见、stable id 有数据才显示、标题 hover 出现操作。
6. 预览实现 Static / Flow 两种阅读状态，metadata/query/speaker/choice 按本文样式分层。
7. 引用、跳转、hover、suggest 全部做浮层，不撑开文稿流。
8. 图视图使用浅色 grid canvas、220px 节点、真实 port center edge、reference node 投影。
9. 表格类生产视图保持小字号、弱分割、语义 pill，不做重型 spreadsheet。
10. 所有交互动画控制在 120ms 到 160ms，只有阅读 Flow 使用极轻 speaker enter 和 typewriter caret。
11. 所有 fallback / provider / session 状态要可见但低权重；错误要显式，不用漂亮假内容遮盖 contract failure。
12. 新增视觉元素前先判断它属于正文层还是提示层。正文层清晰稳定，提示层默认安静。

## 快速口径

对外描述这套视觉系统时，可以使用：

> 暖白纸面上的叙事写作工作台：Notion 式正文层级、Inky 式双栏写作/预览、VSCode 级语言能力，以及低饱和橄榄灰工具层。界面让正文和选择先被看见，让诊断、身份、provider、路径和审校信息退到 hover / focus / 边缘层。
