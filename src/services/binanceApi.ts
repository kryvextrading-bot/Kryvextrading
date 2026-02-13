import CryptoJS from 'crypto-js';

const BASE_URL = 'https://api.binance.com';

export async function getBinanceBalances(apiKey: string, apiSecret: string): Promise<{ [symbol: string]: number }> {
  const endpoint = '/api/v3/account';
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch Binance balances');
  const data = await res.json();
  // data.balances is an array of { asset, free, locked }
  const balances: { [symbol: string]: number } = {};
  data.balances.forEach((b: any) => {
    const total = parseFloat(b.free) + parseFloat(b.locked);
    if (total > 0) balances[b.asset] = total;
  });
  return balances;
} 