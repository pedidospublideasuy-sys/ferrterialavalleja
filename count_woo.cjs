
const ck = 'ck_fd668d668a032fa5188550523dcc8143cfb207ce';
const cs = 'cs_cdaa8875ebe94c602be786aee784d81f77010f12';
const baseUrl = 'https://api.ferreterialavalleja.com';

async function main() {
  let page = 1;
  let totalPublished = 0;
  let withImages = 0;
  const skuCounts = {};

  while (true) {
    const res = await fetch(baseUrl + '/wp-json/wc/v3/products?per_page=100&page=' + page + '&status=publish', {
      headers: { 'Authorization': 'Basic ' + Buffer.from(ck + ':' + cs).toString('base64') }
    });
    if (!res.ok) break;
    const items = await res.json();
    if (!items || items.length === 0) break;

    totalPublished += items.length;
    for (const item of items) {
      if (item.images && item.images.length > 0) {
        withImages++;
        const sku = item.sku || 'WC-' + item.id;
        skuCounts[sku] = (skuCounts[sku] || 0) + 1;
      }
    }
    console.log('Page ' + page + ' done');
    if (items.length < 100) break;
    page++;
  }

  let dupes = 0;
  for (const sku in skuCounts) {
    if (skuCounts[sku] > 1) dupes += (skuCounts[sku] - 1);
  }

  console.log('Total published in Woo:', totalPublished);
  console.log('Total with images:', withImages);
  console.log('Duplicate SKUs (with images):', dupes);
  console.log('Expected unique in Prisma:', withImages - dupes);
}
main();

