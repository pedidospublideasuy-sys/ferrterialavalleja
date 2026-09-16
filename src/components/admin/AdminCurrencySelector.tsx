'use client';

import { useCurrency } from '@/store/currency';

export default function AdminCurrencySelector() {
  const currency = useCurrency((state) => state.currency);
  const setCurrency = useCurrency((state) => state.setCurrency);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs">
      <span className="font-medium text-gray-500">Moneda:</span>
      <button
        type="button"
        onClick={() => setCurrency('UYU')}
        className={`rounded px-2 py-1 font-bold ${currency === 'UYU' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
      >
        Pesos (UYU)
      </button>
      <button
        type="button"
        onClick={() => setCurrency('USD')}
        className={`rounded px-2 py-1 font-bold ${currency === 'USD' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
      >
        Dólares (USD)
      </button>
    </div>
  );
}
