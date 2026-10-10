// Code-level guard for "The Cut": no price, rate, range or estimate may leave the system
// in the studio's voice. A budget the CALLER volunteered may be reported (line must attribute it).

const PRICE_PATTERNS: RegExp[] = [
  /₹|\brs\.?\s*\d|\binr\b|\brupees?\b/i,
  /\b\d[\d,.]*\s*(lakhs?|lacs?|crores?|cr|k)\b/i,
  /\bper\s*(sq\.?\s*ft|square\s*f(oo|ee)t|sqft)\b/i,
  /\/\s*(sq\.?\s*ft|sqft)\b/i,
  /\b(costs?|quote[ds]?|estimate[ds]?|ballpark|price[ds]?|rate)\b.{0,40}\d/i,
];

const CALLER_ATTRIBUTION = /\b(caller|customer|client|they|he|she)\b.{0,40}\b(said|stated|mentioned|volunteered|budget|has a budget|wants to spend)|\bvolunteered\b|\bcaller'?s? (own )?budget\b/i;

export function isPriceLine(line: string): boolean {
  return PRICE_PATTERNS.some((p) => p.test(line));
}

/** Drops any line that states a price/estimate unless it is clearly the caller's own volunteered budget. */
export function stripPrices(text: string): { text: string; removed: string[] } {
  const removed: string[] = [];
  const kept = text.split(/\r?\n/).filter((line) => {
    if (isPriceLine(line) && !CALLER_ATTRIBUTION.test(line)) {
      removed.push(line);
      return false;
    }
    return true;
  });
  return { text: kept.join("\n"), removed };
}
