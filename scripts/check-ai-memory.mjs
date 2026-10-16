#!/usr/bin/env node
// Structural and file-size validator for repository-backed AI memory.
// Security, authorship and factual correctness still require human/agent review.
import {readFileSync,readdirSync,statSync,existsSync} from "node:fs";
import {join,resolve,relative,sep} from "node:path";

const root=resolve(".ai-memory");
const errors=[];
if(!existsSync(root)){console.error("Missing .ai-memory");process.exit(1)}
function filesOf(directory){
  const all=[];
  for(const item of readdirSync(directory,{withFileTypes:true})){
    const path=join(directory,item.name);
    if(item.isDirectory())all.push(...filesOf(path));
    else if(item.isFile())all.push(path);
  }
  return all;
}
const files=filesOf(root);
for(const path of files){
  const name=relative(root,path).replaceAll(sep,"/");
  if(!name.endsWith(".md"))continue;
  const bytes=statSync(path).size;
  if(name.endsWith("/MEMORY.md")||name==="shared/MEMORY.md"){
    if(bytes>4096)errors.push(name+" index "+bytes+" bytes exceeds 4096");
  }
  if(/(?:^|\/)chunks\/memory-\d{4}\.md$/.test(name)&&bytes>8192){
    errors.push(name+" chunk "+bytes+" bytes exceeds 8192");
  }
  if(/(?:^|\/)chunks\/memory-\d{4}\.md$/.test(name)&&bytes>6144)
    console.warn(name+": over 6144-byte rollover target; rotate on next append");
}
const required=[
  "config.yaml","INSTRUCTIONS.md","RULES.md","shared/MEMORY.md",
  "agents/chatgpt/MEMORY.md"
];
for(const name of required)if(!existsSync(join(root,name)))errors.push("Missing "+name);
const config=readFileSync(join(root,"config.yaml"),"utf8");
if(!/memory_sync:\s*\n\s+enabled:\s*true(?:\s|$)/.test(config))
  errors.push("Project memory-sync enablement flag missing");
for(const folder of filesOf(join(root,"agents")).filter(x=>/chunks[/\\]memory-\d{4}\.md$/.test(x))){
  const parent=resolve(folder,"..","..");
  const index=join(parent,"MEMORY.md");
  if(!existsSync(index)||!readFileSync(index,"utf8").includes("chunks/"+folder.split(/[\\/]/).at(-1)))
    errors.push("Unlinked chunk: "+relative(root,folder));
}
if(errors.length){console.error(errors.join("\n"));process.exit(1)}
console.log("AI memory structure OK; "+files.length+" files checked (limits 4096/6144/8192 UTF-8 bytes).");
