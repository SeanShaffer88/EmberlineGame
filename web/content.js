export const RELICS=[
 {name:'The brass whistle',hint:'A quiet place southwest of the hearth.',text:'The station keeper called everyone home with two short notes. On the last night, she sounded them until her breath ran out.'},
 {name:'A blue mitten',hint:'Beyond the eastern berry patches.',text:'A child stitched a crooked star into the wool. The tag says: “If found, bring to the big tree. We will wait.”'},
 {name:'The keeper’s compass',hint:'Where the western logging trail ends.',text:'North is scratched out. HOME is carved below the needle. The keeper knew a direction is not a destination.'},
 {name:'A packet of seeds',hint:'Near the old crossing, on the southern bank.',text:'Sealed in oilcloth: beans, marigolds, and a note. “Plant something beautiful too. Surviving is only the beginning.”'},
 {name:'The midnight photograph',hint:'Under the northwest ridge.',text:'Seven people stand beside this train. One face has been circled. The name on the back is Ada, the keeper.'},
 {name:'A broken pocket watch',hint:'Past the northeastern lookout.',text:'The hands stopped at 4:17. Inside the case: “If the light goes out, remember the western stones.”'},
 {name:'The last unsent letter',hint:'At the southern edge of the valley.',text:'“We stayed. We shared everything. If you find our home, light it again. There is another supply cache near the western stones.”'},
 {name:'Ada’s copper key',hint:'Where the far-bank pines meet the ridge.',text:'A tiny key, warm in your palm. Eight keepsakes tell one story. Look for the stone vault at the southwest edge of the valley.'}
];
export const SECRET_SPOTS=[[-7,10],[15,5],[-17,-5],[6,-8],[-16,-17],[16,-18],[-2,17],[6,-17]];
export const GEAR={
 axe:{name:'Trail hatchet',icon:'hammer',description:'+1 timber per harvest at each level.',costs:[{planks:4,parts:2},{planks:8,parts:6},{planks:14,parts:12}]},
 prybar:{name:'Salvage tools',icon:'craft',description:'+1 salvage and coal per harvest at each level.',costs:[{parts:4,coal:2},{parts:8,coal:5},{parts:14,coal:8}]},
 coat:{name:'Expedition coat',icon:'fire',description:'Each level reduces cold exposure. Keeps its warmth forever.',costs:[{food:6,planks:4},{food:10,parts:6},{food:16,parts:12}]},
 boots:{name:'Trail boots',icon:'compass',description:'Each level increases walking speed.',costs:[{planks:4,parts:4},{planks:8,parts:8},{planks:12,parts:14}]},
 lantern:{name:'Keeper’s lantern',icon:'energy',description:'Each level reveals a wider circle of the valley.',costs:[{parts:4,coal:4},{parts:8,coal:8},{parts:14,coal:12}]}
};
export const DIFFICULTIES={cozy:{name:'A gentler winter',description:'Half the cold and wildlife damage. Explore at your own pace.',cold:.5,damage:.5},standard:{name:'The long winter',description:'The intended balance of exploration and survival.',cold:1,damage:1},harsh:{name:'The white wilderness',description:'Faster cold, stronger wildlife. Every trip asks more of you.',cold:1.65,damage:1.5}};
export const ACHIEVEMENTS=[
 {id:'firstfire',name:'A spark is enough',text:'Restore the Hearth.',kind:'building',key:'furnace',target:1},
 {id:'lumberjack',name:'Timberline',text:'Gather 100 timber.',kind:'gathered',key:'wood',target:100},
 {id:'forester',name:'A forest of possibilities',text:'Gather 500 timber.',kind:'gathered',key:'wood',target:500},
 {id:'salvager',name:'Nothing wasted',text:'Gather 100 salvage.',kind:'gathered',key:'scrap',target:100},
 {id:'scavenger',name:'Old world, new purpose',text:'Gather 500 salvage.',kind:'gathered',key:'scrap',target:500},
 {id:'miner',name:'Black gold',text:'Gather 100 coal.',kind:'gathered',key:'coal',target:100},
 {id:'forager',name:'A table for everyone',text:'Gather 100 food.',kind:'gathered',key:'food',target:100},
 {id:'maker',name:'Made by hand',text:'Craft 50 planks.',kind:'crafted',key:'planks',target:50},
 {id:'machinist',name:'Something from nothing',text:'Craft 50 parts.',kind:'crafted',key:'parts',target:50},
 {id:'medic',name:'First, do some good',text:'Craft 12 medkits.',kind:'crafted',key:'medkit',target:12},
 {id:'rescue',name:'Leave the light on',text:'Rescue Mira.',kind:'flag',key:'mira',target:1},
 {id:'family',name:'Found family',text:'Rescue all three specialists.',kind:'crew',target:3},
 {id:'bridgebuilder',name:'Meet you on the other side',text:'Restore the northern bridge.',kind:'flag',key:'bridge',target:1},
 {id:'gardener',name:'Spring is a promise',text:'Build the Greenhouse.',kind:'building',key:'greenhouse',target:1},
 {id:'signal',name:'We are still here',text:'Complete the main story.',kind:'flag',key:'beacon',target:1},
 {id:'explorer',name:'Footprints in fresh snow',text:'Discover 400 valley tiles.',kind:'explored',target:400},
 {id:'cartographer',name:'Know every trail',text:'Discover 1,000 valley tiles.',kind:'explored',target:1000},
 {id:'curious',name:'Look a little closer',text:'Discover your first keepsake.',kind:'relics',target:1},
 {id:'keeper',name:'Remember the keeper',text:'Find all eight keepsakes.',kind:'relics',target:8},
 {id:'vault',name:'Her last gift',text:'Open Ada’s hidden vault.',kind:'vault',target:1},
 {id:'helper',name:'Good neighbor',text:'Finish 5 field contracts.',kind:'contracts',target:5},
 {id:'regular',name:'The valley provides',text:'Finish 25 field contracts.',kind:'contracts',target:25},
 {id:'legend',name:'A Frosthollow legend',text:'Finish 100 field contracts.',kind:'contracts',target:100},
 {id:'geared',name:'Ready for anything',text:'Earn all 15 equipment upgrades.',kind:'gear',target:15},
 {id:'town',name:'Built to last',text:'Earn all 15 settlement upgrades.',kind:'buildings',target:15}
];
export const LIVERIES={classic:{name:'Hearth red',color:0xaf5148,description:'Your original locomotive.'},pine:{name:'Evergreen',color:0x41736c,achievement:'family',description:'Rescue all three specialists.'},blue:{name:'Glacier blue',color:0x558eb0,achievement:'helper',description:'Finish 5 field contracts.'},gold:{name:'Keeper’s gold',color:0xb68a44,achievement:'vault',description:'Find the eight keepsakes and open Ada’s vault.'},night:{name:'Midnight express',color:0x454b6d,achievement:'regular',description:'Finish 25 field contracts.'},white:{name:'Northern light',color:0xc1d4d5,achievement:'town',description:'Fully upgrade the settlement.'}};

