import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Devuelve todas las categorías que tienen productos, con hasta 24 productos c/u
export async function GET() {
    const homeSetting = await prisma.siteSetting.findUnique({ where: { key: 'home_categories' } });
    let selectedSlugs: string[] = [];
    if (homeSetting?.value) {
        try {
            const parsed = JSON.parse(homeSetting.value);
            if (Array.isArray(parsed)) selectedSlugs = parsed.filter((slug): slug is string => typeof slug === 'string');
        } catch { /* invalid setting means no home carousels */ }
    }
    if (selectedSlugs.length === 0) return NextResponse.json([]);

    // Solo las categorías elegidas desde el panel.
    const allCats = await prisma.category.findMany({
        where: { active: true, slug: { in: selectedSlugs } },
        select: { id: true, name: true, slug: true, sortOrder: true, parentId: true },
        orderBy: { sortOrder: 'asc' },
    });

    if (allCats.length === 0) return NextResponse.json([]);

    // 2. Traer todos los productos activos con imagen, ordenados por featued desc luego createdAt desc
    const products = await prisma.product.findMany({
        where: { active: true },
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            stock: true,
            images: true,
            sku: true,
            categoryId: true,
            featured: true,
            brand: { select: { name: true } },
            category: { select: { name: true, slug: true } },
        },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });

    // 3. Usar todos los productos (sin filtrar por imagen; se mostrará placeholder si no hay)
    const withImage = products;

    // 4. Agrupar por categoryId
    const byCategory = new Map<string, typeof withImage>();
    for (const p of withImage) {
        if (!p.categoryId) continue;
        if (!byCategory.has(p.categoryId)) byCategory.set(p.categoryId, []);
        byCategory.get(p.categoryId)!.push(p);
    }

    // 5. Armar secciones: una por categoría que tenga productos
    // Aplanar padre+hijos, mantener orden
    const ordered: typeof allCats = [];
    const seen = new Set<string>();
    for (const cat of allCats) {
        if (!cat.parentId && !seen.has(cat.id)) {
            seen.add(cat.id);
            ordered.push(cat);
        }
    }
    for (const cat of allCats) {
        if (cat.parentId && !seen.has(cat.id)) {
            seen.add(cat.id);
            ordered.push(cat);
        }
    }

    // 6. Deduplicar por nombre (unifica padre+hijo con mismo nombre)
    const nameMap = new Map<string, { title: string; slug: string; products: any[] }>();
    for (const cat of ordered) {
        const prods = byCategory.get(cat.id) ?? [];
        if (prods.length === 0) continue;
        const key = cat.name.toLowerCase().trim();
        if (!nameMap.has(key)) {
            nameMap.set(key, { title: cat.name, slug: cat.slug, products: prods.slice(0, 24) });
        } else {
            const existing = nameMap.get(key)!;
            const ids = new Set(existing.products.map(p => p.id));
            for (const p of prods) {
                if (!ids.has(p.id) && existing.products.length < 24) {
                    existing.products.push(p);
                    ids.add(p.id);
                }
            }
        }
    }

    const sections = Array.from(nameMap.values()).map(s => ({
        title: s.title,
        slug: s.slug,
        products: s.products.map(p => {
            let firstImage = '';
            try { const arr = JSON.parse(p.images); if (Array.isArray(arr) && arr.length > 0) firstImage = arr[0]; } catch { }
            return {
                id: p.id, name: p.name, slug: p.slug,
                price: p.price, images: p.images,
                sku: p.sku,
                brand: p.brand ? { name: p.brand.name } : null,
                category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
                _firstImage: firstImage,
            };
        }),
    }));

    return NextResponse.json(sections);
}
