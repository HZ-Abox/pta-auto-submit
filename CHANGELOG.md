# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-07-07

### Added

- PTA 登录、题目范围选择、自动解题、提交全流程自动化
- CodeMirror 6 代码注入方案（React Fiber 反查 + `view.dispatch()`）
- 判断题 / 单选题 / 多选题直接点选作答
- 编程题与函数题区分处理（函数题不带 `main` / `#include`）
- 单题业务重试（最多 5 次，带错误详情喂给模型重生成）
- 网络故障重试（502/503/504/超时，最多 3 次，等约 5s）
- 评测 modal 轮询（约 180s 超时，区分中间态 / 最终态）
- 图片题 VLM 识别支持；识别失败时停下请用户文字描述
- sessionStorage 断点续做机制（`/clear` 后再进自动恢复）
- 安全红线：不存密码、不伪造答案、只在 `pintia.cn` 操作
- 完整技术参考文档：
  - `references/codemirror.md` —— CM6 注入原理
  - `references/selectors.md` —— 页面选择器字典
  - `references/submit-flow.md` —— 评测轮询 / 断点续做
- `scripts/inject_code.js` —— 现成可复用的注入脚本
- 开源工程化外壳：README、LICENSE、CHANGELOG、docs/ 教程与贡献指南
