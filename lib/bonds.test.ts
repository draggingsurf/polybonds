import { describe, expect, it } from "vitest";
import {
  computeApy,
  computeBuyPrice,
  computeDaysLeft,
  computeReturnPct,
  filterBonds,
  formatApy,
  looksLikeCryptoPriceMarket,
  looksLikeEntityPriceMarket,
  looksLikeSocialCountMarket,
  looksLikeSportsMarket,
  looksLikeViewCountMarket,
  looksLikeWeatherMarket,
  mapCategory,
  marketToBond,
  profit,
  sideLabel,
  withReferral,
  type Bond,
  type RawMarket,
} from "./bonds";

describe("withReferral", () => {
  it("appends ?via=freeBONDS to event links", () => {
    expect(withReferral("https://polymarket.com/event/fed-cuts")).toBe(
      "https://polymarket.com/event/fed-cuts?via=freeBONDS"
    );
  });

  it("replaces an existing via param", () => {
    expect(
      withReferral("https://polymarket.com/event/fed-cuts?via=other")
    ).toBe("https://polymarket.com/event/fed-cuts?via=freeBONDS");
  });
});

describe("computeBuyPrice", () => {
  it("uses bestAsk for favourite Yes (index 0)", () => {
    expect(computeBuyPrice(0, 0.9, 0.94, [0.93, 0.07])).toBe(0.94);
  });

  it("falls back to outcomePrices[0] when bestAsk missing", () => {
    expect(computeBuyPrice(0, 0.9, null, [0.93, 0.07])).toBe(0.93);
  });

  it("uses 1 - bestBid for favourite No (index 1)", () => {
    expect(computeBuyPrice(1, 0.06, 0.07, [0.05, 0.95])).toBeCloseTo(0.94);
  });

  it("falls back to outcomePrices[1] when bestBid missing", () => {
    expect(computeBuyPrice(1, null, 0.07, [0.05, 0.95])).toBe(0.95);
  });

  it("falls back when bestBid is 0", () => {
    expect(computeBuyPrice(1, 0, 0.07, [0.05, 0.95])).toBe(0.95);
  });
});

describe("return, days, apy, profit", () => {
  it("computes returnPct from buy price", () => {
    expect(computeReturnPct(0.94)).toBeCloseTo((1 - 0.94) / 0.94);
  });

  it("computes daysLeft with a floor of 1", () => {
    const now = new Date("2026-11-16T12:00:00Z");
    const soon = new Date("2026-11-16T18:00:00Z");
    expect(computeDaysLeft(soon, now)).toBe(1);

    const later = new Date("2026-12-16T12:00:00Z");
    expect(computeDaysLeft(later, now)).toBe(30);
  });

  it("computes APY from return and days", () => {
    const returnPct = computeReturnPct(0.94);
    const apy = computeApy(returnPct, 30);
    expect(apy).toBeGreaterThan(0);
    expect(formatApy(apy)).toMatch(/%$/);
  });

  it("formats APY above 999% as >999%", () => {
    expect(formatApy(12)).toBe(">999%");
  });

  it("computes profit for an amount", () => {
    expect(profit(1000, 0.063829787)).toBeCloseTo(63.829787, 5);
  });
});

describe("sideLabel", () => {
  it("uppercases Yes/No", () => {
    expect(sideLabel("Yes")).toBe("YES");
    expect(sideLabel("no")).toBe("NO");
  });

  it("uppercases custom outcomes", () => {
    expect(sideLabel("Trump")).toBe("TRUMP");
  });
});

