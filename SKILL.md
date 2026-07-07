---
name: pta-auto-submit
version: 0.1.0
homepage: https://github.com/HZ-Abox/pta-auto-submit
description: >
  自动化完成 PTA（拼题A / pintia.cn）平台的「登录 → 抓题 → 解答 → 提交」全流程，
  通过 Playwright MCP 驱动真实浏览器操作页面。只要用户提到 PTA、拼题A、pintia、
  程序设计实验平台、在线判题、自动刷题、批量做题、自动提交代码、自动作答判断题/
  选择题/编程题/函数题，或希望让浏览器自动登录 PTA 并完成一套试卷——即使没有明说
  「用这个 skill」，也务必主动触发本技能。它同样适用于：CodeMirror 编辑器无法粘贴时
  的代码注入、带图片题目的识别解答、以及跨题断点续做等场景。遇到「帮我把这套 PTA
  题做了」这类请求时优先使用本技能，不要退化成手动逐条指导用户。
triggers:
  - PTA
  - 拼题A
  - pintia
  - 自动刷题
  - 在线判题
---

# PTA 自动解题与提交

自动完成 PTA 平台上一整套试卷的解答。核心工程难点在于：PTA 用 **CodeMirror 6**
编辑器，普通模拟粘贴常常失效，所以本技能内置了通过 React Fiber 反查 `EditorView`
再调用 `view.dispatch()` 的注入方案（细节见 `references/codemirror.md`）。

## 交互原则：默认自主，只在真正不可逆处停下

这个技能的价值在于把用户从几十道题的重复劳动里解放出来，所以**默认连续自主执行**
整条流程，为可逆步骤选合理默认值并继续。之所以不每步都确认，是因为选内核、翻页、
点选项、进下一题这类操作即便判断偏了也极易纠正，频繁打断反而拖慢用户、消耗耐心。

只在以下**三个真正高风险或不可逆**的节点必须停下：

1. **需要凭据时** —— PTA 登录必须由用户亲自输入账号密码，绝不猜测、存储或回显。
2. **确定抓取范围时** —— 首次要弄清用户想做「哪一类 / 哪些」题，避免误抓一大批无关题目。
3. **遇到无法自动解答的题目时** —— 不要伪造答案，如实交回给用户处理。

其余情况自行决策推进。若某个默认判断可能有争议，采用「先执行，并在回复里简短说明
我做了什么、如何撤销」，而不是提前拦一道确认。

## 前置：确保 Playwright MCP 就绪

在打开浏览器前先备好工具链，能自动完成的不要问用户。按序执行：

1. **检测**：查看 MCP 配置里是否已有 `@playwright/mcp` 或 `playwright` 条目，
   或直接尝试列出其工具。已可用则跳到「启动」。
2. **安装**：若没有，在 MCP 客户端配置中加入官方服务条目
   （`npx -y @playwright/mcp@latest`），或终端预拉取确认可执行。环境缺 Node/npm
   时才提示用户安装 Node.js——这属于环境缺失，需要告知。
3. **选内核**：**默认 chromium**（覆盖 Chrome / Edge / 360 / QQ 等所有 Chromium 系），
   无需为此打断用户；仅当用户表达过偏好或 chromium 安装失败才换 firefox / webkit。
   首次运行需 `npx playwright install chromium`，下载慢属正常。
4. **启动并轻验证**：启动后打开空白页或直接进 PTA 首页确认链路通畅。启动失败时先自行
   尝试常见修复（重装/换内核、查网络），多次失败才把具体报错汇报用户。

## 工作流

### 第一步：登录并进入题目列表

打开 `https://pintia.cn/home`，然后**停下让用户输入账号密码**（三个必须确认点之一）。
登录成功会自动跳到题目列表，无需再确认。

### 第二步：分析页面结构

进入后通过 DOM 分析识别题目按钮、选项、输入框、代码区。PTA 是 React 应用，
代码编辑器容器 class 为 `.cm-editor`、内容节点为 `.cm-content[contenteditable="true"]`。
完整选择器与按钮文案清单见 `references/selectors.md`。

