const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('find / -name "wp-config.php" 2>/dev/null', (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      console.log('OUTPUT:\n' + data);
      conn.end();
    }).on('data', (d) => {
      data += d;
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
