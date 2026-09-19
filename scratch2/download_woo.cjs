const { spawnSync } = require('child_process');

spawnSync('scp', ['-o', 'BatchMode=yes', 'root@193.203.182.222:/tmp/woo_variations.json', 'scratch2/'], { stdio: 'inherit' });
spawnSync('scp', ['-o', 'BatchMode=yes', 'root@193.203.182.222:/tmp/woo_meta.tsv', 'scratch2/'], { stdio: 'inherit' });
spawnSync('scp', ['-o', 'BatchMode=yes', 'root@193.203.182.222:/tmp/woo_products.json', 'scratch2/'], { stdio: 'inherit' });

console.log("Descarga completa");
