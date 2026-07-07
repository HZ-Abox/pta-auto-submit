# 选择器速查表（人类视角）

把 [references/selectors.md](../../pta-auto-submit/references/selectors.md) 按**"我想找什么"重排**成速查表，
方便在 DevTools 里对照验证，不用读结构化说明。

---

## 题型与编辑器

| 你想找 | 选择器 / 方法 | 示例 / 备注 |
|---|---|---|
| 代码内容节点 | `.cm-content[contenteditable="true"]` | 有 `true` 才是可编辑容器 |
| 编辑器根容器 | `.cm-editor` | 包裹内容节点的外壳 |
| 当前代码文本 | `cmContent.textContent` | 直接读即可，不用反查 Fiber |
| 编辑器聚焦与否 | `document.querySelector('.cm-content').classList.contains('cm-focused')` | 判断用户是否在编辑 |
| 判断是函数题？ | `!!document.querySelector('#tab-CODE_COMPLETION')` | 命中 → 函数题，编程题反之 |

---

## 题目元信息

字段从 `<main>` 内的纯文本用正则解析，不必死磕选择器：

| 字段 | 正则 | 示例 |
|---|---|---|
| 分数 | `/分数\s*(\d+)/` | 25 |
| 时间限制 | `/时间限制\s*(\d+)\s*ms/` | 1000 |
| 内存限制 | `/内存限制\s*(\d+)\s*MB/` | 64 |
| 代码长度限制 | `/代码长度限制\s*(\d+)\s*KB/` | 1024 |

在 DevTools 里验证：

```js
document.querySelector('main').textContent.match(/分数\s*(\d+)/)?.[1]
```

---

## 语言选择器（React-Select）

不能只改 DOM，必须模拟点击展开再选：

| 步骤 | 选择器 / 操作 |
|---|---|
| 看当前语言 | `.select__single-value` 的 textContent |
| 展开下拉 | 点 `.select__control`，等约 300ms |
| 选选项 | `.select__option`，按文本"包含"匹配（如 `C (gcc)`、`C++ (g++)`、`Python (python3)`）|

DevTools 快速模拟：

```js
document.querySelector('.select__control').click()
setTimeout(() => {
  [...document.querySelectorAll('.select__option')]
    .find(o => o.textContent.includes('C++'))?.click()
}, 300)
```

---

## 按钮（按文本，别按 class）

常见文案清单：

- 测试用例
- 运行测试
- 提交本题作答
- 编译器输出
- 保存

匹配模板：

```js
[...document.querySelectorAll('button')]
  .find(b => b.textContent.trim() === '提交本题作答' && !b.disabled)
  ?.click()
```

---

## 评测结果与输出

| 目标 | 说明 |
|---|---|
| 只读输出编辑器（测试） | `[class*="answerInput"]` 内找 `[class*="readOnly"]` 节点，index 0=实际、1=预期 |
| 判断自测是否通过 | `actual.textContent === expected.textContent` |
| 评测 modal | `.modal_I0D4Y` 或 `[class*="pc-modal"]`，用 `modal.offsetHeight === 0` 判是否可见 |
| 评测状态文本 | modal 内用 `/状态\s*：?\s*(\S+)/` 匹配 |
| 分数 | `/分数\s*：?\s*(\d+)\s*\/\s*(\d+)/` |
| 用时 | `/用时\s*：?\s*(\d+)\s*\/\s*(\d+)\s*ms/` |
| 内存 | `/内存\s*：?\s*(\d+)\s*\/\s*(\d+)\s*KB/` |
| 表格详情 | `modal table tbody tr`，列顺序：id / 内存 / 时间 / 结果 / 得分 |

---

## 题目列表与状态

| 说明 | 选择器 / 判定 |
|---|---|
| 每条题 | `.px-2.grid a[href*="problemSetProblemId"]`（fallback 到 `a[href*="problemSetProblemId"]`）|
| 题号 | 该 `<a>` 的 textContent（如 `1-1`）|
| 跳转目标 id | href 的查询参数 `problemSetProblemId` |
| 当前题 | `<a>` 是否带 `active` class |
| 已通过 | status 节点含 `PROBLEM_ACCEPTED` |
| 答错 | status 节点含 `PROBLEM_WRONG_ANSWER` |
| 提交过未 AC | status 节点含 `PROBLEM_SUBMITTED` |
| 未提交 | 以上 class 都没有 |

---

## 跳题（SPA 局部路由）

不整页刷新，只是改 URL 参数：

```js
const url = new URL(location.href);
url.searchParams.set('problemSetProblemId', '<target-id>');
location.href = url.toString();
```

验证是否在列表：

```js
document.querySelector('a[href*="problemSetProblemId"]')?.href
```

---

## 等待类轮询

| 等啥 | 方式 |
|---|---|
| 编辑器挂载 | 轮询 `.cm-content[contenteditable="true"]` 出现，最多约 15s |
| 题目状态变化 | `MutationObserver` 观察列表 `<a>` 的 class，最多约 90s |
| 评测 modal 消失 / 出现 | 约 1s 一次 `modal.offsetHeight` 检查 |

---

## 自测脚本区

DevTools 控制台快速检查（打开任一道 PTA 题后跑）：

```js
// 能拿到编辑器
document.querySelector('.cm-content[contenteditable="true"]')?.textContent

// 能识别是函数题
!!document.querySelector('#tab-CODE_COMPLETION')

// 能读到当前语言
document.querySelector('.select__single-value')?.textContent

// 提交按钮是否可点
![...document.querySelectorAll('button')].find(b => b.textContent.trim()==='提交本题作答')?.disabled

// 评测 modal 是否可见（提交后）
const m = document.querySelector('.modal_I0D4Y') || document.querySelector('[class*="pc-modal"]');
m ? m.offsetHeight > 0 : false
```

---

## 什么时候该改选择器？

- PTA 前端改版：选择器命中 `null` 或数量异常
- 新题型文档没覆盖：先手动验证，再把结果补回 [references/selectors.md](../../pta-auto-submit/references/selectors.md)
- 永远用**稳定的锚点**（文本 / id / 部分 class 关键字），避免完整 class（带 hash 的常变）

出问题先看 [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)，再看 [../ARCHITECTURE.md](./ARCHITECTURE.md)。
