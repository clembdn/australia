const DEFAULT_YAHOO_BASE_URL = import.meta.env.DEV
  ? '/api/yahoo'
  : 'https://query1.finance.yahoo.com'
const YAHOO_BASE_URL = (import.meta.env.VITE_YAHOO_PROXY_URL ?? DEFAULT_YAHOO_BASE_URL).replace(
  /\/$/,
  '',
)
const YAHOO_QUOTE_URL = `${YAHOO_BASE_URL}/v7/finance/quote`

export async function fetchYahooLiveQuote(symbol) {
  const endpoint = `${YAHOO_QUOTE_URL}?symbols=${encodeURIComponent(symbol)}`
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`Yahoo quote request failed with status ${response.status}`)
  }

  const payload = await response.json()
  const quote = payload?.quoteResponse?.result?.[0]

  if (!quote || typeof quote.regularMarketPrice !== 'number') {
    throw new Error(`No live quote returned for ${symbol}`)
  }

  return {
    symbol: quote.symbol ?? symbol,
    shortName: quote.shortName ?? quote.longName ?? symbol,
    currency: quote.currency ?? 'EUR',
    price: quote.regularMarketPrice,
  }
}
