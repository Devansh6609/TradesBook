"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";

interface AssetIconProps {
    symbol: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
}

// Map currency code to 2-letter country code for flagcdn
const CURRENCY_TO_FLAG: Record<string, string> = {
    USD: "us", EUR: "eu", GBP: "gb", JPY: "jp",
    AUD: "au", CAD: 'ca', CHF: "ch", NZD: "nz",
    CNY: "cn", HKD: "hk", SGD: "sg", SEK: "se",
    KRW: "kr", TRY: "tr", INR: "in", RUB: "ru",
    ZAR: "za", MXN: "mx", BRL: "br", IDR: "id",
    // Crypto mappings (generic)
    BTC: "btc", ETH: "eth", SOL: "sol", XRP: "xrp",
    // Metal mappings
    XAU: "xau", XAG: "xag",
};

// Special assets that need specific handling or logos
const SPECIAL_ASSETS: Record<string, { type: 'crypto' | 'metal' | 'index', base: string, quote?: string, logo?: string }> = {
    // Metals
    XAUUSD: { type: 'metal', base: 'XAU', quote: 'USD', logo: '/assets/GOLD.webp' }, 
    XAU: { type: 'metal', base: 'XAU', logo: '/assets/GOLD.webp' },
    XAGUSD: { type: 'metal', base: 'XAG', quote: 'USD' },
    // Crypto
    BTCUSD: { type: 'crypto', base: 'BTC', quote: 'USD', logo: 'https://assets.coincap.io/assets/icons/btc@2x.png' },
    ETHUSD: { type: 'crypto', base: 'ETH', quote: 'USD', logo: 'https://assets.coincap.io/assets/icons/eth@2x.png' },
    SOLUSD: { type: 'crypto', base: 'SOL', quote: 'USD', logo: 'https://assets.coincap.io/assets/icons/sol@2x.png' },
    XRPUSD: { type: 'crypto', base: 'XRP', quote: 'USD', logo: 'https://assets.coincap.io/assets/icons/xrp@2x.png' },
    // Indices
    US30: { type: 'index', base: 'US', quote: 'USD' },
    NAS100: { type: 'index', base: 'US', quote: 'USD' },
    SPX500: { type: 'index', base: 'US', quote: 'USD' },
    GER30: { type: 'index', base: 'DE', quote: 'EUR' },
    UK100: { type: 'index', base: 'GB', quote: 'GBP' },
};

export function AssetIcon({ symbol, size = "md", className }: AssetIconProps) {
    const s = size === "xs" ? 20 : size === "sm" ? 24 : size === "md" ? 32 : 40;
    const fontSize = size === "xs" ? "text-[8px]" : size === "sm" ? "text-[9px]" : "text-[11px]";

    // Clean symbol
    const cleanSymbol = symbol.replace('/', '').toUpperCase();

    // Check for special asset first
    const special = SPECIAL_ASSETS[cleanSymbol];

    if (special) {
        if (special.logo) {
            return (
                <div className={cn("relative flex items-center", className)} style={{ width: s * 1.5, height: s }}>
                    <img
                        src={special.logo}
                        alt={special.base}
                        className="rounded-full object-cover z-10 bg-white"
                        style={{ width: s, height: s }}
                    />
                    {special.quote && (
                        <img
                            src={`https://flagcdn.com/w40/${CURRENCY_TO_FLAG[special.quote] || 'us'}.png`}
                            alt={special.quote}
                            className="rounded-full object-cover absolute top-0 -right-1 border border-background"
                            style={{ width: s * 0.7, height: s * 0.7, right: 0, top: s * 0.15 }}
                        />
                    )}
                </div>
            );
        }
        // Fallback for indices (Show Flag)
        const flag = CURRENCY_TO_FLAG[special.base] || 'us';
        return (
            <div className={cn("relative flex items-center justify-center bg-[var(--background-secondary)] rounded-full", className)} style={{ width: s, height: s }}>
                <img
                    src={`https://flagcdn.com/w40/${flag}.png`}
                    alt={special.base}
                    className="rounded-full object-cover"
                    style={{ width: s, height: s }}
                />
            </div>
        );
    }

    // Default Forex Logic (Split 6 chars: 3 base + 3 quote)
    if (cleanSymbol.length === 6) {
        const base = cleanSymbol.substring(0, 3);
        const quote = cleanSymbol.substring(3, 6);

        // Check if both are valid currencies
        if (CURRENCY_TO_FLAG[base] && CURRENCY_TO_FLAG[quote]) {
            return (
                <div className={cn("relative flex items-center", className)} style={{ width: s * 1.6, height: s }}>
                    {/* Base Currency */}
                    <img
                        src={`https://flagcdn.com/w40/${CURRENCY_TO_FLAG[base]}.png`}
                        alt={base}
                        className="rounded-full object-cover z-10 border border-background absolute left-0"
                        style={{ width: s, height: s }}
                    />
                    {/* Quote Currency */}
                    <img
                        src={`https://flagcdn.com/w40/${CURRENCY_TO_FLAG[quote]}.png`}
                        alt={quote}
                        className="rounded-full object-cover border border-background absolute right-0"
                        style={{ width: s, height: s, left: s * 0.6 }}
                    />
                </div>
            );
        }
    }

    // Fallback: Generic Icon or First 1-2 letters
    return (
        <div className={cn("flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold rounded-full", fontSize, className)} style={{ width: s, height: s }}>
            {cleanSymbol.substring(0, 2)}
        </div>
    );
}
