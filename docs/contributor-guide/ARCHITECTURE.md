# 架构与贡献指南

面向想**二次开发**的读者：加新题型、改选择器、调流程，看这里的入口。

---

## 文件职责总览

```
pta-auto-submit/                ← GitHub 仓库根：工程化外壳（npx skills add 的目标）
├── pta-auto-submit/                      ← ★ Claude Code Skill 包（npx skills add 安装的就是这里）
│   ├── SKILL.md                │   Claude 加载入口：frontmatter + 工作流步骤
│   ├── references/             │   底层事实性参考（修改需谨慎，已打磨）
│   │   ├── codemirror.md       │     CM6 注入原理
│   │   ├── selectors.md        │     选择器字典、题型判定、按钮文案
│   │   └── submit-flow.md       │     评测轮询 / 重试策略 / 断点续做
│   └── scripts/
│       └── inject_code.js      ← 注入的可执行脚本（不改则不碰）
├── docs/                       ← 人类读者导向教程（不拷贝到 skill 目录）
│   ├── INSTALL.md              ← 用户安装手册
│   ├── USAGE.md                ← 用户实操教程
│   ├── TROUBLESHOOTING.md      ← 用户排错索引
│   └── contributor-guide/
│       ├── ARCHITECTURE.md     ← 本文件
│       └── SELECTOR_PLAYGROUND.md
├── README.md                   ← 用户招牌：徽章 + npx 一键安装 + 文档索引
├── LICENSE                     ← MIT 许可
├── CHANGELOG.md                ← 版本日志
└── .gitignore                  ← 运行时产物排除
```

| 文件类型 | 适合改？ | 改它说明 |
|---|---|---|
| `pta-auto-submit/SKILL.md` | ✅ 常改 | 工作流步骤、新题型、新分支 |
| `pta-auto-submit/references/selectors.md` | ⚠️ 慎改 | PTA 前端改版时才动；附日期说明 |
| `pta-auto-submit/references/codemirror.md` | ⚠️ 慎改 | 原理性文档；CM6 升级才动 |
| `pta-auto-submit/references/submit-flow.md` | ⚠️ 慎改 | 评测状态枚举、modal 选择器常变 |
| `pta-auto-submit/scripts/inject_code.js` | ❌ 尽量不动 | 已稳定验证；问题多在文档不在脚本 |
| `docs/*.md` | ✅ 可改 | 教程与排错，持续迭代 |
| `README.md` | ✅ 可改 | 招牌页，同步版本号/特性/截图 |

---

## Claude Code Skill 加载机制简述

1. 启动时扫描 `~/.claude/skills/*/SKILL.md`
2. 读取 YAML frontmatter：
   - `name`：技能标识
   - `description`：触发描述，Claude 用来决定何时调用
   - **`version`**：本技能新加，便于多版本 skill 并存
   - **`triggers`**：显式触发词列表（本技能新加，辅助匹配）
   - `homepage`：指向仓库
3. 正文作为 Claude 的 skill instruction，贯穿会话

> ✅ 想改技能行为，**几乎总是改 SKILL.md 正文**，不必碰 references/ 和 scripts/。

---

## 常见扩展方向

### 1. 加新题型（如"填空题"、"程序补丁题"）

**改 SKILL.md** 的"第四步：解答并自动提交"，参照现有分支形态：

```markdown
- **填空题**：定位所有空白输入框，按序号填入生成的答案字符串
```

**改 `references/selectors.md`**，补一条选择器记录：

```markdown
| 填空输入框 | `.blank-input[n]` 或按 `[class*="blankInput"]` 索引 |
```

**不改** `scripts/inject_code.js`。

### 2. 调整单题重试次数 / 评测超时

**改 SKILL.md** 的"解答失败时的自愈"：

```markdown
为单题设一个重试上限（默认 5 次）   ← 改这里的数字
最长约 180s（SUBMIT_RESULT_TIMEOUT_MS）  ← 改这里的数字
```

对应细节在 `references/submit-flow.md` 表格一并更新。

### 3. 换浏览器内核（Chromium → Firefox）

**改 SKILL.md** 的"选内核"段落：

```markdown
仅当用户表达过偏好或 chromium 安装失败才换 firefox / webkit。
```

把 `chromium` 换成 `firefox` 即可；安装命令 `npx playwright install firefox`。

### 4. 适配 PTA 前端改版

**仅改 `references/selectors.md` 与 `references/submit-flow.md`**：
- 在条目后加 `(2026-07 验证类名)` 形式的时间戳
- 新旧两种选择器并存，优先稳定锚点（文本、id、部分 class 匹配）
- 在 issue 里贴改动前的选择器失效报错

---

## 调试技巧

### 用 Playwright 直接验证选择器

本地启动后，在 Claude Code 里直接：

```
 snapshots：浏览器当前页面
```

或在 DevTools 控制台跑：

```js
document.querySelector('.cm-content[contenteditable="true"]')
// 命中说明选择器没失效
```

### 验证注入脚本

PTA 页面打开代码题后，控制台执行 `scripts/inject_code.js` 内容，再执行：

```js
injectCode('int main(){return 0;}')
// 期望：{ ok: true, length: 21 }
```

### 打开 verbose 看技能决策

在 Claude Code 的 skill 加载日志里能看到触发链。若 Claude 没按预期触发：
- 确认 frontmatter `description` 和 `triggers` 涵盖你想用的触发词
- 查看会话里的 skill 确认提示

---

## 提交 PR 规范

1. **PR 标题**：`fix(selectors): ...` / `docs(usage): ...` / `feat(skill): ...`
2. **描述里写**：
   - 对应 issue 编号（如 `Closes #12`）
   - 改动前后对比（截图或文本）
   - 是否已实际跑过 PTA 页面验证
3. **改动范围**：
   - 优先改 `SKILL.md` + `docs/` 不动 `references/` 和 `scripts/`
   - 改 `references/selectors.md` 时标注验证日期
4. **CHANGELOG 同步**：在 `[Unreleased]` 块补一行

---

## 维护者备忘

- `references/selectors.md` **是事实性基准**，改它要有 PTA 页面实测依据
- PTA 前端频繁 hash class 改版，尽量用文本 / id / 部分 class 匹配而非完整 class
- 函数题 vs 编程题判定是高频错误点，改判定逻辑要回归测试

---

普通用户无需看这份文档，回到 [../INSTALL.md](../INSTALL.md) 即可。
