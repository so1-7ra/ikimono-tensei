// シェア用画像 assets/og.png（1200×630）を作る
// 使い方：python3 -m http.server 8000 を動かしてから node tools/make_og.js
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto((process.env.BASE || "http://localhost:8000/") + "tools/og.html");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: "assets/og.png" });
  await browser.close();
})();
