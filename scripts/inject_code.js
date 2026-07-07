/**
 * PTA CodeMirror 6 代码注入脚本
 *
 * 用途：当模拟粘贴失效时，反查页面 React Fiber 拿到 CodeMirror 6 的 EditorView 实例，
 *       通过 view.dispatch() 一次性写入全文（这是唯一能让 PTA 判题系统真正拿到代码的方式）。
 *
 * 运行环境：必须在页面主世界（MAIN world）执行，而不是隔离世界。
 *   - Playwright:   await page.evaluate(injectCode, code)
 *   - 浏览器扩展:    chrome.scripting.executeScript({ target, world: 'MAIN', func: injectCode, args: [code] })
 *
 * 返回：{ ok: true, length } 成功；{ error: '...' } 失败（含具体阶段原因）。
 */
function injectCode(code) {
  // 1) 定位 CodeMirror 内容节点
  const cmContent = document.querySelector('.cm-content[contenteditable="true"]');
  if (!cmContent) return { error: 'no cm-content' };

  // 2) 从内容节点找到 PTA React 组件的 wrapper div
  const container = cmContent.closest('.cm-editor').parentElement;

  // 3) 找到 React Fiber 入口（键名形如 __reactFiber$xxxx，每次随机）
  let fk = null;
  for (const k in container) {
    if (k.startsWith('__reactFiber')) { fk = k; break; }
  }
  if (!fk) return { error: 'no fiber' };

  // 4) 沿 .return 链向上遍历，最多 10 级，寻找持有 EditorView 的 Fiber 节点
  let f = container[fk];
  let view = null;
  for (let i = 0; i < 10 && f; i++) {
    // class 组件形态
    if (f.stateNode && f.stateNode.codemirror && f.stateNode.codemirror.dispatch) {
      view = f.stateNode.codemirror;
      break;
    }
    // forwardRef / 函数组件形态
    if (f.ref && f.ref.current && f.ref.current.codemirror && f.ref.current.codemirror.dispatch) {
      view = f.ref.current.codemirror;
      break;
    }
    f = f.return;
  }
  if (!view) return { error: 'no view' };

  // 5) 一次性替换编辑器全文（CodeMirror 6 标准数据流，会触发 onChange 与状态同步）
  view.focus();
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: code }
  });

  return { ok: true, length: view.state.doc.length };
}

/**
 * 读取当前编辑器内代码（仅读取无需反查 Fiber）。
 * 用于「提示模式」判断用户是否已自己写了代码。
 */
function readCode() {
  const cmContent = document.querySelector('.cm-content[contenteditable="true"]');
  return cmContent ? cmContent.textContent : null;
}

// 若作为模块使用可导出；作为注入函数时直接调用 injectCode(code) 即可。
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { injectCode, readCode };
}
