import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const apiKeyConfigured = !!process.env.STOCK_SYSTEM_API_KEY;
  try {
    const syncedProducts = await prisma.product.count({ where: { sourceApi: 'stockba' } });
    const last = await prisma.product.findFirst({
      where: { sourceApi: 'stockba' }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true },
    });
    return NextResponse.json({ ok: true, apiKeyConfigured, syncedProducts, lastSyncAt: last?.updatedAt ?? null });
  } catch (err: any) {
    return NextResponse.json({ ok: false, apiKeyConfigured, syncedProducts: 0, lastSyncAt: null, error: err.message });
  }
}
