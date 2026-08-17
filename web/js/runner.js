/* runner.js — 调用本地服务器执行 C / Python 代码 */
"use strict";
const Runner = (() => {
  async function run(lang, code, stdinText) {
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: lang, code: code, stdin: stdinText || "" })
    });
    if (!res.ok) throw new Error("服务器返回错误 " + res.status);
    return await res.json();
  }
  async function health() {
    const res = await fetch("/api/health", { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  }
  /* 判断代码是否需要标准输入(scanf / input) */
  function needsInput(code) {
    return /scanf\s*\(|input\s*\(/.test(code || "");
  }
  return { run, health, needsInput };
})();
