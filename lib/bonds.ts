export type BondCategory = "Politics" | "Crypto" | "Economy" | "Other";

export const BOND_CATEGORIES: BondCategory[] = [
  "Politics",
  "Crypto",
  "Economy",
  "Other",
];

export type RangeFilter = "week" | "month" | "year";
export type SortKey = "apy" | "return" | "ends" | "liquidity";
export type CategoryFilter = "all" | BondCategory;

export interface RawMarket {
  id?: string;
  question?: string;
  slug?: string;
  endDate?: string;
  image?: string;
  icon?: string;
  outcomes?: string;
  outcomePrices?: string;
  bestBid?: number | null;
  bestAsk?: number | null;
  liquidityNum?: number | null;
  volumeNum?: number | null;
  volume24hr?: number | null;
  acceptingOrders?: boolean;
  enableOrderBook?: boolean;
  closed?: boolean;
  feesEnabled?: boolean;
  events?: Array<{ slug?: string; title?: string }>;
}

export interface RawEvent {
  slug?: string;
  title?: string;
  tags?: Array<{ label?: string }>;
  markets?: unknown[];
}

export interface Bond {
  id: string;
  question: string;
  side: string;
  buyPrice: number;
  returnPct: number;
  daysLeft: number;
  apy: number;
  liquidity: number;
  endDate: string;
  tradeUrl: string;
  category: BondCategory;
  slug: string;
}

export interface BondAggregates {
  totalLiquidity: number;
  count: number;
  avgReturn: number;
  nextPays: number | null;
}

export interface BondsPayload {
  bonds: Bond[];
  fetchedAt: string;
  year: number;
  error?: string;
}

const GAMMA = "https://gamma-api.polymarket.com";
const PAGE_SIZE = 100;
export const POLYMARKET_REFERRAL = "via=freeBONDS";

/** Ensure a Polymarket URL carries the referral query. */
export function withReferral(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("via", "freeBONDS");
    return parsed.toString();
  } catch {
    const bare = url.split("#")[0] ?? url;
    const hash = url.includes("#") ? `#${url.split("#").slice(1).join("#")}` : "";
    if (/[?&]via=/.test(bare)) {
      return bare.replace(/([?&])via=[^&]*/i, `$1${POLYMARKET_REFERRAL}`) + hash;
    }
    return `${bare}${bare.includes("?") ? "&" : "?"}${POLYMARKET_REFERRAL}${hash}`;
  }
}

// Local networks sometimes need a longer connect window to reach Gamma.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const undici = require("undici") as typeof import("undici");
  undici.setGlobalDispatcher(
    new undici.Agent({
      connect: { timeout: 90_000 },
      headersTimeout: 180_000,
      bodyTimeout: 180_000,
    })
  );
} catch {
  // undici optional at edge
}

/**
 * Inclusive end of the "before Dec 31 / this year" window.
 * Polymarket often stamps Dec 31 ET close as Jan 1 ~04:59–05:00 UTC
 * (e.g. "Will X happen before 2027?" → 2027-01-01T04:59:00Z).
 */
export function yearEndCutoff(year: number): Date {
  return new Date(Date.UTC(year + 1, 0, 1, 12, 0, 0));
}

export function parseJsonArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Sports / esports are not bonds — drop them entirely. */
export function isSportsOrEsportsLabel(labels: string[]): boolean {
  const joined = labels.map((l) => l.toLowerCase());
  return joined.some(
    (l) =>
      l.includes("sport") ||
      l.includes("esport") ||
      l.includes("nba") ||
      l.includes("nfl") ||
      l.includes("nhl") ||
      l.includes("mlb") ||
      l.includes("mls") ||
      l.includes("soccer") ||
      l.includes("football") ||
      l.includes("basketball") ||
      l.includes("baseball") ||
      l.includes("hockey") ||
      l.includes("tennis") ||
      l.includes("golf") ||
      l.includes("ufc") ||
      l.includes("mma") ||
      l.includes("boxing") ||
      l.includes("cricket") ||
      l.includes("rugby") ||
      l.includes("f1") ||
      l.includes("formula 1") ||
      l.includes("racing") ||
      l.includes("olymp") ||
      l.includes("lol") ||
      l.includes("dota") ||
      l.includes("csgo") ||
      l.includes("cs2") ||
      l.includes("valorant") ||
      l.includes("league of legends") ||
      l.includes("games") ||
      l.includes("ncaa") ||
      l.includes("premier league") ||
      l.includes("champions league")
  );
}

