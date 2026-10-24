#!/usr/bin/env python3
"""サイトで使っている文字だけを含むフォントを作り、assets/fonts/ に保存する。

文章や生き物を追加したら、もう一度実行してください：
    python3 tools/build_fonts.py

Google Fonts から必要な文字だけを取り寄せてサイト内に置くので、
公開後のページは Google を含む外部サービスと通信しません。
フォントはすべて SIL Open Font License です（assets/fonts/LICENSE.md）。
"""
import pathlib
import re
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "fonts"
SOURCES = ["index.html", "privacy.html", "assets/data.js", "assets/app.js", "tools/og.html"]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
CHUNK = 150  # 1回のリクエストで送る文字数

# (保存名, Google Fonts の family 指定, 使う文字の範囲)
FONTS = [
    ("dela", "Dela+Gothic+One", "all"),
    ("zenkaku-400", "Zen+Kaku+Gothic+New:wght@400", "all"),
    ("zenkaku-700", "Zen+Kaku+Gothic+New:wght@700", "all"),
    ("jbmono-500", "JetBrains+Mono:wght@500", "latin"),
    ("jbmono-400i", "JetBrains+Mono:ital,wght@1,400", "latin"),
]


def used_chars():
    text = "".join((ROOT / p).read_text(encoding="utf-8") for p in SOURCES)
    text += "".join(chr(c) for c in range(0x20, 0x7F))  # 英数字は全部入れておく
    return sorted({ch for ch in text if ch.isprintable() and ch != " "} | {" "})


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.woff2"):
        old.unlink()
    chars = used_chars()
    css_out = ["/* tools/build_fonts.py が自動で作るファイルです。手で編集しないでください。 */\n"]
    for name, family, scope in FONTS:
        cs = [c for c in chars if scope == "all" or ord(c) < 0x250]
        for n in range(0, len(cs), CHUNK):
            part = "".join(cs[n:n + CHUNK])
            q = "https://fonts.googleapis.com/css2?family=%s&display=swap&text=%s" % (family, urllib.parse.quote(part))
            css = fetch(q).decode("utf-8")
            for i, block in enumerate(re.findall(r"@font-face\s*{[^}]*}", css)):
                src = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", block).group(1)
                fname = "%s-%02d-%d.woff2" % (name, n // CHUNK, i)
                (OUT / fname).write_bytes(fetch(src))
                css_out.append(block.replace(src, "fonts/" + fname) + "\n")
        print(name, len(cs), "文字")
    (ROOT / "assets" / "fonts.css").write_text("".join(css_out), encoding="utf-8")


if __name__ == "__main__":
    main()
