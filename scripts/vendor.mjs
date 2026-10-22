import {copyFileSync,mkdirSync} from 'node:fs';
mkdirSync('web/vendor',{recursive:true});
for (const file of ['three.module.js','three.core.js']) copyFileSync(`node_modules/three/build/${file}`,`web/vendor/${file}`);
copyFileSync('node_modules/three/LICENSE','web/vendor/THREE-LICENSE.txt');
