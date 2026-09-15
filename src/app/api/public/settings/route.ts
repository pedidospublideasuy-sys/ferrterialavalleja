import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Public endpoint — only returns non-sensitive keys
const ALLOWED_PREFIXES = ['logo_', 'footer_', 'site_name', 'site_whatsapp', 'site_description', 'favicon_url', 'hero_slides', 'color_', 'hide_prices', 'home_carousel_auto', 'home_categories'];

function isAllowed(key: string) {
  return ALLOWED_PREFIXES.some(p => key === p || key.startsWith(p));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keysParam = searchParams.get('keys');

  if (keysParam) {
    const requested = keysParam.split(',').map(k => k.trim()).filter(isAllowed);
    const settings = await prisma.siteSetting.findMany({ where: { key: { in: requested } } });
    const result: Record<string, string> = {};
    for (const s of settings) result[s.key] = s.value;
    return NextResponse.json(result);
  }

  // Return all allowed settings
  const settings = await prisma.siteSetting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    if (isAllowed(s.key)) result[s.key] = s.value;
  }
  return NextResponse.json(result);
}
