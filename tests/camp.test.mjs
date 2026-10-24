import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../web/model.js';
function stocked(){const s=M.newGame();for(const k of Object.keys(s.inventory))s.inventory[k]=100;s.completed=M.QUESTS.map(q=>q.id);s.buildings.furnace=1;return s;}
test('map preserves exploration and does not disclose unseen secrets or restored-site discoveries',()=>{
 const s=M.newGame(),secret=M.WORLD.find(n=>n.id==='secret0');s.discovered.push(M.key(secret.x,secret.z));
 assert.ok(!M.mapNodes(s).some(n=>n.id===secret.id));assert.ok(!M.mapNodes(s).some(n=>n.id==='beacon'));assert.ok(M.mapNodes(s).some(n=>n.id==='home'));
 s.secretSeen.push(secret.id);assert.ok(M.mapNodes(s).some(n=>n.id===secret.id));const d=M.WORLD.find(n=>n.type==='discovery');s.discovered.push(M.key(d.x,d.z));assert.ok(!M.mapNodes(s).includes(d));s.discoverySeen.push(d.discovery);assert.ok(M.mapNodes(s).includes(d));
});
test('waypoints require explored integer coordinates, persist, and report actual continuous distance',()=>{
 const s=M.newGame(),start={...s.player};for(const [x,z]of [[20,19],[21,0],[0,20],[.5,3],[NaN,1]])assert.equal(M.setWaypoint(s,x,z).ok,false);
 assert.ok(M.setWaypoint(s,1,3).ok);assert.deepEqual(s.player,start);s.player.x=.25;assert.equal(M.waypointInfo(s).distance,.75);assert.deepEqual(M.deserialize(M.serialize(s)).camp.waypoint,{x:1,z:3});assert.ok(M.setWaypoint(s,0,-3).ok,'home is always known');
});
test('recipe shopping lists track partial crafting and finish without spending or auto-crafting',()=>{
 const s=stocked();s.crafted.planks=8;const inv={...s.inventory};assert.ok(M.pinGoal(s,'recipe','planks',5).ok);assert.deepEqual(s.inventory,inv);assert.equal(s.camp.pin.target,18);assert.deepEqual(M.goalInfo(s).cost,{wood:15});
 M.craft(s,'planks',2);assert.deepEqual(M.goalInfo(s).cost,{wood:9});M.craft(s,'planks',3);assert.ok(M.goalInfo(s).done);assert.deepEqual(M.goalInfo(s).cost,{});assert.equal(s.camp.pin.target,18);
 assert.ok(M.pinGoal(s,'recipe','planks').ok);s.journey.friendships.oren=2;assert.equal(M.goalInfo(s).cost.wood,3);M.craft(s,'planks');assert.ok(M.goalInfo(s).done);assert.equal(M.pinGoal(s,'recipe','planks',-1).ok,false);
});
test('building, gear and restoration pins retain a single target stage and honor prerequisites',()=>{
 const s=stocked();assert.equal(M.pinGoal(s,'constructor','x').ok,false);assert.ok(M.pinGoal(s,'building','greenhouse').ok);assert.equal(M.goalInfo(s).ready,false);assert.match(M.goalInfo(s).reason,/pump/);s.flags.pump=true;assert.ok(M.goalInfo(s).ready);M.upgrade(s,'greenhouse');assert.ok(M.goalInfo(s).done);
 M.pinGoal(s,'gear','axe');M.upgradeGear(s,'axe');assert.ok(M.goalInfo(s).done);s.gear.axe=3;assert.equal(M.pinGoal(s,'gear','axe').ok,false);
 M.pinGoal(s,'project','garden');assert.equal(M.goalInfo(s).ready,false);s.flags.mira=true;assert.ok(M.goalInfo(s).ready);const n=M.WORLD.find(n=>n.id==='project-garden');for(const [x,z]of M.pathTo(s,n.x,n.z,true))M.move(s,x,z);assert.ok(M.interact(s,n.id).ok);assert.ok(M.goalInfo(s).done);assert.equal(s.camp.pin.target,1);
});
test('kitchen validates location, earned recipes and ingredients; meals replace instead of stacking',()=>{
 const s=M.newGame(),original=M.serialize(s);assert.equal(M.cookMeal(s,'stew').ok,false);assert.equal(M.serialize(s),original);s.buildings.furnace=1;s.inventory.food=0;const before=M.serialize(s);assert.equal(M.cookMeal(s,'stew').ok,false);assert.equal(M.serialize(s),before);
 s.inventory.food=20;s.inventory.coal=20;s.player={x:14,z:14};assert.equal(M.cookMeal(s,'stew').ok,false);s.player={x:0,z:3};assert.equal(M.cookMeal(s,'tea').ok,false);assert.equal(M.cookMeal(s,'constructor').ok,false);
 assert.ok(M.cookMeal(s,'stew').ok);assert.equal(s.inventory.food,17);assert.equal(s.camp.meal.ends,180);s.projects.garden=1;s.activeSeconds=10;assert.ok(M.cookMeal(s,'tea').ok);assert.equal(M.activeMeal(s).id,'tea');assert.equal(s.camp.meal.ends,190);assert.equal(s.camp.cooked.stew,1);assert.equal(s.camp.cooked.tea,1);
});
test('meal benefits apply to real gathering, cold and movement, and expire only in active ticks',()=>{
 const s=stocked();M.cookMeal(s,'stew');s.player={x:4,z:5};s.energy=50;assert.ok(M.interact(s,'first-pine').ok);assert.equal(s.energy,48);
 s.player={x:0,z:3};s.projects.garden=1;M.cookMeal(s,'tea');s.player={x:14,z:14};s.warmth=80;const plain=M.deserialize(M.serialize(s));plain.camp.meal=null;M.tick(s,1);M.tick(plain,1);assert.ok(Math.abs((80-s.warmth)/(80-plain.warmth)-.65)<1e-8);
 s.player={x:0,z:3};s.buildings.greenhouse=1;M.cookMeal(s,'oatcakes');assert.equal(M.mealSpeed(s),1.12);const saved=M.deserialize(M.serialize(s));assert.equal(M.activeMeal(saved).seconds,180);for(let i=0;i<179;i++)M.tick(saved,1);assert.equal(M.activeMeal(saved).seconds,1);M.tick(saved,1);assert.equal(M.activeMeal(saved),null);assert.equal(M.mealSpeed(saved),1);
});
test('camp extension and comfort settings migrate safely and reject malformed imported progress',()=>{
 const s=stocked();M.pinGoal(s,'recipe','parts',5);M.cookMeal(s,'stew');M.setWaypoint(s,1,3);s.settings.dragSensitivity=1.5;s.settings.reducedMotion=true;s.settings.steadyDaylight=true;const r=M.deserialize(M.serialize(s));assert.deepEqual(r.camp,s.camp);assert.deepEqual(r.settings,s.settings);
 const old=JSON.parse(M.serialize(s));delete old.camp;delete old.settings.dragSensitivity;delete old.settings.reducedMotion;delete old.settings.steadyDaylight;const migrated=M.deserialize(JSON.stringify(old));assert.deepEqual(migrated.camp,M.newCamp());assert.equal(migrated.settings.dragSensitivity,1);assert.equal(migrated.settings.reducedMotion,false);
 s.camp={waypoint:{x:999,z:0},meal:{id:'tea',ends:s.activeSeconds+99999},pin:{kind:'recipe',id:'parts',baseline:0,target:99999},cooked:{stew:-1,tea:4.5,oatcakes:1e20}};s.settings.dragSensitivity=100;const invalid=M.deserialize(M.serialize(s));assert.equal(invalid.camp.waypoint,null);assert.equal(invalid.camp.meal,null);assert.equal(invalid.camp.pin,null);assert.deepEqual(invalid.camp.cooked,{stew:0,tea:0,oatcakes:1000000});assert.equal(invalid.settings.dragSensitivity,1);
});
test('daylight cycles smoothly on active time; steady daylight changes no weather or survival rules',()=>{
 const s=M.newGame();assert.equal(M.daylight(s).night,0);s.activeSeconds=360;assert.equal(M.daylight(s).night,1);assert.equal(M.daylight(s).label,'Moonlight');const weather=M.weather(s);s.settings.steadyDaylight=true;assert.equal(M.daylight(s).night,0);assert.deepEqual(M.weather(s),weather);s.settings.steadyDaylight=false;s.activeSeconds=720;assert.equal(M.daylight(s).night,0);
 let previous=0;for(let t=0;t<=720;t++){s.activeSeconds=t;const n=M.daylight(s).night;assert.ok(n>=0&&n<=1);assert.ok(Math.abs(n-previous)<.005);previous=n;}
});
