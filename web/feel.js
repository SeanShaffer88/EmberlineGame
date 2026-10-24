// Presentation timing only. Costs, stock and rewards are committed by model.interact.
export const WORK_SECONDS = 1.2;
export const STRIKES = [.2, .5, .8];
const profiles = {
 tree: {label:'Chopping timber',tool:'axe',color:0xe8bd80},
 coal: {label:'Mining coal',tool:'pick',color:0x8cabbc},
 scrap: {label:'Salvaging parts',tool:'prybar',color:0xffcf82},
 food: {label:'Picking berries',tool:null,color:0xbc6565},
};
export const workProfile = type => profiles[type] || {label:type==='wolf'?'Driving off wolf':type==='secret'?'Searching the snow':type==='survivor'?'Helping the survivor':'Restoring',tool:null,color:0xf0d7a4};
export const isGathering = type => Object.hasOwn(profiles,type);
