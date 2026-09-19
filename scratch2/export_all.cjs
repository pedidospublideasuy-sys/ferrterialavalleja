const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"
PREFIX=$(sudo -u ferreteria wp config get table_prefix --path="$WP_PATH")

echo "Exportando productos y variaciones..."
sudo -u ferreteria wp post list --post_type=product,product_variation --post_status=publish --fields=ID,post_title,post_parent,post_type,post_name --format=json --path="$WP_PATH" > /tmp/woo_all_products.json

echo "Exportando metadata..."
sudo -u ferreteria wp db query "SELECT post_id, meta_key, meta_value FROM \${PREFIX}postmeta WHERE meta_key IN ('_price', '_regular_price', '_sku', '_stock', '_manage_stock', '_thumbnail_id') OR meta_key LIKE 'attribute_%';" --path="$WP_PATH" > /tmp/woo_meta.tsv

echo "Exportando URLs de attachments..."
sudo -u ferreteria wp db query "SELECT ID, guid FROM \${PREFIX}posts WHERE post_type = 'attachment';" --path="$WP_PATH" > /tmp/woo_attachments.tsv

echo "Exportando categorias (taxonomies)..."
sudo -u ferreteria wp db query "SELECT tr.object_id, t.name, tt.taxonomy FROM \${PREFIX}term_relationships tr JOIN \${PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id JOIN \${PREFIX}terms t ON tt.term_id = t.term_id WHERE tt.taxonomy IN ('product_cat', 'product_type', 'product_brand');" --path="$WP_PATH" > /tmp/woo_taxonomies.tsv

echo "DONE EXPORT"
\n`);
proc.stdin.end();
