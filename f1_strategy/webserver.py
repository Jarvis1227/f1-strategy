"""One-process local launcher; React assets are built once in web/dist."""
import argparse
from pathlib import Path
import threading
import time
import urllib.request
import webbrowser


def open_when_ready(url):
    for _ in range(40):
        try:
            with urllib.request.urlopen(url + "/api/health", timeout=1) as response:
                if response.status == 200:
                    webbrowser.open(url)
                    return
        except OSError:
            time.sleep(0.25)


def main():
    parser = argparse.ArgumentParser(description="Play F1 Strategy in your local browser")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--open", action="store_true", help="Open your browser once ready")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("Port must be between 1 and 65535")
    root = Path(__file__).resolve().parent.parent
    if not (root / "web" / "dist" / "index.html").is_file():
        parser.exit(1, "UI assets missing. In web/, run npm.cmd install then npm.cmd run build.\n")
    try:
        import uvicorn
    except ImportError:
        parser.exit(1, 'Web dependencies missing. Run: .venv\\Scripts\\python.exe -m pip install -e ".[web]"\n')
    url = f"http://127.0.0.1:{args.port}"
    print(f"F1 Strategy: {url}\nKeep this terminal open. Press Ctrl+C to stop.", flush=True)
    if args.open:
        threading.Thread(target=open_when_ready, args=(url,), daemon=True).start()
    uvicorn.run("f1_strategy.api:app", host="127.0.0.1", port=args.port, workers=1)


if __name__ == "__main__":
    main()
