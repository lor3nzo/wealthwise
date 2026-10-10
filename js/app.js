/* DOM wiring: controls, theme toggle, meters, card copy. Depends on SCF (data.js) and SCFCore (core.js). */
(function () {
  "use strict";
  const { AGE, EDU, HOUSE, METRO, ALL, KNOTS, BENCH: B } = window.SCF;
  const C = window.SCFCore;
  const { fmt, full, xs, level, risk } = C;
  const K = 1000;
  const STORE = "scf-fit", THEME_STORE = "scf-fit-theme";

  const CTL = {
    income:   { l: "Household income (year)",        min: 5000, max: 2e6,   log: 1 },
    nw:       { l: "Net worth",                       min: 1000, max: 5e7,   log: 1, neg: 1 },
    home:     { l: "Home value",                      min: 50000, max: 5e6,  log: 1 },
    mortgage: { l: "Mortgage and HELOC balance",      min: 5000, max: 3e6,   log: 1, zero: 1 },
    ret:      { l: "Retirement accounts",             min: 1000, max: 5e6,   log: 1, zero: 1 },
    debt:     { l: "Total debt (all types)",          min: 1000, max: 3e6,   log: 1, zero: 1 },
    pay:      { l: "Monthly debt payments",           min: 0,    max: 20000, step: 50 },
    cc:       { l: "Credit card balance carried",     min: 100,  max: 50000, log: 1, zero: 1 },
    stud:     { l: "Student loan balance",            min: 1000, max: 300000, log: 1, zero: 1 },
    spend:    { l: "Yearly spending, excl. housing",  min: 5000, max: 500000, log: 1 },
    vac:      { l: "Vacation spending (year)",        min: 100,  max: 100000, log: 1, zero: 1 }
  };
  const GROUPS = { age: AGE, edu: EDU, house: HOUSE, metro: METRO };
  const SAMPLE = { age: "a3", edu: "e4", house: "own", metro: "msa", income: 150000, nw: 600000, home: 650000,
    mortgage: 320000, ret: 350000, debt: 340000, pay: 2600, cc: 0, stud: 0, spend: 55000, vac: 5000 };

  const $ = id => document.getElementById(id);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: page still works */ } }
  };
  let saved = null;
  try { saved = JSON.parse(store.get(STORE) || "null"); } catch (e) { saved = null; }
  let S = C.sanitize(saved, SAMPLE, CTL, GROUPS);

  /* ---------- theme toggle: system -> light -> dark ---------- */
  const THEMES = ["system", "light", "dark"];
  let theme = THEMES.includes(store.get(THEME_STORE)) ? store.get(THEME_STORE) : "system";
  function applyTheme() {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", theme);
    const b = $("themeBtn");
    b.textContent = "Theme: " + theme[0].toUpperCase() + theme.slice(1);
    b.setAttribute("aria-label", "Color theme: " + theme + ". Click to change.");
  }
  $("themeBtn").addEventListener("click", () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    store.set(THEME_STORE, theme);
    applyTheme();
  });
  applyTheme();

  /* ---------- controls ---------- */
  document.querySelectorAll("[data-ctl]").forEach(el => {
    const id = el.dataset.ctl, c = CTL[id];
    el.innerHTML = '<div class="ctl-head"><label for="r-' + id + '">' + c.l + '</label>' +
      '<input type="text" inputmode="decimal" id="t-' + id + '" aria-label="' + c.l + ', exact value"></div>' +
      '<input type="range" id="r-' + id + '" min="0" max="1000" step="1">';
    const r = $("r-" + id), t = $("t-" + id);
    r.addEventListener("input", () => { S[id] = C.fromPos(+r.value, c); t.value = full(S[id]); update(); });
    t.addEventListener("change", () => {
      let v = C.parse(t.value);
      if (v === null) { t.value = full(S[id]); return; }
      if (!c.neg && v < 0) v = 0;
      S[id] = v; r.value = C.toPos(v, c); t.value = full(v); update();
    });
  });
  function syncCtls() {
    Object.keys(CTL).forEach(id => { $("r-" + id).value = C.toPos(S[id], CTL[id]); $("t-" + id).value = full(S[id]); });
  }

  document.querySelectorAll("[data-group]").forEach(el => {
    const g = el.dataset.group;
    GROUPS[g].forEach(o => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = o.l; b.dataset.k = o.k;
      b.addEventListener("click", () => { S[g] = o.k; update(); });
      el.appendChild(b);
    });
  });
  function syncChips() {
    document.querySelectorAll("[data-group]").forEach(el => {
      const g = el.dataset.group;
      el.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === S[g] ? "true" : "false"));
    });
  }
  const pick = g => GROUPS[g].find(o => o.k === S[g]) || GROUPS[g][0];

  /* ---------- rendering helpers ---------- */
  function verdict(el, cls, txt) { el.className = "verdict " + cls; el.textContent = txt; }

  // Log-scale meter. o.you is the true value; it is clamped for position only, never for the label.
  function meter(id, o) {
    const lo = o.min, hi = o.max;
    const P = v => C.clamp(Math.log(Math.max(v, lo) / lo) / Math.log(hi / lo), 0, 1) * 100;
    const L = x => C.clamp(x, 6, 94);
    let h = '<div class="m-band"></div>';
    (o.ticks || []).forEach(([v, lab]) => {
      const x = P(v);
      h += '<span class="m-tick" style="left:' + x + '%"></span><span class="m-tl" style="left:' + L(x) + '%">' + lab + '</span>';
    });
    (o.refs || []).forEach(([v, lab], i) => {
      const x = P(v);
      h += '<span class="m-ref" style="left:' + x + '%"></span><span class="m-rl" style="left:' + L(x) + '%;top:' + (i % 2 ? 76 : 60) + 'px">' + lab + '</span>';
    });
    const yx = P(o.you), off = o.you < 0 ? " (below scale)" : (o.you > 0 && o.you < lo) || o.you > hi ? " (off scale)" : "";
    h += '<span class="m-you" style="left:' + yx + '%"></span><span class="m-yl" style="left:' + L(yx) + '%">You · ' + fmt(o.you) + off + '</span>';
    const el = $(id);
    el.innerHTML = h;
    el.setAttribute("aria-label", "Your value " + fmt(o.you) + ". " + (o.refs || []).map(r => r[1]).join(". "));
  }

  function cmpRows(tb, key, you) {
    const h = pick("house");
    const rows = [["All families", ALL[key]], [pick("age").l, pick("age")[key]], [pick("edu").l, pick("edu")[key]],
      [h.k === "own" ? "Homeowners" : "Renters", h[key]], [pick("metro").l, pick("metro")[key]]];
    $(tb).innerHTML = rows.map(([n, [md, mn]]) =>
      '<tr><td>' + n + '</td><td class="r tab">' + fmt(md * K) + '</td><td class="r tab">' + fmt(mn * K) +
      '</td><td class="r tab"><b>' + (you > 0 ? xs(you / (md * K)) : "n/a") + '</b></td></tr>').join("");
  }
  function stats(id, arr) {
    $(id).innerHTML = arr.map(([k, v, c]) =>
      '<div class="stat"><span class="k">' + k + '</span><span class="v">' + v + '</span><span class="c">' + (c || "") + '</span></div>').join("");
  }
  const pctStr = x => Number.isFinite(x) ? x.toFixed(1) + "%" : "n/a";

  /* ---------- main update ---------- */
  function update() {
    syncChips();
    store.set(STORE, JSON.stringify(S));
    const age = pick("age"), inc = S.income, nw = S.nw, ageLc = age.l.toLowerCase();

    // Income
    const ri = C.pct(KNOTS.inc, inc);
    $("s-inc").textContent = ri.edge === "high" ? "95+" : String(Math.round(ri.p));
    $("s-inc-sub").textContent = "Rank " + C.rankText(ri, "inc") + " at " + fmt(inc) + ". US median $82k.";
    const ageX = inc / (age.inc[0] * K);
    $("s-age").textContent = xs(ageX);
    $("s-age-sub").textContent = "Median, " + ageLc + ": " + fmt(age.inc[0] * K);
    $("f-inc").textContent = xs(ageX);
    verdict($("v-inc"), ...level(inc / (age.inc[0] * K)));
    meter("m-inc", { min: 10000, max: 1e6, you: inc,
      ticks: [[40100, "P20"], [84200, "P50"], [174400, "P80"], [248500, "P90"], [387200, "≈P95"]],
      refs: [[age.inc[0] * K, "Median, " + ageLc], [ALL.inc[1] * K, "US mean"]] });
    const incBeat = ri.edge === "high" ? "more than about 95% of US families" : "more than about " + Math.round(ri.p) + "% of US families";
    $("r-inc").innerHTML = "You earn " + incBeat + ". That is <b>" + xs(inc / (age.inc[0] * K)) +
      "</b> the median for families aged " + ageLc + " (" + fmt(age.inc[0] * K) + ").";
    cmpRows("t-inc", "inc", inc);

    // Net worth
    const rn = C.pct(KNOTS.nw, nw);
    $("s-nw").textContent = C.rankText(rn, "nw");
    $("s-nw-sub").textContent = fmt(nw) + " vs US median $216k";
    $("f-nw").textContent = nw > 0 ? xs(nw / (age.nw[0] * K)) : fmt(nw);
    verdict($("v-nw"), ...level(nw / (age.nw[0] * K)));
    meter("m-nw", { min: 1000, max: 2e7, you: nw,
      ticks: [[27900, "P25"], [215900, "P50"], [812800, "P75"], [2539200, "P90"], [4935200, "≈P95"]],
      refs: [[age.nw[0] * K, "Median, " + ageLc], [ALL.nw[1] * K, "US mean"]] });
    const nwLead = rn.edge === "low"
      ? "Your net worth is at or below the bottom quartile's typical $1,700, so roughly 87% of US families have more."
      : "Your net worth is " + (rn.edge === "high" ? "more than about 95%" : "more than about " + Math.round(rn.p) + "%") + " of US families.";
    $("r-nw").innerHTML = nwLead + (nw > 0
      ? " Against families aged " + ageLc + " you hold <b>" + xs(nw / (age.nw[0] * K)) + "</b> their median of " + fmt(age.nw[0] * K) + "."
      : " The median for families aged " + ageLc + " is " + fmt(age.nw[0] * K) + ".");
    cmpRows("t-nw", "nw", nw);

    // Home
    const own = S.house === "own";
    $("homeCtls").hidden = !own; $("m-home").hidden = !own; $("st-home").hidden = !own;
    if (own) {
      const eq = S.home - S.mortgage, p2i = inc > 0 ? S.home / inc : Infinity;
      $("f-home").textContent = fmt(eq); $("f-home-cap").textContent = "Your home equity. Median owner $230k";
      verdict($("v-home"), ...level(eq / B.homeEquityMedian));
      meter("m-home", { min: 10000, max: 5e6, you: eq,
        ticks: [[B.homeMedianValue, "Median home $375k"]],
        refs: [[B.homeEquityMedian, "Median equity $230k"], [B.homeEquityMean, "Mean $380k"]] });
      $("r-home").innerHTML = "Your net housing value is <b>" + fmt(eq) + "</b>, " + xs(eq / B.homeEquityMedian) +
        " the median owner's $230,000. Your home costs <b>" + (Number.isFinite(p2i) ? p2i.toFixed(1) + "×" : "n/a") +
        "</b> your income; for the median family the ratio is above 4.5, near the survey's record.";
      stats("st-home", [
        ["Home value", fmt(S.home), "Median owner $375k"],
        ["Mortgage balance", fmt(S.mortgage), S.mortgage > 0 ? "Median among borrowers $184k" : "Like 1 in 3 owners, debt free"],
        ["Price to income", Number.isFinite(p2i) ? p2i.toFixed(1) + "×" : "n/a", "US median above 4.5×"]]);
    } else {
      verdict($("v-home"), "v-mid", "Renter");
      $("f-home").textContent = "$10.6k"; $("f-home-cap").textContent = "Renters' median net worth";
      $("r-home").innerHTML = "Renters had a median net worth of <b>$10,600</b> in 2025 versus <b>$458,900</b> for owners. " +
        "66% of families own their home. A 30 year mortgage on the median home with 20% down, plus property tax, now takes about 33% of median monthly income, the highest the survey has recorded.";
    }

    // Retirement
    const rm = age.ret ? age.ret * K : null;
    verdict($("v-ret"), ...level(S.ret / (rm || B.retMedian)));
    $("f-ret").textContent = S.ret > 0 ? xs(S.ret / (rm || B.retMedian)) : "$0";
    $("f-ret-cap").textContent = S.ret > 0 ? (rm ? "Average holder aged " + ageLc : "Median holder, all ages") : "No retirement account";
    meter("m-ret", { min: 1000, max: 5e6, you: S.ret,
      refs: rm ? [[B.retMedian, "All holders median $106k"], [rm, "Mean, " + ageLc]]
               : [[B.retMedian, "Median $106k"], [B.retMean, "Mean $451k"]] });
    $("r-ret").innerHTML = S.ret <= 0
      ? "About 45% of families hold no retirement account. Among families under 65, 65.1% take part in some plan, pensions included."
      : rm ? "Among families aged " + ageLc + " with an IRA or DC plan, the average balance is " + fmt(rm) + ". You hold <b>" + xs(S.ret / rm) + "</b> that."
           : "The median balance among all holders is $106,000 and the mean $451,100. You hold <b>" + xs(S.ret / B.retMedian) + "</b> the median.";
    stats("st-ret", [["Your balance", fmt(S.ret), ""], ["Holders' median", fmt(B.retMedian), "54.9% of families hold one"],
      ["Holders' mean", fmt(rm || B.retMean), rm ? "Age " + ageLc : "All ages"]]);

    // Debt
    const pti = S.debt <= 0 ? 0 : inc > 0 ? S.pay * 12 / inc * 100 : NaN;
    const dti = inc > 0 ? S.debt / inc * 100 : NaN;
    const assets = nw + S.debt, lev = S.debt <= 0 ? 0 : assets > 0 ? S.debt / assets * 100 : NaN;
    $("s-pti").textContent = pctStr(pti);
    $("f-debt").textContent = pctStr(pti);
    $("s-pti-sub").textContent = S.debt > 0 ? "Median debtor 15.4%; 8.6% of families top 40%" : "No debt: like 23% of families";
    $("s-lev").textContent = Number.isFinite(lev) ? lev.toFixed(1) + "%" : "Over 100%";
    $("s-lev-sub").textContent = "Median debtor 26.9%";
    verdict($("v-debt"), ...(S.debt > 0 ? risk(Number.isFinite(pti) ? pti : 100, 25, 40) : ["v-ok", "Debt free"]));
    stats("st-debt", [["Payments to income", pctStr(pti), "Median debtor 15.4%"], ["Debt to income", Number.isFinite(dti) ? dti.toFixed(0) + "%" : "n/a", "Median debtor 94.8%"],
      ["Leverage", Number.isFinite(lev) ? lev.toFixed(1) + "%" : "Over 100%", "Median debtor 26.9%"], ["Total debt", fmt(S.debt), "Median debtor $88k"]]);
    $("r-debt").innerHTML = S.debt <= 0 ? "You carry no debt, like about 23% of US families."
      : pti > 40 ? "Your payments take more than 40% of income. Only <b>8.6%</b> of families are this stretched, the highest share since 2010. In 2025, 19.6% of families fell behind on a payment."
      : "Your payments use <b>" + pctStr(pti) + "</b> of income versus a median of 15.4% among debtors. " +
        (Number.isFinite(lev) && lev < B.levMedian ? "Your leverage is below the typical debtor's." : "Your leverage is above the typical debtor's 26.9%.");

    // Credit cards and student loans
    verdict($("v-cc"), ...(S.cc <= 0 ? ["v-ok", "No balance"] : S.cc > B.ccMean ? ["v-bad", "High"] : S.cc > B.ccMedian ? ["v-warn", "Above median"] : ["v-mid", "Near median"]));
    $("f-cc").textContent = fmt(S.cc);
    meter("m-cc", { min: 100, max: 50000, you: S.cc, refs: [[B.ccMedian, "Median $3.1k"], [B.ccMean, "Mean $8.0k"]] });
    $("r-cc").innerHTML = (S.cc <= 0 ? "You pay cards in full, like <b>55.8%</b> of families."
        : "You carry " + fmt(S.cc) + " on cards, <b>" + xs(S.cc / B.ccMedian) + "</b> the median balance among the 44.7% of families who carry one. Average card rates reached 21.4% in 2025.") +
      " " + (S.stud <= 0 ? "No student debt puts you with 80% of families."
        : "Your student debt of " + fmt(S.stud) + " compares with a median of $25,600 and mean of $43,000 among the 20% who owe.");

    // Spending
    const sp = S.spend;
    let grp = null;
    if (ri.edge === "high" || ri.p >= 90) grp = [B.spendTop10, "top 10% by income"];
    else if (ri.p >= 80) grp = [B.spend80to90, "80th to 90th income percentile"];
    else if (ri.p < 20) grp = [B.spendBottom20, "bottom 20% by income"];
    verdict($("v-sp"), ...level(sp / B.spendMedian));
    $("f-sp").textContent = xs(sp / B.spendMedian);
    const refs = [[B.spendMedian, "Median $33.7k"], [B.spendMean, "Mean $48.7k"]];
    if (grp) refs.push([grp[0], "Your income group avg"]);
    meter("m-sp", { min: 5000, max: 500000, you: sp, refs });
    $("r-sp").innerHTML = "You spend <b>" + xs(sp / B.spendMedian) + "</b> the median family's $33,700 outside housing." +
      (grp ? " Families in the " + grp[1] + " spend " + fmt(grp[0]) + " on average." : "") + " " +
      (S.vac <= 0 ? "Like 39% of families, you took no paid vacation." : "Your vacation budget of " + fmt(S.vac) + " compares with $3,500 for the median family that travels.");

    const isSample = Object.keys(SAMPLE).every(k => S[k] === SAMPLE[k]);
    $("sampleNote").innerHTML = isSample ? "<b>Sample household loaded.</b> Replace it with your own numbers. Nothing leaves your browser."
                                         : "<b>Your numbers.</b> Saved in this browser only.";
  }

  $("resetBtn").addEventListener("click", () => { S = Object.assign({}, SAMPLE); syncCtls(); update(); });
  syncCtls();
  update();
})();
