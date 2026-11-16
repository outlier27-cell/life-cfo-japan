
'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
(async()=>{let marked;try{({marked}=await import('marked'));}catch{if(!process.env.CFO_NODE_MODULES)throw Error('Set CFO_NODE_MODULES to bundled Node packages');const{pathToFileURL}=require('node:url');({marked}=await import(pathToFileURL(path.join(process.env.CFO_NODE_MODULES,'marked/lib/marked.esm.js')).href));}
const documents=[['guide.html',read('docs/玩法守则-v6.md')+'\n\n[下载Word版玩法守则](docs/life-cfo-player-v6.docx)\n'],['developer.html',read('docs/开发与持续优化文档-v6.md')+'\n\n[下载Word版开发文档](docs/life-cfo-developer-v6.docx)\n'],['sources.html',read('docs/数据来源-v6.md')],['review.html',read('docs/改进分析-v6.md')]];
require('./render-docs.cjs')({root,marked,documents,edition:'家庭账本篇 6.0',date:'2026-11-16'});
})();
