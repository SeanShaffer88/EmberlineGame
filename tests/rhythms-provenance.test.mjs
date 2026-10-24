import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('Valley Rhythms source assets match their exact offline provenance and fifty documented additions',()=>{
 const root=new URL('../',import.meta.url);
 for(const name of ['valley-rhythms','inhabitants']){
  const data=JSON.parse(readFileSync(new URL(`web/assets/${name}-provenance.json`,root),'utf8'));
  assert.equal(data.networkRequired,false);for(const entry of data.sources){assert.ok(entry.file.startsWith('web/')&&!entry.file.includes('..'));const bytes=readFileSync(new URL(entry.file,root));assert.equal(bytes.length,entry.bytes,entry.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.file);}
 }
 const doc=readFileSync(new URL('docs/VALLEY-RHYTHMS.md',root),'utf8');assert.deepEqual([...doc.matchAll(/^\| (\d+) \|/gm)].map(m=>+m[1]),Array.from({length:50},(_,i)=>i+1));
});
