/* Node 冒烟测试: 用 DOM/localStorage/fetch stub 加载前端模块, 渲染所有页面 */
"use strict";
const fs = require("fs");
const path = require("path");

/* ---------- 最小 DOM stub ---------- */
function makeEl() {
  return {
    style: {}, classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, appendChild() {}, innerHTML: "", textContent: "", value: "", onclick: null
  };
}
global.document = {
  createElement: () => makeEl(),
  querySelector: () => null,
  querySelectorAll: () => [],
  documentElement: { setAttribute() {}, getAttribute: () => "light" },
  addEventListener() {},
  activeElement: { tagName: "BODY" }
};
global.window = { addEventListener() {}, innerWidth: 1400, scrollTo() {} };
global.location = { hash: "#/", href: "" };
global.localStorage = (() => {
  const m = {};
  return {
    getItem: k => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; }
  };
})();
global.fetch = async url => {
  const file = path.join(__dirname, "..", "web", url);
  try {
    const data = fs.readFileSync(file, "utf8");
    return { ok: true, status: 200, json: async () => JSON.parse(data) };
  } catch (e) {
    return { ok: false, status: 404, json: async () => null };
  }
};

/* ---------- 加载模块 ---------- */
function load(name, varName) {
  let code = fs.readFileSync(path.join(__dirname, "..", "web", "js", name), "utf8");
  code = code.replace("const " + varName + " =", "global." + varName + " =");
  eval(code);
}
load("md.js", "MD");
load("hl.js", "HL");
load("store.js", "Store");
load("data.js", "Data");
load("runner.js", "Runner");
load("ui.js", "UI");
load("cheatdata.js", "CHEAT_DATA");
load("pages.js", "Pages");

/* ---------- 渲染测试 ---------- */
let fail = 0;
function check(name, fn) {
  try {
    const html = fn();
    if (typeof html !== "string" || !html.length) { fail++; console.log("FAIL:", name, "(空输出)"); return; }
    console.log("OK  :", name, "(" + html.length + " chars)");
  } catch (e) {
    fail++;
    console.log("FAIL:", name, "->", e.message);
  }
}

(async () => {
  await Data.load();
  const chs = Data.allChapters();
  console.log("章节数:", chs.length, "小节数:", Data.totalSections());
  if (chs.length < 1) { fail++; console.log("FAIL: 无章节数据"); }

  check("navTree", () => Pages.navTree(null));
  check("home", () => Pages.home());
  check("pathPage", () => Pages.pathPage());
  check("review", () => Pages.review());
  check("lab", () => Pages.lab());
  check("cheat", () => Pages.cheat());
  check("search", () => Pages.search("算法"));
  check("stats", () => Pages.stats());
  check("quiz setup", () => Pages.quiz());

  /* 逐章节渲染 */
  for (const ch of chs) {
    check("chapter " + ch.id, () => Pages.chapter(ch.id));
    for (const sec of ch.sections) {
      check("section " + sec.id, () => Pages.section(sec.id));
    }
  }
  /* Store 状态切换后重渲染 */
  const first = Data.pathOrder()[0];
  Store.setStatus(first.id, 1);
  Store.setStatus(first.id, 2);
  Store.addWrong("x#0");
  Store.addQuizLog({ t: Date.now(), total: 5, correct: 3, partial: 1, wrong: [] });
  check("home (with progress)", () => Pages.home());
  check("review (with schedule)", () => Pages.review());
  check("stats (with log)", () => Pages.stats());
  check("section (mastered)", () => Pages.section(first.id));

  console.log(fail === 0 ? "\nRENDER SMOKE: ALL PASS" : "\nRENDER SMOKE FAILED: " + fail);
  process.exit(fail === 0 ? 0 : 1);
})();
