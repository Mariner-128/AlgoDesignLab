/* store.js — 本地持久化: 学习进度 / 间隔复习 / 笔记 / 收藏 / 错题本 / 测验记录 */
"use strict";
const Store = (() => {
  const P = "adalp:";
  const REVIEW_INTERVALS = [1, 3, 7, 15, 30]; // 间隔复习: 掌握后 1/3/7/15/30 天

  function read(key, def) {
    try {
      const v = localStorage.getItem(P + key);
      return v ? JSON.parse(v) : def;
    } catch (e) { return def; }
  }
  function write(key, val) {
    try { localStorage.setItem(P + key, JSON.stringify(val)); } catch (e) { /* 忽略 */ }
  }

  /* ---- 学习状态: {secId: {s: 0未学 1学习中 2已掌握, t: 时间戳}} ---- */
  function getProgress() { return read("progress", {}); }
  function setStatus(id, s) {
    const p = getProgress();
    p[id] = { s: s, t: Date.now() };
    write("progress", p);
    if (s === 2) scheduleReview(id, false);
  }
  function getStatus(id) {
    const p = getProgress()[id];
    return p ? p.s : 0;
  }

  /* ---- 间隔复习: {secId: {stage, next}} ---- */
  function getReview() { return read("review", {}); }
  function scheduleReview(id, completed) {
    const r = getReview();
    const cur = r[id];
    let stage = 0;
    if (cur) stage = completed ? Math.min(cur.stage + 1, REVIEW_INTERVALS.length - 1) : cur.stage;
    r[id] = { stage: stage, next: Date.now() + REVIEW_INTERVALS[stage] * 86400000, first: cur ? cur.first : Date.now() };
    write("review", r);
  }
  function reviewDone(id) { scheduleReview(id, true); }
  function dueReviews() {
    const r = getReview(), now = Date.now();
    const due = [], up = [];
    for (const id in r) {
      const item = r[id];
      if (item.next <= now) due.push({ id: id, item: item });
      else up.push({ id: id, item: item });
    }
    due.sort((a, b) => a.item.next - b.item.next);
    up.sort((a, b) => a.item.next - b.item.next);
    return { due: due, upcoming: up };
  }

  /* ---- 笔记 ---- */
  function getNotes() { return read("notes", {}); }
  function setNote(id, text) { const n = getNotes(); n[id] = text; write("notes", n); }
  function getNote(id) { return getNotes()[id] || ""; }

  /* ---- 收藏 ---- */
  function getBookmarks() { return read("bookmarks", []); }
  function toggleBookmark(id) {
    const b = getBookmarks();
    const idx = b.indexOf(id);
    if (idx >= 0) b.splice(idx, 1); else b.push(id);
    write("bookmarks", b);
    return idx < 0;
  }
  function isBookmarked(id) { return getBookmarks().indexOf(id) >= 0; }

  /* ---- 错题本: {secId(exerciseKey): 次数} ---- */
  function getWrong() { return read("wrong", {}); }
  function addWrong(key) { const w = getWrong(); w[key] = (w[key] || 0) + 1; write("wrong", w); }
  function removeWrong(key) { const w = getWrong(); delete w[key]; write("wrong", w); }

  /* ---- 测验记录: [{t, chapter, total, correct, partial, wrong: []}] ---- */
  function getQuizLog() { return read("quizLog", []); }
  function addQuizLog(entry) {
    const l = getQuizLog();
    l.push(entry);
    if (l.length > 60) l.splice(0, l.length - 60);
    write("quizLog", l);
  }

  /* ---- 实验台代码缓存 ---- */
  function getLabCode() { return read("labCode", { lang: "python", code: "" }); }
  function setLabCode(v) { write("labCode", v); }

  /* ---- 侧栏章节展开状态记忆 ---- */
  function getNavOpen() { return read("navOpen", {}); }
  function setNavOpen(id, v) { const o = getNavOpen(); o[id] = v; write("navOpen", o); }

  /* ---- 主题 ---- */
  function getTheme() { return read("theme", "light"); }
  function setTheme(t) { write("theme", t); }

  /* ---- 数据导出 / 导入 / 清空(防丢失备份) ---- */
  function exportAll() {
    const out = { app: "算法设计与分析学习平台", version: 1, exportedAt: Date.now(), data: {} };
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(P) === 0) out.data[k.slice(P.length)] = localStorage.getItem(k);
      }
    } catch (e) { /* 忽略 */ }
    return out;
  }
  function importAll(obj) {
    if (!obj || typeof obj !== "object" || !obj.data || typeof obj.data !== "object") {
      return { ok: false, error: "文件格式不正确: 缺少 data 字段" };
    }
    let n = 0;
    for (const k in obj.data) {
      try { localStorage.setItem(P + k, String(obj.data[k])); n++; } catch (e) { /* 忽略 */ }
    }
    return { ok: true, count: n };
  }
  function clearAll() {
    let n = 0;
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(P) === 0) keys.push(k);
      }
      keys.forEach(k => { localStorage.removeItem(k); n++; });
    } catch (e) { /* 忽略 */ }
    return n;
  }

  /* ---- 统计 ---- */
  function statusCounts() {
    const p = getProgress();
    let s0 = 0, s1 = 0, s2 = 0;
    for (const k in p) { const s = p[k].s; if (s === 1) s1++; else if (s === 2) s2++; else s0++; }
    return { s0: s0, s1: s1, s2: s2 };
  }

  return {
    REVIEW_INTERVALS,
    getProgress, setStatus, getStatus,
    getReview, scheduleReview, reviewDone, dueReviews,
    getNotes, setNote, getNote,
    getBookmarks, toggleBookmark, isBookmarked,
    getWrong, addWrong, removeWrong,
    getQuizLog, addQuizLog,
    getLabCode, setLabCode,
    getNavOpen, setNavOpen,
    getTheme, setTheme,
    exportAll, importAll, clearAll,
    statusCounts
  };
})();