export function isWeatherLabel(labels: string[]): boolean {
  return labels.some((l) => {
    const lower = l.toLowerCase();
    return (
      lower.includes("weather") ||
      lower.includes("temperature") ||
      lower.includes("climate") ||
      lower.includes("rainfall") ||
      lower.includes("hurricane") ||
      lower.includes("forecast")
    );
  });
}

export function looksLikeWeatherMarket(question: string, slug = ""): boolean {
  const text = `${question} ${slug}`.toLowerCase();
  return (
    /\bhighest temperature\b/.test(text) ||
    /\blowest temperature\b/.test(text) ||
    /\btemperature in\b/.test(text) ||
    (/\btemp(erature)?\b/.test(text) &&
      /(°|celsius|fahrenheit|\b\d+\s*[cf]\b)/.test(text)) ||
    /\b\d+\s*°\s*[cf]\b/.test(text) ||
    /\bbetween \d+-\d+\s*°?\s*[cf]\b/.test(text) ||
    /\b(rainfall|precipitation|snowfall|snow depth)\b/.test(text) ||
    /\bwill it (rain|snow|storm|be sunny|be cloudy)\b/.test(text) ||
    /\brain in\b/.test(text) ||
    /\bsnow in\b/.test(text) ||
    /\bweather\b/.test(text) ||
    /\bhurricane\b/.test(text) ||
    /temperature/.test(slug) ||
    /weather/.test(slug) ||
    /highest-temp/.test(slug) ||
    /lowest-temp/.test(slug) ||
    /\brain-in-/.test(slug)
  );
}

const SPORTS_MASCOT =
  /\b(tigers|wildcats|bulldogs|cardinals|grizzlies|aggies|celtics|lakers|yankees|dodgers|cowboys|patriots|chiefs|eagles|ravens|chargers|nuggets|suns|warriors|pelicans|wizards|timberwolves|trail blazers|76ers|nets|bulls|cavaliers|magic|heat|spurs|rockets|mavericks|clippers|kings|hornets|pistons|pacers|bucks|hawks|raptors|knicks|bears|packers|vikings|lions|saints|falcons|panthers|buccaneers|steelers|browns|bengals|colts|jaguars|titans|texans|broncos|raiders|rams|49ers|seahawks|commanders|giants|jets|bills|dolphins|steelers|guardians|red sox|cubs|mets|phillies|braves|mariners|astros|rangers|twins|royals|white sox|orioles|blue jays|nationals|padres|giants|rockies|diamondbacks|marlins|brewers|pirates|reds|athletics|angels)\b/i;

export function looksLikeSportsMarket(question: string, slug = ""): boolean {
  const text = `${question} ${slug}`.toLowerCase();
  const q = question.trim().toLowerCase();

  if (
    /\bexact score\b/.test(text) ||
    /\bo\/u\b/.test(text) ||
    /\bover\/under\b/.test(text) ||
    /\bspread\s*:/.test(text) ||
    /\b1st half\b/.test(text) ||
    /\b2nd half\b/.test(text) ||
    /\bhalftime\b/.test(text) ||
    /\bend in a draw\b/.test(text) ||
    /\bwinning margin\b/.test(text) ||
    /\bmap \d\b/.test(text) ||
    /\banytime goalscorer\b/.test(text) ||
    /\bgoals?\s*\+\s*assists?\b/.test(text) ||
    /\b\+?\d+\+?\s*goals?\b/.test(text) ||
    /\ball[-\s]?star\b/.test(text) ||
    /\bto score first\b/.test(text) ||
    /\bscore first\b/.test(text) ||
    /\b(nba|nfl|nhl|mlb|mls|ufc|mma|atp|wta|pga|lpga|ncaa|wnba|epl)\b/.test(text) ||
    /\b(esport|e-sport)/.test(text) ||
    /\b(csgo|cs2|dota|valorant|lol|league of legends|gmgn|ggc)\b/.test(text) ||
    /\b(mls cup|world cup|super bowl|stanley cup|nba finals|fifa|rsm classic|ryder cup|the masters)\b/.test(text) ||
    /\bwin the .{0,60}(classic|open|championship|invitational|masters)\b/.test(text) ||
    /\b(bo[135]|best of [135])\b/.test(text) ||
    /-(vs|o-u|spread|exact-score|moneyline)-/.test(slug.toLowerCase()) ||
    /\bvs\.?\b/.test(text) ||
    /\bwill .+ win on \d{4}-\d{2}-\d{2}\b/.test(text) ||
    SPORTS_MASCOT.test(text)
  ) {
    return true;
  }

  // "Will X win?" — sports/match, not elections
  if (
    /^will .+ win\??$/.test(q) &&
    !/\b(election|primary|nomination|seat|race for|presidency|president|senator|governor)\b/.test(
      q
    )
  ) {
    return true;
  }

  return false;
}

