# -*- coding: utf-8 -*-
"""
《算法设计与分析学习平台》本地服务器
====================================
运行方式:  python server.py           (或双击「启动学习平台.exe」)
依赖:      仅 Python 标准库;  C 代码执行需要 gcc / tcc / clang(自动探测;
            也支持把 tcc.exe 放入本目录 tools\\ 文件夹, 将优先使用)
接口:
  GET  /api/health        健康检查(返回 Python 版本与可用 C 编译器)
  POST /api/run           {lang: "c"|"python", code, stdin} -> 运行结果 JSON
其余路径: 静态托管 web\\ 目录下的前端资源。
"""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

APP_NAME = "算法设计与分析学习平台"
ROOT = os.path.dirname(os.path.abspath(__file__))
WEB_DIR = os.path.join(ROOT, "web")
TOOLS_DIR = os.path.join(ROOT, "tools")
TMP_DIR = os.path.join(ROOT, ".tmp")
os.makedirs(TMP_DIR, exist_ok=True)

DEFAULT_PORT = 8765
MAX_CODE_BYTES = 300 * 1024      # 单次提交代码大小上限
RUN_TIMEOUT = 15                 # 运行超时(秒)
COMPILE_TIMEOUT = 25             # 编译超时(秒)

# 常见 MinGW / TCC 安装路径(兜底搜索)
EXTRA_COMPILER_PATHS = [
    r"C:\MinGW\bin",
    r"C:\msys64\mingw64\bin",
    r"C:\msys64\ucrt64\bin",
    r"C:\TDM-GCC-64\bin",
    r"C:\Program Files\mingw-w64\x86_64-8.1.0-posix-seamless-rt_v6-rev0\mingw64\bin",
]


def _which(name):
    p = shutil.which(name)
    if p:
        return p
    for d in EXTRA_COMPILER_PATHS:
        cand = os.path.join(d, name + ".exe")
        if os.path.isfile(cand):
            return cand
    return None


def detect_compilers():
    """返回可用 C 编译器标签列表, 例如 ["gcc"]"""
    found = []
    tests = []
    bundled = os.path.join(TOOLS_DIR, "tcc.exe")
    if os.path.isfile(bundled):
        tests.append(("tcc(bundled)", bundled, ["-v"]))
    for name in ("tcc", "gcc", "clang"):
        p = _which(name)
        if p:
            tests.append((name, p, ["-v"] if name == "tcc" else ["--version"]))
    for label, p, args in tests:
        try:
            r = subprocess.run([p] + args,
                               stdout=subprocess.DEVNULL,
                               stderr=subprocess.DEVNULL,
                               timeout=8)
            if r.returncode == 0:
                found.append(label)
        except Exception:
            pass
    return found


def _pick_c_compiler():
    """返回 (可执行文件路径, 类型); 找不到返回 None"""
    bundled = os.path.join(TOOLS_DIR, "tcc.exe")
    if os.path.isfile(bundled):
        return (bundled, "tcc")
    for name in ("tcc", "gcc", "clang"):
        p = _which(name)
        if p:
            return (p, name)
    return None


