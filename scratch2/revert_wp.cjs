const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
sed -i "/WP_HOME/d" "/home/ferreteria/htdocs/ferreterialavalleja.com/nv/wp-config.php"
sed -i "/WP_SITEURL/d" "/home/ferreteria/htdocs/ferreterialavalleja.com/nv/wp-config.php"

sed -i "/WP_HOME/d" "/home/user/htdocs/srv876295.hstgr.cloud/wp-config.php"
sed -i "/WP_SITEURL/d" "/home/user/htdocs/srv876295.hstgr.cloud/wp-config.php"
echo "Reverted non-target configs."
\n`);
proc.stdin.end();