const CRYPTO_ASSET =
  /\b(bitcoin|btc|ethereum|ether|eth|solana|sol|xrp|ripple|dogecoin|doge|cardano|avalanche|avax|polygon|matic|chainlink|polkadot|litecoin|ltc|binance|bnb|toncoin|ton|sui|pepe|shiba|shib|zcash|zec|meme\s*coin)\b/i;

const CRYPTO_PRICE_SIGNAL =
  /\b(price|between|above|below|under|over|dip(?:s|ped|ping)?\s+to|hit|reach(?:es|ed)?|at\s+least|more\s+than|less\s+than|greater\s+than|fall(?:s|ing)?\s+to|rise(?:s|ing)?\s+to|trade(?:s|ing)?\s+(above|below|at)|\$[\d,]+(?:\.\d+)?[kmb]?)\b/i;

/** Crypto up/down + price/range markets — too volatile to treat as bonds. */
export function looksLikeCryptoPriceMarket(
  question: string,
  slug = "",
  outcomes: string[] = []
): boolean {
  const text = `${question} ${slug}`.toLowerCase();

  // Explicit up/down short-term markets
  if (/\bup or down\b/.test(text)) return true;
  if (/\bup\/down\b/.test(text)) return true;
  if (/up-?down/.test(text)) return true;
  if (
    /-(5|15|60)m-/.test(slug.toLowerCase()) &&
    /updown|up-down|up_or_down/.test(slug.toLowerCase())
  ) {
    return true;
  }

  const normalized = outcomes.map((o) => o.trim().toLowerCase()).sort();
  if (
    normalized.length === 2 &&
    normalized[0] === "down" &&
    normalized[1] === "up"
  ) {
    return true;
  }

  // "Bitcoin price on …", "Ethereum Price - …"
  if (CRYPTO_ASSET.test(text) && /\bprice\b/.test(text)) return true;

  // Range / level markets naming a crypto asset + a price signal
  if (CRYPTO_ASSET.test(text) && CRYPTO_PRICE_SIGNAL.test(text)) {
    // Dollar amounts or between-ranges make this a price market
    if (
      /\$[\d,]/.test(text) ||
      /\bbetween\b/.test(text) ||
      /\b(above|below|under|over|dip|hit|reach|fall|rise)\b/.test(text)
    ) {
      return true;
    }
  }

  // Slug patterns: btc-price-…, eth-between-…, sol-above-…
  if (
    /\b(btc|eth|sol|xrp|doge|ada|avax|bnb|ton|sui|pepe|shib|bitcoin|ethereum|solana)[-_](price|above|below|between|dip|hit|reach|under|over)/i.test(
      slug
    )
  ) {
    return true;
  }

  return false;
}

/** @deprecated Use looksLikeCryptoPriceMarket */
export function looksLikeCryptoUpDownMarket(
  question: string,
  slug = "",
  outcomes: string[] = []
): boolean {
  return looksLikeCryptoPriceMarket(question, slug, outcomes);
}

