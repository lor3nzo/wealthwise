/*
 * Benchmarks from: Aladangady et al. (2026), "Changes in U.S. Family Finances
 * from 2022 to 2025: Evidence from the Survey of Consumer Finances",
 * Board of Governors of the Federal Reserve System. All values in 2025 dollars.
 * Group values are [median, mean] in thousands unless noted.
 */
(function (root) {
  "use strict";

  // Table 1 (income, p.7) and Table 2 (net worth, p.12); retirement means from Box 2 Table A (p.18)
  const AGE = [
    { k: "a1", l: "Under 35",   inc: [67.8, 89.0],  nw: [33.0, 135.4],   ret: 48.4 },
    { k: "a2", l: "35 to 44",   inc: [97.0, 139.8], nw: [155.6, 681.9],  ret: 182.4 },
    { k: "a3", l: "45 to 54",   inc: [108.9, 187.1], nw: [253.7, 1244.5], ret: 415.8 },
    { k: "a4", l: "55 to 64",   inc: [92.4, 197.6], nw: [411.9, 1878.0], ret: 670.2 },
    { k: "a5", l: "65 to 74",   inc: [69.4, 138.4], nw: [431.3, 1897.6], ret: null },
    { k: "a6", l: "75 or more", inc: [66.8, 125.1], nw: [504.9, 1962.2], ret: null }
  ];
  const EDU = [
    { k: "e1", l: "No HS diploma",  inc: [36.3, 52.3],   nw: [18.6, 294.3] },
    { k: "e2", l: "High school",    inc: [60.6, 82.7],   nw: [106.7, 470.6] },
    { k: "e3", l: "Some college",   inc: [69.0, 95.9],   nw: [181.0, 661.2] },
    { k: "e4", l: "College degree", inc: [129.2, 232.9], nw: [505.4, 2263.3] }
  ];
  const HOUSE = [
    { k: "own",  l: "Own",           inc: [108.9, 184.6], nw: [458.9, 1812.9] },
    { k: "rent", l: "Rent or other", inc: [50.3, 70.3],   nw: [10.6, 153.5] }
  ];
  const METRO = [
    { k: "msa", l: "Metro area",    inc: [84.2, 153.5], nw: [231.3, 1337.7] },
    { k: "non", l: "Outside metro", inc: [67.5, 88.3],  nw: [150.1, 577.1] }
  ];
  const ALL = { inc: [82.2, 145.2], nw: [215.9, 1241.5] };

  /*
   * Percentile knots [dollars, percentile].
   * Exact cutoffs: Table A.2 (p.48). Approximate midpoints: each group's
   * median from Tables 1 and 2, placed at the group's middle percentile.
   */
  const KNOTS = {
    inc: [[0, 0], [24600, 10], [40100, 20], [50500, 30], [66800, 40], [84200, 50],
          [103600, 60], [129200, 70], [174400, 80], [201300, 85], [248500, 90], [387200, 95]],
    nw:  [[1700, 12.5], [27900, 25], [100900, 37.5], [215900, 50], [405700, 62.5],
          [812800, 75], [1267500, 82.5], [2539200, 90], [4935200, 95]]
  };

  // Point benchmarks used by the topic cards (dollars or percent)
  const BENCH = {
    homeMedianValue: 375000,      // Table 3
    homeEquityMedian: 230000,     // Box 4
    homeEquityMean: 380400,       // Box 4
    mortgageMedian: 183600,       // Table 4
    priceToIncome: 4.5,           // Box 4 Figure B
    retMedian: 106000,            // Table 3, holders
    retMean: 451100,              // Table 3, holders
    retHoldShare: 54.9,           // Table 3
    debtMedian: 88100,            // Table 4, holders
    debtShare: 77.0,              // Table 4
    ptiMedian: 15.4,              // Table 5
    dtiMedian: 94.8,              // Table 5
    levMedian: 26.9,              // Table 5
    ptiOver40Share: 8.6,          // Table 5
    lateShare: 19.6,              // Table 5
    ccMedian: 3100, ccMean: 8000, ccShare: 44.7, ccNoBalance: 55.8, ccRate: 21.4, // Table 4, Table 5, p.25
    studMedian: 25600, studMean: 43000, studShare: 20.0, // Table 4
    spendMedian: 33700, spendMean: 48700,                // Box 1
    spendBottom20: 17600, spend80to90: 68700, spendTop10: 138800, // Box 1
    vacTravelerMedian: 3500, vacNoneShare: 39            // Box 1
  };

  const API = { AGE, EDU, HOUSE, METRO, ALL, KNOTS, BENCH };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SCF = API;
})(this);
