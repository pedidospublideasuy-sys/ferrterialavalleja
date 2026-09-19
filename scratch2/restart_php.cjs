const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec('systemctl restart php8.4-fpm || systemctl restart php-fpm || service php-fpm restart', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end());
  });
}).connect({
  host: '191.96.251.223',
  port: 22,
  username: 'root',
  password: 'Admin123123@123123'
});
