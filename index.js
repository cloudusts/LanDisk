
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

function parseArgs() {
    const args = process.argv.slice(2);
    let port = 9000;
    let host = '0.0.0.0';
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--port' && i + 1 < args.length) {
            port = parseInt(args[i + 1], 10);
            i++;
        } else if (args[i] === '--addr' && i + 1 < args.length) {
            host = args[i + 1];
            i++;
        }
    }
    return { port, host };
}

const { port, host } = parseArgs();
function readFiles(callback) {
    const folderPath = path.join(__dirname, 'Files');
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, files);
    });
}


function renderTemplate(fileList, callback) {
    fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
        if (err) {
            callback(err, null);
            return;
        }
        const fileListHTML = fileList.map(file => `<p><a href="/download?file=${file}" target="_blank">${file}</a></p><br>`).join('');
        const renderedHTML = data.replace('[[filelist]]', fileListHTML);
        callback(null, renderedHTML);
    });
}



// Create server
const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    if (reqUrl.pathname === '/download') {
        const queryObject = url.parse(req.url, true).query;
        const fileName = queryObject.file;
        const filePath = path.join(__dirname, 'Files', fileName);
        const fileStream = fs.createReadStream(filePath);
    
        res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
        res.setHeader('Content-type', 'application/octet-stream');
    
        fileStream.pipe(res);
    } else {
        readFiles((err, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            renderTemplate(files, (err, renderedHTML) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('500');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(renderedHTML);
            });
        });
    }
});

// Start the server
server.listen(port, host, () => {
    console.log(`LanDisk running at http://${host}:${port}/`);
});
