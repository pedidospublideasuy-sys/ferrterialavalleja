import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getStockBAProducts, getStockBAProduct } from '@/lib/stockba';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function ensureUniqueSlug(base: string, existing: Set<string>): string {
    let slug = base;
    let i = 2;
    while (existing.has(slug)) {
        slug = `${base}-${i++}`;
    }
    existing.add(slug);
    return slug;
}

function extractImageUrls(product: any): string[] {
    const values = [
        product?.image_url,
        product?.image,
        product?.thumbnail,
        ...(Array.isArray(product?.images) ? product.images : []),
        ...(Array.isArray(product?.gallery) ? product.gallery : []),
        ...(Array.isArray(product?.galeria) ? product.galeria : []),
    ];
    return values
        .map((value: any) => typeof value === 'string' ? value : value?.url ?? value?.src ?? value?.img)
        .filter((value: unknown): value is string => typeof value === 'string' && /^(https?:)?\/\//i.test(value))
        .map(value => value.startsWith('//') ? `https:${value}` : value)
        .filter((value, index, all) => all.indexOf(value) === index)
        .filter(value => !value.includes('default.png'));
}

function normalizeImageUrl(value: string): string {
    if (/^\/\//.test(value)) return `https:${value}`;
    if (/^https?:\/\//i.test(value)) return value;
    const base = process.env.STOCK_SYSTEM_API_URL || 'https://stockba.es/api/v1';
    try { return new URL(value, `${new URL(base).origin}/`).toString(); } catch { return value; }
}

/** Extract price from StockBA product — price lives in variations[0], not root */
function extractPrice(sp: any): { price: number; cost: number | null } {
    const rootPrice = Number(sp.selling_price_inc_tax ?? sp.selling_price ?? 0);
    const rootCost = sp.purchase_price != null ? Number(sp.purchase_price) : null;
    const v0 = Array.isArray(sp.variations) && sp.variations.length > 0 ? sp.variations[0] : null;
    const price = rootPrice > 0 ? rootPrice : Number(v0?.selling_price ?? 0);
    const cost = rootCost != null && rootCost > 0 ? rootCost
        : v0?.purchase_price != null ? Number(v0.purchase_price) : null;
    return { price, cost };
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'ADMIN'].includes((session.user as any).role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const page = Number(body.page ?? 1);
    const perPage = Number(body.perPage ?? 20);
    const syncImages = body.syncImages !== false;
    const overwritePrice = body.overwritePrice === true;

    const results = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    try {
        // 1 – Fetch one PAGE from the list endpoint (fast, no prices)
        const listRes = await getStockBAProducts(page, perPage);
        const pageProducts: any[] = listRes.data || [];
        const pagination = listRes.pagination ?? {};
        const lastPage = pagination.last_page ?? 1;
        const total = pagination.total ?? 0;

        if (pageProducts.length === 0) {
            return NextResponse.json({ ok: true, ...results, page, lastPage, total, done: true });
        }

        // 2 – Fetch individual details in small batches to avoid 429
        const BATCH = 3;
        const DELAY_MS = 500;
        const detailResults: PromiseSettledResult<any>[] = [];
        for (let i = 0; i < pageProducts.length; i += BATCH) {
            const chunk = pageProducts.slice(i, i + BATCH);
            const batchRes = await Promise.allSettled(
                chunk.map((p: any) => getStockBAProduct(p.id).then((r: any) => r.data ?? r))
            );
            detailResults.push(...batchRes);
            if (i + BATCH < pageProducts.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        // 3 – Build a map: id → detailed product
        const detailMap = new Map<number, any>();
        detailResults.forEach((res, i) => {
            if (res.status === 'fulfilled') {
                detailMap.set(pageProducts[i].id, res.value);
            } else {
                // fallback to list data (price will be 0)
                detailMap.set(pageProducts[i].id, pageProducts[i]);
            }
        });

        // 4 – Pre-load category/brand maps to avoid N+1 in DB
        const catCache = new Map<string, string>(); // name → id
        const brandCache = new Map<string, string>();
        const existingSlugs = await prisma.product.findMany({ select: { slug: true } });
        const slugSet = new Set<string>(existingSlugs.map((p: { slug: string }) => p.slug));

        for (const sp of pageProducts) {
            const detail = detailMap.get(sp.id) ?? sp;

            try {
                // ── Resolve category ──────────────────────────────
                let categoryId: string | null = null;
                const catName = detail.category?.name ?? sp.category?.name;
                if (catName) {
                    if (!catCache.has(catName)) {
                        let cat = await prisma.category.findFirst({
                            where: { name: { equals: catName, mode: 'insensitive' } },
                        });
                        if (!cat) {
                            cat = await prisma.category.create({
                                data: { name: catName, slug: slugify(catName) || `cat-${Date.now()}` },
                            });
                        }
                        catCache.set(catName, cat.id);
                    }
                    categoryId = catCache.get(catName)!;
                }

                // ── Resolve brand ─────────────────────────────────
                let brandId: string | null = null;
                const brandName = detail.brand?.name ?? sp.brand?.name;
                if (brandName) {
                    if (!brandCache.has(brandName)) {
                        let brand = await prisma.brand.findFirst({
                            where: { name: { equals: brandName, mode: 'insensitive' } },
                        });
                        if (!brand) {
                            brand = await prisma.brand.create({
                                data: { name: brandName, slug: slugify(brandName) || `brand-${Date.now()}` },
                            });
                        }
                        brandCache.set(brandName, brand.id);
                    }
                    brandId = brandCache.get(brandName)!;
                }

                // ── Price (from variations[0]) ────────────────────
                const { price, cost } = extractPrice(detail);

                // ── Images ────────────────────────────────────────
                // Ignorar la imagen default de Laravel (producto sin imagen real)
                const imageUrls = syncImages ? extractImageUrls({ ...sp, ...detail }).map(normalizeImageUrl) : [];
                const images = imageUrls.length > 0 ? JSON.stringify(imageUrls) : undefined;

                // ── SKU ───────────────────────────────────────────
                const sku = detail.sku || sp.sku || `SBA-${sp.id}`;

                // ── Upsert ────────────────────────────────────────
                const existing = await prisma.product.findFirst({
                    where: { sourceId: String(sp.id), sourceApi: 'stockba' },
                });

                if (existing) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const updateData: any = {
                        name: detail.name ?? sp.name,
                        sku,
                        active: detail.active ?? sp.active ?? true,
                    };
                    if (overwritePrice && price > 0) { updateData.price = price; if (cost != null) updateData.cost = cost; }
                    if (images) updateData.images = images;
                    if (categoryId) updateData.categoryId = categoryId;
                    if (brandId) updateData.brandId = brandId;
                    await prisma.product.update({ where: { id: existing.id }, data: updateData });
                    results.updated++;
                } else {
                    const baseSlug = slugify(detail.name ?? sp.name) || `product-${sp.id}`;
                    const slug = ensureUniqueSlug(baseSlug, slugSet);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const createData: any = {
                        name: detail.name ?? sp.name,
                        slug,
                        sku,
                        price,
                        stock: 0,
                        active: detail.active ?? sp.active ?? true,
                        sourceId: String(sp.id),
                        sourceApi: 'stockba',
                        images: images ?? '[]',
                    };
                    if (cost != null) createData.cost = cost;
                    if (categoryId) createData.categoryId = categoryId;
                    if (brandId) createData.brandId = brandId;
                    await prisma.product.create({ data: createData });
                    results.created++;
                }
            } catch (err: any) {
                results.errors.push(`[${sp.id}] ${sp.name}: ${err.message}`);
                results.skipped++;
            }
        }

        const done = page >= lastPage;
        return NextResponse.json({
            ok: true,
            ...results,
            page,
            lastPage,
            total,
            done,
            nextPage: done ? null : page + 1,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
