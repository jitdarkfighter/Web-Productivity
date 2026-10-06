/** Popup: live per-domain stats for any day, with day navigation and a history list. */
const $ = (id) => document.getElementById(id);
let days = {}, session = null, current = Util.dayKey();

function pretty(key, long) {
  const [y, m, d] = key.split("-").map(Number);
  if (key === Util.dayKey()) return "Today";
  if (key === Util.dayKey(Date.now() - 86400000)) return "Yesterday";
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "long", day: "numeric", ...(long ? { year: "numeric" } : {}) });
}

/** Stored stats for a day; for today, adds the not-yet-flushed running session. */
function statsFor(key) {
  const data = JSON.parse(JSON.stringify(days[key] || {}));
  if (key === Util.dayKey() && session) {
    const start = Math.max(session.start, new Date().setHours(0, 0, 0, 0));
    const e = (data[session.domain] = data[session.domain] || { time: 0, visits: 0, clicks: 0 });
    e.time += Math.max(0, Date.now() - start);
  }
  return data;
}

function render() {
  const today = Util.dayKey();
  const keys = Array.from(new Set([today, ...Object.keys(days)])).sort();
  const idx = keys.indexOf(current);
  $("prev").disabled = idx <= 0;
  $("next").disabled = idx >= keys.length - 1;
  $("label").textContent = pretty(current, true);

  const list = Object.entries(statsFor(current)).sort((a, b) => b[1].time - a[1].time);
  const sum = (f) => list.reduce((s, [, v]) => s + v[f], 0);
  $("total").textContent = Util.formatDuration(sum("time"));
  $("sites").textContent = list.length;
  $("visits").textContent = sum("visits");
  $("clicks").textContent = sum("clicks");
  $("empty").hidden = list.length > 0;

  const max = list.length ? list[0][1].time || 1 : 1;
  const rows = $("rows");
  rows.textContent = "";
  for (const [domain, v] of list) {
    const row = document.createElement("div");
    row.className = "row";
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = Math.round((v.time / max) * 100) + "%";
    const name = document.createElement("span");
    name.className = "name";
    const badge = document.createElement("i");
    badge.className = "badge";
    badge.textContent = domain[0];
    const em = document.createElement("em");
    em.textContent = domain;
    em.title = domain;
    name.append(badge, em);
    row.append(bar, name);
    for (const t of [Util.formatDuration(v.time), v.visits, v.clicks]) {
      const s = document.createElement("span");
      s.textContent = t;
      row.appendChild(s);
    }
    rows.appendChild(row);
  }

  const hist = $("history");
  hist.textContent = "";
  const past = keys.filter((k) => k !== today).reverse();
  if (!past.length) {
    const p = document.createElement("p");
    p.id = "emptyhist";
    p.style.cssText = "color:var(--muted);margin:0";
    p.textContent = "No previous days yet. Stats are kept after each midnight.";
    hist.appendChild(p);
  }
  for (const k of past) {
    const total = Object.values(days[k] || {}).reduce((s, v) => s + v.time, 0);
    const b = document.createElement("button");
    b.className = "hist" + (k === current ? " sel" : "");
    const a = document.createElement("span");
    a.textContent = pretty(k);
    const t = document.createElement("span");
    t.textContent = Util.formatDuration(total);
    b.append(a, t);
    b.onclick = () => { current = k; render(); };
    hist.appendChild(b);
  }
  $("prev").onclick = () => { current = keys[idx - 1]; render(); };
  $("next").onclick = () => { current = keys[idx + 1]; render(); };
}

async function load() {
  const r = await browser.storage.local.get(["days", "session"]);
  days = r.days || {};
  session = r.session || null;
  render();
}

load();
browser.storage.onChanged.addListener(load);
setInterval(render, 5000);