describe("marketToBond filters", () => {
  const base: RawMarket = {
    id: "1",
    question: "Fed cuts rates in December?",
    slug: "fed-cuts",
    endDate: "2026-12-15T00:00:00Z",
    outcomes: '["Yes","No"]',
    outcomePrices: '["0.06","0.94"]',
    bestBid: 0.05,
    bestAsk: 0.07,
    liquidityNum: 5000,
    acceptingOrders: true,
    enableOrderBook: true,
    closed: false,
    events: [{ slug: "fed-cuts-event", title: "Fed" }],
  };

  const now = new Date("2026-11-16T12:00:00Z");

  it("keeps a valid near-certain No bond", () => {
    const bond = marketToBond(base, { now, year: 2026, minPrice: 0.9 });
    expect(bond).not.toBeNull();
    expect(bond?.side).toBe("NO");
    expect(bond?.buyPrice).toBeCloseTo(0.95);
    expect(bond?.tradeUrl).toBe(
      "https://polymarket.com/event/fed-cuts-event?via=freeBONDS"
    );
  });

  it("rejects prices below minPrice", () => {
    const market: RawMarket = {
      ...base,
      outcomePrices: '["0.20","0.80"]',
      bestBid: 0.18,
      bestAsk: 0.22,
    };
    expect(marketToBond(market, { now, year: 2026, minPrice: 0.9 })).toBeNull();
  });

  it("rejects closed or non-orderbook markets", () => {
    expect(
      marketToBond({ ...base, closed: true }, { now, year: 2026 })
    ).toBeNull();
    expect(
      marketToBond({ ...base, acceptingOrders: false }, { now, year: 2026 })
    ).toBeNull();
    expect(
      marketToBond({ ...base, enableOrderBook: false }, { now, year: 2026 })
    ).toBeNull();
  });

  it("rejects low liquidity and non-binary markets", () => {
    expect(
      marketToBond({ ...base, liquidityNum: 500 }, { now, year: 2026 })
    ).toBeNull();
    expect(
      marketToBond(
        { ...base, outcomes: '["A","B","C"]', outcomePrices: '["0.3","0.3","0.4"]' },
        { now, year: 2026 }
      )
    ).toBeNull();
  });

  it("keeps markets that close Dec 31 ET (Jan 1 morning UTC)", () => {
    expect(
      marketToBond(
        {
          ...base,
          question: "Will Jesus Christ return before 2027?",
          slug: "will-jesus-christ-return-before-2027",
          endDate: "2027-01-01T04:59:00Z",
          outcomePrices: '["0.0085","0.9915"]',
          bestBid: 0.008,
          bestAsk: 0.009,
          liquidityNum: 2_000_000,
        },
        { now, year: 2026 }
      )
    ).not.toBeNull();
  });

  it("rejects markets well after the year window", () => {
    expect(
      marketToBond(
        { ...base, endDate: "2027-01-02T00:00:00Z" },
        { now, year: 2026 }
      )
    ).toBeNull();
  });

  it("rejects sports-style questions", () => {
    expect(
      marketToBond(
        {
          ...base,
          question: "Exact Score: Kazakhstan 0 - 1 Slovakia?",
          slug: "exact-score-kaz-svk",
        },
        { now, year: 2026 }
      )
    ).toBeNull();
  });
});

