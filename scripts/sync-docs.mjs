import { writeFile, mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { repositories, docSources } from './doc-sources.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const local=process.argv.includes('--local');
const workspace=process.env.MOEBOT_SOURCE_ROOT||path.dirname(root);
const token=process.env.GITHUB_TOKEN;
const map=new Map(docSources.map(s=>[`${repositories[s.repo].repository}/${s.path}`,s.slug]));

async function sourceText(repo,file){
  if(local){
    const result=spawnSync('git',['show',`${repo.commit}:${file}`],{cwd:path.join(workspace,repo.directory),encoding:'utf8',maxBuffer:2*1024*1024});
    if(result.status!==0)throw new Error(`无法读取固定提交：${repo.repository}/${file}`);
    return result.stdout;
  }
  const response=await fetch(`https://api.github.com/repos/${repo.repository}/contents/${file}?ref=${repo.commit}`,{headers:{Accept:'application/vnd.github.raw+json',...(token?{Authorization:`Bearer ${token}`}:{})}});
  if(!response.ok)throw new Error(`文档读取失败：${repo.repository}/${file}（HTTP ${response.status}）。私有来源请提供只读 GITHUB_TOKEN。`);
  return response.text();
}

function destination(repo,sourcePath,target){
  if(/^(?:https?:|mailto:|#|\/)/.test(target))return target;
  const [rawPath,hash]=target.split('#');
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(sourcePath),rawPath));
  const route=map.get(`${repo.repository}/${resolved}`);
  if(route)return `/docs/${route}/${hash?`#${hash}`:''}`;
  if(repo.public)return `https://github.com/${repo.repository}/blob/${repo.commit}/${resolved}${hash?`#${hash}`:''}`;
  // 原仓库私有：非白名单内部路径只显示源码路径，不生成公众无法读取的链接。
  return null;
}

const manifest=[];
for(const source of docSources){
  const repo=repositories[source.repo];
  const original=await sourceText(repo,source.path);
  let body=original;
  if(/<script\b|\bon\w+\s*=|javascript:/i.test(body))throw new Error(`文档包含不可发布 HTML：${source.path}`);
  // README 顶部品牌 Logo 改用已审阅的本地品牌资产；其他未知 HTML 不进入静态文档。
  body=body.replace(/<img\b[^>]*>/gi,'');
  body=body.replace(/^# .+\r?\n/m,'').trim();
  // 代码块/行内代码中的 Markdown 是示例，不能改写链接或把示例当真实图片。
  body=body.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g).map((part,index)=>{
    if(index%2)return part;
    return part.replace(/(!?)\[([^\]]*)\]\(([^\s)]+)\)/g,(whole,image,label,url)=>{
      if(image){if(/^https:\/\//.test(url))return whole;throw new Error(`需要单独审阅图片资源：${source.path} -> ${url}`);}
      const transformed=destination(repo,source.path,url);
      return transformed?`[${label}](${transformed})`:`${label}（源码路径：\`${url}\`）`;
    });
  }).join('');
  const meta={title:source.title,description:source.description,slug:source.slug,version:source.version||'核心 / WebUI 0.8.6',verifiedAt:'2026-10-29',source:{repository:repo.repository,path:source.path,commit:repo.commit,public:repo.public},imported:true};
  const frontmatter=Object.entries(meta).map(([key,value])=>`${key}: ${JSON.stringify(value)}`).join('\n');
  const prefix=source.note?`> 当前版本说明：${source.note}\n\n`:'';
  const output=`---\n${frontmatter}\n---\n\n${prefix}${body}\n`;
  const target=path.join(root,'src/content/docs',`${source.slug}.md`);
  await mkdir(path.dirname(target),{recursive:true});await writeFile(target,output);
  manifest.push({...meta,originalSha256:createHash('sha256').update(original).digest('hex'),renderedSha256:createHash('sha256').update(body).digest('hex')});
}
await writeFile(path.join(root,'docs-sources.json'),JSON.stringify({verifiedAt:'2026-10-29',sources:manifest},null,2)+'\n');
console.log(`已同步 ${manifest.length} 篇固定版本的 Markdown 文档。请审阅 diff 后提交；普通构建直接使用这些快照。`);