### 第三步：抓取题目范围

先自动查看平台上有哪些题目分类，然后**停下让用户选择做哪一类**（第二个必须确认点，
防止误抓）。用户确定后连续翻页抓取该类全部题目，翻页无需逐页确认；有子代理能力时
可派生子代理并行抓取。

### 第四步：解答并自动提交

确定范围后连续解题，不要每题都问。判断题型后走对应分支：

- **判断题 / 单选 / 多选**：直接点选正确选项（可脚本批量点击），再点「保存」提交。
- **编程题 / 函数题**：先判断编辑器能否直接粘贴。能粘贴就粘贴后提交；不能粘贴则用
  CodeMirror 6 内部 API 注入——脚本见 `scripts/inject_code.js`，原理见
  `references/codemirror.md`。注意函数题**不能带 main 和 #include**（裁判会自动
  提供上下文），编程题则要完整可运行；判断依据见 `references/selectors.md` 中的
  `#tab-CODE_COMPLETION`。
- **带图片的题目**：具备图片识别能力就直接识别解答；无法识别时把图片下载到工作目录，
  然后**停下告知用户无法自动解答**（第三个必须确认点），请用户用文字补充题面。

提交后不要急着下结论。评测有「等待评测 / 评测中 / 排队中」等中间态，需轮询到最终态
（答案正确 / 答案错误 / 编译错误 / 运行超时 等）才判定成败。轮询与结果解析的实现要点
见 `references/submit-flow.md`。

### 解答失败时的自愈

测试不匹配或提交未过时，把「题面 + 旧代码 + 具体错误（编译输出 / 实际vs预期 / 评测详情）」
一起交给模型重生成，而不是盲目重试。为单题设一个重试上限（默认 5 次），超过就如实标记
并跳到下一题，避免在一道题上空转。临时网络错误（502/503/504/超时）单独计数、短暂等待后
重试（默认最多 3 次），不要和业务重试混为一谈。

## 会话与状态管理

- 批量做题会让上下文变长。适时**主动提醒**用户：上下文过长时建议 `/clear`
  （这是提醒，不是征求同意）。
- 跨题跳转时页面会重新加载，用会话级标记（正在刷题 / 导航目标题）保持状态，
  重新进入时据此自动续做。具体键名与恢复逻辑见 `references/submit-flow.md`。
- 每次开始先自行判断界面状态；只有分不清「开新任务」还是「续上次 /clear 的任务」时，
  才简短问一次。

## 安全与边界

- 绝不存储或回显 PTA 账号密码。
- 无法解答的题目如实告知，绝不伪造答案。
- 只在 `pintia.cn` 域名下操作，不越界访问其他站点。

## 参考文件

- `references/codemirror.md` —— React Fiber 反查 `EditorView` 与 `view.dispatch()`
  注入的原理、10 级 `.return` 向上遍历、为何不能直接改 `innerText`。
- `references/selectors.md` —— 题面分节（h3 sections）、按钮文案、语言选择器
  （React-Select）、题目状态 class（PROBLEM_ACCEPTED 等）、函数题判定选择器。
- `references/submit-flow.md` —— 提交后 modal 轮询、评测状态枚举、结果/评测详情解析、
  跨页面会话标记与断点续做。
- `scripts/inject_code.js` —— 现成的 CodeMirror 6 代码注入脚本。

## 更多文档

本技能为 [HZ-Abox/pta-auto-submit](https://github.com/HZ-Abox/pta-auto-submit) 仓库的一部分。
面向**用户**的详细用法，见 GitHub 仓库的
[docs/INSTALL.md](https://github.com/HZ-Abox/pta-auto-submit/blob/main/docs/INSTALL.md)、
[docs/USAGE.md](https://github.com/HZ-Abox/pta-auto-submit/blob/main/docs/USAGE.md)；
面向**二次开发者**的结构说明，见
[docs/contributor-guide/ARCHITECTURE.md](https://github.com/HZ-Abox/pta-auto-submit/blob/main/docs/contributor-guide/ARCHITECTURE.md)。
