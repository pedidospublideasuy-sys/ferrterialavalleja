const { spawn } = require('child_process');
const script = `
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"
PREFIX=$(sudo -u ferreteria wp config get table_prefix --path="$WP_PATH")
echo "Check SKUs:"
sudo -u ferreteria wp db query "SELECT post_id, meta_value FROM \${PREFIX}postmeta WHERE meta_key='_sku' AND meta_value LIKE '%wc-%' LIMIT 10;" --path="$WP_PATH"
echo "Check post names:"
sudo -u ferreteria wp db query "SELECT ID, post_name, post_title FROM \${PREFIX}posts WHERE post_type='product' AND post_name LIKE '%wc-%' LIMIT 10;" --path="$WP_PATH"
`;
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(script + '\n');
proc.stdin.end();
