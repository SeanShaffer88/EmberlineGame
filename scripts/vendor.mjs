import {copyFileSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
mkdirSync('web/vendor',{recursive:true});
for (const file of ['three.module.js','three.core.js']) copyFileSync(`node_modules/three/build/${file}`,`web/vendor/${file}`);
copyFileSync('node_modules/three/LICENSE','web/vendor/THREE-LICENSE.txt');
// Keep the matching loader and its utility imports local, including in Android.
for(const file of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','utils/SkeletonUtils.js']){
 mkdirSync('web/vendor/'+file.split('/')[0],{recursive:true});
 writeFileSync('web/vendor/'+file,readFileSync('node_modules/three/examples/jsm/'+file,'utf8').replaceAll("from 'three'","from '../three.module.js'"));
}
