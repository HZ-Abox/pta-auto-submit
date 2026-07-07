# 安装与前置条件

## 前置条件

在开始前，确认你已具备：

| 条件 | 说明 |
|---|---|
| **Claude Code CLI** | 已安装并登录 `claude` 命令（[安装文档](https://docs.claude.com/en/docs/claude-code)） |
| **Node.js ≥ 18** | Playwright MCP 依赖 Node.js，运行 `node -v` 验证 |
| **网络** | 能访问 `pintia.cn` 与 npm 注册表（国内用户可能需要镜像） |

## 第一步：安装 Skill

任选一种方式：

### 方式 A：直接 clone 仓库，复制 pta-auto-submit/ 子目录

仓库内 `pta-auto-submit/` 才是真正的 skill 包，**只拷它**：

```bash
# macOS / Linux
git clone https://github.com/HZ-Abox/pta-auto-submit.git /tmp/pta-tmp
cp -r /tmp/pta-tmp/skill ~/.claude/skills/pta-auto-submit
rm -rf /tmp/pta-tmp

# Windows (PowerShell)
git clone https://github.com/HZ-Abox/pta-auto-submit.git $env:TEMP\pta-tmp
Copy-Item -Recurse $env:TEMP\pta-tmp\skill "$env:USERPROFILE\.claude\skills\pta-auto-submit"
Remove-Item -Recurse -Force $env:TEMP\pta-tmp
```

更新：重新跑一遍上面的命令就能覆盖。

### 方式 B：symlink（适合想在两个地方都用同一份 skill 副本的用户）

```bash
# macOS / Linux
git clone https://github.com/HZ-Abox/pta-auto-submit.git ~/.claude/skills/pta-repo
ln -s ~/.claude/skills/pta-repo/skill ~/.claude/skills/pta-auto-submit

# Windows (PowerShell)：用 Junction
git clone https://github.com/HZ-Abox/pta-auto-submit.git "$env:USERPROFILE\.claude\skills\pta-repo"
cmd //c mklink /J "$env:USERPROFILE\.claude\skills\pta-auto-submit" "$env:USERPROFILE\.claude\skills\pta-repo\skill"
```

Claude Code 启动时会自动扫描 `~/.claude/skills/` 下的所有子目录，找到 `SKILL.md` 即加载。

> ⚠️ 注意：**不要把仓库根目录直接当 skill 拷过去**，务必用 `pta-auto-submit/` 子目录。仓库根的 `docs/`、`README.md` 等不是 skill 的一部分，Claude 加载不到 `SKILL.md` 时会静默忽略。

## 第二步：配置 Playwright MCP

这是唯一需要手动添加的外部依赖——技能通过它驱动浏览器。

在 Claude Code 会话中运行：

```bash
claude mcp add playwright -- npx -y @playwright/mcp@latest
```

或直接编辑配置文件：

- macOS / Linux：`~/.claude/settings.json`
- Windows：`%USERPROFILE%\.claude\settings.json`

加入：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

## 第三步：安装 Chromium 内核

首次运行才会需要，国内网络可能较慢：

```bash
npx playwright install chromium
```

> **国内镜像加速**：若命令卡住，可先设环境变量再运行：
> ```bash
> # macOS / Linux
> export PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright
> npx playwright install chromium
>
> # Windows (PowerShell)
> $env:PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright"
> npx playwright install chromium
> ```

## 第四步：验证安装

1. 启动（或重启）Claude Code
2. 输入 `/help`（或任何带斜杠的命令列表入口）
3. 能看到 **`pta-auto-submit`** 在列

或者在会话里直接说：

```
帮我把这套 PTA 题做了
```

如果浏览器顺利启动、跳转到 PTA 登录页，说明链路通了。

## 安装后常见问题

### skill 没出现在列表

- 确认 `SKILL.md` 在 `.../pta-auto-submit/SKILL.md`（不是嵌套更深的子目录）
- 确认 frontmatter 顶格写在文件最前面，没有空行或 BOM
- 重启 Claude Code

### `claude mcp add` 报错

- Node.js 版本过旧（`node -v` 看是不是 ≥ 18）
- npm 未配置或网络受限，手动跑一下 `npx -y @playwright/mcp@latest` 看是否能拉取

### Chromium 装不上

- 先用 `PLAYWRIGHT_DOWNLOAD_HOST` 镜像
- 或用 `npx playwright install --with-deps chromium`（Linux 下还会装系统依赖）

### 页面空白或登录失败

- PTA 本身需要校园网/VPN 访问时，按你平时习惯先把网络搞定
- 浏览器版本过旧：`npx playwright install chromium --force` 重装

验证都通过后，跳到 [USAGE.md](./USAGE.md) 看详细用法。
