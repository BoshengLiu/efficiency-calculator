"""
自动化价值展示中心 - 本地开发服务器
=====================================
使用方法：
    python server.py

依赖安装（热重载功能需要）：
    pip install watchdog

访问地址：http://localhost:8000
按 Ctrl+C 停止服务器

功能说明：
  - 静态文件服务（http.server）
  - 目录遍历攻击防护
  - 安全 HTTP 响应头
  - 禁止访问敏感文件/目录
  - 文件变更热重载提示（需安装 watchdog）
  - 统计 API：POST /api/track（埋点）、GET /api/stats（聚合）
"""

import http.server
import json
import os
import posixpath
import urllib.parse
import webbrowser
from datetime import datetime
from pathlib import Path

# ── 配置 ──────────────────────────────────────────────────────
HOST = "localhost"
PORT = 8000
ROOT_DIR = Path(__file__).parent.resolve()

# 禁止通过 HTTP 访问的路径（相对于项目根目录）
FORBIDDEN_PATHS = {
    "server.py",
    ".git",
    ".env",
    ".cursor",
    "__pycache__",
    "node_modules",
}

# 监听文件变更的扩展名（热重载提示）
WATCH_EXTENSIONS = {".html", ".css", ".js", ".json"}

# 统计事件存储（JSONL）
DATA_DIR = ROOT_DIR / "data"
EVENTS_FILE = DATA_DIR / "events.jsonl"
ALLOWED_EVENTS = {"page_view", "calculator_use", "consult_click"}


