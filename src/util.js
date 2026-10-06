/**
 * Shared helpers (loaded in the background page and the popup).
 */
const Util = {
  /** Returns the tracked domain for a URL (www. stripped), or null if the URL is not trackable. */
  domainOf(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      return u.hostname.replace(/^www\./, "").toLowerCase() || null;
    } catch (e) {
      return null;
    }
  },

  /** Local-date key "YYYY-MM-DD" for a timestamp (rolls over at local midnight). */
  dayKey(ts = Date.now()) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  },

  /** Timestamp of the next local midnight after ts. */
  nextMidnight(ts) {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
  },

  /** Formats milliseconds in minutes only: "<1 min", "42 min", "1 h 05 min". */
  formatDuration(ms) {
    const m = Math.floor(ms / 60000);
    if (m < 1) return ms > 0 ? "<1 min" : "0 min";
    if (m < 60) return `${m} min`;
    return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
  },
};
