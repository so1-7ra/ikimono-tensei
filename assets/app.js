// いきもの転生：画面の処理
"use strict";


const SITE_URL = "https://so1-7ra.github.io/ikimono-tensei/"; // 公開後にサイトのURLを入れると、シェア文に付きます
const SPR_CACHE = {};
function sprURL(id) {
  if (SPR_CACHE[id]) return SPR_CACHE[id];
  const s = SPR[id], cv = document.createElement("canvas");
  cv.width = cv.height = 16;
  const g = cv.getContext("2d");
  const w = Math.max(...s.px.map((r) => r.length));
  const ox = Math.floor((16 - w) / 2), oy = Math.floor((16 - s.px.length) / 2);
  s.px.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === "." || !s.pal[ch]) return;
    g.fillStyle = s.pal[ch]; g.fillRect(ox + x, oy + y, 1, 1);
  }));
  return (SPR_CACHE[id] = cv.toDataURL());
}
function spr(c, size) {
  return '<img class="px" src="' + sprURL(c.id) + '" width="' + size + '" height="' + size + '" alt="">';
}

const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const ZKEY = "ikimono-zukan";
let zukan = new Set();
try { zukan = new Set(JSON.parse(localStorage.getItem(ZKEY) || "[]")); } catch (e) {}
let cur = null, rec = null;