# ── 安全请求处理器 ────────────────────────────────────────────
class SecureRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    在 SimpleHTTPRequestHandler 基础上增加：
      1. translate_path：防止目录遍历攻击，强制限定在项目根目录内
      2. end_headers：注入安全 HTTP 响应头
      3. 禁止访问 FORBIDDEN_PATHS 中定义的敏感文件/目录
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    # ── 防目录遍历 ──────────────────────────────────────────
    def translate_path(self, path):
        """
        重写路径解析，确保请求路径始终在 ROOT_DIR 内部。
        防止形如 /../../../etc/passwd 的目录遍历攻击。
        """
        # 去除查询字符串和 fragment
        path = path.split("?", 1)[0].split("#", 1)[0]
        # URL 解码
        path = urllib.parse.unquote(path, errors="surrogatepass")
        # 规范化路径分隔符
        path = posixpath.normpath(path)
        # 拼接到根目录
        resolved = (ROOT_DIR / path.lstrip("/")).resolve()

        # 检查是否在根目录之内（防止跳出）
        try:
            resolved.relative_to(ROOT_DIR)
        except ValueError:
            # 路径在根目录之外，返回根目录本身（不泄露信息）
            return str(ROOT_DIR)

        return str(resolved)

    # ── API：GET /api/stats ───────────────────────────────────
    def _send_stats(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        from_param = query.get("from", [""])[0]
        to_param = query.get("to", [""])[0]
        event_filter = query.get("event", [""])[0]
        tool_filter = query.get("tool_id", [""])[0]
        limit = min(int(query.get("limit", ["50"])[0] or "50"), 500)

        if not EVENTS_FILE.exists():
            payload = {"by_day": {}, "by_tool": {}, "by_event": {}, "recent_consult": []}
            self._send_json(200, payload)
            return

        by_day = {}
        by_tool = {}
        by_event = {}
        recent_consult = []

        with open(EVENTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    continue
                ts = rec.get("ts", "")
                ev = rec.get("event", "")
                tool_id = rec.get("tool_id", "")
                if event_filter and ev != event_filter:
                    continue
                if tool_filter and tool_id != tool_filter:
                    continue
                try:
                    day = ts[:10] if len(ts) >= 10 else ""
                except Exception:
                    day = ""
                if from_param and day < from_param:
                    continue
                if to_param and day > to_param:
                    continue

                if day:
                    if day not in by_day:
                        by_day[day] = {"page_view": 0, "calculator_use": 0, "consult_click": 0}
                    if ev in by_day[day]:
                        by_day[day][ev] = by_day[day][ev] + 1
                by_event[ev] = by_event.get(ev, 0) + 1
                if tool_id:
                    by_tool[tool_id] = by_tool.get(tool_id, 0) + 1

                if ev == "consult_click":
                    recent_consult.append(
                        {"ts": ts, "source": rec.get("source"), "last_tools": rec.get("last_tools")}
                    )

        recent_consult = list(reversed(recent_consult))[:limit]
        payload = {
            "by_day": dict(sorted(by_day.items())),
            "by_tool": by_tool,
            "by_event": by_event,
            "recent_consult": recent_consult,
        }
        self._send_json(200, payload)

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    # ── API：POST /api/track ──────────────────────────────────
    def _receive_track(self, body_bytes):
        try:
            data = json.loads(body_bytes.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self._send_json(400, {"error": "Invalid JSON"})
            return
        ev = data.get("event")
        if ev not in ALLOWED_EVENTS:
            self._send_json(400, {"error": "Invalid event"})
            return
        if not data.get("ts"):
            self._send_json(400, {"error": "Missing ts"})
            return

        record = {
            "event": ev,
            "ts": data.get("ts"),
            "path": data.get("path"),
            "tool_id": data.get("tool_id"),
            "source": data.get("source"),
            "last_tools": data.get("last_tools"),
            "result_summary": data.get("result_summary"),
        }
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(EVENTS_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
        self.send_response(204)
        self.send_header("Content-Length", 0)
        self.end_headers()

    # ── 禁止访问敏感路径 ────────────────────────────────────
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path_only = parsed.path.rstrip("/") or "/"
        if path_only == "/api/stats":
            self._send_stats()
            return

        url_path = urllib.parse.unquote(self.path.split("?")[0].lstrip("/"))
        top_level = url_path.split("/")[0] if url_path else ""

        if top_level in FORBIDDEN_PATHS:
            self.send_error(403, "Access Forbidden")
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path_only = parsed.path.rstrip("/") or "/"
        if path_only == "/api/track":
            content_type = self.headers.get("Content-Type", "")
            if "application/json" not in content_type:
                self._send_json(400, {"error": "Content-Type must be application/json"})
                return
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b""
            self._receive_track(body)
            return
        self.send_error(404, "Not Found")

    # ── 安全响应头 ──────────────────────────────────────────
    def end_headers(self):
        """
        为所有响应注入安全 HTTP 头，加固浏览器安全策略。
        """
        # 禁止 MIME 类型嗅探
        self.send_header("X-Content-Type-Options", "nosniff")
        # 禁止在 iframe 中嵌套（防点击劫持）
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        # XSS 过滤（旧版浏览器兼容）
        self.send_header("X-XSS-Protection", "1; mode=block")
        # 内容安全策略：仅允许同源脚本/样式，外部 CDN 脚本白名单
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline'; "
            "font-src 'self' data:; "
            "img-src 'self' data:; "
            "connect-src 'self';",
        )
        # 禁止发送 Referer 到外部站点
        self.send_header("Referrer-Policy", "same-origin")
        super().end_headers()

    # ── 简化日志输出 ────────────────────────────────────────
    def log_message(self, format, *args):
        status = args[1] if len(args) > 1 else "-"
        # 用颜色区分状态码
        color = "\033[32m" if str(status).startswith("2") else (
            "\033[33m" if str(status).startswith("3") else "\033[31m"
        )
        reset = "\033[0m"
        print(f"  {color}{status}{reset}  {self.path}")


# ── 热重载文件监听（watchdog） ─────────────────────────────────
def start_file_watcher():
    """
    使用 watchdog 监听文件变更，变更时打印提示。
    若未安装 watchdog，跳过此功能，不影响服务器正常运行。
    """
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler

        class ChangeHandler(FileSystemEventHandler):
            def on_modified(self, event):
                if event.is_directory:
                    return
                ext = Path(event.src_path).suffix.lower()
                if ext in WATCH_EXTENSIONS:
                    rel = Path(event.src_path).relative_to(ROOT_DIR)
                    print(f"  \033[36m[热重载]\033[0m 文件已变更: {rel}")
                    print("         请在浏览器中手动刷新，或安装 Live Reload 插件实现自动刷新。")

        observer = Observer()
        observer.schedule(ChangeHandler(), str(ROOT_DIR), recursive=True)
        observer.daemon = True
        observer.start()
        print("  \033[36m[热重载]\033[0m watchdog 已启动，监听文件变更中...")
        return observer
    except ImportError:
        print("  [提示] 未安装 watchdog，热重载功能不可用。")
        print("         安装方法：pip install watchdog")
        return None


# ── 主入口 ────────────────────────────────────────────────────
if __name__ == "__main__":
    os.chdir(ROOT_DIR)

    url = f"http://{HOST}:{PORT}"
    print(f"\n{'='*48}")
    print(f"  ⚡ 自动化价值展示中心 - 本地开发服务器")
    print(f"{'='*48}")
    print(f"  地址  : {url}")
    print(f"  目录  : {ROOT_DIR}")
    print(f"  按 Ctrl+C 停止")
    print(f"{'='*48}")

    observer = start_file_watcher()
    print()

    server = http.server.HTTPServer((HOST, PORT), SecureRequestHandler)
    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n  服务器已停止。")
        if observer:
            observer.stop()
            observer.join()
