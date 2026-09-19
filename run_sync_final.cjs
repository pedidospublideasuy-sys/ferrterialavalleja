const slugify = require('slugify');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_Bd38FNUIMSah@ep-winter-grass-b4d7zlkm-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
    }
  }
});

async function main() {
  try {
    const ck = 'ck_fd668d668a032fa5188550523dcc8143cfb207ce';
    const cs = 'cs_cdaa8875ebe94c602be786aee784d81f77010f12';
    const baseUrl = 'https://api.ferreterialavalleja.com';

    console.log('Starting full WooCommerce sync into Neon DB...');
    
    let cat = await prisma.category.findFirst({ where: { slug: 'woocommerce' } });
    if (!cat) {
        cat = await prisma.category.create({
            data: { name: 'WooCommerce', slug: 'woocommerce' }
        });
    }
    let defaultCatId = cat.id;

    let page = 1;
    let totalSynced = 0;

    while (true) {
      console.log('Fetching page ' + page + '...');
      const url = baseUrl + '/wp-json/wc/v3/products?per_page=100&page=' + page + '&status=publish';
      const res = await fetch(url, {
        headers: { 'Authorization': 'Basic ' + Buffer.from(ck + ':' + cs).toString('base64') }
      });

      if (!res.ok) {
        console.log('Page ' + page + ' ended with status: ' + res.status);
        break;
      }

      const products = await res.json();
      if (!Array.isArray(products) || products.length === 0) break;

      for (const item of products) {
        const name = item.name || 'Sin nombre';
        const regularPrice = parseFloat(item.regular_price || item.price || '0');
        const salePrice = parseFloat(item.sale_price || item.price || '0');
        const price = salePrice || regularPrice;
        const comparePrice = salePrice && regularPrice > salePrice ? regularPrice : null;
        const sku = item.sku || 'WC-' + item.id;
        const stock = item.manage_stock ? (item.stock_quantity ?? 0) : 999;
        const description = (item.description || item.short_description || '').replace(/<[^>]+>/g, '').trim();
        
        const rawImages = (item.images || []).map(img => img.src).filter(Boolean);
        const imageUrls = rawImages.map(url => 
          url.replace('https://ferreterialavalleja.com', 'https://api.ferreterialavalleja.com')
             .replace('http://ferreterialavalleja.com', 'https://api.ferreterialavalleja.com')
        );

        const sourceProductId = String(item.id);
        const prodSlug = slugify(name, { lower: true, strict: true }) + '-' + item.id;
        const imagesJson = JSON.stringify(imageUrls);

        await prisma.$executeRawUnsafe(`
          INSERT INTO "Product" (
            "id", "name", "slug", "sku", "price", "comparePrice", "currency", "stock",
            "description", "images", "categoryId", "sourceId", "sourceApi", "active", "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, 'UYU', $7,
            $8, $9, $10, $11, 'WooCommerce Ferreteria', true, NOW()
          )
          ON CONFLICT ("sku") DO UPDATE SET
            "name" = $2, "price" = $5, "comparePrice" = $6,
            "stock" = $7, "description" = $8, "images" = $9, "updatedAt" = NOW()
        `, 
        'prod_wc_' + item.id, name, prodSlug, sku, price, comparePrice, stock,
        description, imagesJson, defaultCatId, sourceProductId);
        
        totalSynced++;
      }

      console.log('Page ' + page + ' synced! (' + products.length + ' items)');
      if (products.length < 100) break;
      page++;
    }

    console.log('FULL SYNC COMPLETED! Synced ' + totalSynced + ' products.');

  } catch (err) {
    console.error('Sync Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
