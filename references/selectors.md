# PTA 页面选择器与文案清单

PTA 是 React 应用，class 名常带 hash 后缀且按需变化，因此**优先按稳定的文本 / id /
class 关键字匹配**，避免依赖完整 class 名。

## 题面分节结构

每道题题面在 `<main>` 内是「H3 标题 + 直到下一个 H3 的所有兄弟节点」的分节模式。

提取时遍历每个带 id 的 h3，把它到下一个 h3 之间的兄弟节点合并为该节内容。
代码块要用 `.cm-content` 的 innerText（保留换行），普通节点用 textContent。
节 id 去掉中文冒号更干净："题目描述：" → "题目描述"。

## 题目元信息（正则解析 main.textContent）

| 字段 | 正则 | 示例 |
|---|---|---|
| 分数 | `/分数\s*(\d+)/` | 25 |
| 时间限制 | `/时间限制\s*(\d+)\s*ms/` | 1000 |
| 内存限制 | `/内存限制\s*(\d+)\s*MB/` | 64 |
| 代码长度限制 | `/代码长度限制\s*(\d+)\s*KB/` | 1024 |

## 函数题 vs 编程题判定

页面存在 `#tab-CODE_COMPLETION` → 函数题（只实现函数，不能带 main / #include，
裁判自动提供上下文）；否则为编程题（需完整可运行代码含 main）。此判定直接决定
生成代码的形态，是防止函数题因带 main 被判错的关键。

## 编辑器相关

| 目标 | 选择器 |
|---|---|
| 编辑器内容节点 | `.cm-content[contenteditable="true"]` |
| 编辑器根容器 | `.cm-editor` |
| 只读输出编辑器（测试） | `[class*="answerInput"]` 内的 `[class*="readOnly"]`，[0]=实际输出、[1]=预期输出 |

## 语言选择器（React-Select）

不能直接改 DOM，必须模拟点击展开再选：

| 目标 | 选择器 |
|---|---|
| 当前语言文本 | `.select__single-value` |
| 下拉触发控件 | `.select__control`（点击后等约 300ms 渲染选项） |
| 选项 | `.select__option`（按文本包含匹配目标语言，如 C (gcc) / C++ (g++) / Python (python3)） |

## 按钮（按精确文本匹配，勿依赖 class）

常见文案：测试用例、运行测试、提交本题作答、编译器输出、保存。
匹配用 `button.textContent.trim() === 文案`，且点击前检查 `!btn.disabled`。

## 题目列表与状态

左侧列表每题是 `<a href*="problemSetProblemId">`，内含 `[class*="problemStatusRect"]` 状态色块。
状态由 class 关键字判定：

| 状态 | class 关键字 | 含义 |
|---|---|---|
| accepted | `PROBLEM_ACCEPTED` | 已通过（绿灯） |
| wrong | `PROBLEM_WRONG_ANSWER` | 答错 / 部分错 |
| submitted | `PROBLEM_SUBMITTED` | 提交过但未 AC |
| no_answer | （无以上 class） | 未提交 |

列表选择器优先用 `.px-2.grid a[href*="problemSetProblemId"]`，找不到就 fallback 到
`a[href*="problemSetProblemId"]`（兼容新旧版本）。题号取 `a.textContent`（如 1-1），
`problemSetProblemId` 从 href 查询参数取；当前题带 `active` class。

## 跳题

不整页刷新，只改 URL 的 `problemSetProblemId` 参数再跳转，触发 SPA 路由切换：

```js
const url = new URL(location.href);
url.searchParams.set('problemSetProblemId', <id>);
location.href = url.toString();
```
