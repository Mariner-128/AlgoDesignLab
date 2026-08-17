/* app.js — 路由 / 全局事件委托 / 初始化 */
"use strict";
const App = (() => {
  const U = UI;

  function route(preserveScroll) {
    const hash = location.hash || "#/";
    const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    const main = U.q("#main");
    let html = "", crumb = [];
    const activeId = parts[1] && (parts[0] === "sec" || parts[0] === "chap") ? parts[1] : null;
    if (!Data.isLoaded()) {
      html = '<div class="loading"><div class="spin"></div><div>正在加载知识库…</div></div>';
    } else if (!Data.allChapters().length) {
      html = '<div class="card"><h3>⚠ 知识库加载失败</h3>' +
        '<p>无法加载章节内容。请确认:</p><ul>' +
        "<li>已通过「启动学习平台.exe」运行本平台(而非直接双击 index.html);</li>" +
        "<li>web/chapters 目录下的章节文件完整存在(应包含 ch01.json ~ ch13.json 共 13 个文件)。</li></ul>" +
        '<p class="muted small">缺失文件数: ' + Data.loadFailedCount() + " / 13</p></div>";
    } else if (parts[0] === "sec") {
      const sec = Data.getSection(parts[1]);
      if (sec) {
        html = Pages.section(parts[1]);
        crumb = ["<a href='#/chap/" + sec.chapter.id + "'>" + U.escapeHtml(sec.chapter.title) + "</a>", "<b>" + U.escapeHtml(sec.title) + "</b>"];
      } else html = '<div class="card">未找到该小节</div>';
    } else if (parts[0] === "chap") {
      const ch = Data.getChapter(parts[1]);
      if (ch) {
        html = Pages.chapter(parts[1]);
        crumb = ["<b>" + U.escapeHtml(ch.title) + "</b>"];
      } else html = '<div class="card">未找到该章节</div>';
    } else if (parts[0] === "quiz") { html = Pages.quiz(); crumb = ["<b>随机测验</b>"]; }
    else if (parts[0] === "review") { html = Pages.review(); crumb = ["<b>间隔复习</b>"]; }
    else if (parts[0] === "lab") { html = Pages.lab(); crumb = ["<b>算法实验台</b>"]; }
    else if (parts[0] === "cheat") { html = Pages.cheat(); crumb = ["<b>知识速查表</b>"]; }
    else if (parts[0] === "search") { html = Pages.search(decodeURIComponent(parts[1] || "")); crumb = ["<b>搜索</b>"]; }
    else if (parts[0] === "path") { html = Pages.pathPage(); crumb = ["<b>学习路径</b>"]; }
    else if (parts[0] === "stats") { html = Pages.stats(); crumb = ["<b>学习统计</b>"]; }
    else { html = Pages.home(); crumb = ["<b>首页</b>"]; }
    main.innerHTML = html;
    U.q("#crumb").innerHTML = crumb.join(" <span class='muted'>/</span> ");
    U.q("#nav-tree").innerHTML = Pages.navTree(activeId);
    refreshOverall();
    /* 浏览器标签页标题随路由更新 */
    const plain = crumb.map(c => c.replace(/<[^>]+>/g, "").replace(/&[^;]+;/g, " ")).join(" · ").trim();
    document.title = plain ? plain + " — 算法设计与分析学习平台" : "算法设计与分析学习平台";
    if (!preserveScroll) window.scrollTo(0, 0);
    closeSidebarOnMobile();
    bindPage();
  }

  function refreshOverall() {
    const total = Data.totalSections();
    const cnt = Store.statusCounts();
    const pct = U.pct((cnt.s2 + cnt.s1 * 0.5) / Math.max(1, total) * 100);
    const bar = U.q("#overall-bar"), p = U.q("#overall-pct");
    if (bar) bar.style.width = pct + "%";
    if (p) p.textContent = pct + "%";
  }

  /* ---------------- 代码运行 ---------------- */
  async function doRun(outId, codeId, inId, lang, metaId) {
    const out = U.q("#" + outId), meta = metaId ? U.q("#" + metaId) : null;
    const codeEl = U.q("#" + codeId), inEl = inId ? U.q("#" + inId) : null;
    if (!out || !codeEl) return;
    const code = codeEl.value, stdinText = inEl ? inEl.value : "";
    out.classList.remove("hidden", "err");
    out.textContent = "⏳ 运行中…";
    if (meta) { meta.classList.remove("hidden"); meta.textContent = "正在提交 " + lang.toUpperCase() + " 代码…"; }
    try {
      const r = await Runner.run(lang, code, stdinText);
      if (r.ok) {
        out.textContent = r.stdout || "(无输出)";
        if (r.stderr) out.textContent += "\n[stderr]\n" + r.stderr;
        out.classList.remove("err");
      } else {
        out.textContent = r.error || "运行失败";
        if (r.stdout) out.textContent += "\n[stdout]\n" + r.stdout;
        out.classList.add("err");
      }
      if (meta) {
        const bits = [];
        if (r.time_ms !== undefined) bits.push("耗时 " + r.time_ms + " ms");
        if (r.returncode !== undefined) bits.push("退出码 " + r.returncode);
        if (r.compiler) bits.push("编译器 " + r.compiler);
        meta.textContent = bits.join(" · ");
      }
    } catch (e) {
      out.classList.remove("hidden");
      out.classList.add("err");
      out.textContent = "执行出错: " + e.message + " (请确认已通过「启动学习平台.exe」运行服务器)";
    }
  }

  /* ---------------- 全局点击委托 ---------------- */
  function onClick(e) {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.getAttribute("data-act");
    const id = t.getAttribute("data-id") || "";
    switch (act) {
      case "goto":
        location.hash = t.getAttribute("data-href");
        break;
      case "nav-ch": {
        const node = t.closest(".nav-chapter");
        const open = node.classList.toggle("open");
        Store.setNavOpen(id, open);
        break;
      }
      case "status": {
        const s = parseInt(t.getAttribute("data-s"), 10);
        Store.setStatus(id, s);
        U.toast(s === 2 ? "已标记掌握, 已安排间隔复习 ✔" : s === 1 ? "已标记学习中" : "已重置", s === 2 ? "ok" : "");
        route(true);
        break;
      }
      case "bm": {
        const on = Store.toggleBookmark(id);
        U.toast(on ? "已收藏 ⭐" : "已取消收藏");
        t.textContent = on ? "★ 已收藏" : "☆ 收藏";
        break;
      }
      case "note": {
        const sec = Data.getSection(id);
        const cur = Store.getNote(id);
        U.openModal("📝 笔记 · " + (sec ? U.escapeHtml(sec.title) : id),
          '<textarea id="note-text" placeholder="记录你的理解、易错点、证明思路…">' + MD.esc(cur) + "</textarea>" +
          '<div style="margin-top:10px;text-align:right"><button class="btn primary" id="note-save">保存笔记</button></div>');
        U.q("#note-save").onclick = () => {
          Store.setNote(id, U.q("#note-text").value);
          U.closeModal();
          U.toast("笔记已保存 ✔", "ok");
        };
        break;
      }
      case "run": {
        const btn = t;
        btn.disabled = true;
        btn.textContent = "⏳ 运行中…";
        doRun(t.getAttribute("data-out"), t.getAttribute("data-code"), t.getAttribute("data-in"), t.getAttribute("data-lang"), t.getAttribute("data-meta"))
          .finally(() => { btn.disabled = false; btn.textContent = "▶ 运行"; });
        break;
      }
      case "reset": {
        const codeEl = U.q("#" + t.getAttribute("data-code"));
        const pid = t.getAttribute("data-orig");
        const li = pid.lastIndexOf("-");
        const secId = pid.slice(0, li);
        const idx = parseInt(pid.slice(li + 1), 10);
        const sec = Data.getSection(secId);
        const cd = sec && sec.codes && sec.codes[idx];
        if (codeEl && cd) {
          codeEl.value = cd.code;
          U.toast("已恢复原始代码");
        }
        break;
      }
      case "to-lab": {
        const codeEl = U.q("#" + t.getAttribute("data-code"));
        const lang = t.getAttribute("data-lang");
        Store.setLabCode({ lang: lang, code: codeEl ? codeEl.value : "" });
        location.hash = "#/lab";
        U.toast("已载入实验台: " + t.getAttribute("data-title"));
        break;
      }
      case "toggle-box": {
        const box = U.q("#" + t.getAttribute("data-t"));
        if (box) box.classList.toggle("hidden");
        break;
      }
      case "wrong":
        Store.addWrong(t.getAttribute("data-key"));
        U.toast("已加入错题本 📕", "ok");
        break;
      case "del-wrong":
        Store.removeWrong(t.getAttribute("data-key"));
        route();
        break;
      case "quiz-start":
        Pages.quizStart();
        break;
      case "quiz-grade":
        Q_GRADE(parseFloat(t.getAttribute("data-g")));
        break;
      case "quiz-skip":
        Q_NEXT();
        break;
      case "quiz-restart":
        Q.started = false;
        route();
        break;
      case "rev-done":
        Store.reviewDone(id);
        U.toast("复习完成, 已安排下一轮复习 ✔", "ok");
        route(true);
        break;
      case "export-data": {
        const data = Store.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const d = new Date();
        const p2 = n => String(n).padStart(2, "0");
        const a = document.createElement("a");
        a.href = url;
        a.download = "算法学习数据_" + d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        U.toast("备份已导出 ✔ 请妥善保存该文件", "ok");
        break;
      }
      case "import-data": {
        const inp = U.q("#import-file");
        if (!inp) break;
        inp.value = "";
        inp.onchange = () => {
          const f = inp.files && inp.files[0];
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const obj = JSON.parse(reader.result);
              const r = Store.importAll(obj);
              if (r.ok) {
                U.toast("导入成功 ✔ 共恢复 " + r.count + " 项数据", "ok");
                route(true);
              } else {
                U.toast("导入失败: " + r.error, "err");
              }
            } catch (e) {
              U.toast("导入失败: 不是有效的 JSON 文件", "err");
            }
          };
          reader.readAsText(f, "utf-8");
        };
        inp.click();
        break;
      }
      case "clear-data": {
        if (confirm("确定清空全部学习数据吗?\n(进度/笔记/错题本/测验记录将全部删除, 建议先导出备份)")) {
          const n = Store.clearAll();
          U.toast("已清空 " + n + " 项学习数据", "ok");
          route(true);
        }
        break;
      }
      case "lab-load": {
        const secId = U.q("#lab-sec").value;
        const lang = U.q("#lab-lang").value;
        const sec = Data.getSection(secId);
        if (!sec) { U.toast("请先选择小节", "err"); return; }
        const cd = (sec.codes || []).find(c => c.lang === lang) || (sec.codes || [])[0];
        if (!cd) { U.toast("该小节没有案例代码", "err"); return; }
        U.q("#lab-editor").value = cd.code;
        U.q("#lab-lang").value = cd.lang;
        Store.setLabCode({ lang: cd.lang, code: cd.code });
        U.toast("已载入: " + sec.id + " " + sec.title);
        break;
      }
      case "lab-clear":
        U.q("#lab-editor").value = "";
        break;
      case "lab-run": {
        const lang = U.q("#lab-lang").value;
        const code = U.q("#lab-editor").value;
        const stdinText = U.q("#lab-in").value;
        Store.setLabCode({ lang: lang, code: code });
        const out = U.q("#lab-out"), meta = U.q("#lab-meta");
        const btn = t;
        btn.disabled = true;
        out.classList.remove("hidden", "err");
        out.textContent = "⏳ 运行中…";
        meta.classList.remove("hidden");
        meta.textContent = "正在提交 " + lang.toUpperCase() + " 代码…";
        Runner.run(lang, code, stdinText).then(r => {
          if (r.ok) {
            out.textContent = r.stdout || "(无输出)";
            if (r.stderr) out.textContent += "\n[stderr]\n" + r.stderr;
            out.classList.remove("err");
          } else {
            out.textContent = r.error || "运行失败";
            if (r.stdout) out.textContent += "\n[stdout]\n" + r.stdout;
            out.classList.add("err");
          }
          const bits = [];
          if (r.time_ms !== undefined) bits.push("耗时 " + r.time_ms + " ms");
          if (r.returncode !== undefined) bits.push("退出码 " + r.returncode);
          if (r.compiler) bits.push("编译器 " + r.compiler);
          meta.textContent = bits.join(" · ");
        }).catch(err => {
          out.classList.add("err");
          out.textContent = "执行出错: " + err.message;
        }).finally(() => {
          btn.disabled = false;
        });
        break;
      }
    }
  }

  /* 测验状态访问(供 pages 内部使用) */
  function Q_GRADE(g) {
    const q = Pages._q();
    const item = q.pool[q.idx];
    if (g === 0) Store.addWrong(item.key);
    if (g === 1) q.correct++;
    else if (g === 0.5) q.partial++;
    else q.wrong.push(item.key);
    q.idx++;
    route();
  }
  function Q_NEXT() {
    const q = Pages._q();
    q.idx++;
    route();
  }

  /* 事件绑定 */
  function bind() {
    document.addEventListener("click", onClick);
    U.q("#btn-theme").onclick = toggleTheme;
    U.q("#btn-menu").onclick = toggleSidebar;
    U.q("#search-btn").onclick = () => doSearch();
    U.q("#search-input").addEventListener("keydown", e => {
      if (e.key === "Enter") doSearch();
      if (e.key === "Escape") { U.q("#search-input").value = ""; U.q("#search-input").blur(); }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        U.q("#search-input").focus();
      }
      /* 编辑器内 Tab 键插入两空格(仅文本域/代码编辑器, 输入框保持默认焦点跳转) */
      if (e.key === "Tab" && document.activeElement.tagName === "TEXTAREA") {
        e.preventDefault();
        const el = document.activeElement;
        const start = el.selectionStart, end = el.selectionEnd;
        el.value = el.value.slice(0, start) + "  " + el.value.slice(end);
        el.selectionStart = el.selectionEnd = start + 2;
      }
    });
    U.q("#lab-lang") && U.q("#lab-lang").addEventListener("change", e => {
      const saved = Store.getLabCode();
      Store.setLabCode({ lang: e.target.value, code: saved.code || "" });
    });
    U.q("#modal-mask").addEventListener("click", e => { if (e.target.id === "modal-mask") U.closeModal(); });
    window.addEventListener("hashchange", route);
    window.addEventListener("resize", closeSidebarOnMobile);
  }
  /* 路由渲染后绑定页面级元素事件(实验台等动态元素) */
  function bindPage() {
    U.q("#lab-ch") && U.q("#lab-ch").addEventListener("change", e => {
      const chId = e.target.value;
      const sel = U.q("#lab-sec");
      if (!sel) return;
      const ch = Data.allChapters().find(c => c.id === chId);
      sel.innerHTML = '<option value="">— 选择小节 —</option>' + (ch ? ch.sections.map(s =>
        '<option value="' + s.id + '">' + U.escapeHtml(s.id + " " + s.title) + "</option>").join("") : "");
    });
    U.q("#lab-editor") && U.q("#lab-editor").addEventListener("input", U.debounce(e => {
      const saved = Store.getLabCode();
      Store.setLabCode({ lang: U.q("#lab-lang").value, code: e.target.value });
    }, 600));
  }
  function closeSidebarOnMobile() {
    if (window.innerWidth > 920) U.q("#sidebar").classList.remove("open");
  }
  /* ☰ 按钮: 宽屏折叠/展开侧栏, 窄屏开合抽屉 */
  function toggleSidebar() {
    if (window.innerWidth > 920) {
      const collapsed = document.body.classList.toggle("sidebar-collapsed");
      const btn = U.q("#btn-menu");
      btn.title = collapsed ? "展开章节目录" : "收起章节目录";
    } else {
      U.q("#sidebar").classList.toggle("open");
    }
  }
  function doSearch() {
    const v = U.q("#search-input").value.trim();
    if (!v) return;
    location.hash = "#/search/" + encodeURIComponent(v);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    Store.setTheme(next);
    U.toast(next === "dark" ? "已切换深色模式 🌙" : "已切换浅色模式 ☀️");
  }

  /* 运行环境: online(本地服务器可用, 可执行代码) / readonly(GitHub Pages 预览) */
  let onlineMode = false;
  function setOnline(v) { onlineMode = !!v; }
  function isOnline() { return onlineMode; }

  async function boot() {
    const theme = Store.getTheme();
    document.documentElement.setAttribute("data-theme", theme);
    bind();
    await Data.load();
    route();
    /* 健康检查: 探测运行环境 + 编译器状态 */
    Runner.health().then(h => {
      if (!h || !h.ok) {
        setOnline(false);
        route(true);
        U.toast("当前为网页预览模式: 学习内容完整, 代码运行需在本地启动平台", "warn");
        return;
      }
      setOnline(true);
      route(true);
      if (h.compilers && h.compilers.length) return;
      setTimeout(() => U.toast("⚠ 未检测到 C 编译器: C 案例暂不可运行, 详见 README"), 2500);
    }).catch(() => {});
  }

  return { route, boot, setOnline, isOnline };
})();
document.addEventListener("DOMContentLoaded", () => App.boot());
