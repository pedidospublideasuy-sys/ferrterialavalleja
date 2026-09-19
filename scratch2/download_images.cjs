const { spawnSync } = require('child_process');

spawnSync('scp', ['-o', 'BatchMode=yes', 'root@193.203.182.222:/tmp/woo_thumbnail_ids.tsv', 'scratch2/'], { stdio: 'inherit' });
spawnSync('scp', ['-o', 'BatchMode=yes', 'root@193.203.182.222:/tmp/woo_attachments.tsv', 'scratch2/'], { stdio: 'inherit' });

console.log("Descargados thumbnails y attachments");
