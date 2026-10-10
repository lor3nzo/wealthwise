# WealthWise

**Where do I stand?**

Move a few sliders and see where your household ranks against 135 million US families, using the Federal Reserve's **2025 Survey of Consumer Finances** (released October 2026).

It covers income, net worth, home equity, retirement savings, debt ratios, credit cards, student loans and spending. Every benchmark is cited to a table and page in the Fed report.

No framework, no build step, no tracking. Your inputs stay in your own browser.

## Run it

Open `index.html` in a browser. That's it.

For a single self-contained file (handy for drag and drop hosting):

```bash
python3 build.py        # writes dist/index.html with CSS and JS inlined
```

## Test it

```bash
npm test                # Node 18+, uses the built-in test runner, no dependencies
```

Tests cover percentile interpolation, money parsing, slider scale round trips, saved state sanitizing and edge cases.

## How it works

```
js/data.js   Benchmarks from the report, each commented with its source table
js/core.js   Pure functions: parsing, formatting, log slider scales, percentile interpolation
js/app.js    DOM wiring: controls, meters, card copy, theme toggle
css/style.css  Design tokens with light and dark themes
```

**Percentiles.** The report publishes exact cutoffs (Table A.2: P20, P40, P50, P60, P80, P90 for income; P25, P50, P75, P90 for net worth). I add each group's published median as an approximate midpoint (for example, the top decile's median income is treated as P95), then interpolate on a log scale. Above P95 the report gives no finer detail, so the page says "Top 5%". Ranks are approximate, within a few points.

**Known limits.**
* Percentile cutoffs use "usual" income; users enter last year's actual income.
* Percentiles are national. Peer group comparisons (age, education, housing, metro) use medians and means, not within group percentiles.
* Retirement balances by age cover IRAs and DC plans only, for families under 65.

## Roadmap

* Within group percentiles computed from the SCF public microdata, with survey weights
* 2022 vs 2025 toggle to show how your rank moved
* Shareable result link and a downloadable summary card

## Source

Aladangady, A., Bricker, J., Chang, A. C., Goodman, S., Li, G., Moore, K. B., Reber, S., Volz, A. H., and Windle, R. A. (2026). *Changes in U.S. Family Finances from 2022 to 2025: Evidence from the Survey of Consumer Finances.* Board of Governors of the Federal Reserve System. https://doi.org/10.17016/8799.1

Built by [Lorenzo T Geraci](https://www.linkedin.com/in/lor3nzo/). MIT licensed.
