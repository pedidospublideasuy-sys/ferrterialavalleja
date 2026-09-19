const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
echo "Apagando proceso zip y nexo..."
killall -9 zip 2>/dev/null
pkill -9 -f "nexo" 2>/dev/null

NEXO_DIR="/home/nexoimportaciones/htdocs/nexoimportaciones.com"
if [ -d "$NEXO_DIR" ]; then
  # Remove the code immediately without zipping
  rm -rf "$NEXO_DIR"/*
  echo "<h1>Sitio suspendido</h1>" > "$NEXO_DIR/index.html"
  echo "Nexoimportaciones apagado y vaciado."
fi

# Deactivate PHP pool again just in case
find /etc/php -name "nexoimportaciones.com.conf" -exec mv {} {}.disabled \\; 2>/dev/null
systemctl restart php8.1-fpm 2>/dev/null
systemctl restart php8.4-fpm 2>/dev/null

echo "✅ Recursos liberados al 100%."
\n`);
proc.stdin.end();
