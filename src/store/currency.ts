import { create } from 'zustand';

type Currency = 'UYU' | 'USD';

interface CurrencyStore {
    /** Solo formatea el precio en la moneda indicada (sin conversión) */
    format: (price: number, fromCurrency?: Currency) => string;
    /** Retorna el precio tal cual (sin conversión) */
    convert: (price: number, fromCurrency?: Currency) => number;
    /** Alias de format para compatibilidad */
    formatCurrency: (price: number, fromCurrency?: Currency) => string;
}

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

export const useCurrency = create<CurrencyStore>()((set, get) => ({
    format: (price, fromCurrency = 'UYU') => {
        return fmt(price, fromCurrency);
    },
    convert: (price, _fromCurrency = 'UYU') => {
        return price; // sin conversión
    },
    formatCurrency: (price, fromCurrency = 'UYU') => {
        return fmt(price, fromCurrency);
    },
}));
