/* 专项验证: 练习按钮 id / 错题本入口 / 练习卡片定位 id */
"use strict";
const fs = require("fs");
const path = require("path");
global.document = {
  createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {}, innerHTML: "", textContent: "", value: "", onclick: null }),
  querySelector: () => null, querySelectorAll: () => [], getElementById: () => null,
  documentElement: { setAttribute() {}, getAttribute: () => "light" }, addEventListener() {}, activeElement: { tagName: "BODY" }
};
global.window = { addEventListener() {}, innerWidth: 1400, scrollTo() {} };
global.location = { hash: "#/sec/1-1", href: "" };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.fetch = async url => {
  const d = fs.readFileSync(path.join("web", url), "utf8");
  return { ok: true, status: 200, json: async () => JSON.parse(d) };
};
function load(name, varName) {
  eval(fs.readFileSync(path.join("web", "js", name), "utf8").replace("const " + varName + " =", "global." + varName + " ="));
}
load("md.js", "MD"); load("hl.js", "HL"); load("store.js", "Store"); load("data.js", "Data");
load("runner.js", "Runner"); load("ui.js", "UI"); load("cheatdata.js", "CHEAT_DATA"); load("pages.js", "Pages");
global.App = { isOnline: () => true, route: () => {}, setOnline: () => {}, boot: () => {} };

(async () => {
  await Data.load();
  const html = Pages.section("1-1");
  const ids = [];
  const re = /id="(hint|ans)-([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) ids.push(m[2]);
  const bad = ids.filter(x => x.includes("#"));
  let fail = 0;
  console.log("hint/ans id 数量:", ids.length, "| 含 # 数量:", bad.length);
  if (bad.length) { fail++; }
  const nav = Pages.navTree(null);
  console.log("侧栏含错题本入口:", nav.includes("错题本"));
  if (!nav.includes("错题本")) fail++;
  console.log("侧栏含随机测验入口:", nav.includes("随机测验"));
  console.log("练习卡片定位 id:", html.includes('id="ex-1-1-0"'));
  if (!html.includes('id="ex-1-1-0"')) fail++;
  /* 验证 querySelector 不再抛错: 用 jsdom 风格不可行, 但确认 data-t 无 # */
  const dt = html.match(/data-t="hint-[^"]+"/g) || [];
  console.log("hint data-t 样例:", dt[0]);
  if (dt[0] && dt[0].includes("#")) fail++;
  console.log(fail === 0 ? "SPECIAL CHECK: ALL PASS" : "SPECIAL CHECK FAILED: " + fail);
  process.exit(fail ? 1 : 0);
})();
