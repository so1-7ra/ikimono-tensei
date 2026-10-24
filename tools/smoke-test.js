// 公開前の動作確認：全部の生き物を1回ずつ遊び、エラー・CSP違反・外部通信がないか調べる
// 使い方：python3 -m http.server 8000 を別の画面で動かしてから node tools/smoke-test.js
const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:8000/";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const problems = [];
  page.on("pageerror", (e) => problems.push("JSエラー: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") problems.push("コンソール: " + m.text()); });
  page.on("request", (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith("data:")) problems.push("外部通信: " + r.url()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(BASE);

  const ids = await page.evaluate(() => C.map((c) => c.id));
  const missing = await page.evaluate(() => C.filter((c) => !EV[c.id] || EV[c.id].length < 15 || !SPR[c.id]).map((c) => c.id));
  if (missing.length) problems.push("データ不足: " + missing.join(", "));
  for (const id of ids) {
    await page.evaluate((id) => { pick = () => C.find((c) => c.id === id); }, id);
    await page.click("#go");
    await page.click("#choice .primary");
    for (let i = 0; i < 20; i++) {
      const bs = await page.$$("#choice .choice button");
      if (!bs.length) break;
      await bs[Math.floor(Math.random() * bs.length)].click();
    }
    await page.waitForSelector("#result:not([hidden])", { timeout: 3000 });
  }
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > 390) problems.push("横にはみ出し: " + sw + "px");
  await page.click("#reset"); await page.click("#reset");
  const left = await page.evaluate(() => localStorage.getItem("ikimono-zukan"));
  if (left) problems.push("図鑑の記録が消えない");
  await page.goto(BASE + "privacy.html");

  console.log(ids.length + "種類を確認しました");
  console.log(problems.length ? problems.join("\n") : "問題は見つかりませんでした");
  await browser.close();
  process.exit(problems.length ? 1 : 0);
})();
