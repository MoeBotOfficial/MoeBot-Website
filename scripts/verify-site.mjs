import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const item=path.join(directory,entry.name);if(entry.isDirectory())files.push(...await walk(item));else files.push(item);}return files;}
const files=await walk(dist);const paths=new Set(files.map(file=>path.relative(dist,file).split(path.sep).join('/')));const pages=new Map();
const errors=[];
for(const file of files.filter(file=>file.endsWith('.html'))){const html=await readFile(file,'utf8');const $=load(html);const key=path.relative(dist,file).split(path.sep).join('/');pages.set(key,$);if(!$('title').text())errors.push(`${key}: 缺少页面标题`);if($('main h1').length!==1)errors.push(`${key}: 正文应有一个 h1`);if(!$('#main').length)errors.push(`${key}: 缺少正文入口`);if(/ghp_[A-Za-z0-9]{20,}|vcp_[A-Za-z0-9]{20,}|cfat_[A-Za-z0-9]{20,}/.test(html))errors.push(`${key}: 发现凭据格式`);}
function localFile(url){const pathname=decodeURIComponent(url.pathname).replace(/^\//,'');if(paths.has(pathname))return pathname;return path.posix.join(pathname,'index.html');}
for(const [key,$] of pages){const base=new URL(key.endsWith('index.html')?'/'+key.slice(0,-10):'/'+key,'https://local.invalid');for(const element of $('a[href],img[src]').toArray()){const tag=element.tagName;const attr=tag==='img'?'src':'href';const href=$(element).attr(attr);if(!href||/^(?:mailto:|https?:|data:|tel:)/.test(href))continue;let url;try{url=new URL(href,base);}catch{errors.push(`${key}: 无效链接 ${href}`);continue;}const target=localFile(url);if(!paths.has(target)){errors.push(`${key}: 缺失 ${href}`);continue;}if(tag==='a'&&url.hash&&target.endsWith('.html')){const id=decodeURIComponent(url.hash.slice(1));const targetPage=pages.get(target);if(targetPage&&![...targetPage('[id]').toArray()].some(node=>targetPage(node).attr('id')===id))errors.push(`${key}: 缺失锚点 ${href}`);}}}
if(!paths.has('pagefind/pagefind.js'))errors.push('缺少静态搜索索引');if(!paths.has('sitemap-index.xml'))errors.push('缺少 sitemap');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`静态站点检查通过：${pages.size} 页，内部链接、锚点、搜索索引与 sitemap 完整。`);