def _spawn(cmd, work, stdin_text, timeout):
    """
    以「文件重定向」方式运行子进程(不依赖管道), 返回
    (returncode, stdout文本, stderr文本, 错误信息, 耗时毫秒)
    """
    in_path = os.path.join(work, "stdin.txt")
    out_path = os.path.join(work, "stdout.txt")
    err_path = os.path.join(work, "stderr.txt")
    with open(in_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(stdin_text or "")
    t0 = time.time()
    try:
        with open(in_path, "rb") as fi, open(out_path, "wb") as fo, open(err_path, "wb") as fe:
            r = subprocess.run(cmd, stdin=fi, stdout=fo, stderr=fe,
                               timeout=timeout, cwd=work)
        code = r.returncode
    except subprocess.TimeoutExpired:
        return None, "", "", "运行超时(超过 %d 秒), 请检查代码是否存在死循环" % timeout, 0
    except Exception as e:
        return None, "", "", "执行失败: %s" % e, 0
    elapsed = int((time.time() - t0) * 1000)

    def rd(p):
        try:
            with open(p, "rb") as f:
                return f.read().decode("utf-8", errors="replace")
        except Exception:
            return ""
    return code, rd(out_path), rd(err_path), None, elapsed


def _run_python(work, code, stdin_text):
    with open(os.path.join(work, "main.py"), "w", encoding="utf-8") as f:
        f.write(code)
    env = dict(os.environ)
    env["PYTHONIOENCODING"] = "utf-8"
    env["PYTHONUTF8"] = "1"
    code_, out, err, msg, ms = _spawn([sys.executable, "main.py"], work,
                                      stdin_text, RUN_TIMEOUT)
    if msg:
        return {"ok": False, "error": msg}
    if code_ != 0 and not out and not err:
        err = "(程序异常退出, 退出码 %d)" % code_
    return {"ok": code_ == 0, "stdout": out, "stderr": err,
            "returncode": code_, "time_ms": ms}


def _run_c(work, code, stdin_text):
    cc = _pick_c_compiler()
    if not cc:
        return {"ok": False,
                "error": "未检测到可用的 C 编译器。\n\n"
                         "请任选其一后重启本平台:\n"
                         "1) 安装 MinGW-w64(gcc) 并加入 PATH;\n"
                         "2) 将 TinyCC 的 tcc.exe 放入平台的 tools 目录;\n"
                         "3) 安装 LLVM(clang) 并加入 PATH。\n"
                         "详见 README.md 中的说明。"}
    path, kind = cc
    src = os.path.join(work, "main.c")
    exe = os.path.join(work, "main.exe")
    with open(src, "w", encoding="utf-8") as f:
        f.write(code)
    if kind == "tcc":
        cmd = [path, src, "-o", exe]
    else:
        cmd = [path, src, "-o", exe, "-O2", "-std=c11"]
    ccode, cout, cerr, cmsg, _ = _spawn(cmd, work, "", COMPILE_TIMEOUT)
    if cmsg:
        return {"ok": False, "error": "编译失败: " + cmsg}
    if ccode != 0:
        return {"ok": False,
                "error": "编译失败(退出码 %d):\n%s" % (ccode, (cerr or cout))}
    rcode, out, err, rmsg, ms = _spawn([exe], work, stdin_text, RUN_TIMEOUT)
    if rmsg:
        return {"ok": False, "error": rmsg}
    return {"ok": rcode == 0, "stdout": out, "stderr": err,
            "returncode": rcode, "time_ms": ms, "compiler": kind}


def _make_workdir(prefix):
    """用 makedirs 创建唯一工作目录(兼容受限沙箱环境)"""
    for _ in range(200):
        name = os.path.join(TMP_DIR, prefix + os.urandom(4).hex())
        try:
            os.makedirs(name, exist_ok=False)
            return name
        except FileExistsError:
            continue
    raise RuntimeError("无法创建工作目录")


def run_code(lang, code, stdin_text):
    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        return {"ok": False, "error": "代码过长(上限 %d KB)" % (MAX_CODE_BYTES // 1024)}
    work = _make_workdir("run_")
    try:
        if lang == "python":
            return _run_python(work, code, stdin_text)
        if lang == "c":
            return _run_c(work, code, stdin_text)
        return {"ok": False, "error": "不支持的语言: %s" % lang}
    finally:
        shutil.rmtree(work, ignore_errors=True)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=WEB_DIR, **kw)

    def log_message(self, fmt, *args):  # 保持控制台安静
        pass

    def guess_type(self, path):
        ctype = super().guess_type(path)
        if ctype.startswith("text/"):
            ctype = ctype.split(";")[0] + "; charset=utf-8"
        return ctype

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/health":
            self._send_json({
                "ok": True,
                "app": APP_NAME,
                "python": sys.version.split()[0],
                "compilers": detect_compilers(),
                "time": time.strftime("%Y-%m-%d %H:%M:%S"),
            })
            return
        super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/api/run":
            self._send_json({"ok": False, "error": "未知接口"}, 404)
            return
        try:
            n = int(self.headers.get("Content-Length") or 0)
            req = json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception as e:
            self._send_json({"ok": False, "error": "请求解析失败: %s" % e}, 400)
            return
        lang = str(req.get("lang", "")).lower()
        code = req.get("code", "")
        stdin_text = req.get("stdin", "")
        if lang not in ("c", "python") or not isinstance(code, str) or not code.strip():
            self._send_json({"ok": False, "error": "参数错误: lang 须为 c 或 python, 且 code 不能为空"}, 400)
            return
        try:
            result = run_code(lang, code, stdin_text)
        except Exception as e:
            result = {"ok": False, "error": "服务器内部错误: %s" % e}
        self._send_json(result)


def find_free_port(start):
    for port in range(start, start + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return None


def main():
    # 控制台编码容错: 避免在非 UTF-8/GBK 终端打印中文 banner 时崩溃
    try:
        sys.stdout.reconfigure(errors="replace")
        sys.stderr.reconfigure(errors="replace")
    except Exception:
        pass
    # 启动时清理上次运行遗留的临时工作目录
    try:
        for name in os.listdir(TMP_DIR):
            p = os.path.join(TMP_DIR, name)
            if os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True)
    except Exception:
        pass
    args = sys.argv[1:]
    no_browser = "--no-browser" in args
    port_arg = next((a for a in args if a.isdigit()), None)
    port = find_free_port(int(port_arg) if port_arg else DEFAULT_PORT)
    if port is None:
        print("错误: 端口被占用, 请稍后重试")
        sys.exit(1)
    compilers = detect_compilers()
    url = "http://127.0.0.1:%d/" % port
    banner = (
        "=" * 64 + "\n"
        "  %s\n" % APP_NAME +
        "  访问地址: %s\n" % url +
        "  Python 版本: %s    可用 C 编译器: %s\n"
        % (sys.version.split()[0], ", ".join(compilers) if compilers else "未检测到") +
        "  按 Ctrl+C 停止服务器\n" +
        "=" * 64
    )
    print(banner, flush=True)
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    if not no_browser:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。")


if __name__ == "__main__":
    main()
