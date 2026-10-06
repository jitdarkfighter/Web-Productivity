/**
 * Persistence layer. Everything lives in browser.storage.local (never leaves the machine).
 *
 * Schema:  days = { "YYYY-MM-DD": { "example.com": { time: ms, visits: n, clicks: n } } }
 * All mutations are serialised through one promise chain to avoid read-modify-write races.
 */
const Store = (() => {
  let chain = Promise.resolve();

  /** Runs fn(days) -> may mutate days; result is saved. */
  function mutate(fn) {
    chain = chain.then(async () => {
      const { days = {} } = await browser.storage.local.get("days");
      fn(days);
      await browser.storage.local.set({ days });
    }).catch((e) => console.error("Store error", e));
    return chain;
  }

  function entry(days, day, domain) {
    const d = (days[day] = days[day] || {});
    return (d[domain] = d[domain] || { time: 0, visits: 0, clicks: 0 });
  }

  /** Adds `ms` of active time to a domain, splitting across local midnights. */
  function addTime(domain, startTs, endTs) {
    return mutate((days) => {
      let t = startTs;
      while (t < endTs) {
        const cut = Math.min(endTs, Util.nextMidnight(t));
        entry(days, Util.dayKey(t), domain).time += cut - t;
        t = cut;
      }
    });
  }

  const addVisit = (domain) => mutate((days) => { entry(days, Util.dayKey(), domain).visits++; });
  const addClick = (domain) => mutate((days) => { entry(days, Util.dayKey(), domain).clicks++; });

  async function getDays() {
    await chain;
    return (await browser.storage.local.get("days")).days || {};
  }

  return { addTime, addVisit, addClick, getDays };
})();
