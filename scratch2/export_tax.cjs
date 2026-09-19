const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"
PREFIX=$(sudo -u ferreteria wp config get table_prefix --path="$WP_PATH")
sudo -u ferreteria wp db query "SELECT tr.object_id, t.name, tt.taxonomy FROM \${PREFIX}term_relationships tr JOIN \${PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id JOIN \${PREFIX}terms t ON tt.term_id = t.term_id WHERE tt.taxonomy IN ('product_cat', 'product_type', 'product_brand');" --path="$WP_PATH" > /tmp/woo_taxonomies.tsv
\n`);
proc.stdin.end();
