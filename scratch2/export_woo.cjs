const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"

# Check if wp-cli is installed
if ! command -v wp &> /dev/null; then
  echo "Instalando wp-cli..."
  curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
  chmod +x wp-cli.phar
  mv wp-cli.phar /usr/local/bin/wp
fi

# Export variable products
echo "Exportando productos variables..."
sudo -u ferreteria wp post list --post_type=product --post_status=publish --fields=ID,post_title,post_name --format=json --path="$WP_PATH" > /tmp/woo_products.json

# Find which ones are variable
echo "Consultando terminos..."
sudo -u ferreteria wp db query "SELECT object_id FROM wp_term_relationships tr JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id JOIN wp_terms t ON tt.term_id = t.term_id WHERE t.slug = 'variable' AND tt.taxonomy = 'product_type';" --path="$WP_PATH" > /tmp/variable_ids.txt

# Extract variations
echo "Exportando variaciones..."
sudo -u ferreteria wp post list --post_type=product_variation --post_status=publish --fields=ID,post_title,post_parent,post_name --format=json --path="$WP_PATH" > /tmp/woo_variations.json

# Get prices and SKU
echo "Exportando meta data..."
sudo -u ferreteria wp db query "SELECT post_id, meta_key, meta_value FROM wp_postmeta WHERE meta_key IN ('_price', '_regular_price', '_sku', '_stock', '_manage_stock');" --path="$WP_PATH" > /tmp/woo_meta.txt

# Get image URLs
echo "Exportando imagenes..."
sudo -u ferreteria wp db query "SELECT p.ID, p.post_parent, m.meta_value FROM wp_posts p JOIN wp_postmeta m ON p.ID = m.post_id WHERE p.post_type = 'attachment' AND m.meta_key = '_wp_attached_file';" --path="$WP_PATH" > /tmp/woo_images.txt
sudo -u ferreteria wp db query "SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key = '_thumbnail_id';" --path="$WP_PATH" > /tmp/woo_thumbnails.txt

echo "Archivos generados en /tmp"
\n`);
proc.stdin.end();