export function isCryptoPriceLabel(labels: string[]): boolean {
  return labels.some((l) => {
    const lower = l.toLowerCase();
    return (
      lower.includes("up or down") ||
      lower.includes("up-or-down") ||
      lower === "updown" ||
      lower.includes("up/down") ||
      lower.includes("crypto prices") ||
      lower === "crypto price" ||
      (lower.includes("pre-market") && lower.includes("crypto"))
    );
  });
}

/**
 * Stock / commodity / equity price levels — not bonds.
 * e.g. "Micron … hit (HIGH) $870", "S&P 500 closes above $740", "Silver hit (HIGH) $50"
 */
export function looksLikeEntityPriceMarket(question: string, slug = ""): boolean {
  const text = `${question} ${slug}`.toLowerCase();
  return (
    /\bhit\s*\(\s*(high|low)\s*\)\b/.test(text) ||
    /\b(hit|reach(?:es|ed)?|trade(?:s|ing)?)\s+(high|low)\b/.test(text) ||
    /\bcloses?\s+(above|below|over|under)\s*\$/.test(text) ||
    (/\b(stock|share|equity|etf|nasdaq|nyse|s&p|spx|spy|qqq|dow)\b/.test(text) &&
      /(\$|above|below|hit|close|high|low|price)/.test(text)) ||
    /\b[a-z0-9.&]+\s*\([a-z]{1,5}\)\s+(hit|close|reach|above|below)/.test(text) ||
    (/\b(xagusd|xauusd|gold|silver)\b/.test(text) &&
      /(\$|hit|high|low|above|below|price)/.test(text)) ||
    /hit-high|hit-low|closes-above|closes-below/.test(slug.toLowerCase())
  );
}

/**
 * Tweet / Truth Social / post-count markets — not bonds.
 * e.g. "Will Elon Musk post 300-319 tweets…", "Truth Social posts…"
 */
export function looksLikeSocialCountMarket(question: string, slug = ""): boolean {
  const text = `${question} ${slug}`.toLowerCase();
  return (
    /\btweets?\b/.test(text) ||
    /\btruth social\b/.test(text) ||
    /\bwhite house post/.test(text) ||
    (/\bpost(?:s|ed|ing)?\s+\d/.test(text) &&
      /\b(tweet|truth social|posts?\s+from)\b/.test(text)) ||
    /\bpost\s+\d{1,4}[-–]\d{1,4}\s+(tweets?|posts?|truth)/.test(text) ||
    /tweets?-from|truth-social|posts-from/.test(slug.toLowerCase())
  );
}

/**
 * View-count / engagement vanity metrics — not bonds.
 * e.g. "MrBeast's next video get between 76 and 77 million views"
 */
export function looksLikeViewCountMarket(question: string, slug = ""): boolean {
  const text = `${question} ${slug}`.toLowerCase();
  return (
    /\b(million|billion)?\s*views?\b/.test(text) ||
    /\bmr\.?\s*beast\b/.test(text) ||
    (/\b(youtube|tiktok|instagram)\b/.test(text) &&
      /\b(views?|subscribers?|likes?)\b/.test(text)) ||
    /million-views|views-on|video-get/.test(slug.toLowerCase())
  );
}

/** Markets that should never appear as bonds. */
export function isExcludedBondMarket(
  question: string,
  slug = "",
  outcomes: string[] = []
): boolean {
  return (
    looksLikeSportsMarket(question, slug) ||
    looksLikeWeatherMarket(question, slug) ||
    looksLikeCryptoPriceMarket(question, slug, outcomes) ||
    looksLikeEntityPriceMarket(question, slug) ||
    looksLikeSocialCountMarket(question, slug) ||
    looksLikeViewCountMarket(question, slug)
  );
}

