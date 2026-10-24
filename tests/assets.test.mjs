import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname,sep} from 'node:path';
const root=resolve('web/assets'),manifest=JSON.parse(readFileSync(root+'/asset-manifest.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('bundled art matches its recorded provenance and local texture dependencies',()=>{
 assert.equal(manifest.models.length,16);
 for(const item of [...manifest.models,...manifest.textures]){
  const file=resolve(root,item.file),bytes=readFileSync(file);assert.equal(hash(bytes),item.sha256,item.file);assert.equal(item.license,'CC0-1.0');
  if(!item.file.endsWith('.glb'))continue;
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  const childNodes=new Set(gltf.nodes.flatMap(n=>n.children||[]));for(const scene of gltf.scenes)for(const n of scene.nodes)assert.ok(!childNodes.has(n),'Scene uses root nodes');
  for(const res of [...gltf.buffers,...gltf.images||[]])if(res.uri){assert.ok(!/^(https?:|\/|data:)/i.test(res.uri));const dep=resolve(dirname(file),res.uri);assert.ok(dep.startsWith(root+sep));assert.ok(readFileSync(dep).length>0);}
 }
 assert.equal(hash(readFileSync(root+'/title.png')),manifest.generated_art.sha256);
});

test('small-wonders models, texture and original notebook illustration match their provenance',()=>{
 const m=JSON.parse(readFileSync(root+'/field-assets.json','utf8'));assert.equal(m.models.length,10);
 for(const item of [...m.models,...m.textures]){const file=resolve(root,item.file),bytes=readFileSync(file);assert.equal(hash(bytes),item.sha256);assert.equal(item.license,'CC0-1.0');if(!item.file.endsWith('.glb'))continue;const g=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());const children=new Set(g.nodes.flatMap(n=>n.children||[]));for(const scene of g.scenes)for(const n of scene.nodes)assert.ok(!children.has(n));for(const res of [...g.buffers,...g.images||[]])if(res.uri){const dep=resolve(dirname(file),res.uri);assert.ok(dep.startsWith(root+sep));assert.ok(readFileSync(dep).length);}}
 assert.equal(hash(readFileSync(root+'/'+m.generated_art.file)),m.generated_art.sha256);const validation=JSON.parse(readFileSync(root+'/field-validation.json'));assert.equal(validation.errors,0);assert.equal(validation.warnings,0);
});
