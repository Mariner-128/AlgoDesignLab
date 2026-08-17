/* ui.js — 通用 UI 工具 */
"use strict";
const UI = (() => {
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }
  let toastTimer = null;
  function toast(msg, type) {
    const t = q("#toast");
    t.textContent = msg;
    t.className = "toast show" + (type ? " " + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = "toast"; }, 2600);
  }
  function stars(n) {
    return '<span class="stars">' + "★".repeat(n) + "☆".repeat(5 - n) + "</span>";
  }
  function diffLabel(n) {
    return { 3: "中等偏上", 4: "较难", 5: "挑战" }[n] || "中等";
  }
  function statusChip(s) {
    if (s === 2) return '<span class="chip ok">✔ 已掌握</span>';
    if (s === 1) return '<span class="chip warn">● 学习中</span>';
    return '<span class="chip gray">○ 未学习</span>';
  }
  function pct(v) { return Math.max(0, Math.min(100, Math.round(v))); }
  function fmtDate(ts) {
    const d = new Date(ts);
    const p = n => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function fmtDue(ts) {
    const diff = ts - Date.now();
    if (diff <= 0) return "已到期";
    const days = Math.ceil(diff / 86400000);
    if (days >= 30) return Math.round(days / 30) + " 个月后";
    return days + " 天后";
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function debounce(fn, ms) {
    let t = null;
    return function () {
      clearTimeout(t);
      const args = arguments;
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }
  function openModal(title, bodyHtml) {
    q("#modal-mask").classList.remove("hidden");
    const m = q("#modal");
    m.innerHTML = '<h3>' + title + '</h3>' + bodyHtml +
      '<div style="margin-top:14px;text-align:right"><button class="btn" id="modal-close">关闭</button></div>';
    q("#modal-close").onclick = closeModal;
  }
  function closeModal() { q("#modal-mask").classList.add("hidden"); }
  function escapeHtml(s) { return MD.esc(String(s)); }
  return { q, qa, el, toast, stars, diffLabel, statusChip, pct, fmtDate, fmtDue, shuffle, debounce, openModal, closeModal, escapeHtml };
})();
