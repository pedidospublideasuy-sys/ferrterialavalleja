'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { useCurrency } from '@/store/currency';

interface ChartData {
  mes: string;
  ventasUYU: number;
  ventasUSD: number;
  pedidos: number;
  devoluciones: number;
}

export default function DashboardCharts({ data }: { data: ChartData[] }) {
  const format = useCurrency((state) => state.format);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Gráfica de Ventas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-lg mb-1">Ventas Mensuales</h3>
        <p className="text-sm text-gray-400 mb-4">Últimos 6 meses</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorVentasUYU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8850c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e8850c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorVentasUSD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#999" />
              <YAxis tick={{ fontSize: 12 }} stroke="#999" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #eee', fontSize: '13px' }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: string) => [
                  name === 'Ventas UYU' ? `UYU ${Number(value).toFixed(2)}` : `USD ${Number(value).toFixed(2)}`,
                  name
                ]) as any}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Area type="monotone" dataKey="ventasUYU" name="Ventas UYU" stroke="#e8850c" strokeWidth={2} fill="url(#colorVentasUYU)" />
              <Area type="monotone" dataKey="ventasUSD" name="Ventas USD" stroke="#15803d" strokeWidth={2} fill="url(#colorVentasUSD)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfica de Pedidos y Devoluciones */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-bold text-lg mb-1">Pedidos y Devoluciones</h3>
        <p className="text-sm text-gray-400 mb-4">Últimos 6 meses</p>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#999" />
              <YAxis tick={{ fontSize: 12 }} stroke="#999" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #eee', fontSize: '13px' }}
              />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Bar dataKey="pedidos" fill="#1a8a7d" radius={[4, 4, 0, 0]} name="Pedidos" />
              <Bar dataKey="devoluciones" fill="#ef4444" radius={[4, 4, 0, 0]} name="Devoluciones" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
