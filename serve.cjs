'use strict';

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const port = Number(process.env.LIFE_CFO_PORT || 4173);
const lan = process.argv.includes('--lan');
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/rules.js', ['rules.js', 'text/javascript; charset=utf-8']],
  ['/content.js', ['content.js', 'text/javascript; charset=utf-8']],
  ['/engine.js', ['engine.js', 'text/javascript; charset=utf-8']],
  ['/charts.js', ['charts.js', 'text/javascript; charset=utf-8']],
  ['/tokyo-1989.webp', ['tokyo-1989.webp', 'image/webp']],
]);
for (const filename of ['japan.html','guide.html','review.html','sources.html','world.css','world-data.js','world-content.js','world-history.js','world-engine.js','world-social.js','world-charts.js','world-app.js','world-journal.webp','data/annual.csv','data/manifest.json','data/audit.json']) {
  const ext=path.extname(filename),type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.csv':'text/csv; charset=utf-8','.json':'application/json; charset=utf-8'}[ext];
  files.set('/'+filename,[filename,type]);
}
for(const filename of ['developer.html','world-v3.html','guide-v3.html','sources-v3.html','pro.css','pro-data.js','pro-content.js','pro-history.js','pro-engine.js','pro-social.js','pro-planning.js','pro-app.js','data/v4/manifest.json','data/v4/monthly.csv','data/v4/housing.csv','data/v4/gold-extraction.json','data/v4/audit.json']) { const type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.csv':'text/csv; charset=utf-8','.json':'application/json; charset=utf-8'}[path.extname(filename)];files.set('/'+filename,[filename,type]); }
for(const filename of ["family-engine.js", "family-social.js", "family-charts.js", "family-app.js", "family.css", "multi-v4.html", "guide-v4.html", "sources-v4.html", "developer-v4.html", "assets/story-family.webp", "assets/story-career.webp", "assets/story-inheritance.webp", "assets/story-layoff.webp", "assets/story-quiet.webp"]){files.set('/'+filename,[filename,({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.webp':'image/webp'})[path.extname(filename)]]);}
for(const name of ["family-stories.js", "family-ledger.js", "family-v5.html", "family-v5.css", "family-v5-engine.js", "family-v5-social.js", "family-v5-charts.js", "family-v5-app.js", "guide-v5.html", "developer-v5.html", "sources-v5.html", "review-v5.html", "assets/story-learning.webp", "assets/story-baby.webp", "assets/story-moving.webp", "assets/story-care.webp", "assets/story-repair.webp", "assets/story-history-oil.webp", "assets/story-history-bubble.webp", "assets/story-history-internet.webp", "assets/story-history-crisis.webp", "assets/story-history-pandemic.webp"]){files.set('/'+name,[name,({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.webp':'image/webp'})[path.extname(name)]]);}
const multiManifest=JSON.parse(fs.readFileSync(path.join(__dirname,'data/v4/manifest.json'),'utf8'));
for(const name of ['life-cfo-player-v5.docx','life-cfo-developer-v5.docx','life-cfo-player-v6.docx','life-cfo-developer-v6.docx'])files.set('/docs/'+name,['docs/'+name,'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
files.set('/review-v4.html',['review-v4.html','text/html; charset=utf-8']);
for(const item of multiManifest.series)files.set('/'+item.file,[item.file,'text/csv; charset=utf-8']);
files.set('/data/v4/raw/CMO-Historical-Data-Monthly.xlsx',['data/v4/raw/CMO-Historical-Data-Monthly.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'data/manifest.json'),'utf8'));
for(const source of manifest.series) files.set('/'+source.file,[source.file,'text/csv; charset=utf-8']);


for(const name of ['annual-policy-rates.js','annual-policy-events.js','annual-briefings.js','family-monthly.js','family-story-engine.js','family-scenes.js','family-scene-assets.js','family-v6.html','family-v6.css','family-v6-engine.js','family-v6-stories.js','family-v6-ledger.js','family-v6-social.js','family-v6-charts.js','family-v6-app.js','guide-v6.html','developer-v6.html','sources-v6.html','review-v6.html','docs/life-cfo-player-v71.docx','docs/life-cfo-developer-v71.docx','docs/life-cfo-player-v7.docx','docs/life-cfo-developer-v7.docx'])files.set('/'+name,[name,({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})[path.extname(name)]]);
files.set('/assets/scene-briefs-v7.json',['assets/scene-briefs-v7.json','application/json; charset=utf-8']);
for (const folder of ['scenes', 'archive', 'history']) {
  for (const file of fs.readdirSync(path.join(__dirname,'assets',folder))) {
    if (!/^[a-zA-Z0-9-]+\.(webp|json)$/.test(file)) continue;
    const relative = 'assets/' + folder + '/' + file;
    files.set('/' + relative, [relative, file.endsWith('.json') ? 'application/json' : 'image/webp']);
  }
}
for (const file of ['family-archive.js','family-photo-view.js']) files.set('/'+file,[file,'text/javascript; charset=utf-8']);
http.createServer((req, res) => {
  const file = files.get(req.url.split('?')[0]);
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  if (!file) {
    res.writeHead(404).end();
    return;
  }
  fs.readFile(path.join(__dirname, file[0]), (error, data) => {
    if (error) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': file[1], 'Content-Length': data.length, 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}).listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`人生 CFO: http://127.0.0.1:${port}/`);
  if (lan) {
    for (const entries of Object.values(os.networkInterfaces())) {
      for (const address of entries) {
        if (address.family === 'IPv4' && !address.internal) console.log(`LAN: http://${address.address}:${port}/`);
      }
    }
  }
});
