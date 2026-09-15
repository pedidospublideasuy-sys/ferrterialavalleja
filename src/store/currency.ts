import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Currency = 'UYU' | 'USD';

interface CurrencyStore {
    currency: Currency;
    rate: number; // USD → UYU tasa del día
    rateUpdatedAt: number;
    setCurrency: (c: Currency) => void;
    fetchRate: () => Promise<void>;
    /** Convierte y formatea. fromCurrency = moneda nativa del producto (default 'USD') */
    format: (price: number, fromCurrency?: Currency) => string;
    /** Solo convierte el número sin formatear */
    convert: (price: number, fromCurrency?: Currency) => number;
}

const DEFAULT_RATE = 42;

function fmt(price: number, currency: Currency): string {
    if (currency === 'USD') {
        return new Intl.NumberFormat('es-UY', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: 0, maximumFractionDigits: 2,
        }).format(price);
    }
    return new Intl.NumberFormat('es-UY', {
        style: 'currency', currency: 'UYU',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(price);
}

export const useCurrency = create<CurrencyStore>()(
    persist(
        (set, get) => ({
            currency: 'UYU',
            rate: DEFAULT_RATE,
            rateUpdatedAt: 0,

            setCurrency: (c) => set({ currency: c }),

            fetchRate: async () => {
                if (Date.now() - get().rateUpdatedAt < 60 * 60 * 1000) return;
                try {
                    const res = await fetch('https://open.er-api.com/v6/latest/USD');
                    if (!res.ok) return;
                    const data = await res.json();
                    const uyu = data?.rates?.UYU;
                    if (uyu && typeof uyu === 'number' && uyu > 10) {
                        set({ rate: uyu, rateUpdatedAt: Date.now() });
                    }
                } catch { /* silencioso */ }
            },

            convert: (price, fromCurrency = 'USD') => {
                const { currency, rate } = get();
                if (fromCurrency === currency) return price;
                if (fromCurrency === 'USD' && currency === 'UYU') return price * rate;
                if (fromCurrency === 'UYU' && currency === 'USD') return price / rate;
                return price;
            },

            format: (price, fromCurrency = 'UYU') => {
                const { currency } = get();
                const converted = get().convert(price, fromCurrency);
                return fmt(converted, currency);
            },
        }),
        { name: 'currency-preference' }
    )
);