export function mapCategory(labels: string[]): BondCategory | null {
  if (isSportsOrEsportsLabel(labels)) return null;
  if (isWeatherLabel(labels)) return null;
  if (isCryptoPriceLabel(labels)) return null;

  const joined = labels.map((l) => l.toLowerCase());
  if (
    joined.some(
      (l) =>
        l.includes("politic") ||
        l.includes("election") ||
        l.includes("geopolitic")
    )
  ) {
    return "Politics";
  }
  if (joined.some((l) => l.includes("crypto") || l.includes("bitcoin") || l.includes("ethereum"))) {
    return "Crypto";
  }
  if (
    joined.some(
      (l) =>
        l.includes("econom") ||
        l.includes("finance") ||
        l.includes("fed") ||
        l.includes("business") ||
        l.includes("macro")
    )
  ) {
    return "Economy";
  }
  return "Other";
}

export function computeBuyPrice(
  favouriteIndex: 0 | 1,
  bestBid: number | null | undefined,
  bestAsk: number | null | undefined,
  prices: number[]
): number | null {
  if (favouriteIndex === 0) {
    if (typeof bestAsk === "number" && Number.isFinite(bestAsk) && bestAsk > 0) {
      return bestAsk;
    }
    return typeof prices[0] === "number" && Number.isFinite(prices[0]) ? prices[0] : null;
  }

  // bestBid === 0 is useless (implies buy=1); fall back to outcome price
  if (typeof bestBid === "number" && Number.isFinite(bestBid) && bestBid > 0) {
    return 1 - bestBid;
  }
  return typeof prices[1] === "number" && Number.isFinite(prices[1]) ? prices[1] : null;
}

export function computeReturnPct(buy: number): number {
  return (1 - buy) / buy;
}

