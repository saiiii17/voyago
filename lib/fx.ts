const FX_BASE_URL = "https://open.er-api.com/v6/latest";

interface FxResponse {
  result: string;
  rates: Record<string, number>;
}

/**
 * Free, no-API-key exchange rates (exchangerate-api.com's open endpoint),
 * updated daily. Chosen over ECB-based providers like Frankfurter because
 * those only cover ~30 major currencies and notably omit VND — which
 * matters when the whole point of this app is a Vietnam trip.
 */
async function getUsdRates(): Promise<Record<string, number>> {
  const res = await fetch(`${FX_BASE_URL}/USD`, { next: { revalidate: 6 * 60 * 60 } });
  if (!res.ok) throw new Error(`FX rate fetch failed: ${res.status}`);
  const data: FxResponse = await res.json();
  if (data.result !== "success") throw new Error("FX rate fetch returned an error result");
  return data.rates;
}

/** Rate to convert 1 unit of `from` into `to` (multiply an amount in `from` by this). */
export async function getExchangeRate(from: string, to: string): Promise<number> {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  if (fromCode === toCode) return 1;

  const rates = await getUsdRates();
  const fromRate = rates[fromCode];
  const toRate = rates[toCode];
  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency pair: ${fromCode} -> ${toCode}`);
  }
  return toRate / fromRate;
}

export async function listSupportedCurrencies(): Promise<string[]> {
  const rates = await getUsdRates();
  return Object.keys(rates).sort();
}