describe("sports / weather / up-down exclusion and categories", () => {
  it("detects sports/esports markets from text", () => {
    expect(looksLikeSportsMarket("Exact Score: A 1 - 0 B?")).toBe(true);
    expect(looksLikeSportsMarket("Magic vs. Celtics: O/U 233.5")).toBe(true);
    expect(looksLikeSportsMarket("Will Guatemala win on 2026-11-16?")).toBe(true);
    expect(looksLikeSportsMarket("Alessio Hasler: Anytime Goalscorer")).toBe(true);
    expect(looksLikeSportsMarket("LSR All Star +1 goals")).toBe(true);
    expect(looksLikeSportsMarket("Montana Grizzlies vs. Kansas State Wildcats")).toBe(true);
    expect(looksLikeSportsMarket("Will Zimbabwe win?")).toBe(true);
    expect(looksLikeSportsMarket("Fed cuts rates in December?")).toBe(false);
    expect(looksLikeSportsMarket("Will Trump win the election?")).toBe(false);
  });

  it("detects weather markets from text", () => {
    expect(
      looksLikeWeatherMarket(
        "Will the highest temperature in Hong Kong be 26°C on November 17?"
      )
    ).toBe(true);
    expect(
      looksLikeWeatherMarket(
        "Will the highest temperature in Atlanta be between 64-65°F on November 17?"
      )
    ).toBe(true);
    expect(looksLikeWeatherMarket("Will it rain in Los Angeles, CA on November 18?")).toBe(
      true
    );
    expect(looksLikeWeatherMarket("Fed cuts rates in December?")).toBe(false);
  });

  it("detects crypto up/down and price/range markets", () => {
    expect(
      looksLikeCryptoPriceMarket(
        "Bitcoin Up or Down - April 2, 9:50PM-9:55PM ET",
        "btc-updown-5m-1775181000"
      )
    ).toBe(true);
    expect(
      looksLikeCryptoPriceMarket("Ethereum price on November 16?", "eth-price")
    ).toBe(true);
    expect(
      looksLikeCryptoPriceMarket(
        "Will Bitcoin be above $100k by Dec 31?"
      )
    ).toBe(true);
    expect(
      looksLikeCryptoPriceMarket(
        "Will Solana trade between $100 and $150 in December?"
      )
    ).toBe(true);
    expect(
      looksLikeCryptoPriceMarket("Will a Bitcoin ETF be approved in 2026?")
    ).toBe(false);
  });

  it("detects entity price, social-count, and view-count markets", () => {
    expect(
      looksLikeEntityPriceMarket(
        "Will Micron Technology, Inc. (MU) hit (HIGH) $870 Week of November 16 2026?"
      )
    ).toBe(true);
    expect(
      looksLikeEntityPriceMarket("S&P 500 (SPY) closes above $740 on November 16?")
    ).toBe(true);
    expect(
      looksLikeSocialCountMarket(
        "Will Elon Musk post 300-319 tweets from November 13 to November 20, 2026?"
      )
    ).toBe(true);
    expect(
      looksLikeSocialCountMarket(
        "Will Donald Trump post 100-119 Truth Social posts from November 13 to November 20, 2026?"
      )
    ).toBe(true);
    expect(
      looksLikeViewCountMarket(
        "Will MrBeast's next video get between 76 and 77 million views on day 4?"
      )
    ).toBe(true);
    expect(looksLikeEntityPriceMarket("Fed cuts rates in December?")).toBe(false);
  });

  it("maps tags and excludes sports / weather / crypto-price tags", () => {
    expect(mapCategory(["Politics"])).toBe("Politics");
    expect(mapCategory(["Crypto"])).toBe("Crypto");
    expect(mapCategory(["Sports"])).toBeNull();
    expect(mapCategory(["Esports"])).toBeNull();
    expect(mapCategory(["Weather"])).toBeNull();
    expect(mapCategory(["Up or Down"])).toBeNull();
    expect(mapCategory(["Crypto Prices"])).toBeNull();
  });
});

describe("filterBonds", () => {
  const now = new Date("2026-11-16T12:00:00Z");
  const bonds: Bond[] = [
    {
      id: "a",
      question: "Fed cuts rates in December?",
      side: "NO",
      buyPrice: 0.94,
      returnPct: 0.0638,
      daysLeft: 30,
      apy: 0.77,
      liquidity: 10000,
      endDate: "2026-12-16T00:00:00Z",
      tradeUrl: "https://polymarket.com/event/a",
      category: "Economy",
      slug: "a",
    },
    {
      id: "b",
      question: "Will Bitcoin hit $100k by Dec 31?",
      side: "YES",
      buyPrice: 0.97,
      returnPct: 0.0309,
      daysLeft: 5,
      apy: 0.94,
      liquidity: 8000,
      endDate: "2026-11-21T00:00:00Z",
      tradeUrl: "https://polymarket.com/event/b",
      category: "Crypto",
      slug: "b",
    },
  ];

  it("filters by week range", () => {
    const result = filterBonds(bonds, { range: "week", now });
    expect(result.map((b) => b.id)).toEqual(["b"]);
  });

  it("filters by min price, search, and category", () => {
    expect(filterBonds(bonds, { now }).map((b) => b.id)).toEqual(["b"]);
    expect(filterBonds(bonds, { minPrice: 0.97, now }).map((b) => b.id)).toEqual([
      "b",
    ]);
    expect(
      filterBonds(bonds, { q: "fed", minPrice: 0.9, now }).map((b) => b.id)
    ).toEqual(["a"]);
    expect(
      filterBonds(bonds, { category: "Economy", minPrice: 0.9, now }).map(
        (b) => b.id
      )
    ).toEqual(["a"]);
    expect(
      filterBonds(bonds, { category: "Crypto", now }).map((b) => b.id)
    ).toEqual(["b"]);
  });
});
