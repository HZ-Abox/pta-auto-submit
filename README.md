# pta-auto-submit
只需一句"帮我把这套 PTA 题做了"，技能就会在真实浏览器里自动完成 登录 → 选择题目范围 → 连续解题 → 提交评测   ▎ 的完整流程，支持：   ▎   ▎ - 判断题 / 单选题 / 多选题自动点选   ▎ - 编程题 / 函数题 区分生成代码（函数题自动去除 main 和 #include）   ▎ - CodeMirror 6 注入（React Fiber 反查 EditorView，粘贴失效场景自动修复）   ▎ - 评测 modal 轮询、单题错误自愈（业务 / 网络 两级重试）   ▎ - VLM 识别带图题目 + 安全红线（无法解答绝不伪造）   ▎ - sessionStorage 断点续做（/clear 后再进自动恢复）