// Camp remarks follow permanent milestones, with no relationship grind or timers.
export function crewRemark(state, id) {
 const stage = state.flags.beacon ? 3 : state.flags.relay ? 2 : state.buildings.greenhouse ? 1 : 0;
 return {
  mira: [
   'I had forgotten what a kettle sounded like. Funny, the little things that bring you back.',
   'A green leaf in all this snow. I checked on it three times today. For medical reasons, obviously.',
   'Someone answered the radio. I have put an extra blanket by the stove, just in case.',
   'I used to count the people I could not help. Today I counted everyone at breakfast.'
  ],
  oren: [
   'That carriage door sticks. Leave it with me. A home ought to let you in without an argument.',
   'Built a shelf for the greenhouse. Then another. Apparently growing things need room for ambition.',
   'The bridge holds. The roof holds. You can stop checking over your shoulder for a moment.',
   'Made a little sign for the platform. FROSTHOLLOW. Had to sand it twice. Wanted it to last.'
  ],
  ivo: [
   'There are stone piles out in the trees. Too neat to be accidents. Keep your eyes on the snow.',
   'I mapped the creek again. Same bends, same stones. It feels different when you know the way home.',
   'The voice on the radio asked where we were going. I told them we were already here.',
   'You can see our beacon from every ridge. Best landmark I have ever put on a map.'
  ]
 }[id][stage];
}
