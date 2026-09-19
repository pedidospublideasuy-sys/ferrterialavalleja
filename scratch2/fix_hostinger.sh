#!/bin/bash
# 1. Fix api.ferreterialavalleja.com wp-config
WP_CONF="/home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php"
if [ -f "$WP_CONF" ]; then
  sed -i '/WP_HOME/d' "$WP_CONF"
  sed -i '/WP_SITEURL/d' "$WP_CONF"
  sed -i "/define( 'DB_NAME'/i define( 'WP_HOME', 'https://api.ferreterialavalleja.com' );\\ndefine( 'WP_SITEURL', 'https://api.ferreterialavalleja.com' );" "$WP_CONF"
  echo "✅ wp-config.php arreglado para api.ferreterialavalleja.com"
else
  echo "❌ No se encontró $WP_CONF"
fi

# 2. Backup and remove Nexoimportaciones
NEXO_DIR="/home/nexoimportaciones/htdocs/nexoimportaciones.com"
BACKUP_FILE="/home/nexoimportaciones/respaldo_nexo_$(date +%F).zip"

if [ -d "$NEXO_DIR" ]; then
  echo "📦 Comprimiendo nexoimportaciones..."
  cd /home/nexoimportaciones/htdocs
  zip -rq "$BACKUP_FILE" nexoimportaciones.com
  echo "✅ Respaldo guardado en $BACKUP_FILE"
  
  echo "🗑️ Eliminando código en vivo de nexoimportaciones..."
  rm -rf "$NEXO_DIR"/*
  
  # Put a simple index.html so nginx doesn't fail
  echo "<h1>Sitio suspendido</h1>" > "$NEXO_DIR/index.html"
  echo "✅ Código eliminado y reemplazado por index.html"
else
  echo "❌ Directorio $NEXO_DIR no encontrado"
fi

# 3. Stop Nexo PHP-FPM pool and disable wp-cron for it
NEXO_POOL="/etc/php/8.4/fpm/pool.d/nexoimportaciones.com.conf"
if [ -f "$NEXO_POOL" ]; then
  mv "$NEXO_POOL" "${NEXO_POOL}.disabled"
  echo "✅ Pool PHP de Nexo desactivado"
fi
# Just in case it's PHP 8.1 or 8.2 or 8.3
find /etc/php -name "nexoimportaciones.com.conf" -exec mv {} {}.disabled \; 2>/dev/null

# Restart all PHP-FPM versions to clear RAM
systemctl restart php8.1-fpm 2>/dev/null
systemctl restart php8.2-fpm 2>/dev/null
systemctl restart php8.3-fpm 2>/dev/null
systemctl restart php8.4-fpm 2>/dev/null

echo "✅ PHP-FPM reiniciado. Recursos liberados."
