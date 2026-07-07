# pta-auto-submit

> **Claude Code Skill** —— 自动登录 [PTA（拼题A）](https://pintia.cn)，抓题、解题、提交，一条龙跑完一套试卷。

[![Skill Version](https://img.shields.io/badge/skill-v0.1.0-blue)](./pta-auto-submit/SKILL.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Requires](https://img.shields.io/badge/requires-%40playwright%2Fmcp-orange)](https://www.npmjs.com/package/@playwright/mcp)

---

## ✨ 它能做什么

| 能力 | 说明 |
|---|---|
| 🔐 **一键登录** | 打开 PTA 首页，停下请你输入账号密码，绝不猜测或存储 |
| 📋 **抓题成批** | 自动翻题目列表，按你指定的类别一次性抓完所有题 |
| 🧩 **题型分流** | 判断 / 单选 / 多选直接点选；编程 / 函数题区分后生成代码 |
| 💉 **CM6 注入** | PTA 用 CodeMirror 6，粘贴常失效，技能走 React Fiber 反查 + `view.dispatch()` 正统注入 |
| 🔁 **单题自愈** | 测试不匹配 / 提交未过 → 把错误详情喂给模型重生成（最多 5 次） |
| 📡 **评测轮询** | 提交后自动轮询 modal 直到最终态（约 180s），不急着下结论 |
| 🖼️ **图片题识别** | 带图题目启用 VLM 识别；无法识别时停下请你文字描述 |
| ⏯️ **断点续做** | 跳题 / `/clear` 后再进页面，sessionStorage 恢复状态自动续做 |
| 🛡️ **安全红线** | 无法解答的题如实交回，绝不伪造答案；只在 `pintia.cn` 域名操作 |

---

## 🚀 快速开始（3 步）

### 1. 安装 Skill

**主力方式（推荐）：一行命令**

```bash
npx skills add HZ-Abox/pta-auto-submit
```

这会把 skill 文件放到 `~/.claude/skills/pta-auto-submit/`，Claude Code 下次启动自动加载。

**手动方式（没有 npx / 离线场景）：**

```bash
# macOS / Linux
git clone https://github.com/HZ-Abox/pta-auto-submit.git /tmp/pta-tmp
cp -r /tmp/pta-tmp/skill ~/.claude/skills/pta-auto-submit

# Windows (PowerShell)
git clone https://github.com/HZ-Abox/pta-auto-submit.git $env:TEMP\pta-tmp
Copy-Item -Recurse $env:TEMP\pta-tmp\skill "$env:USERPROFILE\.claude\skills\pta-auto-submit"
```

> macOS / Linux 用 `~/.claude/skills/`，Windows 用 `%USERPROFILE%\.claude\skills\`。
> 仓库内 `pta-auto-submit/` 子目录才是 Claude Code 的 skill 包，根目录的 `docs/`、`README.md` 等是工程化外壳，不必复制过去。

### 2. 配置 Playwright MCP

在 Claude Code 里执行一次：

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

或确认 `~/.claude/settings.json` 已有 `@playwright/mcp` 条目。

检查 Chromium 内核就绪：

```bash
npx playwright install chromium
```

### 3. 启动，开始刷题

在 Claude Code 里说一句：

```
帮我把这套 PTA 题做了
```

技能会自动触发 → 打开浏览器 → 请你输入账号密码 → 连续刷题。

---

## 📦 仓库结构

```
pta-auto-submit/
├── pta-auto-submit/                       ← npx skills add 安装的就是这个文件夹
│   ├── SKILL.md
│   ├── references/              # 选择器字典、注入原理、评测轮询
│   └── scripts/inject_code.js   # CM6 代码注入脚本
├── docs/                        ← 人类可读的教程与排错（不上传到 skill 目录）
│   ├── INSTALL.md
│   ├── USAGE.md
│   ├── TROUBLESHOOTING.md
│   └── contributor-guide/
├── README.md
├── LICENSE
├── CHANGELOG.md
└── .gitignore
```

## 🔄 完整流程

```
用户触发（"帮我把这套 PTA 题做了"）
        │
        ▼
启动浏览器（默认 Chromium）
        │
        ▼
打开 https://pintia.cn/home
        │
        ▼
停下让用户输入账号密码 ←── ⚠️ 必须确认点 ①
        │
        ▼
进入题目列表 → 抓取分类
        │
        ▼
停下让用户选"做哪一类" ←── ⚠️ 必须确认点 ②
        │
        ▼
翻页抓取该类全部题目
        │
        ▼
单题循环 ──────────────────────┐
  ├ 判断/选择/多选 → 点选项    │
  ├ 编程题 → 生成完整代码      │
  ├ 函数题 → 仅实现函数体      │
  ├ 带图题 → VLM 识别         │
  │   └ 识别失败 → 停下请用户  │ ←── ⚠️ 必须确认点 ③
  │                            │
  ▼                            │
尝试提交 ── ok ──→ 评测轮询    │
  │                     │      │
  │ fail                ▼      │
  │               最终态？─no─→ 继续轮询
  │                     │      │
  │                    yes     │
  │                     │      │
  │               AC ✓ → 下一题 │
  │               未过 → 自愈 ──┘（最多 5 次）
  ▼
所有题做完 → 汇报总结
```

---

## 📚 文档

| 文档 | 适合谁 |
|---|---|
| [SKILL.md](./pta-auto-submit/SKILL.md) | 想**理解技能内部逻辑**的人（Claude 加载也是这份） |
| [docs/INSTALL.md](./docs/INSTALL.md) | **首次安装**，排查前置条件 |
| [docs/USAGE.md](./docs/USAGE.md) | 想了解**完整使用流程**、截图示例 |
| [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) | **出错了**，按症状索引解法 |
| [docs/contributor-guide/ARCHITECTURE.md](./docs/contributor-guide/ARCHITECTURE.md) | 想**二次开发**、加新题型/选择器 |
| [docs/contributor-guide/SELECTOR_PLAYGROUND.md](./docs/contributor-guide/SELECTOR_PLAYGROUND.md) | 想在 DevTools 里**手工验证**选择器 |
| [references/](./pta-auto-submit/references/) | 内置的技术参考（注入原理、选择器字典、提交轮询） |

---

## 🛡️ 安全边界

- **绝不**存储、回显、猜测你的 PTA 账号密码
- **绝不**伪造答案——技能无法解答的题如实停下交回你
- **只在** `pintia.cn` 域名下操作，不越界访问其他站点
- 所有敏感输入（账号/密码、题目范围选择）都会停下确认

---

## 🤝 贡献

欢迎提 issue / PR，详见 [docs/contributor-guide/ARCHITECTURE.md](./docs/contributor-guide/ARCHITECTURE.md)。

核心文件最好别动：
- `references/*.md` 与 `scripts/inject_code.js` 已经过多轮实战打磨
- 想加新能力优先扩展，而不是重写

---

## 📜 许可

[MIT](./LICENSE) © 2026。替换 Copyright 名字后即可用于自己的仓库。

---

## ⚠️ 免责声明

本技能与 [PTA 平台 / 拼题A](https://pintia.cn) **无官方关联**，为非官方自动化工具。请遵守 PTA 平台及所在学校/机构关于作业提交的规则，自行判断使用场景。任何因使用本技能产生的后果由使用者自行承担。