export function computeDaysLeft(endDate: Date, now: Date): number {
  const ms = endDate.getTime() - now.getTime();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export function computeApy(returnPct: number, daysLeft: number): number {
  const days = Math.max(1, daysLeft);
  return (1 + returnPct) ** (365 / days) - 1;
}

export function profit(amount: number, returnPct: number): number {
  return amount * returnPct;
}

export function sideLabel(outcomeName: string): string {
  const trimmed = outcomeName.trim();
  if (/^yes$/i.test(trimmed)) return "YES";
  if (/^no$/i.test(trimmed)) return "NO";
  return trimmed.toUpperCase();
}

export function formatLiquidity(value: number): string {
  if (value >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `$${trimFixed(n, n >= 10 ? 1 : 1)}B`;
  }
  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `$${trimFixed(n, 1)}M`;
  }
  if (value >= 1_000) {
    const n = value / 1_000;
    return `$${trimFixed(n, n >= 100 ? 0 : 1)}K`;
  }
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function trimFixed(n: number, digits: number): string {
  return n.toFixed(digits).replace(/\.0$/, "");
}

export function formatCents(price: number): string {
  return `${Math.round(price * 100)}¢`;
}

export function formatProfit(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
}

export function formatReturnPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatApy(apy: number): string {
  const pct = apy * 100;
  if (pct > 999) return ">999%";
  return `${Math.round(pct)}%`;
}

export function formatEnds(daysLeft: number, endDate: Date, now: Date): string {
  const ms = endDate.getTime() - now.getTime();
  if (ms < 86_400_000) return "<1d";
  return `${daysLeft}d`;
}

export function formatAsOf(fetchedAt: string): string {
  const d = new Date(fetchedAt);
  if (Number.isNaN(d.getTime())) return "snapshot";
  return `as of ${d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })}`;
}

export interface MarketToBondOptions {
  now?: Date;
  year?: number;
  minPrice?: number;
  categoryByEventSlug?: Map<string, BondCategory>;
}

export function marketToBond(
  market: RawMarket,
  options: MarketToBondOptions = {}
): Bond | null {
  const now = options.now ?? new Date();
  const year = options.year ?? now.getUTCFullYear();
  const minPrice = options.minPrice ?? 0.95;
  const cutoff = yearEndCutoff(year);

  if (market.closed) return null;
  if (!market.acceptingOrders || !market.enableOrderBook) return null;

  const question = market.question?.trim() || "Untitled market";
  const slug = market.slug ?? "";

  const endRaw = market.endDate;
  if (!endRaw) return null;
  const endDate = new Date(endRaw);
  if (Number.isNaN(endDate.getTime())) return null;
  if (endDate.getTime() <= now.getTime()) return null;
  if (endDate.getTime() > cutoff.getTime()) return null;

  const liquidity = Number(market.liquidityNum ?? 0);
  if (!Number.isFinite(liquidity) || liquidity < 1000) return null;

  const outcomes = parseJsonArray<string>(market.outcomes);
  const prices = parseJsonArray<string | number>(market.outcomePrices).map(Number);
  if (outcomes.length !== 2 || prices.length !== 2) return null;
  if (!prices.every((p) => Number.isFinite(p))) return null;
  if (isExcludedBondMarket(question, slug, outcomes)) return null;

  const favouriteIndex: 0 | 1 = prices[0] >= prices[1] ? 0 : 1;
  let buy = computeBuyPrice(
    favouriteIndex,
    market.bestBid,
    market.bestAsk,
    prices
  );
  // Stale book can push buy just over 99.5¢ — fall back to last outcome price
  if (buy != null && buy > 0.995) {
    const fallback = prices[favouriteIndex];
    if (typeof fallback === "number" && fallback >= minPrice && fallback <= 0.995) {
      buy = fallback;
    }
  }
  if (buy == null || !Number.isFinite(buy)) return null;
  if (buy < minPrice || buy > 0.995) return null;

  const returnPct = computeReturnPct(buy);
  const daysLeft = computeDaysLeft(endDate, now);
  const apy = computeApy(returnPct, daysLeft);
  const eventSlug = market.events?.[0]?.slug ?? market.slug ?? "";
  const category =
    (eventSlug && options.categoryByEventSlug?.get(eventSlug)) || "Other";

  return {
    id: String(market.id ?? `${market.slug}-${favouriteIndex}`),
    question,
    side: sideLabel(outcomes[favouriteIndex] ?? (favouriteIndex === 0 ? "Yes" : "No")),
    buyPrice: buy,
    returnPct,
    daysLeft,
    apy,
    liquidity,
    endDate: endDate.toISOString(),
    tradeUrl: withReferral(
      eventSlug
        ? `https://polymarket.com/event/${eventSlug}`
        : "https://polymarket.com"
    ),
    category,
    slug: market.slug ?? eventSlug,
  };
}

export function filterBonds(
  bonds: Bond[],
  opts: {
    range?: RangeFilter;
    minPrice?: number;
    q?: string;
    category?: CategoryFilter;
    now?: Date;
  } = {}
): Bond[] {
  const now = opts.now ?? new Date();
  const minPrice = opts.minPrice ?? 0.95;
  const range = opts.range ?? "year";
  const category = opts.category ?? "all";
  const q = (opts.q ?? "").trim().toLowerCase();

  const maxDays = range === "week" ? 7 : range === "month" ? 30 : null;

  return bonds.filter((b) => {
    if (b.buyPrice < minPrice || b.buyPrice > 0.995) return false;
    if (category !== "all" && b.category !== category) return false;
    if (maxDays != null) {
      const end = new Date(b.endDate);
      const days = computeDaysLeft(end, now);
      if (days > maxDays) return false;
    }
    if (q && !b.question.toLowerCase().includes(q)) return false;
    return true;
  });
}

export function sortBonds(bonds: Bond[], sort: SortKey = "apy"): Bond[] {
  const copy = [...bonds];
  copy.sort((a, b) => {
    switch (sort) {
      case "return":
        return b.returnPct - a.returnPct;
      case "ends":
        return a.daysLeft - b.daysLeft || new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case "liquidity":
        return b.liquidity - a.liquidity;
      case "apy":
      default:
        return b.apy - a.apy;
    }
  });
  return copy;
}

export function computeAggregates(bonds: Bond[]): BondAggregates {
  if (bonds.length === 0) {
    return { totalLiquidity: 0, count: 0, avgReturn: 0, nextPays: null };
  }

  const totalLiquidity = bonds.reduce((sum, b) => sum + b.liquidity, 0);
  const weighted = bonds.reduce((sum, b) => sum + b.returnPct * b.liquidity, 0);
  const avgReturn = totalLiquidity > 0 ? weighted / totalLiquidity : 0;
  const nextPays = bonds.reduce(
    (min, b) => (min == null ? b.daysLeft : Math.min(min, b.daysLeft)),
    null as number | null
  );

  return {
    totalLiquidity,
    count: bonds.length,
    avgReturn,
    nextPays,
  };
}

const MAX_OFFSET = 2000; // Gamma rejects larger offsets on /markets

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchJsonPage<T>(
  path: string,
  query: Record<string, string>,
  offset: number
): Promise<{ page: T[]; exhausted: boolean }> {
  const url = new URL(path, GAMMA);
  for (const [k, v] of Object.entries(query)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        const body = await res.text();
        // Offset ceiling — treat as end of available pages
        if (res.status === 422 && /offset too large/i.test(body)) {
          return { page: [], exhausted: true };
        }
        throw new Error(`Polymarket API ${res.status} for ${path}`);
      }

      const page = (await res.json()) as T[];
      if (!Array.isArray(page)) {
        throw new Error(`Unexpected response from ${path}`);
      }
      return { page, exhausted: false };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await sleep(400 * (attempt + 1));
    }
  }

  throw lastError ?? new Error(`Polymarket API failed for ${path}`);
}

