const fs = require('fs');
const path = require('path');

let files = fs.readdirSync('config');
for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    if (path.extname(filename).toLowerCase() == '.example') {
        const fullfilename = 'config' + '/' + filename;
        const outfilename = 'config' + '/' + filename.slice(0, filename.lastIndexOf('.'));
        fs.copyFileSync(fullfilename, outfilename);
    }
}
