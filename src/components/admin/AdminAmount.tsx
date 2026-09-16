'use client';

import { useCurrency } from '@/store/currency';

export default function AdminAmount({ value, from = 'USD' }: { value: number; from?: 'USD' | 'UYU' }) {
  const format = useCurrency((state) => state.format);
  return <>{format(value, from)}</>;
}
