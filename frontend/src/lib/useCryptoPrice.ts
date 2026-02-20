"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CryptoPrice {
  /** USD price per 1 unit of the native currency */
  usdPrice: number;
  /** Whether this is a live price or a mock/fallback */
  isLive: boolean;
  /** Human-readable source label */
  source: string;
  /** Timestamp (ms) when price was fetched */
  fetchedAt: number;
}

export interface UseCryptoPriceReturn {
  /** Current price info */
  price: CryptoPrice;
  /** Whether a fetch is in flight */
  isLoading: boolean;
  /** Last fetch error, if any */
  error: string | null;
  /** Convert a crypto amount string to USD */
  cryptoToUsd: (cryptoAmount: string) => number | null;
  /** Convert a USD amount string to crypto */
  usdToCrypto: (usdAmount: string) => number | null;
  /** Force a fresh price fetch */
  refresh: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 60_000; // 60 seconds

/** Mock rate for ADI testnet native token */
const ADI_MOCK_RATE = 0.5;

/** DDSC is a stablecoin pegged 1:1 to USD */
const DDSC_RATE = 1.0;

/** CoinGecko free API endpoint for HBAR */
const COINGECKO_HBAR_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd";

// ---------------------------------------------------------------------------
// In-memory price cache (shared across hook instances)
// ---------------------------------------------------------------------------

interface CacheEntry {
  price: number;
  fetchedAt: number;
}

const priceCache: Record<string, CacheEntry> = {};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that provides real-time fiat-to-crypto price conversion.
 *
 * @param isHedera - true when the connected chain is Hedera (296)
 * @param currencySymbol - the native currency symbol ("ADI", "HBAR", "DDSC", etc.)
 */
export function useCryptoPrice(
  isHedera: boolean,
  currencySymbol: string
): UseCryptoPriceReturn {
  const cacheKey = isHedera ? "hbar" : currencySymbol.toLowerCase();
  const isMounted = useRef(true);

  const getMockPrice = useCallback((): CryptoPrice => {
    if (isHedera) {
      return {
        usdPrice: 0.0,
        isLive: false,
        source: "Fetching...",
        fetchedAt: Date.now(),
      };
    }
    if (currencySymbol === "DDSC") {
      return {
        usdPrice: DDSC_RATE,
        isLive: false,
        source: "Stablecoin (1:1 USD)",
        fetchedAt: Date.now(),
      };
    }
    // ADI testnet
    return {
      usdPrice: ADI_MOCK_RATE,
      isLive: false,
      source: "Testnet estimate",
      fetchedAt: Date.now(),
    };
  }, [isHedera, currencySymbol]);

  const [price, setPrice] = useState<CryptoPrice>(() => {
    // Return cached if still valid
    const cached = priceCache[cacheKey];
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return {
        usdPrice: cached.price,
        isLive: isHedera,
        source: isHedera ? "Live price from CoinGecko" : "Testnet estimate",
        fetchedAt: cached.fetchedAt,
      };
    }
    return getMockPrice();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    // For non-Hedera chains, use mock rates (no API call needed)
    if (!isHedera) {
      const mock = getMockPrice();
      if (isMounted.current) {
        setPrice(mock);
        priceCache[cacheKey] = {
          price: mock.usdPrice,
          fetchedAt: mock.fetchedAt,
        };
      }
      return;
    }

    // Check cache first
    const cached = priceCache[cacheKey];
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      if (isMounted.current) {
        setPrice({
          usdPrice: cached.price,
          isLive: true,
          source: "Live price from CoinGecko",
          fetchedAt: cached.fetchedAt,
        });
      }
      return;
    }

    // Fetch from CoinGecko
    if (isMounted.current) setIsLoading(true);
    try {
      const res = await fetch(COINGECKO_HBAR_URL);
      if (!res.ok) throw new Error(`CoinGecko API returned ${res.status}`);
      const data = await res.json();
      const usd = data?.["hedera-hashgraph"]?.usd;
      if (typeof usd !== "number" || usd <= 0) {
        throw new Error("Invalid price data from CoinGecko");
      }

      const now = Date.now();
      priceCache[cacheKey] = { price: usd, fetchedAt: now };

      if (isMounted.current) {
        setPrice({
          usdPrice: usd,
          isLive: true,
          source: "Live price from CoinGecko",
          fetchedAt: now,
        });
        setError(null);
      }
    } catch (err) {
      // Fallback: use a reasonable HBAR mock rate
      const fallbackRate = 0.07; // rough HBAR fallback
      const now = Date.now();
      if (isMounted.current) {
        setPrice({
          usdPrice: fallbackRate,
          isLive: false,
          source: "Estimate (CoinGecko unavailable)",
          fetchedAt: now,
        });
        setError(
          err instanceof Error ? err.message : "Failed to fetch price"
        );
      }
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [isHedera, cacheKey, getMockPrice]);

  // Fetch on mount and when chain changes
  useEffect(() => {
    isMounted.current = true;
    fetchPrice();
    return () => {
      isMounted.current = false;
    };
  }, [fetchPrice]);

  // Auto-refresh every 60s for live prices
  useEffect(() => {
    if (!isHedera) return;
    const interval = setInterval(fetchPrice, CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, [isHedera, fetchPrice]);

  // Conversion helpers
  const cryptoToUsd = useCallback(
    (cryptoAmount: string): number | null => {
      const val = parseFloat(cryptoAmount);
      if (isNaN(val) || val < 0 || price.usdPrice <= 0) return null;
      return val * price.usdPrice;
    },
    [price.usdPrice]
  );

  const usdToCrypto = useCallback(
    (usdAmount: string): number | null => {
      const val = parseFloat(usdAmount);
      if (isNaN(val) || val < 0 || price.usdPrice <= 0) return null;
      return val / price.usdPrice;
    },
    [price.usdPrice]
  );

  return {
    price,
    isLoading,
    error,
    cryptoToUsd,
    usdToCrypto,
    refresh: fetchPrice,
  };
}
