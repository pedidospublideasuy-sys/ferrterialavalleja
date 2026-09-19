const { spawn } = require('child_process');

const script = `
WP_PATH="/home/ferreteria/htdocs/ferreterialavalleja.com"
PREFIX=$(sudo -u ferreteria wp config get table_prefix --path="$WP_PATH")
sudo -u ferreteria wp db query "SELECT p.post_title FROM \${PREFIX}posts p JOIN \${PREFIX}term_relationships tr ON p.ID = tr.object_id JOIN \${PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id JOIN \${PREFIX}terms t ON tt.term_id = t.term_id WHERE p.post_type = 'product' AND p.post_status = 'publish' AND t.name = 'variable' AND tt.taxonomy = 'product_type';" --path="$WP_PATH" > /tmp/woo_variables_list.txt
cat /tmp/woo_variables_list.txt
`;

const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(script + '\n');
proc.stdin.end();
