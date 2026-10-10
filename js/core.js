/* Pure functions: formatting, parsing, slider scales, percentile interpolation. No DOM. */
(function (root) {
  "use strict";

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  function fmt(v) {
    if (!Number.isFinite(v)) return "n/a";
    const a = Math.abs(v), s = v < 0 ? "−" : "";
    if (a >= 1e6) return s + "$" + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + "M";
    if (a >= 1e4) return s + "$" + Math.round(a / 1e3) + "k";
    return s + "$" + Math.round(a).toLocaleString("en-US");
  }
  const full = v => (v < 0 ? "−$" : "$") + Math.round(Math.abs(v)).toLocaleString("en-US");

  // Round to a step that scales with magnitude so slider values look human
  function nice(v) {
    const a = Math.abs(v);
    const st = a < 1000 ? 10 : a < 1e4 ? 100 : a < 1e5 ? 500 : a < 1e6 ? 5000 : a < 1e7 ? 50000 : 100000;
    return Math.round(v / st) * st;
  }

  // Accepts "120000", "$120,000", "120k", "1.2m", "-50k", "−50k"
  function parse(t) {
    let s = String(t).trim().toLowerCase().replace(/[$,\s]/g, "").replace(/−/g, "-");
    let m = 1;
    if (s.endsWith("k")) { m = 1e3; s = s.slice(0, -1); }
    else if (s.endsWith("m")) { m = 1e6; s = s.slice(0, -1); }
    if (!/^-?\d*\.?\d+$/.test(s)) return null;
    return parseFloat(s) * m;
  }

  // Slider position (0..1000) <-> value. Log scales may reserve position 0 for exactly $0.
  function toPos(v, c) {
    if (c.log) {
      if (c.zero && v <= 0) return 0;
      return clamp(Math.log(Math.max(v, c.min) / c.min) / Math.log(c.max / c.min) * 1000, c.zero ? 1 : 0, 1000);
    }
    return clamp((v - c.min) / (c.max - c.min) * 1000, 0, 1000);
  }
  function fromPos(p, c) {
    if (c.log) {
      if (c.zero && p <= 0) return 0;
      return nice(c.min * Math.pow(c.max / c.min, p / 1000));
    }
    const step = c.step || 1;
    return Math.round((c.min + (c.max - c.min) * p / 1000) / step) * step;
  }

  // Interpolate a percentile from sorted [value, pct] knots: log between positive knots, linear from 0.
  function pct(knots, v) {
    const first = knots[0], last = knots[knots.length - 1];
    if (!(v > first[0])) return { p: first[1], edge: "low" };
    if (v >= last[0]) return { p: last[1], edge: "high" };
    for (let i = 1; i < knots.length; i++) {
      const a = knots[i - 1], b = knots[i];
      if (v <= b[0]) {
        const t = a[0] <= 0 ? (v - a[0]) / (b[0] - a[0]) : Math.log(v / a[0]) / Math.log(b[0] / a[0]);
        return { p: a[1] + t * (b[1] - a[1]) };
      }
    }
    return { p: last[1], edge: "high" };
  }

  function ord(n) {
    n = Math.round(n);
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function rankText(r, kind) {
    if (r.edge === "high") return "Top 5%";
    if (r.edge === "low") return kind === "nw" ? "Bottom 13%" : "Bottom 1%";
    return ord(r.p);
  }

  // "1.4×" style multiple; guards zero and non-finite
  function xs(r) {
    if (!Number.isFinite(r) || r <= 0) return "0×";
    return (r >= 10 ? Math.round(r) : r.toFixed(r >= 2 ? 1 : 2)) + "×";
  }

  const level = ratio => ratio >= 1.33 ? ["v-hi", "Above typical"] : ratio >= 0.75 ? ["v-mid", "Near typical"] : ["v-lo", "Below typical"];
  const risk = (x, mid, high) => x >= high ? ["v-bad", "High"] : x >= mid ? ["v-warn", "Elevated"] : ["v-ok", "Healthy"];

  // Merge saved state over defaults, keeping only known keys with valid values
  function sanitize(saved, defaults, ctl, groups) {
    const out = Object.assign({}, defaults);
    if (!saved || typeof saved !== "object") return out;
    Object.keys(ctl).forEach(k => {
      const v = saved[k];
      if (typeof v === "number" && Number.isFinite(v) && (ctl[k].neg || v >= 0) && Math.abs(v) < 1e10) out[k] = v;
    });
    Object.keys(groups).forEach(g => {
      if (groups[g].some(o => o.k === saved[g])) out[g] = saved[g];
    });
    return out;
  }

  const API = { clamp, fmt, full, nice, parse, toPos, fromPos, pct, ord, rankText, xs, level, risk, sanitize };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SCFCore = API;
})(this);
