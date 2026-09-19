const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"
PREFIX=$(sudo -u ferreteria wp config get table_prefix --path="$WP_PATH")

echo "Exportando thumbnail IDs de las variaciones..."
sudo -u ferreteria wp db query "SELECT post_id, meta_value FROM \${PREFIX}postmeta WHERE meta_key = '_thumbnail_id';" --path="$WP_PATH" > /tmp/woo_thumbnail_ids.tsv

echo "Exportando URLs de attachments..."
sudo -u ferreteria wp db query "SELECT ID, guid FROM \${PREFIX}posts WHERE post_type = 'attachment';" --path="$WP_PATH" > /tmp/woo_attachments.tsv

# We will join them locally or download both files
\n`);
proc.stdin.end();
