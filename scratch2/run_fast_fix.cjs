const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
echo "Buscando directo..."
for DIR in "/home/ferreteria/htdocs/ferreterialavalleja.com" "/home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com"; do
  WP_CONF="$DIR/wp-config.php"
  if [ -f "$WP_CONF" ]; then
    echo "Encontrado en $WP_CONF"
    sed -i "/WP_HOME/d" "$WP_CONF"
    sed -i "/WP_SITEURL/d" "$WP_CONF"
    sed -i "/define( 'DB_NAME'/i define( 'WP_HOME', 'https://api.ferreterialavalleja.com' );\\ndefine( 'WP_SITEURL', 'https://api.ferreterialavalleja.com' );" "$WP_CONF"
    echo "✅ Estilos arreglados en $WP_CONF"
  fi
done
\n`);
proc.stdin.end();
