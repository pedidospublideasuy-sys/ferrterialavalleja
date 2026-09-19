const { spawn } = require('child_process');
const script = `
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"
PREFIX=$(sudo -u ferreteria wp config get table_prefix --path="$WP_PATH")
echo "Total Woo Products:"
sudo -u ferreteria wp db query "SELECT COUNT(*) FROM \${PREFIX}posts WHERE post_type='product' AND post_status='publish';" --path="$WP_PATH"
echo "Woo Products with WC- sku:"
sudo -u ferreteria wp db query "SELECT COUNT(DISTINCT post_id) FROM \${PREFIX}postmeta WHERE meta_key='_sku' AND meta_value LIKE 'WC-%';" --path="$WP_PATH"
`;
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(script + '\n');
proc.stdin.end();
