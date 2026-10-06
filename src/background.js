/**
 * Background tracker.
 *  - Time:   accrues only while a tab is active in a focused window and the user is not idle.
 *  - Visits: top-frame navigations (new URL, new page, SPA history changes).
 *  - Clicks: reported by content.js for navigating link clicks.
 * The currently running "session" {domain, start} is persisted so the event page
 * can be suspended/restarted without losing time.
 */
const IDLE_SECONDS = 120;
let session = null;      // { domain, start }
let userIdle = false;
let ready = null;

/** Close the running session, crediting elapsed time to its domain. */
async function closeSession(now = Date.now()) {
  if (session) {
    const s = session;
    session = null;
    if (now > s.start) await Store.addTime(s.domain, s.start, now);
  }
}

/** Re-evaluates what (if anything) is being actively viewed and updates the session. */
async function refresh() {
  await ready;
  const now = Date.now();
  let domain = null;
  if (!userIdle) {
    try {
      const win = await browser.windows.getLastFocused();
      if (win.focused && win.state !== "minimized") {
        const [tab] = await browser.tabs.query({ active: true, windowId: win.id });
        if (tab) domain = Util.domainOf(tab.url);
      }
    } catch (e) { /* no window */ }
  }
  if (session && session.domain === domain) {
    // Same target: flush so storage stays current, keep running.
    await Store.addTime(session.domain, session.start, now);
    session.start = now;
  } else {
    await closeSession(now);
    if (domain) session = { domain, start: now };
  }
  await browser.storage.local.set({ session });
}

// Restore a session left by a previous (suspended) instance, crediting up to the last flush.
ready = (async () => {
  const { session: old } = await browser.storage.local.get("session");
  if (old) {
    // Cap credit at 2 min past start to avoid inflating after a crash/shutdown.
    await Store.addTime(old.domain, old.start, Math.min(Date.now(), old.start + 120000));
    await browser.storage.local.set({ session: null });
  }
  userIdle = (await browser.idle.queryState(IDLE_SECONDS)) !== "active";
})();
// NOTE: refresh() awaits `ready`, so it must not be chained onto it (that deadlocks).
refresh();

browser.tabs.onActivated.addListener(refresh);
browser.tabs.onUpdated.addListener((id, change) => { if (change.url) refresh(); });
browser.tabs.onRemoved.addListener(refresh);
browser.windows.onFocusChanged.addListener(refresh);
browser.idle.setDetectionInterval(IDLE_SECONDS);
browser.idle.onStateChanged.addListener((state) => { userIdle = state !== "active"; refresh(); });

// Periodic flush (also handles midnight rollover via Store.addTime splitting).
browser.alarms.create("tick", { periodInMinutes: 0.5 });
browser.alarms.onAlarm.addListener((a) => { if (a.name === "tick") refresh(); });

// ---- Visits ----
function onVisit(d) {
  if (d.frameId !== 0) return;
  if (d.transitionType === "reload") return;
  const domain = Util.domainOf(d.url);
  if (domain) Store.addVisit(domain);
}
browser.webNavigation.onCommitted.addListener(onVisit);
browser.webNavigation.onHistoryStateUpdated.addListener((d) => {
  // SPA navigation (e.g. YouTube). Ignore duplicates from the same URL.
  if (d.frameId === 0) onVisit(d);
});

// ---- Clicks ----
browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === "link-click" && sender.tab) {
    const domain = Util.domainOf(sender.tab.url);
    if (domain) Store.addClick(domain);
  }
});
