const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../js/core.js");
const D = require("../js/data.js");

test("knots are strictly increasing in value and percentile", () => {
  for (const kn of [D.KNOTS.inc, D.KNOTS.nw]) {
    for (let i = 1; i < kn.length; i++) {
      assert.ok(kn[i][0] > kn[i - 1][0]);
      assert.ok(kn[i][1] > kn[i - 1][1]);
    }
  }
});

test("published cutoffs map exactly to their percentiles", () => {
  assert.equal(C.pct(D.KNOTS.inc, 84200).p, 50);   // Table A.2 median usual income
  assert.equal(C.pct(D.KNOTS.nw, 215900).p, 50);   // Table A.2 median net worth
  assert.equal(C.pct(D.KNOTS.nw, 2539200).p, 90);
});

test("percentile is monotonic across the range", () => {
  let prev = -1;
  for (let v = 1000; v < 6e6; v *= 1.07) {
    const p = C.pct(D.KNOTS.nw, v).p;
    assert.ok(p >= prev, "dropped at " + v);
    prev = p;
  }
});

test("edges are flagged", () => {
  assert.equal(C.pct(D.KNOTS.nw, -50000).edge, "low");
  assert.equal(C.pct(D.KNOTS.inc, 5e6).edge, "high");
  assert.equal(C.rankText(C.pct(D.KNOTS.inc, 5e6), "inc"), "Top 5%");
});

test("parse handles common money formats and rejects junk", () => {
  assert.equal(C.parse("$120,000"), 120000);
  assert.equal(C.parse("120k"), 120000);
  assert.equal(C.parse("1.2M"), 1200000);
  assert.equal(C.parse("−50k"), -50000);
  assert.equal(C.parse("abc"), null);
  assert.equal(C.parse("12k5"), null);
});

test("slider position round-trips within rounding", () => {
  const c = { min: 5000, max: 2e6, log: 1 };
  for (const v of [5000, 82000, 150000, 900000, 2e6]) {
    const back = C.fromPos(Math.round(C.toPos(v, c)), c);
    assert.ok(Math.abs(back - v) / v < 0.02, v + " -> " + back);
  }
  const z = { min: 100, max: 50000, log: 1, zero: 1 };
  assert.equal(C.toPos(0, z), 0);
  assert.equal(C.fromPos(0, z), 0);
});

test("sanitize keeps valid saved values and drops garbage", () => {
  const ctl = { income: {}, nw: { neg: 1 } };
  const groups = { age: D.AGE };
  const def = { income: 1, nw: 1, age: "a1" };
  const out = C.sanitize({ income: "x", nw: -5, age: "zz", evil: 1 }, def, ctl, groups);
  assert.deepEqual(out, { income: 1, nw: -5, age: "a1" });
  assert.deepEqual(C.sanitize(null, def, ctl, groups), def);
});

test("xs guards zero, negative and infinity", () => {
  assert.equal(C.xs(0), "0×");
  assert.equal(C.xs(-1), "0×");
  assert.equal(C.xs(Infinity), "0×");
  assert.equal(C.xs(1.5), "1.50×");
});
