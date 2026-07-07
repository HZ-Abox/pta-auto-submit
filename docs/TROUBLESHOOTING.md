# 故障排查（按症状索引）

先按**症状**找，再看可能原因和解法。如果都不命中，末尾有"通用调试流程"。

---

## 症状速查表

| # | 症状 | 跳转 |
|---|---|---|
| 1 | 粘贴代码后判题拿到的还是旧内容 | → [CM6 注入失败](#1-粘贴代码后判题拿到的还是旧内容) |
| 2 | 评测 modal 一直"评测中" | → [评测卡住](#2-评测-modal-一直评测中) |
| 3 | 跳题后题目列表没更新 | → [SPA 缓存](#3-跳题后题目列表没更新) |
| 4 | 函数题提交了带 `main` 的代码导致编译错误 | → [题型判定走错](#4-函数题提交了带-main-的代码) |
| 5 | 图片题识别不出来 / 识别错误 | → [图片题失败](#5-图片题识别失败) |
| 6 | Playwright 找不到 chromium | → [内核缺失](#6-playwright-找不到-chromium) |
| 7 | skill 没出现在 Claude Code 的 skill 列表 | → [Skill 未加载](#7-skill-未加载) |
| 8 | 进 PTA 页面空白 / 超时 | → [页面打不开](#8-页面空白或超时) |
| 9 | 提示"no cm-content" / "no fiber" 报错 | → [注入脚本报错](#9-注入脚本报错-no-cm-content--no-fiber) |
| 10 | Claude 说"工具不可用"或"MCP 错误" | → [MCP 不可用](#10-mcp-不可用) |
| 11 | 评测结果 / 分数解析看起来不对 | → [结果解析偏差](#11-评测结果解析偏差) |

---

## 1. 粘贴代码后判题拿到的还是旧内容

**原因**：PTA 用 CodeMirror 6 编辑器，普通 DOM 改 `innerText` 不会触发内部 React 状态同步，判题系统拿不到。

**解法**：无需手动干预——技能会**自动切到注入脚本**走 `view.dispatch()`。
如果还是失败：
- 确认是 PTA 的 `.cm-content[contenteditable="true"]` 容器（其他站点可能有不同选择器）
- 尝试手动注入：DevTools 控制台保存并运行 `scripts/inject_code.js`，再执行 `injectCode('你的代码')`
- 详细原理见 [references/codemirror.md](../pta-auto-submit/references/codemirror.md)

---

## 2. 评测 modal 一直"评测中"

**原因**：评测排队、网络抖动、或 modal 状态文本正则没命中。

**解法**：
- 技能默认轮询 **约 180s**，多数会自动恢复
- 手动刷新评测 modal，看是否已变最终态
- 若超过 3 分钟仍卡，关闭 modal 重点"提交本题作答"
- 若反复出现，把 modal 状态文本贴给 Claude，说明"请用这条状态文本更新 submit-flow.md 的正则"

---

## 3. 跳题后题目列表没更新

**原因**：PTA 是 React SPA，切题只改 URL 参数，局部 DOM 未必即时重渲染。

**解法**：
- 技能内建了 `MutationObserver` 监听状态变化，一般会自动等到
- 强制刷新一次：`Ctrl+R`（Windows）/ `Cmd+R`（macOS）
- 若刷新后仍不对，清除 `sessionStorage` 中 `pta-auto-submit-*` key 后重新触发

---

## 4. 函数题提交了带 `main` 的代码

**原因**：函数题与编程题判定走错。函数题有 `#tab-COMPLETION` 标记，代码只能保留函数体。

**解法**：
- 重新触发这道题：把浏览器手动跳到该题
- 明确告诉 Claude"这是函数题"，让它重新生成
- 判定逻辑详见 [references/selectors.md](../pta-auto-submit/references/selectors.md) 的"函数题 vs 编程题判定"

---

## 5. 图片题识别失败

**原因**：
- 图片在题干的次要位置，VLM 抓不到关键信息
- 模型不支持多模态（极少见，Claude 默认支持）
- 图片是复杂流程图，VLM 理解偏差

**解法**：
- 技能会停下把图片下载到工作目录，告知你无法自动解答
- 你只要用文字描述图的关键部分，Claude 就能继续
- 长期：在 issue 里贴出该图与错误识别结果，改善提示词

---

## 6. Playwright 找不到 chromium

**原因**：首次使用没装内核，或安装失败。

**解法**：

```bash
npx playwright install chromium
```

国内网络慢：

```bash
# macOS / Linux
export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright

# Windows (PowerShell)
$env:PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright"

npx playwright install chromium
```

还是失败：`npx playwright install --with-deps chromium`（Linux 会补系统依赖）

---

## 7. Skill 未加载

**特征**：在 Claude Code 里输入 `/help` 没有看到 `pta-auto-submit`。

**排查**：

- 确认 `SKILL.md` 位于 `~/.claude/skills/pta-auto-submit/SKILL.md`（macOS/Linux）或 `%USERPROFILE%\.claude\skills\pta-auto-submit\SKILL.md`（Windows）
- 检查 frontmatter 顶格、无 BOM、无非法 YAML
- 重启 Claude Code
- 其他 Skyll 能加载 → 说明是 skill 本身的问题；全部不能 → 看 Claude Code 版本是否过旧

---

## 8. 页面空白或超时

**原因**：网络问题（校园网、VPN）、Playwright 未启动、Chromium 崩溃。

**排查顺序**：

1. 浏览器手动能打开 `pintia.cn` 吗？不能 → 搞定网络/VPN
2. Chromium 装了吗？看第 6 条
3. 浏览器扩展 / 广告拦截干扰 → 换 Firefox 或重装 Chromium
4. 关闭所有相关进程后重新启动 Claude Code

---

## 9. 注入脚本报错 "no cm-content" / "no fiber"

**特征**：技能执行后，注入返回 `{ error: 'no cm-content' }` 或 `{ error: 'no fiber' }`。

**解法**：

- `no cm-content` → 编辑器没渲染完。重进本题等几秒再试
- `no fiber` → React Fiber 键名提取失败。手动在 DevTools 里打印 `.cm-editor` parentElement，看 `__reactFiber$*` 是否存在
- 两种都失败 → PTA 前端改版，提 issue 带上 PTA 页面截图与 DevTools 输出

---

## 10. MCP 不可用

**提示类似**：`Error: tool not found: browser_navigate` 或 `MCP server 'playwright' unreachable`。

**解法**：

```bash
# 验证 MCP 能跑
npx -y @playwright/mcp@latest
# 看不到报错就 OK
```

若能跑但 Claude Code 内还是不行：

- 检查 `~/.claude/settings.json` 的 `mcpServers` 是否配错
- 重启 Claude Code（MCP 在会话启动时加载）
- Claude Code 版本过旧：`claude --version`，建议 ≥ 1.0

---

## 11. 评测结果解析偏差

**特征**：分数、用时、内存等信息读错。

**解法**：
- `references/submit-flow.md` 的"轮询"小节列出所有正则
- 手动打开评测 modal，把实际状态文本贴给 Claude，说明"这条文本匹配失败"
- 长期：提 issue 或 PR，补正则并加测试用例

---

## 通用调试流程

如果以上都未命中：

1. **抓关键信息**
   - 当前 URL、浏览器类型、Chromium 版本
   - 错误文本（截图或复制）
   - `scripts/inject_code.js` 执行返回值
2. **检查 simplest case**
   - 手动打开这道题，F12 验证选择器是否仍有效（对照 [SELECTOR_PLAYGROUND.md](./contributor-guide/SELECTOR_PLAYGROUND.md)）
3. **隔离故障**
   - 其他题也这样？→ 网络 / MCP / 内核问题
   - 只有这道题？→ 该题特殊结构
4. **向 Claude 报告**
   - 整理成：症状 + 复现步骤 + 已尝试的解法
   - Claude 会按 [ARCHITECTURE.md](./contributor-guide/ARCHITECTURE.md) 给的扩展点建议修复
5. **提 issue**
   - 用以上信息，贴到 GitHub issue
   - 标注 `bug` 或 `question` 标签

---

## 常见错误码参考

| 错误 | 含义 | 参考 |
|---|---|---|
| `browser_navigate timeout` | 页面加载超时 | 查第 8 条 |
| `no cm-content` | 编辑器未挂载 | 查第 9 条 |
| `no view` | Fiber 反查失败 | 查第 9 条 |
| `502 / 503 / 504` | 网关错误 | 技能自动重试 3 次，否则手动重试 |
| `compile error` | 代码编译失败 | 看编译器输出，按题型分支处理 |
