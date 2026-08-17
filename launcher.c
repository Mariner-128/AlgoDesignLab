/* ============================================================
 * AlgoLab Launcher
 * 双击启动《算法设计与分析学习平台》:
 *   1) 切换工作目录到本 exe 所在目录
 *   2) 自动寻找 python / py -3
 *   3) 启动 server.py(服务器会自动打开浏览器)
 * 编译:  gcc -O2 -o "启动学习平台.exe" launcher.c
 * ============================================================ */
#include <windows.h>
#include <stdio.h>
#include <string.h>

static int command_ok(const char *cmd) {
    char buf[512];
    snprintf(buf, sizeof buf, "%s >nul 2>nul", cmd);
    return system(buf) == 0;
}

int main(void) {
    /* 1) 切换到 exe 所在目录 */
    char dir[MAX_PATH];
    DWORD n = GetModuleFileNameA(NULL, dir, MAX_PATH);
    if (n > 0) {
        char *slash = strrchr(dir, '\\');
        if (slash) *slash = '\0';
        SetCurrentDirectoryA(dir);
    }

    /* 2) 检查 python 是否可用 */
    int has_python = command_ok("python --version");
    if (!has_python) has_python = command_ok("py -3 --version");

    if (!has_python) {
        MessageBoxA(NULL,
            "Python was not found on this computer.\n\n"
            "Please install Python 3.8 or later from:\n"
            "https://www.python.org/downloads/\n\n"
            "During install, check the option:\n"
            "\"Add Python to PATH\".",
            "AlgoLab - Error", MB_ICONERROR | MB_OK);
        return 1;
    }

    /* 3) 启动服务器(继承当前控制台窗口, 按 Ctrl+C 可停止) */
    system("python server.py");
    return 0;
}