async function fetchAllPages<T>(
  path: string,
  query: Record<string, string>
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;

  for (;;) {
    if (offset > MAX_OFFSET) break;
    const { page, exhausted } = await fetchJsonPage<T>(path, query, offset);
    if (exhausted) break;
    results.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return results;
}

/**
 * Gamma caps offset at 2000 (~2100 rows). Merge several sort orders so
 * lower-liquidity but still-valid bonds aren't dropped just because they
 * aren't in the top liquidity page window.
 * Runs sequentially — parallel hammering causes ECONNRESET from Gamma.
 */
async function fetchMarketsMerged(
  baseQuery: Record<string, string>
): Promise<RawMarket[]> {
  const sortPasses: Array<Record<string, string>> = [
    { order: "liquidityNum", ascending: "false" },
    { order: "volume24hr", ascending: "false" },
    { order: "endDate", ascending: "true" },
  ];

  const byId = new Map<string, RawMarket>();

  for (const sort of sortPasses) {
    try {
      const page = await fetchAllPages<RawMarket>("/markets", {
        ...baseQuery,
        ...sort,
      });
      for (const market of page) {
        const id = String(market.id ?? market.slug ?? "");
        if (!id || byId.has(id)) continue;
        byId.set(id, market);
      }
    } catch {
      // Keep whatever we already collected from earlier passes
    }
  }

  if (byId.size === 0) {
    throw new Error("Polymarket data is temporarily unavailable");
  }

  return [...byId.values()];
}

export type CategoryLookup = {
  categoryBySlug: Map<string, BondCategory>;
  /** Event slugs tagged as sports/esports/up-down — exclude from bonds. */
  excludedSlugs: Set<string>;
};

/** Resolve categories via /events/slug/{slug} for only the events we need. */
export async function fetchCategoryMap(
  _year: number,
  neededSlugs: Iterable<string>
): Promise<CategoryLookup> {
  const slugs = [...new Set([...neededSlugs].filter(Boolean))];
  const categoryBySlug = new Map<string, BondCategory>();
  const excludedSlugs = new Set<string>();
  if (slugs.length === 0) return { categoryBySlug, excludedSlugs };

  const concurrency = 8;
  for (let i = 0; i < slugs.length; i += concurrency) {
    const batch = slugs.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (slug) => {
        try {
          const res = await fetch(`${GAMMA}/events/slug/${encodeURIComponent(slug)}`, {
            cache: "no-store",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            categoryBySlug.set(slug, "Other");
            return;
          }
          const event = (await res.json()) as RawEvent;
          const labels = (event.tags ?? [])
            .map((t) => t.label)
            .filter((l): l is string => Boolean(l));
          const category = mapCategory(labels);
          if (category == null) {
            excludedSlugs.add(slug);
            return;
          }
          categoryBySlug.set(slug, category);
        } catch {
          categoryBySlug.set(slug, "Other");
        }
      })
    );
  }

  return { categoryBySlug, excludedSlugs };
}

