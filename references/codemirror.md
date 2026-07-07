# CodeMirror 6 代码注入原理

PTA 的代码编辑器是 **CodeMirror 6**，`EditorView` 实例挂在 React 组件内部状态上，
无法从外部直接拿到。因此写入代码必须"反查 Fiber → 拿到 view → dispatch"。

## 为什么不能直接改 DOM

`document.querySelector('.cm-content').innerText = code` 只是**视觉文本替换**，
不会触发 CodeMirror 内部状态同步，React 的 onChange 监听器收不到，PTA 判题系统
拿到的仍是旧内容。必须走 `view.dispatch()` 这条官方数据流。

## 隔离世界（isolated world）的限制

如果通过 Playwright/扩展的内容脚本运行，脚本处在 isolated world：
- **能**通过 `querySelector` 拿到 `.cm-content` 这类 DOM 元素；
- **不能**直接访问页面 React 组件实例（挂在页面自己的 MAIN world 上）。

解决办法：把定位与写入逻辑作为一段 JS 在**页面主世界（MAIN world）**里执行
（Playwright 用 `page.evaluate()`，扩展用 `chrome.scripting.executeScript({world:'MAIN'})`）。

## 分层定位链

```
.cm-content[contenteditable="true"]   ← CodeMirror 内容节点
  └─ closest('.cm-editor')           ← 编辑器根
      └─ .parentElement              ← PTA React 组件的 wrapper div
          └─ __reactFiber$XXXX 属性  ← React Fiber 入口（键名每次随机）
              └─ 沿 .return 链向上最多遍历 10 级
                  └─ fiber.stateNode.codemirror   ← EditorView 实例
                  或  fiber.ref.current.codemirror
```

关键点：

- React 在 DOM 节点上以 `__reactFiber$<随机id>` 挂 Fiber 引用，键名每次不同，
  所以用 `for (k in container)` + `startsWith('__reactFiber')` 暴力找到。
- React 16+ 里 Fiber 的挂载点有两种形态：class 组件在 `fiber.stateNode`，
  forwardRef / 函数组件在 `fiber.ref.current`。两者都要试。
- 最多 10 级 `f = f.return` 向上遍历，在 DOM wrapper 与宿主 React 组件之间做弹性匹配。

## 写入方式

找到 `view` 后一次性替换全文（CodeMirror 6 标准用法）：

```js
view.focus();
view.dispatch({
  changes: { from: 0, to: view.state.doc.length, insert: <代码> }
});
```

## 读取当前代码

仅需读取（如判断用户是否已自己写了代码）时直接取文本即可，不必反查 Fiber：

```js
document.querySelector('.cm-content[contenteditable="true"]').textContent
```
