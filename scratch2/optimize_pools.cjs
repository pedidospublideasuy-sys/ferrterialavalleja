const { spawn } = require('child_process');
const proc = spawn('ssh', ['-o', 'BatchMode=yes', 'root@193.203.182.222'], { stdio: ['pipe', 'inherit', 'inherit'] });
proc.stdin.write(`
echo "Optimizando Pools PHP-FPM..."
for CONF in /etc/php/*/fpm/pool.d/*.conf; do
  sed -i 's/^pm\\.max_children = .*/pm.max_children = 5/' "$CONF"
  sed -i 's/^pm\\.start_servers = .*/pm.start_servers = 2/' "$CONF"
  sed -i 's/^pm\\.min_spare_servers = .*/pm.min_spare_servers = 1/' "$CONF"
  sed -i 's/^pm\\.max_spare_servers = .*/pm.max_spare_servers = 3/' "$CONF"
done

# Check what is currently eating CPU
echo "Top CPU consumers:"
ps aux --sort=-%cpu | head -10

# Restart PHP to apply pool limits
systemctl restart php8.1-fpm 2>/dev/null
systemctl restart php8.2-fpm 2>/dev/null
systemctl restart php8.3-fpm 2>/dev/null
systemctl restart php8.4-fpm 2>/dev/null
echo "✅ Pools reducidos a 5 workers maximo."
\n`);
proc.stdin.end();
