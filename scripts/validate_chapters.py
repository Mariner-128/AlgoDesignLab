# -*- coding: utf-8 -*-
"""
全量章节结构校验: 检查 web/chapters/*.json 的 schema 完整性。
用法: python scripts/validate_chapters.py [可选: 只校验某章, 如 ch03]
"""
import glob
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CH_DIR = os.path.join(ROOT, "web", "chapters")
REQUIRED_SEC = ["id", "title", "keywords", "desc", "theory", "keyPoints", "codes", "exercises"]
REQUIRED_CODE = ["lang", "name", "desc", "code"]
REQUIRED_EX = ["diff", "q", "hint", "ans"]


def check_chapter(path):
    errs = []
    with open(path, encoding="utf-8") as f:
        d = json.load(f)
    for k in ("id", "order", "title", "subtitle", "icon", "sections"):
        if k not in d:
            errs.append("章节缺少字段: %s" % k)
    sec_ids = set()
    for sec in d.get("sections", []):
        sid = sec.get("id", "?")
        if sid in sec_ids:
            errs.append("小节 id 重复: %s" % sid)
        sec_ids.add(sid)
        for k in REQUIRED_SEC:
            if k not in sec:
                errs.append("[%s] 缺少字段 %s" % (sid, k))
        theory = sec.get("theory", "")
        if len(theory) < 300:
            errs.append("[%s] theory 过短(%d字), 要求 >=300" % (sid, len(theory)))
        if len(theory) > 2500:
            errs.append("[%s] theory 过长(%d字), 要求 <=2500" % (sid, len(theory)))
        kp = sec.get("keyPoints", [])
        if not (3 <= len(kp) <= 6):
            errs.append("[%s] keyPoints 数量 %d, 要求 3~6" % (sid, len(kp)))
        kws = sec.get("keywords", [])
        if not (3 <= len(kws) <= 8):
            errs.append("[%s] keywords 数量 %d, 要求 3~8" % (sid, len(kws)))
        codes = sec.get("codes", [])
        langs = [c.get("lang") for c in codes]
        if "c" not in langs or "python" not in langs:
            errs.append("[%s] codes 必须同时含 c 与 python, 实际: %s" % (sid, langs))
        if len(codes) != 2:
            errs.append("[%s] codes 数量 %d, 要求恰好 2" % (sid, len(codes)))
        for cd in codes:
            for k in REQUIRED_CODE:
                if k not in cd:
                    errs.append("[%s][%s] 代码缺少字段 %s" % (sid, cd.get("lang"), k))
            code = cd.get("code", "")
            if len(code) < 8:
                errs.append("[%s][%s] 代码过短" % (sid, cd.get("lang")))
            if cd.get("lang") == "c" and "main" not in code:
                errs.append("[%s][C] 代码缺少 main 函数" % sid)
        exs = sec.get("exercises", [])
        if not (3 <= len(exs) <= 5):
            errs.append("[%s] 练习题数量 %d, 要求 3~5" % (sid, len(exs)))
        diffs = []
        for i, ex in enumerate(exs):
            for k in REQUIRED_EX:
                if k not in ex:
                    errs.append("[%s] 练习%d 缺少字段 %s" % (sid, i + 1, k))
            df = ex.get("diff")
            if df not in (3, 4, 5):
                errs.append("[%s] 练习%d diff=%s, 要求 3/4/5" % (sid, i + 1, df))
            else:
                diffs.append(df)
            if len(ex.get("ans", "")) < 60:
                errs.append("[%s] 练习%d 答案过短(<60字)" % (sid, i + 1))
        if diffs and max(diffs) < 4:
            errs.append("[%s] 无 diff>=4 的练习" % sid)
    return d, errs


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    files = sorted(glob.glob(os.path.join(CH_DIR, "ch*.json")))
    if only:
        files = [f for f in files if os.path.basename(f).startswith(only)]
    total_err = 0
    for path in files:
        name = os.path.basename(path)
        try:
            d, errs = check_chapter(path)
        except Exception as e:
            print("FAIL %s: JSON 解析失败: %s" % (name, e))
            total_err += 1
            continue
        if errs:
            total_err += len(errs)
            print("FAIL %s (%s, %d 小节):" % (name, d.get("id"), len(d.get("sections", []))))
            for e in errs[:20]:
                print("   - " + e)
            if len(errs) > 20:
                print("   ... 共 %d 个问题" % len(errs))
        else:
            print("OK   %s (%s, %d 小节)" % (name, d.get("id"), len(d.get("sections", []))))
    print("总问题数: %d" % total_err)
    sys.exit(1 if total_err else 0)


if __name__ == "__main__":
    main()
