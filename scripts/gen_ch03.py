# -*- coding: utf-8 -*-
"""生成 web/chapters/ch03.json (动态规划)"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dp_part_a import sections_a
from dp_part_b import sections_b

data = {
    "id": "ch03",
    "order": 3,
    "title": "动态规划",
    "subtitle": "最优子结构与重叠子问题: 从钢条切割到状态压缩 DP。",
    "icon": "📐",
    "sections": sections_a + sections_b,
}

out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "web", "chapters", "ch03.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write("\n")

# 统计每个 theory 的中文字符数(去空白与 Markdown 符号), 便于自查
import re
def cjk_count(s):
    return len(re.findall(r"[\u4e00-\u9fff]", s))

print("生成:", out)
for sec in data["sections"]:
    n_cjk = cjk_count(sec["theory"])
    flag = "OK" if 400 <= n_cjk <= 900 else "!! 越界"
    print("  %s %s  theory中文字数=%d %s" % (sec["id"], sec["title"], n_cjk, flag))
print("小节数:", len(data["sections"]))
