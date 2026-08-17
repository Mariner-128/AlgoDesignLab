/* pages.js — 全部页面渲染(首页/章节/小节/测验/复习/实验台/速查/搜索/路径/统计) */
"use strict";
const Pages = (() => {
  const U = UI;
  /* ---------------- 侧栏导航 ---------------- */
  function navTree(activeId) {
    const chs = Data.allChapters();
    if (!chs.length) return '<div class="muted small" style="padding:10px">章节加载中…</div>';
    const navState = Store.getNavOpen();
    let html = "";
    chs.forEach(ch => {
      const prog = chapterProgress(ch);
      const pct = U.pct(prog.done / Math.max(1, prog.total) * 100);
      const inChapter = activeId && ch.sections.some(s => s.id === activeId);
      /* 展开状态: 用户显式设置过则尊重, 否则当前章节默认展开 */
      const open = inChapter ? (navState[ch.id] !== false) : (navState[ch.id] === true);
      const secs = (ch.sections || []).map(s => {
        const st = Store.getStatus(s.id);
        return '<a class="nav-sec' + (s.id === activeId ? " active" : "") + '" href="#/sec/' + s.id + '">' +
          '<span class="dot s' + st + '"></span><span>' + U.escapeHtml(s.title) + "</span></a>";
      }).join("");
      html += '<div class="nav-chapter' + (open ? " open" : "") + '" data-ch="' + ch.id + '">' +
        '<button type="button" data-act="nav-ch" data-id="' + ch.id + '">' +
        '<span class="arr">▶</span><span class="t">' + U.escapeHtml(ch.icon || "📖") + " " + U.escapeHtml(ch.title) + "</span>" +
        '<span class="nb">' + pct + "%</span></button>" +
        '<div class="nav-sections">' + secs + "</div></div>";
    });
    return html;
  }
  function chapterProgress(ch) {
    const secs = ch.sections || [];
    let done = 0;
    secs.forEach(s => { if (Store.getStatus(s.id) === 2) done++; });
    return { done: done, total: secs.length };
  }

  /* ---------------- 首页 ---------------- */
  function home() {
    const chs = Data.allChapters();
    const total = Data.totalSections();
    const cnt = Store.statusCounts();
    const rev = Store.dueReviews();
    const path = Data.pathOrder();
    let cont = path.find(s => Store.getStatus(s.id) === 0) || path.find(s => Store.getStatus(s.id) === 1);
    const daily = Data.dailyExercise();
    const overall = U.pct((cnt.s2 + cnt.s1 * 0.5) / Math.max(1, total) * 100);
    let html = "";
    html += '<div class="hero"><h1>🧠 算法设计与分析 · 学习平台</h1>' +
      "<p>系统学习<b>算法设计策略</b>与<b>复杂度分析</b>: 分治 · 动态规划 · 贪心 · 图算法 · 高级数据结构 · 字符串 · 随机化 · 数论 · 复杂性理论。</p>" +
      "<p>每个知识点均配有<b>理论精讲</b>、<b>可运行 C/Python 案例</b>与<b>中等偏上难度练习</b>; 平台内置间隔复习与测验系统, 助你科学掌握。</p>" +
      '<div class="hero-btns">' +
      (cont ? '<a class="btn primary" href="#/sec/' + cont.id + '">▶ 继续学习: ' + U.escapeHtml(cont.title) + "</a>" : '<span class="btn">🎉 全部章节已学完</span>') +
      '<a class="btn" href="#/quiz">📝 随机测验</a>' +
      '<a class="btn" href="#/path">🗺 学习路径</a>' +
      '<a class="btn" href="#/cheat">📋 速查表</a></div></div>';
    if (!App.isOnline()) {
      html += '<div class="card" style="border-left:4px solid var(--warn)"><b>📖 网页预览模式</b><span class="muted small"> — 全部学习内容与功能可用(进度/测验/复习等保存在本浏览器); 代码「运行」需在本地启动平台: 下载仓库后双击「启动学习平台.exe」。</span></div>';
    }
    html += '<div class="grid c4">' +
      '<div class="stat-card"><div class="v">' + chs.length + " 章 / " + total + "</div><div class=\"k\">知识小节总数</div></div>" +
      '<div class="stat-card"><div class="v">' + cnt.s2 + " / " + total + "</div><div class=\"k\">已掌握</div>" +
      '<div class="bar" style="margin-top:6px"><i style="width:' + U.pct(cnt.s2 / Math.max(1, total) * 100) + '%"></i></div></div>' +
      '<div class="stat-card"><div class="v">' + cnt.s1 + "</div><div class=\"k\">学习中</div></div>" +
      '<div class="stat-card' + (rev.due.length ? " due" : "") + '"><div class="v">' + rev.due.length + "</div><div class=\"k\">待复习</div></div></div>";
    html += '<div class="grid c2">';
    /* 左列: 每日一题 + 学习建议 */
    html += '<div>';
    if (daily) {
      html += '<div class="card daily-q"><h3>📌 今日一题</h3>' +
        '<div class="small muted">' + U.escapeHtml(daily.sec.chapter.title) + " · " + U.escapeHtml(daily.sec.id + " " + daily.sec.title) + " · " + U.stars(daily.ex.diff) + " " + U.diffLabel(daily.ex.diff) + "</div>" +
        '<div class="content" style="margin-top:8px">' + MD.render(daily.ex.q) + "</div>" +
        '<div style="margin-top:10px"><a class="btn small" href="#/sec/' + daily.sec.id + '">去该小节练习 →</a></div></div>';
    }
    html += '<div class="card"><h3>💡 学习建议</h3><ul class="small" style="margin:6px 0;padding-left:20px">' +
      "<li>按「学习路径」顺序学习, 先基础后核心再进阶;</li>" +
      "<li>学完一节先独立运行案例代码, 修改参数观察行为;</li>" +
      "<li>练习时先独立思考 10 分钟, 再看提示与答案;</li>" +
      "<li>标记「已掌握」后平台会按 1/3/7/15/30 天安排复习;</li>" +
      "<li>定期用「随机测验」检验学习效果, 错题自动进入错题本。</li></ul></div>";
    html += "</div>";
    /* 右列: 待复习 + 章节进度 */
    html += '<div>';
    if (rev.due.length) {
      html += '<div class="card"><h3>⏰ 待复习 (' + rev.due.length + ')</h3>';
      rev.due.slice(0, 5).forEach(d => {
        const sec = Data.getSection(d.id);
        if (!sec) return;
        html += '<div class="rev-card overdue"><div class="ti"><b>' + U.escapeHtml(sec.title) + "</b>" +
          "<small>" + U.escapeHtml(sec.chapter.title) + "</small></div>" +
          '<a class="btn small primary" href="#/sec/' + sec.id + '">复习</a></div>';
      });
      if (rev.due.length > 5) html += '<div class="muted small">… 共 ' + rev.due.length + ' 项, 见<a href="#/review">复习页</a></div>';
      html += "</div>";
    } else {
      html += '<div class="card"><h3>⏰ 间隔复习</h3><p class="small muted">暂无到期复习项。掌握一个知识点后, 平台会自动按遗忘曲线安排复习(1/3/7/15/30 天)。</p></div>';
    }
    html += '<div class="card"><h3>📚 章节进度</h3>';
    chs.forEach(ch => {
      const p = chapterProgress(ch);
      html += '<div style="margin:7px 0"><div style="display:flex;justify-content:space-between;font-size:12.5px">' +
        '<a href="#/chap/' + ch.id + '">' + U.escapeHtml(ch.icon + " " + ch.title) + "</a>" +
        '<span class="muted">' + p.done + "/" + p.total + "</span></div>" +
        '<div class="bar sm" style="margin-top:3px"><i style="width:' + U.pct(p.done / Math.max(1, p.total) * 100) + '%"></i></div></div>';
    });
    html += "</div></div></div>";
    return html;
  }

  /* ---------------- 章节页 ---------------- */
  function chapter(chId) {
    const ch = Data.getChapter(chId);
    if (!ch) return '<div class="card">章节不存在</div>';
    const p = chapterProgress(ch);
    let html = '<div class="chapter-hero"><div class="tag" style="color:#fff;opacity:.85">第 ' + ch.order + " 章</div>" +
      "<h1>" + U.escapeHtml(ch.icon + " " + ch.title) + "</h1>" +
      "<p>" + U.escapeHtml(ch.subtitle || "") + "</p>" +
      '<div style="margin-top:10px;font-size:12.5px;opacity:.9">进度 ' + p.done + "/" + p.total + "</div></div>";
    (ch.sections || []).forEach(sec => {
      const st = Store.getStatus(sec.id);
      const exn = (sec.exercises || []).length;
      html += '<a class="sec-row" href="#/sec/' + sec.id + '">' +
        '<span class="dot s' + st + '"></span>' +
        '<span class="id">' + U.escapeHtml(sec.id) + "</span>" +
        '<span class="ti">' + U.escapeHtml(sec.title) +
        (sec.desc ? '<span class="ds">' + U.escapeHtml(sec.desc) + "</span>" : "") + "</span>" +
        '<span class="exn">📝 ' + exn + " 题</span></a>";
    });
    return html;
  }

  /* ---------------- 小节页(知识点页) ---------------- */
  function section(secId) {
    const sec = Data.getSection(secId);
    if (!sec) return '<div class="card">小节不存在: ' + U.escapeHtml(secId) + "</div>";
    const ch = sec.chapter;
    const st = Store.getStatus(sec.id);
    const bm = Store.isBookmarked(sec.id);
    const path = Data.pathOrder();
    const idx = path.findIndex(s => s.id === sec.id);
    const prev = idx > 0 ? path[idx - 1] : null;
    const next = idx >= 0 && idx < path.length - 1 ? path[idx + 1] : null;
    let html = "";
    html += '<div class="sec-head">' +
      '<div class="tag">第 ' + ch.order + " 章 · " + U.escapeHtml(ch.title) + "</div>" +
      "<h1>" + U.escapeHtml(sec.id + "  " + sec.title) + "</h1>" +
      "<div>" + (sec.keywords || []).map(k => '<span class="chip">' + U.escapeHtml(k) + "</span>").join("") +
      U.statusChip(st) + "</div>" +
      '<div class="sec-actions">' +
      '<button class="btn small' + (st === 1 ? " warn" : "") + '" data-act="status" data-id="' + sec.id + '" data-s="1">' + (st === 1 ? "● 学习中" : "标记学习中") + "</button>" +
      '<button class="btn small ok' + (st === 2 ? "" : "") + '" data-act="status" data-id="' + sec.id + '" data-s="2">✔ 已掌握</button>' +
      '<button class="btn small' + (st === 2 ? " ghost" : "") + '" data-act="status" data-id="' + sec.id + '" data-s="0">重置</button>' +
      '<button class="btn small" data-act="bm" data-id="' + sec.id + '">' + (bm ? "★ 已收藏" : "☆ 收藏") + "</button>" +
      '<button class="btn small" data-act="note" data-id="' + sec.id + '">📝 笔记</button>' +
      "</div></div>";
    html += '<div class="card content">' + MD.render(sec.theory) + "</div>";
    if (sec.keyPoints && sec.keyPoints.length) {
      html += '<div class="card"><h3>🎯 核心要点</h3><ul class="keypoints">' +
        sec.keyPoints.map(k => "<li>" + MD.render(k).replace(/^<p>|<\/p>$/g, "") + "</li>").join("") + "</ul></div>";
    }
    /* 代码面板 */
    (sec.codes || []).forEach((cd, i) => {
      html += codePanel(sec.id, cd, i);
    });
    /* 练习题 */
    const exs = sec.exercises || [];
    if (exs.length) {
      html += '<div class="card"><h3>📝 练习题 <span class="muted small">(中等偏上难度 · 先独立思考再看答案)</span></h3>';
      exs.forEach((ex, i) => {
        const key = sec.id + "#" + i;
        html += '<div class="ex-card"><div class="ex-head"><span class="ex-no">练习 ' + (i + 1) + "</span>" +
          U.stars(ex.diff) + '<span class="ex-diff">' + U.diffLabel(ex.diff) + "</span></div>" +
          '<div class="ex-q content">' + MD.render(ex.q) + "</div>" +
          '<div class="ex-actions">' +
          '<button class="btn small" data-act="toggle-box" data-t="hint-' + key + '">💡 提示</button>' +
          '<button class="btn small" data-act="toggle-box" data-t="ans-' + key + '">✅ 查看答案</button>' +
          '<button class="btn small danger" data-act="wrong" data-key="' + key + '">📕 加入错题本</button></div>' +
          '<div class="ex-box hidden" id="hint-' + key + '"><div class="ex-box-title">💡 提示</div><div class="content">' + MD.render(ex.hint || "") + "</div></div>" +
          '<div class="ex-box hidden" id="ans-' + key + '"><div class="ex-box-title">✅ 参考答案</div><div class="content">' + MD.render(ex.ans || "") + "</div></div></div>";
      });
      html += "</div>";
    }
    /* 上/下一节 */
    html += '<div style="display:flex;justify-content:space-between;margin:20px 0 8px">' +
      (prev ? '<a class="btn" href="#/sec/' + prev.id + '">← ' + U.escapeHtml(prev.id + " " + prev.title) + "</a>" : "<span></span>") +
      (next ? '<a class="btn" href="#/sec/' + next.id + '">' + U.escapeHtml(next.id + " " + next.title) + " →</a>" : "<span></span>") + "</div>";
    return html;
  }

  /* 单个代码面板 */
  function codePanel(secId, cd, i) {
    const lang = cd.lang;
    const pid = secId + "-" + i;
    const needIn = Runner.needsInput(cd.code);
    const online = App.isOnline();
    const runBtn = online
      ? '<button class="btn" data-act="run" data-out="out-' + pid + '" data-code="code-' + pid + '" data-in="in-' + pid + '" data-meta="meta-' + pid + '" data-lang="' + lang + '">▶ 运行</button>'
      : '<button class="btn" disabled title="网页预览模式无法执行代码, 请本地启动平台">▶ 运行(需本地)</button>';
    const tip = online
      ? '<span class="small" style="color:#7d8ba1">运行超时 15 秒 · 修改代码后点「运行」</span>'
      : '<span class="small" style="color:#fbbf24">📖 网页预览模式: 代码仅可查看/复制, 运行功能需在本地启动平台(双击「启动学习平台.exe」)</span>';
    return '<div class="code-card"><div class="code-head">' +
      '<span class="lang-badge ' + (lang === "c" ? "c" : "py") + '">' + (lang === "c" ? "C" : "PYTHON") + "</span>" +
      "<span class=\"desc\">" + U.escapeHtml(cd.name || (lang === "c" ? "C 案例" : "Python 案例")) + (cd.desc ? " — " + U.escapeHtml(cd.desc) : "") + "</span>" +
      runBtn +
      '<button class="btn" data-act="reset" data-code="code-' + pid + '" data-orig="' + pid + '">↺ 重置</button>' +
      '<button class="btn" data-act="to-lab" data-lang="' + lang + '" data-code="code-' + pid + '" data-title="' + U.escapeHtml(secId + " " + (cd.name || "")) + '">🔧 在实验台打开</button></div>' +
      '<textarea class="code-edit" id="code-' + pid + '" spellcheck="false" data-orig="' + pid + '">' + escArea(cd.code) + "</textarea>" +
      '<div class="run-row">' +
      (needIn ? '<textarea class="inp" id="in-' + pid + '" rows="2" placeholder="标准输入(如: 5 3 8 1 9)…"></textarea>' : '<span class="muted small" style="color:#7d8ba1">无需输入</span>') +
      tip + "</div>" +
      '<pre class="out-box hidden" id="out-' + pid + '"></pre>' +
      '<div class="out-meta hidden" id="meta-' + pid + '"></div></div>';
  }
  function escArea(s) {
    /* MD.esc 已把 < 转成 &lt;, textarea 会正确还原显示, 且不会截断标签 */
    return MD.esc(s);
  }

  /* ---------------- 测验 ---------------- */
  const Q = { pool: [], idx: 0, correct: 0, partial: 0, wrong: [], started: false, chs: null, max: 10, diffs: null, logged: false };
  function quiz() {
    if (!Q.started) return quizSetup();
    if (Q.idx >= Q.pool.length) return quizResult();
    const item = Q.pool[Q.idx];
    const sec = item.sec;
    let html = '<div class="card">' +
      '<div class="quiz-progress">' + Q.pool.map((_, i) => '<i class="' + (i < Q.idx ? "done" : i === Q.idx ? "cur" : "") + '"></i>').join("") + "</div>" +
      '<div class="muted small" style="margin-bottom:8px">第 ' + (Q.idx + 1) + " / " + Q.pool.length + " 题 · " +
      U.escapeHtml(sec.chapter.title + " · " + sec.id + " " + sec.title) + " · " +
      U.stars(item.ex.diff) + " " + U.diffLabel(item.ex.diff) + "</div>" +
      '<div class="quiz-q content">' + MD.render(item.ex.q) + "</div>" +
      '<div style="margin-top:14px"><textarea class="quiz-ans" id="quiz-ans" placeholder="在此写下你的解答思路…(可写伪代码)"></textarea></div>' +
      '<div class="ex-actions">' +
      '<button class="btn small" data-act="toggle-box" data-t="quiz-hint">💡 提示</button>' +
      '<button class="btn small" data-act="toggle-box" data-t="quiz-ans-box">✅ 查看答案</button></div>' +
      '<div class="ex-box hidden" id="quiz-hint"><div class="ex-box-title">💡 提示</div><div class="content">' + MD.render(item.ex.hint || "") + "</div></div>" +
      '<div class="ex-box hidden" id="quiz-ans-box"><div class="ex-box-title">✅ 参考答案</div><div class="content">' + MD.render(item.ex.ans || "") + "</div></div>" +
      '<div class="ex-actions" style="border-top:1px dashed var(--line);padding-top:12px;margin-top:14px">' +
      '<button class="btn ok" data-act="quiz-grade" data-g="1">✔ 答对</button>' +
      '<button class="btn warn" data-act="quiz-grade" data-g="0.5">◐ 部分正确</button>' +
      '<button class="btn danger" data-act="quiz-grade" data-g="0">✘ 答错</button>' +
      '<button class="btn ghost" data-act="quiz-skip">跳过 →</button></div></div>';
    return html;
  }
  function quizSetup() {
    const chs = Data.allChapters();
    let html = '<div class="card quiz-hero"><h2 style="margin:0 0 6px">📝 随机测验</h2>' +
      '<p class="muted small">从所选章节的练习题中随机抽题, 自评打分。答错的题会自动进入错题本。</p></div>';
    html += '<div class="card"><h3>① 选择章节</h3><div class="grid c2">' +
      chs.map(c => '<label class="chk-row"><input type="checkbox" class="quiz-ch" value="' + c.id + '" checked><span>' +
        U.escapeHtml(c.icon + " " + c.title) + "</span></label>").join("") + "</div></div>";
    html += '<div class="card"><h3>② 题目难度与数量</h3>' +
      '<label class="chk-row" style="width:fit-content"><input type="checkbox" class="quiz-df" value="3" checked> ★★★ 中等偏上</label>' +
      '<label class="chk-row" style="width:fit-content"><input type="checkbox" class="quiz-df" value="4" checked> ★★★★ 较难</label>' +
      '<label class="chk-row" style="width:fit-content"><input type="checkbox" class="quiz-df" value="5" checked> ★★★★★ 挑战</label>' +
      '<div style="margin-top:12px"><label class="small muted">题目数量: </label><select class="lab-lang" id="quiz-max">' +
      [5, 8, 10, 15, 20].map(n => '<option value="' + n + '"' + (n === 10 ? " selected" : "") + ">" + n + " 题</option>").join("") +
      "</select></div>" +
      '<div style="margin-top:16px"><button class="btn primary" data-act="quiz-start">开始测验 ▶</button></div></div>';
    return html;
  }
  function quizResult() {
    const score = Math.round((Q.correct + Q.partial * 0.5) / Math.max(1, Q.pool.length) * 100);
    const total = Q.pool.length;
    if (!Q.logged) {
      Q.logged = true;
      Store.addQuizLog({
        t: Date.now(), chapter: "综合", total: total,
        correct: Q.correct, partial: Q.partial, wrong: Q.wrong.slice()
      });
    }
    let html = '<div class="card quiz-hero"><h2 style="margin:0 0 4px">🎉 测验完成</h2>' +
      '<div style="font-size:44px;font-weight:800;color:var(--primary)">' + score + " 分</div>" +
      '<div class="muted">答对 ' + Q.correct + " · 部分 " + Q.partial + " · 答错 " + (total - Q.correct - Q.partial) + " / 共 " + total + " 题</div>" +
      '<div class="bar" style="margin:12px auto;max-width:420px"><i style="width:' + score + '%"></i></div>' +
      '<div class="ex-actions" style="justify-content:center">' +
      '<button class="btn primary" data-act="quiz-restart">再来一轮</button>' +
      '<a class="btn" href="#/stats">查看统计</a></div></div>';
    if (Q.wrong.length) {
      html += '<div class="card"><h3>📕 错题回顾</h3>';
      Q.wrong.forEach(key => {
        const m = key.split("#");
        const sec = Data.getSection(m[0]);
        if (sec) html += '<div class="rev-card"><div class="ti"><b>' + U.escapeHtml(sec.title) + "</b><small>" +
          U.escapeHtml(sec.chapter.title) + "</small></div>" +
          '<a class="btn small primary" href="#/sec/' + sec.id + '">去复习</a></div>';
      });
      html += "</div>";
    }
    return html;
  }
  function quizStart() {
    const chs = U.qa(".quiz-ch").filter(i => i.checked).map(i => i.value);
    const diffs = U.qa(".quiz-df").filter(i => i.checked).map(i => parseInt(i.value, 10));
    const max = parseInt(U.q("#quiz-max").value, 10) || 10;
    let pool = Data.allExercises().filter(it => chs.includes(it.sec.chapter.id) && diffs.includes(it.ex.diff));
    if (!pool.length) { U.toast("所选范围没有题目, 请调整筛选条件", "err"); return; }
    Q.pool = U.shuffle(pool).slice(0, Math.min(max, pool.length));
    Q.idx = 0; Q.correct = 0; Q.partial = 0; Q.wrong = []; Q.started = true; Q.logged = false;
    App.route();
  }

  /* ---------------- 复习页 ---------------- */
  function review() {
    const rev = Store.dueReviews();
    const intervals = Store.REVIEW_INTERVALS.map(d => d + "天").join(" → ");
    let html = '<div class="card"><h2 style="margin:0 0 6px">⏰ 间隔复习</h2>' +
      "<p class=\"muted small\">基于<b>遗忘曲线</b>: 掌握一个知识点后, 平台在 " + intervals + " 后提醒你复习。每次「复习完成」会推进到下一间隔, 直至长期记忆。</p></div>";
    html += '<div class="grid c2">';
    html += '<div><div class="card"><h3>🔔 待复习 (' + rev.due.length + ")</h3>";
    if (!rev.due.length) html += '<p class="muted small">太棒了, 当前没有到期复习项! 🎉</p>';
    rev.due.forEach(d => {
      const sec = Data.getSection(d.id);
      if (!sec) return;
      const overdue = d.item.next + 86400000 * 2 < Date.now();
      html += '<div class="rev-card' + (overdue ? " overdue" : "") + '">' +
        '<div class="ti"><b>' + U.escapeHtml(sec.id + " " + sec.title) + "</b>" +
        "<small>" + U.escapeHtml(sec.chapter.title) + " · 第 " + (d.item.stage + 1) + " 轮复习" + (overdue ? " · 已逾期" : "") + "</small></div>" +
        '<a class="btn small" href="#/sec/' + sec.id + '">去复习</a>' +
        '<button class="btn small ok" data-act="rev-done" data-id="' + sec.id + '">✔ 复习完成</button></div>';
    });
    html += "</div></div>";
    html += '<div><div class="card"><h3>🗓 即将复习</h3>';
    if (!rev.upcoming.length) html += '<p class="muted small">还没有已安排的复习计划。去学习并「标记已掌握」吧。</p>';
    rev.upcoming.slice(0, 12).forEach(d => {
      const sec = Data.getSection(d.id);
      if (!sec) return;
      html += '<div class="rev-card"><div class="ti"><b>' + U.escapeHtml(sec.title) + "</b>" +
        "<small>" + U.escapeHtml(sec.chapter.title) + "</small></div>" +
        '<span class="due">' + U.fmtDue(d.item.next) + "</span></div>";
    });
    html += "</div></div></div>";
    return html;
  }

  /* ---------------- 实验台 ---------------- */
  function lab() {
    const saved = Store.getLabCode();
    const chs = Data.allChapters();
    const secOpts = [];
    chs.forEach(c => (c.sections || []).forEach(s => {
      secOpts.push('<option value="' + s.id + '">' + U.escapeHtml(s.id + " " + s.title) + "</option>");
    }));
    const online = App.isOnline();
    const runBtn = online
      ? '<button class="btn primary" data-act="lab-run">▶ 运行</button>'
      : '<button class="btn primary" disabled title="网页预览模式无法执行代码, 请本地启动平台">▶ 运行(需本地)</button>';
    const tip = online
      ? ""
      : '<p class="muted small" style="color:#fbbf24;margin-top:8px">📖 网页预览模式: 编辑与载入功能可用, 代码运行需在本地启动平台(双击「启动学习平台.exe」)。</p>';
    return '<div class="card"><h2 style="margin:0 0 4px">🔧 算法实验台</h2>' +
      "<p class=\"muted small\">自由编写并运行 C / Python 代码; 也可从任意知识点一键载入其案例代码进行修改实验。</p></div>" +
      '<div class="card"><div class="load-row">' +
      '<select class="lab-lang" id="lab-ch"><option value="">— 选择章节 —</option>' +
      chs.map(c => '<option value="' + c.id + '">' + U.escapeHtml(c.title) + "</option>").join("") + "</select>" +
      '<select class="lab-lang" id="lab-sec"><option value="">— 选择小节 —</option>' + secOpts.join("") + "</select>" +
      '<select class="lab-lang" id="lab-lang"><option value="python"' + (saved.lang === "python" ? " selected" : "") + ">Python</option>" +
      '<option value="c"' + (saved.lang === "c" ? " selected" : "") + ">C</option></select>" +
      '<button class="btn" data-act="lab-load">载入案例</button>' +
      '<button class="btn ghost" data-act="lab-clear">清空</button></div>' +
      '<textarea class="lab-editor" id="lab-editor" spellcheck="false">' + escArea(saved.code || defaultLabCode(saved.lang)) + "</textarea>" +
      '<div class="run-row"><textarea class="inp" id="lab-in" rows="2" placeholder="标准输入(可选)…"></textarea>' +
      runBtn + "</div>" +
      '<pre class="out-box hidden" id="lab-out"></pre>' +
      '<div class="out-meta hidden" id="lab-meta"></div>' + tip + "</div>";
  }
  function defaultLabCode(lang) {
    return lang === "c"
      ? '#include <stdio.h>\n\nint main(void) {\n    // 在这里编写你的 C 代码\n    printf("Hello, 算法!\\n");\n    return 0;\n}\n'
      : '# 在这里编写你的 Python 代码\nprint("Hello, 算法!")\n';
  }

  /* ---------------- 速查表 ---------------- */
  function cheat() {
    let html = '<div class="card"><h2 style="margin:0 0 4px">📋 知识速查表</h2>' +
      "<p class=\"muted small\">考前冲刺 / 快速回顾必备: 复杂度、主定理、排序、图算法、DP 套路等一表打尽。</p></div>";
    html += '<div class="cheat-grid">' + CHEAT_DATA.map(c =>
      '<div class="card content"><h3>' + U.escapeHtml(c.title) + "</h3>" + c.html + "</div>").join("") + "</div>";
    return html;
  }

  /* ---------------- 搜索 ---------------- */
  function search(q) {
    const res = Data.search(q);
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const highlight = (text) => {
      let out = U.escapeHtml(text);
      terms.forEach(term => {
        if (!term) return;
        const re = new RegExp("(" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
        out = out.replace(re, "<mark>$1</mark>");
      });
      return out;
    };
    let html = '<div class="card"><h2 style="margin:0 0 4px">🔍 搜索结果: ' + U.escapeHtml(q) + "</h2>" +
      '<p class="muted small">共 ' + res.length + " 个相关知识点</p></div>";
    if (!res.length) html += '<div class="card muted">没有找到相关内容, 换个关键词试试(如: 动态规划、KMP、主定理、并查集)。</div>';
    res.forEach(sec => {
      html += '<div class="search-hit" data-act="goto" data-href="#/sec/' + sec.id + '">' +
        '<div class="t">' + highlight(sec.chapter.icon + " " + sec.chapter.title + " · " + sec.id + " " + sec.title) + "</div>" +
        '<div class="s">' + highlight(Data.snippet(sec, q)) + "</div></div>";
    });
    return html;
  }

  /* ---------------- 学习路径 ---------------- */
  function pathPage() {
    const phases = [
      { name: "基础篇 · 复杂度分析与分治", cls: "base", range: [1, 2], tip: "掌握渐近记号、递归方程与分治模板, 这是后续一切分析的基础" },
      { name: "核心篇 · 三大设计策略与图算法", cls: "core", range: [3, 6], tip: "动态规划与贪心是算法设计的灵魂; 图算法是笔试面试的重头戏" },
      { name: "进阶篇 · 数据结构与理论", cls: "adv", range: [7, 13], tip: "高级数据结构、字符串、随机化、数论与计算复杂性, 建立完整知识体系" }
    ];
    const path = Data.pathOrder();
    let html = '<div class="card"><h2 style="margin:0 0 4px">🗺 学习路径</h2>' +
      "<p class=\"muted small\">推荐按此顺序学习: 每章内部按小节顺序推进。已掌握的知识点会自动进入间隔复习队列。</p></div>";
    phases.forEach(ph => {
      const secs = path.filter(s => s.chapter.order >= ph.range[0] && s.chapter.order <= ph.range[1]);
      const done = secs.filter(s => Store.getStatus(s.id) === 2).length;
      html += '<div class="phase-title"><span class="ph ' + ph.cls + '">' + ph.name.split(" · ")[0] + "</span><span>" +
        ph.name.split(" · ").slice(1).join(" · ") + "</span><span class=\"muted small\">" + done + "/" + secs.length + "</span></div>";
      html += '<div class="card" style="margin-top:6px"><p class="muted small" style="margin-top:0">' + ph.tip + "</p>";
      secs.forEach(sec => {
        const st = Store.getStatus(sec.id);
        html += '<div style="display:flex;align-items:center;gap:10px;padding:6px 4px;border-bottom:1px dashed var(--line)">' +
          '<span class="dot s' + st + '"></span>' +
          '<a style="flex:1" href="#/sec/' + sec.id + '">' + U.escapeHtml(sec.id + "  " + sec.title) + "</a>" + U.statusChip(st) + "</div>";
      });
      html += "</div>";
    });
    return html;
  }

  /* ---------------- 统计 ---------------- */
  function stats() {
    const chs = Data.allChapters();
    const total = Data.totalSections();
    const cnt = Store.statusCounts();
    const log = Store.getQuizLog();
    const wrong = Store.getWrong();
    const notes = Store.getNotes();
    const bm = Store.getBookmarks();
    const overall = U.pct((cnt.s2 + cnt.s1 * 0.5) / Math.max(1, total) * 100);
    let html = '<div class="card"><h2 style="margin:0 0 4px">📊 学习统计</h2>' +
      "<p class=\"muted small\">掌握度 = 已掌握×100% + 学习中×50%。数据保存在浏览器本地。</p></div>";
    html += '<div class="grid c4">' +
      '<div class="stat-card"><div class="v">' + overall + "%</div><div class=\"k\">总体掌握度</div></div>" +
      '<div class="stat-card"><div class="v">' + cnt.s2 + "</div><div class=\"k\">已掌握小节</div></div>" +
      '<div class="stat-card"><div class="v">' + log.length + "</div><div class=\"k\">完成测验次数</div></div>" +
      '<div class="stat-card"><div class="v">' + Object.keys(wrong).length + "</div><div class=\"k\">错题数</div></div></div>";
    html += '<div class="card"><h3>📚 各章掌握度</h3>';
    chs.forEach(ch => {
      const p = chapterProgress(ch);
      html += '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:13px">' +
        "<span>" + U.escapeHtml(ch.icon + " " + ch.title) + "</span><span class=\"muted\">" + p.done + "/" + p.total + "</span></div>" +
        '<div class="bar" style="margin-top:4px"><i style="width:' + U.pct(p.done / Math.max(1, p.total) * 100) + '%"></i></div></div>';
    });
    html += "</div>";
    /* 测验历史 */
    html += '<div class="card"><h3>📈 测验成绩历史(最近 10 次)</h3>';
    if (!log.length) html += '<p class="muted small">还没有测验记录, 去<a href="#/quiz">随机测验</a>测一把!</p>';
    else {
      const last = log.slice(-10);
      html += '<div class="hist-bar">' + last.map(l => {
        const p = U.pct(((l.correct || 0) + (l.partial || 0) * 0.5) / Math.max(1, l.total || 1) * 100);
        return '<div class="hb" style="height:' + Math.max(6, p) + '%" title="' + p + '%"><span>' + p + "</span></div>";
      }).join("") + "</div>";
    }
    html += "</div>";
    /* 错题本 */
    html += '<div class="card"><h3>📕 错题本</h3>';
    const wkeys = Object.keys(wrong);
    if (!wkeys.length) html += '<p class="muted small">暂无错题, 继续保持! 🎉</p>';
    wkeys.forEach(key => {
      const m = key.split("#");
      const sec = Data.getSection(m[0]);
      const label = sec ? U.escapeHtml(sec.id + " " + sec.title) : U.escapeHtml(key);
      html += '<div class="rev-card"><div class="ti"><b>' + label + "</b><small>错 " + wrong[key] + " 次</small></div>" +
        (sec ? '<a class="btn small primary" href="#/sec/' + sec.id + '">重做</a>' : "") +
        '<button class="btn small ghost" data-act="del-wrong" data-key="' + key + '">移除</button></div>';
    });
    html += "</div>";
    /* 收藏与笔记 */
    html += '<div class="card"><h3>⭐ 收藏 (' + bm.length + ") · 📝 笔记 (" + Object.keys(notes).length + ")</h3>";
    if (bm.length) {
      html += '<div class="small">' + bm.map(id => {
        const sec = Data.getSection(id);
        return sec ? '<a href="#/sec/' + id + '" class="chip">' + U.escapeHtml(sec.title) + "</a>" : "";
      }).join("") + "</div>";
    } else html += '<p class="muted small">点击知识点页的「☆ 收藏」可快速标记重要内容。</p>';
    html += "</div>";
    /* 数据管理: 导出 / 导入 / 清空 */
    html += '<div class="card"><h3>💾 学习数据备份</h3>' +
      '<p class="muted small">学习进度、笔记、错题本与测验记录保存在浏览器本地。建议定期导出备份, 更换浏览器或清理数据后可随时导入恢复。</p>' +
      '<div class="ex-actions">' +
      '<button class="btn" data-act="export-data">⬇ 导出备份</button>' +
      '<button class="btn" data-act="import-data">⬆ 导入备份</button>' +
      '<button class="btn danger" data-act="clear-data">🗑 清空全部学习数据</button></div>' +
      '<input type="file" id="import-file" accept=".json,application/json" class="hidden"></div>';
    return html;
  }

  return { navTree, home, chapter, section, review, lab, cheat, search, pathPage, stats, quiz, quizStart, _q: () => Q };
})();
