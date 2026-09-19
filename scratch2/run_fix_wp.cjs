const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
# Find all wp-config files
WP_CONFIGS=$(find /home -name "wp-config.php" 2>/dev/null)

for WP_CONF in $WP_CONFIGS; do
  if grep -q "DB_NAME" "$WP_CONF"; then
    echo "Fijando $WP_CONF"
    sed -i "/WP_HOME/d" "$WP_CONF"
    sed -i "/WP_SITEURL/d" "$WP_CONF"
    sed -i "/define( 'DB_NAME'/i define( 'WP_HOME', 'https://api.ferreterialavalleja.com' );\\ndefine( 'WP_SITEURL', 'https://api.ferreterialavalleja.com' );" "$WP_CONF"
    echo "✅ Actualizado $WP_CONF"
  fi
done
\n`);
proc.stdin.end();
