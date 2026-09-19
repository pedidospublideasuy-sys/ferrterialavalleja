const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const code = `
sed -i "/define( 'WP_DEBUG'/a define( 'WP_HOME', 'https://api.ferreterialavalleja.com' );\\ndefine( 'WP_SITEURL', 'https://api.ferreterialavalleja.com' );" /home/ferreteria/htdocs/ferreterialavalleja.com/wp-config.php
`;
  conn.exec(code, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code);
      conn.end();
    }).on('data', (d) => {
      console.log('STDOUT: ' + d);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '191.96.251.223',
  port: 22,
  username: 'root',
  password: 'Admin123123@123123'
});