function pick() {
  let r = Math.random() * 100, tier = "common";
  for (const [k, t] of Object.entries(TIERS)) { if ((r -= t.w) < 0) { tier = k; break; } }
  const list = C.filter((c) => c.tier === tier);
  return list[Math.floor(Math.random() * list.length)];
}
function fmtDays(d) {
  d = Math.max(1, Math.round(d));
  if (d < 365) return d.toLocaleString() + "日";
  const y = Math.floor(d / 365);
  return d.toLocaleString() + "日（約" + y + "年）";
}
function el(tag, cls, html) { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function addLog(stage, text, days, dead) {
  const li = el("li", dead ? "dead" : "");
  li.innerHTML = '<span class="stage">' + esc(stage) + '</span>' + (days != null ? '<span class="age">' + fmtDays(days) + '目</span>' : "") + "<p>" + esc(text) + "</p>";
  $("log").appendChild(li);
  li.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function renderReveal(c, shuffling) {
  const t = TIERS[c.tier];
  $("reveal").classList.toggle("secret", !shuffling && c.tier === "secret");
  $("reveal").innerHTML =
    '<span class="tier t-' + c.tier + '">' + t.label + "</span>" +
    '<div class="portrait" aria-hidden="true">' + spr(c, 112) + "</div>" +
    "<div><p class=\"eyebrow\">あなたが生まれ変わったのは</p><h2 class=\"cname\">" + esc(shuffling ? "……" : c.name) + "</h2>" +
    '<p class="sci">' + (shuffling ? "&nbsp;" : esc(c.sci)) + "</p></div>" +
    (shuffling ? "" : '<dl class="facts"><dt>地球上の数</dt><dd>' + esc(c.pop) + "</dd><dt>寿命の目安</dt><dd>" + esc(c.lifeText) + "</dd></dl>");
}

function start() {
  $("result").hidden = true; $("play").hidden = false;
  $("log").innerHTML = ""; $("choice").innerHTML = "";
  $("go").disabled = true;
  const final = pick();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const done = () => {
    $("play").classList.remove("shuffle");
    renderReveal(final, false);
    cur = final; rec = { days: 0, kids: 0, cause: null, phase: 0 };
    zukan.add(final.id);
    try { localStorage.setItem(ZKEY, JSON.stringify([...zukan])); } catch (e) {}
    renderZukan();
    const b = el("button", "primary", "一生をはじめる"); b.type = "button";
    b.onclick = () => { $("choice").innerHTML = ""; beginLife(); };
    $("choice").appendChild(b);
    $("go").disabled = false;
  };
  $("play").scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  if (reduce) return done();
  $("play").classList.add("shuffle");
  let n = 0;
  const iv = setInterval(() => {
    const pool = C.filter((c) => c.tier !== "secret");
    renderReveal(pool[Math.floor(Math.random() * pool.length)], true);
    if (++n > 14) { clearInterval(iv); done(); }
  }, 80);
}

function beginLife() {
  rec.alive = 0;
  addLog("誕生", cur.birth, 1);
  askEvent(0);
}

const ADULT_AT = 4;
function stageOf(i) { return i < ADULT_AT ? "こども時代" : i < 11 ? "おとな時代" : "晩年"; }

function askEvent(i) {
  const evs = EV[cur.id];
  if (i >= evs.length) return finish(cur.life * rand(0.9, 1.08), null, cur.end);
  if (i === ADULT_AT) { addLog("おとなになる", cur.adult, cur.life * (ADULT_AT / 16) * rand(0.95, 1.05)); rec.adult = true; }
  const [situation, ...opts] = evs[i];
  const at = cur.life * ((i + 1) / 16) * rand(0.92, 1.04);
  const box = el("div", "choice");
  box.appendChild(el("span", "progress", "分かれ道 " + (i + 1) + " / " + evs.length));
  box.appendChild(el("p", "", esc(situation)));
  opts.forEach(([label, p, ok, ng, cause]) => {
    const b = el("button", "", esc(label)); b.type = "button";
    b.onclick = () => {
      $("choice").innerHTML = "";
      if (Math.random() < p) {
        addLog(stageOf(i), situation + " → " + label + "。" + ok, at);
        rec.alive = i + 1;
        askEvent(i + 1);
      } else {
        addLog(stageOf(i), situation + " → " + label + "。" + ng, at, true);
        finish(at, cause, null);
      }
    };
    box.appendChild(b);
  });
  $("choice").appendChild(box);
  box.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function finish(days, cause, endText) {
  if (endText) addLog("最期", endText, days, true);
  const n = EV[cur.id].length;
  rec.days = Math.max(1, Math.round(days));
  rec.cause = cause || "寿命";
  const share = rec.adult ? Math.max(0.1, (rec.alive - ADULT_AT + 1) / (n - ADULT_AT + 1)) : 0;
  const k = cur.kids;
  rec.kidsText = cur.kidsFixed ? (rec.adult ? cur.kidsFixed : "なし")
    : share && k ? Math.max(k[0] ? 1 : 0, Math.round(rand(k[0], k[1] + 0.99) * share)).toLocaleString() + cur.unit : "0" + (cur.unit || "");
  const score = Math.min(1, rec.days / cur.life) * 70 + (rec.adult ? 30 : 0);
  rec.rank = score >= 92 ? "S" : score >= 70 ? "A" : score >= 40 ? "B" : "C";
  rec.title = { S: "天寿をまっとう", A: "たくましく生きた", B: "波乱の一生", C: "はかない一生" }[rec.rank];
  rec.passed = rec.alive + "/" + n;
  renderResult();
}

function shareText() {
  return "いきもの転生で【" + cur.name + "】（" + TIERS[cur.tier].label + "）に生まれ変わった！\n" +
    fmtDays(rec.days) + "を生きて、最期は「" + rec.cause + "」。分かれ道 " + rec.passed + "。ランク" + rec.rank + "：" + rec.title + "\n#いきもの転生" + (SITE_URL ? "\n" + SITE_URL : "");
}

function renderResult() {
  const no = String(Math.floor(rand(1, 10000))).padStart(4, "0");
  $("label").innerHTML =
    '<div class="label-head"><span>転生記録 No.' + no + '</span><span class="t-' + cur.tier + '">' + TIERS[cur.tier].label + "</span></div>" +
    '<div class="label-name"><span class="portrait" aria-hidden="true">' + spr(cur, 72) + '</span><div><h3 class="cname">' + esc(cur.name) + '</h3><p class="sci">' + esc(cur.sci) + "</p></div></div>" +
    '<dl class="stats">' +
      "<div><dt>生きた日数</dt><dd>" + fmtDays(rec.days) + "</dd></div>" +
      "<div><dt>最期</dt><dd>" + esc(rec.cause) + "</dd></div>" +
      "<div><dt>" + esc(cur.kidsLabel || "残した子ども") + "</dt><dd>" + esc(rec.kidsText) + "</dd></div>" +
      "<div><dt>寿命の目安</dt><dd>" + esc(cur.lifeText) + "</dd></div>" +
      "<div><dt>乗りこえた分かれ道</dt><dd>" + rec.passed + "</dd></div>" +
      "<div><dt>地球上の数</dt><dd>" + esc(cur.pop) + "</dd></div>" +
    "</dl>" +
    '<div class="rank"><b>' + rec.rank + "</b><span>" + rec.title + "</span></div>" +
    '<p class="fact">' + esc(cur.fact) + "</p>";
  $("share").href = "https://x.com/intent/tweet?text=" + encodeURIComponent(shareText());
  $("pr-title").textContent = cur.name + "をもっと知る";
  $("toast").textContent = "";
  $("result").hidden = false;
  $("result").scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function renderZukan() {
  $("zukan").innerHTML = "";
  Object.entries(TIERS).forEach(([tier, t]) => {
    const list = C.filter((c) => c.tier === tier);
    const got = list.filter((c) => zukan.has(c.id)).length;
    $("zukan").appendChild(el("p", "eyebrow t-" + tier, t.label + "　" + got + " / " + list.length));
    const g = el("div", "zukan-grid");
    list.forEach((c) => {
      const has = zukan.has(c.id);
      const d = el("div", has ? "" : "no", spr(c, 40));
      d.title = has ? c.name : "？？？";
      d.setAttribute("aria-label", has ? c.name : "まだ出会っていない生き物");
      g.appendChild(d);
    });
    $("zukan").appendChild(g);
  });
  $("zcount").textContent = "出会った生き物 " + zukan.size + " / " + C.length;
}

$("go").onclick = start;
$("again").onclick = start;
$("copy").onclick = () => {
  const t = shareText();
  const ok = () => ($("toast").textContent = "結果をコピーしました");
  try {
    navigator.clipboard.writeText(t).then(ok, () => fallbackCopy(t));
  } catch (e) { fallbackCopy(t); }
};
function fallbackCopy(t) {
  const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
  ta.remove();
  $("toast").textContent = ok ? "結果をコピーしました" : "コピーできませんでした。お手数ですが手動でコピーしてください：" + t;
}
$("reset").onclick = () => {
  const b = $("reset");
  if (b.dataset.confirm !== "1") {
    b.dataset.confirm = "1";
    b.textContent = "本当に消す（もう一度押す）";
    return;
  }
  zukan = new Set();
  try { localStorage.removeItem(ZKEY); } catch (e) {}
  b.dataset.confirm = "";
  b.textContent = "図鑑の記録を消す";
  renderZukan();
};
renderZukan();
