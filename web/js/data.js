/* data.js — 加载章节 JSON, 构建索引与检索 */
"use strict";
const Data = (() => {
  const CHAPTER_FILES = [];
  for (let i = 1; i <= 13; i++) CHAPTER_FILES.push("chapters/ch" + String(i).padStart(2, "0") + ".json");

  let chapters = [];
  let byId = {};
  let index = [];
  let loaded = false;
  let loadFailed = 0;

  async function load() {
    const results = await Promise.all(CHAPTER_FILES.map(async (name) => {
      try {
        const r = await fetch(name, { cache: "no-store" });
        if (!r.ok) { loadFailed++; return null; }
        return await r.json();
      } catch (e) { loadFailed++; return null; }
    }));
    chapters = results.filter(Boolean).sort((a, b) => (a.order || 0) - (b.order || 0));
    byId = {};
    chapters.forEach(ch => {
      (ch.sections || []).forEach(sec => {
        sec.chapter = ch;
        byId[sec.id] = sec;
      });
    });
    buildIndex();
    loaded = true;
    return chapters;
  }

  function strip(md) {
    return (md || "").replace(/[#*`>|~^\-\[\]()]/g, " ").replace(/\s+/g, " ").toLowerCase();
  }

  function buildIndex() {
    index = [];
    chapters.forEach(ch => {
      (ch.sections || []).forEach(sec => {
        const text = (sec.title + " " + (sec.keywords || []).join(" ") + " " + strip(sec.theory)).toLowerCase();
        index.push({ sec: sec, text: text });
      });
    });
  }

  function search(q) {
    q = (q || "").toLowerCase().trim();
    if (!q) return [];
    const terms = q.split(/\s+/).filter(Boolean);
    return index.filter(it => terms.every(t => it.text.includes(t))).map(it => it.sec);
  }

  function snippet(sec, q) {
    const plain = strip(sec.theory).replace(/\s+/g, " ");
    const term = q.toLowerCase().split(/\s+/)[0];
    const pos = plain.indexOf(term);
    if (pos < 0) return plain.slice(0, 90) + "…";
    const a = Math.max(0, pos - 40), b = Math.min(plain.length, pos + 70);
    return (a > 0 ? "…" : "") + plain.slice(a, b) + (b < plain.length ? "…" : "");
  }

  function allExercises() {
    const out = [];
    chapters.forEach(ch => (ch.sections || []).forEach(sec =>
      (sec.exercises || []).forEach((ex, i) => out.push({ ex: ex, sec: sec, key: sec.id + "#" + i }))
    ));
    return out;
  }

  function getChapter(id) { return chapters.find(c => c.id === id); }
  function getSection(id) { return byId[id]; }
  function isLoaded() { return loaded; }
  function allChapters() { return chapters; }
  function totalSections() { return chapters.reduce((n, c) => n + (c.sections || []).length, 0); }
  /* 学习路径顺序(推荐学习顺序): 按章节 order 展开 */
  function pathOrder() {
    const out = [];
    chapters.forEach(c => (c.sections || []).forEach(s => out.push(s)));
    return out;
  }
  /* 每日一题(按日期做种子, 稳定不重复) */
  function dailyExercise() {
    const pool = allExercises();
    if (!pool.length) return null;
    const d = new Date();
    const seedStr = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
    return pool[h % pool.length];
  }
  return {
    load, isLoaded, allChapters, getChapter, getSection,
    search, snippet, allExercises, pathOrder, dailyExercise, totalSections,
    loadFailedCount: () => loadFailed
  };
})();