let bondsCache: BondsPayload | null = null;

/** Drop markets that current exclusion rules reject (also cleans old snapshots). */
export function sanitizeBonds(bonds: Bond[]): Bond[] {
  return bonds
    .filter(
      (b) =>
        !isExcludedBondMarket(b.question, b.slug) &&
        b.category !== undefined &&
        b.buyPrice >= 0.95 &&
        b.buyPrice <= 0.995
    )
    .map((b) => ({ ...b, tradeUrl: withReferral(b.tradeUrl) }));
}

function sanitizePayload(payload: BondsPayload): BondsPayload {
  const bonds = sanitizeBonds(payload.bonds);
  return { ...payload, bonds };
}

async function readSnapshot(): Promise<BondsPayload | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = await readFile(join(process.cwd(), "data", "bonds.json"), "utf8");
    const parsed = JSON.parse(raw) as BondsPayload;
    if (Array.isArray(parsed.bonds) && parsed.bonds.length > 0) {
      return sanitizePayload(parsed);
    }
  } catch {
    // no snapshot yet
  }
  return null;
}

async function writeSnapshot(payload: BondsPayload): Promise<void> {
  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "bonds.json"), JSON.stringify(payload));
  } catch {
    // non-fatal
  }
}

async function refreshBondsFromNetwork(now: Date): Promise<BondsPayload> {
  const year = now.getUTCFullYear();
  const nowISO = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const endMax = yearEndCutoff(year).toISOString().replace(/\.\d{3}Z$/, "Z");

  const markets = await fetchMarketsMerged({
    closed: "false",
    active: "true",
    end_date_min: nowISO,
    end_date_max: endMax,
    liquidity_num_min: "1000",
  });

  const bonds: Bond[] = [];
  for (const market of markets) {
    const bond = marketToBond(market, {
      now,
      year,
      minPrice: 0.95,
    });
    if (bond) bonds.push(bond);
  }

  bonds.sort((a, b) => b.liquidity - a.liquidity);

  const neededSlugs = [
    ...new Set(
      bonds.map((b) => {
        const match = b.tradeUrl.match(/\/event\/([^/?#]+)/);
        return match?.[1] ?? b.slug;
      })
    ),
  ].slice(0, 250);

  const lookup = await fetchCategoryMap(year, neededSlugs).catch(
    (): CategoryLookup => ({
      categoryBySlug: new Map(),
      excludedSlugs: new Set(),
    })
  );

  const kept: Bond[] = [];
  for (const bond of bonds) {
    const eventSlug =
      bond.tradeUrl.match(/\/event\/([^/?#]+)/)?.[1] ?? bond.slug;
    if (lookup.excludedSlugs.has(eventSlug)) continue;
    bond.category = lookup.categoryBySlug.get(eventSlug) ?? "Other";
    kept.push(bond);
  }

  kept.sort((a, b) => b.apy - a.apy);

  return {
    bonds: kept,
    fetchedAt: now.toISOString(),
    year,
  };
}

export async function fetchBonds(now = new Date()): Promise<BondsPayload> {
  if (bondsCache && bondsCache.bonds.length > 0 && !bondsCache.error) {
    const cleaned = sanitizePayload(bondsCache);
    bondsCache = cleaned;
    return cleaned;
  }

  const snapshot = await readSnapshot();
  if (snapshot && snapshot.bonds.length > 0) {
    bondsCache = snapshot;
    // Refresh in the background when possible; never block the page on Gamma.
    void refreshBondsFromNetwork(now)
      .then(async (payload) => {
        if (payload.bonds.length > 0) {
          const cleaned = sanitizePayload(payload);
          bondsCache = cleaned;
          await writeSnapshot(cleaned);
        }
      })
      .catch(() => {});
    return snapshot;
  }

  const year = now.getUTCFullYear();
  try {
    const payload = sanitizePayload(await refreshBondsFromNetwork(now));
    bondsCache = payload;
    await writeSnapshot(payload);
    return payload;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Polymarket data is temporarily unavailable";
    return {
      bonds: [],
      fetchedAt: now.toISOString(),
      year,
      error: message,
    };
  }
}
