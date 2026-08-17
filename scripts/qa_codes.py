# -*- coding: utf-8 -*-
"""
章节代码 QA 脚本: 编译/运行章节 JSON 中所有 C 与 Python 案例代码。
用法: python scripts/qa_codes.py [章节文件] [--inputs "1-1:30 12;1-4:2 2 1"]
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = os.path.join(ROOT, ".tmp", "qa")
os.makedirs(TMP, exist_ok=True)


def clean_tmp():
    """启动时清理上次测试残留目录"""
    try:
        for name in os.listdir(TMP):
            p = os.path.join(TMP, name)
            if os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True)
    except Exception:
        pass
GCC = "gcc"
PY = sys.executable


def parse_inputs(args):
    """从命令行参数中解析 --inputs "1-1:30 12;1-4:2 2 1" -> {'1-1': '30 12', ...}
    支持用 | 表示输入中的换行: "5-2:6 7|0 1|1 2" -> "6 7\n0 1\n1 2"
    支持 "小节id+语言首字母" 键(如 13-1c / 13-1p)区分 C/Python 的不同输入。
    """
    out = {}
    if "--inputs" in args:
        idx = args.index("--inputs")
        if idx + 1 < len(args):
            for part in args[idx + 1].split(";"):
                part = part.strip()
                if not part:
                    continue
                if ":" in part:
                    k, v = part.split(":", 1)
                    out[k.strip()] = v.strip().replace("|", "\n")
    return out


def make_workdir(base, prefix):
    """用 makedirs 创建唯一工作目录(沙箱环境下 tempfile.mkdtemp 不可用)"""
    for _ in range(200):
        name = os.path.join(base, prefix + os.urandom(4).hex())
        try:
            os.makedirs(name, exist_ok=False)
            return name
        except FileExistsError:
            continue
    raise RuntimeError("无法创建工作目录")


def run(cmd, stdin_text, timeout=30):
    d = make_workdir(TMP, "t_")
    in_p = os.path.join(d, "in.txt")
    out_p = os.path.join(d, "out.txt")
    err_p = os.path.join(d, "err.txt")
    with open(in_p, "w", encoding="utf-8", newline="\n") as f:
        f.write(stdin_text or "")
    t0 = time.time()
    try:
        with open(in_p, "rb") as fi, open(out_p, "wb") as fo, open(err_p, "wb") as fe:
            r = subprocess.run(cmd, stdin=fi, stdout=fo, stderr=fe, timeout=timeout, cwd=d)
        code = r.returncode
    except subprocess.TimeoutExpired:
        return None, "TIMEOUT", ""
    except Exception as e:
        return None, str(e), ""
    out = open(out_p, "rb").read().decode("utf-8", errors="replace") if os.path.exists(out_p) else ""
    err = open(err_p, "rb").read().decode("utf-8", errors="replace") if os.path.exists(err_p) else ""
    return code, out, err


def main():
    clean_tmp()
    args = sys.argv[1:]
    path = args[0] if args else os.path.join(ROOT, "web", "chapters", "ch01.json")
    inputs = parse_inputs(args)
    if not os.path.isabs(path):
        path = os.path.join(ROOT, path)
    data = json.load(open(path, encoding="utf-8"))
    total = passed = 0
    print("QA 章节:", data["id"], data["title"])
    for sec in data["sections"]:
        for cd in sec["codes"]:
            total += 1
            # 输入映射优先匹配 "小节id+语言首字母"(如 13-1c), 其次匹配 "小节id"
            stdin_text = inputs.get(sec["id"] + cd["lang"][0], inputs.get(sec["id"], ""))
            tag = "%s [%s] %s" % (sec["id"], cd["lang"].upper(), cd["name"])
            try:
                if cd["lang"] == "c":
                    d = make_workdir(TMP, "t_")
                    src = os.path.join(d, "main.c")
                    exe = os.path.join(d, "main.exe")
                    with open(src, "w", encoding="utf-8") as f:
                        f.write(cd["code"])
                    code, out, err = run([GCC, src, "-o", exe, "-O2", "-std=c11"], "")
                    if code != 0:
                        print("  FAIL(编译) %s\n%s" % (tag, (err or out)[:500]))
                        continue
                    code, out, err = run([exe], stdin_text)
                else:
                    d = make_workdir(TMP, "t_")
                    src = os.path.join(d, "main.py")
                    with open(src, "w", encoding="utf-8") as f:
                        f.write(cd["code"])
                    env = dict(os.environ, PYTHONIOENCODING="utf-8", PYTHONUTF8="1")
                    code, out, err = run([PY, src], stdin_text)
                    if code is None and out == "TIMEOUT":
                        print("  FAIL(超时) %s" % tag)
                        continue
            except Exception as e:
                print("  FAIL(异常) %s: %s" % (tag, e))
                continue
            if code == 0:
                passed += 1
                first = out.strip().splitlines()
                print("  OK   %s | 输出: %s" % (tag, " / ".join(first[:2])[:110]))
            else:
                print("  FAIL(运行, 退出码 %s) %s\n%s" % (code, tag, (err or out)[:500]))
    print("结果: %d/%d 通过" % (passed, total))
    sys.exit(0 if passed == total else 1)


if __name__ == "__main__":
    main()
