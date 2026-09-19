const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  const code = `
sed -i "/define( 'DISABLE_WP_CRON'/d" /home/ferreteria/htdocs/ferreterialavalleja.com/wp-config.php
sed -i "/define( 'DB_NAME'/i define( 'DISABLE_WP_CRON', true );" /home/ferreteria/htdocs/ferreterialavalleja.com/wp-config.php
`;
  conn.exec(code, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Done');
      conn.end();
    });
  });
}).connect({
  host: '191.96.251.223',
  port: 22,
  username: 'root',
  password: 'Admin123123@123123'
});
