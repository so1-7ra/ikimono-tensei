# いきもの転生

ボタンを押すと、いろいろな生き物に生まれ変わって一生を体験できるシミュレーションです。

公開ページ: https://so1-7ra.github.io/ikimono-tensei/

## ファイルの構成

| ファイル | 中身 |
| --- | --- |
| `index.html` | ページの骨組み |
| `privacy.html` | プライバシーポリシー・免責事項 |
| `assets/style.css` | 見た目 |
| `assets/data.js` | 生き物のデータ（`TIERS` 出現率、`C` 生き物、`EV` 分かれ道、`SPR` ドット絵） |
| `assets/app.js` | 抽選・分かれ道・結果・図鑑の処理 |
| `assets/fonts.css`, `assets/fonts/` | サイト内に置いたフォント（自動生成） |
| `tools/build_fonts.py` | フォントを作り直すスクリプト |
| `tools/smoke-test.js` | 公開前の動作確認 |
| `sitemap.xml` | Google Search Console に登録するページの一覧 |
| `assets/og.png` | Xなどでシェアしたときに出る画像（`tools/make_og.js` で作る） |

サーバー側の処理やデータベースはありません。ブラウザだけで動きます。

## 安全とプライバシーの方針

- 個人情報は集めません。保存するのは、図鑑で出会った生き物のIDだけです（ブラウザの localStorage、端末の中だけ）。
- 外部サービスと通信しません。フォントもサイト内に置いています。
- `Content-Security-Policy` で、このサイト自身のファイル以外は読みこめないようにしています。
- 画面に出す文章は `esc()` でエスケープしています。入力欄はありません。
- 外部リンクには `rel="noopener noreferrer"` を付けます。

## 生き物を追加するには

1. `assets/data.js` の `C` に1件追加する（`id` は英小文字）。
2. 同じ `id` で `EV` に分かれ道を15個、`SPR` にドット絵（16×16）を追加する。
3. 新しい文字を使ったので `python3 tools/build_fonts.py` でフォントを作り直す。
4. 動作確認をする（下記）。

## 動作確認

```sh
python3 -m http.server 8000      # 別の画面で動かしておく
node tools/smoke-test.js          # Playwright が必要
```

全部の生き物を1回ずつ遊び、エラー・CSP違反・外部通信・横はみ出しがないかを調べます。

## ライセンス

フォントは SIL Open Font License 1.1 です（`assets/fonts/LICENSE.md`）。
