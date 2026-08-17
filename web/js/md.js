/* md.js — 轻量 Markdown 渲染器(无外部依赖, 支持平台内联语法) */
"use strict";
const MD = (() => {
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  /* 行内语法: `code`  **粗体**  *斜体*  ~下标~  ^上标^  [文字](#/sec/x)  [文字](http...) */
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, (m, c) => "<code>" + c + "</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");
    s = s.replace(/~([^~\n]+)~/g, "<sub>$1</sub>");
    s = s.replace(/\^([^^\n]+)\^/g, "<sup>$1</sup>");
    s = s.replace(/\[([^\]]+)\]\(#\/([^)]+)\)/g, '<a href="#/$2">$1</a>');
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s;
  }
  function render(src) {
    if (!src) return "";
    const lines = src.replace(/\r\n/g, "\n").split("\n");
    let html = "", i = 0, listType = null;
    const closeList = () => {
      if (listType) { html += listType === "ul" ? "</ul>" : "</ol>"; listType = null; }
    };
    const para = [];
    const flushPara = () => {
      if (para.length) { html += "<p>" + para.map(inline).join("<br>") + "</p>"; para.length = 0; }
    };
    const isBlockStart = (t) => /^(#{1,6})\s/.test(t) || /^```/.test(t) || /^>/.test(t) || /^\s*([-*+]|\d+[.)])\s+/.test(t) || /^\|/.test(t) || /^(-{3,}|\*{3,})$/.test(t);
    while (i < lines.length) {
      const raw = lines[i];
      const t = raw.trim();
      if (!t) { i++; flushPara(); closeList(); continue; }
      // 标题
      const h = t.match(/^(#{1,6})\s+(.*)$/);
      if (h) { flushPara(); closeList(); html += "<h" + h[1].length + ">" + inline(h[2]) + "</h" + h[1].length + ">"; i++; continue; }
      // 分隔线
      if (/^(-{3,}|\*{3,})$/.test(t)) { flushPara(); closeList(); html += "<hr>"; i++; continue; }
      // 代码块
      if (t.startsWith("```")) {
        flushPara(); closeList();
        const lang = t.slice(3).trim();
        const buf = []; i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
        i++;
        const code = buf.join("\n");
        html += '<pre class="codeblock">' + (lang ? HL.highlight(code, lang) : esc(code)) + "</pre>";
        continue;
      }
      // 引用
      if (t.startsWith(">")) {
        flushPara(); closeList();
        const buf = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) { buf.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
        html += "<blockquote><p>" + buf.map(inline).join("<br>") + "</p></blockquote>";
        continue;
      }
      // 表格
      if (t.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) {
        flushPara(); closeList();
        const head = t.split("|").slice(1, -1).map(s => s.trim());
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          rows.push(lines[i].split("|").slice(1, -1).map(s => inline(s.trim())));
          i++;
        }
        html += '<div class="tbl-wrap"><table><thead><tr>' + head.map(c => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>";
        for (const r of rows) html += "<tr>" + r.map(c => "<td>" + c + "</td>").join("") + "</tr>";
        html += "</tbody></table></div>";
        continue;
      }
      // 列表
      const ul = t.match(/^\s*([-*+])\s+(.*)$/);
      const ol = t.match(/^\s*\d+[.)]\s+(.*)$/);
      if (ul || ol) {
        flushPara();
        const kind = ol ? "ol" : "ul";
        if (listType !== kind) { closeList(); html += "<" + kind + ">"; listType = kind; }
        html += "<li>" + inline(ul ? ul[2] : ol[1]) + "</li>";
        i++;
        continue;
      }
      // 普通段落
      if (para.length === 0 && isBlockStart(t)) { flushPara(); closeList(); }
      para.push(raw);
      i++;
    }
    flushPara(); closeList();
    return html;
  }
  return { render, esc };
})();
