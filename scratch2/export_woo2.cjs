const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"

echo "Buscando prefijo..."
PREFIX=$(sudo -u ferreteria wp config get table_prefix --path="$WP_PATH")
echo "PREFIX=$PREFIX"

echo "Exportando variaciones..."
sudo -u ferreteria wp post list --post_type=product_variation --post_status=publish --fields=ID,post_title,post_parent,post_name --format=json --path="$WP_PATH" > /tmp/woo_variations.json

echo "Exportando meta data..."
sudo -u ferreteria wp db query "SELECT post_id, meta_key, meta_value FROM \${PREFIX}postmeta WHERE meta_key IN ('_price', '_regular_price', '_sku', '_stock', '_manage_stock') OR meta_key LIKE 'attribute_%';" --path="$WP_PATH" > /tmp/woo_meta.tsv

cat /tmp/woo_variations.json
echo "METADATA:"
head -50 /tmp/woo_meta.tsv
\n`);
proc.stdin.end();
