
sed -i "/WP_HOME/d" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php
sed -i "/WP_SITEURL/d" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php
sed -i "/define( 'DB_NAME'/i define( 'WP_HOME', 'https://api.ferreterialavalleja.com' );\ndefine( 'WP_SITEURL', 'https://api.ferreterialavalleja.com' );" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php
grep -E "WP_HOME|WP_SITEURL" /home/ferreterialavalleja-api/htdocs/api.ferreterialavalleja.com/wp-config.php
