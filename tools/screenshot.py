#!/usr/bin/env python3
"""Render the Chrome Web Store images into store/images/.

  python3 tools/screenshot.py

Outputs:
  screenshot-<locale>.png  1280x800  the popup after a successful Slack lookup (dummy values)
  promo-440x280.png        440x280   small promo tile

The real popup is loaded with the stub `chrome` object from tests/chrome-stub.js, so the
screenshots show the current UI and messages. Needs Google Chrome (or set CHROME=/path/to/chrome).
"""
import html
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT = ROOT / "extension"
STUB = ROOT / "tests" / "chrome-stub.js"
OUT = ROOT / "store" / "images"
CHROME = os.environ.get("CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

NAVY = "#1e3a5f"

TAGLINES = {
    "en": [
        "Log in to mautrix-slack with one paste.",
        "Reads the token and cookie from your own Slack tab and builds the <code>login token</code> command.",
        "Nothing is sent anywhere. Access to slack.com is requested only when you use it.",
    ],
    "ja": [
        "mautrix-slack へのログインを、貼り付け1回で。",
        "自分の Slack タブからトークンと Cookie を読み取り、<code>login token</code> コマンドを組み立てます。",
        "外部には何も送信しません。slack.com へのアクセスは使うときにだけ求めます。",
    ],
}

SHOT = """<!doctype html>
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: 1280px; height: 800px; overflow: hidden; }
  body { font: 16px/1.6 system-ui, -apple-system, "Hiragino Sans", sans-serif; background: #eef1f5; color: #1c2430; }
  .copy { position: absolute; left: 64px; top: 150px; width: 520px; }
  .copy img { width: 72px; height: 72px; }
  .copy h1 { font-size: 34px; line-height: 1.35; margin: 20px 0 18px; color: %(navy)s; }
  .copy p { margin: 0 0 14px; font-size: 18px; color: #3b4656; }
  .copy code { white-space: nowrap; font-size: 16px; background: #dde3ea; padding: 1px 6px; border-radius: 4px; }
  .browser { position: absolute; left: 640px; top: 30px; width: 600px; height: 740px; background: #fff;
             border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,.15); overflow: hidden; }
  .bar { height: 44px; background: #f2f3f5; border-bottom: 1px solid #dcdfe4; display: flex; align-items: center; gap: 10px; padding: 0 14px; }
  .url { flex: 1; background: #fff; border: 1px solid #dcdfe4; border-radius: 16px; padding: 4px 14px; font-size: 13px; color: #555; }
  .bar img { width: 20px; height: 20px; }
  .page { position: absolute; top: 45px; left: 0; right: 0; bottom: 0; background: #4a154b0d; }
  iframe { position: absolute; top: 52px; right: 10px; width: 468px; height: 680px; border: 0; background: #fff;
           border-radius: 8px; box-shadow: 0 6px 24px rgba(0,0,0,.22); }
</style>
<div class="copy">
  <img src="icons/icon-128.png">
  <h1>%(h1)s</h1>
  %(paras)s
</div>
<div class="browser">
  <div class="bar"><div class="url">app.slack.com/client/T0000000000</div><img src="icons/icon-32.png"></div>
  <div class="page"></div>
  <iframe src="popup-stub.html"></iframe>
</div>
"""

PROMO = """<!doctype html>
<meta charset="utf-8">
<style>
  html, body { margin: 0; width: 440px; height: 280px; overflow: hidden; }
  body { background: %(navy)s; color: #fff; font: 15px/1.5 system-ui, -apple-system, sans-serif;
         display: flex; align-items: center; gap: 22px; padding: 0 34px; box-sizing: border-box; }
  img { width: 96px; height: 96px; border-radius: 20px; box-shadow: 0 0 0 2px rgba(255,255,255,.35); }
  b { display: block; font-size: 22px; line-height: 1.3; margin-bottom: 6px; }
  span { color: #c9d6e6; }
</style>
<img src="icons/icon-128.png">
<div><b>Login Helper for mautrix bridges</b><span>Token &amp; cookie login for <span style="white-space:nowrap">mautrix-slack</span></span></div>
"""


def shoot(page: Path, out: Path, w: int, h: int) -> None:
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
         f"--window-size={w},{h}", "--virtual-time-budget=3000", f"--screenshot={out}", page.as_uri()],
        check=True, capture_output=True,
    )
    print("wrote", out.relative_to(ROOT))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for locale, lines in TAGLINES.items():
            d = Path(tmp) / locale
            shutil.copytree(EXT, d)
            messages = (EXT / "_locales" / locale / "messages.json").read_text()
            popup = (d / "popup.html").read_text().replace(
                '<script src="mask.js">', '<script src="stub.js"></script>\n<script src="mask.js">', 1)
            (d / "popup-stub.html").write_text(popup)
            (d / "stub.js").write_text(f"const MESSAGES = {messages};\n" + STUB.read_text())
            (d / "shot.html").write_text(SHOT % {
                "navy": NAVY,
                "h1": html.escape(lines[0]),
                "paras": "\n  ".join(f"<p>{p}</p>" for p in lines[1:]),
            })
            shoot(d / "shot.html", OUT / f"screenshot-{locale}.png", 1280, 800)
        d = Path(tmp) / "en"
        (d / "promo.html").write_text(PROMO % {"navy": NAVY})
        shoot(d / "promo.html", OUT / "promo-440x280.png", 440, 280)


if __name__ == "__main__":
    main()
