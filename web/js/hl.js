/* hl.js — 轻量语法高亮(C / Python), 输出带 span 的 HTML */
"use strict";
const HL = (() => {
  const KW = {
    c: new Set(("auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while").split(" ")),
    python: new Set(("False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield").split(" "))
  };
  const BUILTIN = {
    c: new Set(("printf scanf putchar getchar puts gets malloc calloc realloc free memcpy memset strlen strcmp strcpy strcat fopen fclose fprintf fscanf sscanf sprintf atoi atol atof abs labs exit rand srand time sqrt pow floor ceil min max").split(" ")),
    python: new Set(("print input len range int float str list dict set tuple sorted min max sum abs map filter enumerate zip open isinstance type super object repr format round pow ord chr hex bin bool").split(" "))
  };
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  const RE_C = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|\b\d[\w.]*\b|\b[A-Za-z_]\w*\b)/g;
  const RE_PY = /(#[^\n]*|"""(?:[^"\\]|\\.|"(?!""))*"""|'''(?:[^'\\]|\\.|'(?!''))*'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d[\w.]*\b|@[A-Za-z_]\w*|\b[A-Za-z_]\w*\b)/g;
  function highlight(code, lang) {
    const re = lang === "python" ? RE_PY : RE_C;
    const kw = KW[lang] || new Set();
    const bi = BUILTIN[lang] || new Set();
    let html = "", last = 0, m;
    while ((m = re.exec(code)) !== null) {
      html += esc(code.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith("//") || tok.startsWith("/*") || tok.startsWith("#") && lang === "python" || tok.startsWith("'''") || tok.startsWith('"""')) {
        html += '<span class="tok-c">' + esc(tok) + "</span>";
      } else if (tok.startsWith('"') || tok.startsWith("'")) {
        html += '<span class="tok-s">' + esc(tok) + "</span>";
      } else if (lang === "c" && tok.startsWith("#")) {
        html += '<span class="tok-p">' + esc(tok) + "</span>";
      } else if (/^\d/.test(tok)) {
        html += '<span class="tok-n">' + esc(tok) + "</span>";
      } else if (lang === "python" && tok.startsWith("@")) {
        html += '<span class="tok-p">' + esc(tok) + "</span>";
      } else if (kw.has(tok)) {
        html += '<span class="tok-k">' + esc(tok) + "</span>";
      } else if (bi.has(tok)) {
        html += '<span class="tok-f">' + esc(tok) + "</span>";
      } else {
        html += esc(tok);
      }
      last = m.index + tok.length;
    }
    html += esc(code.slice(last));
    return html;
  }
  return { highlight };
})();
