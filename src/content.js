/**
 * Counts link clicks that navigate somewhere (not buttons, not in-page anchors).
 * Attributed to the domain of the page the click happened on (done in background via sender.tab).
 */
(() => {
  function handle(e) {
    if (e.button > 1) return;               // left / middle click only
    const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    let url;
    try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.protocol !== "http:" && url.protocol !== "https:") return; // skips javascript:, mailto:, etc.
    if (a.hasAttribute("download")) return;
    // Same-page anchor (#section) does not load a new page.
    if (url.href.split("#")[0] === location.href.split("#")[0] && url.hash) return;
    browser.runtime.sendMessage({ type: "link-click" }).catch(() => {});
  }
  document.addEventListener("click", handle, true);
  document.addEventListener("auxclick", handle, true);
})();
