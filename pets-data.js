// ===================================================================
// pets-data.js — virtual pets sold in the shop, shown on your profile.
// Each pet is hand-built pixel art as inline SVG (sharp at any size,
// no image hosting needed). Owned pet id lives on profile.pet; the
// equipped one renders on the profile card.
// ===================================================================

// helper: build an SVG from a pixel grid map. `px` array of [x,y,w,h,color].
function pixelSVG(viewW, viewH, rects, extra){
  const body = rects.map(r=>`<rect x="${r[0]}" y="${r[1]}" width="${r[2]}" height="${r[3]}" fill="${r[4]}"/>`).join('');
  return `<svg viewBox="0 0 ${viewW} ${viewH}" width="100%" height="100%" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${body}${extra||''}</svg>`;
}

const PETS = [
  {
    id:'pet_monkey', name:'Monkey', cost:600, kind:'basic',
    blurb:'flings stuff, judges you',
    svg: pixelSVG(16,16,[
      // tail
      [1,8,1,4,'#6b4a2a'],[2,11,2,1,'#6b4a2a'],
      // body
      [5,8,6,5,'#7a5230'],[6,13,2,2,'#6b4a2a'],[9,13,2,2,'#6b4a2a'],
      // arms
      [3,8,2,3,'#7a5230'],[11,8,2,3,'#7a5230'],
      // head
      [5,3,6,5,'#7a5230'],
      // face
      [6,4,4,3,'#d9b38c'],
      // ears
      [4,3,1,2,'#7a5230'],[11,3,1,2,'#7a5230'],
      // eyes
      [6,4,1,1,'#1a1a1a'],[9,4,1,1,'#1a1a1a'],
      // nose/mouth
      [7,6,2,1,'#5a3a1a']
    ])
  },
  {
    id:'pet_rat', name:'Rat', cost:450, kind:'basic',
    blurb:'loyal sewer companion',
    svg: pixelSVG(16,16,[
      // tail
      [13,9,2,1,'#c99'],[14,7,1,2,'#c99'],
      // body
      [4,8,9,4,'#9aa0a6'],[5,12,2,1,'#9aa0a6'],[9,12,2,1,'#9aa0a6'],
      // head
      [2,7,4,4,'#9aa0a6'],
      // ears
      [2,5,2,2,'#c0a0a8'],[4,5,2,2,'#c0a0a8'],
      // eye
      [3,8,1,1,'#1a1a1a'],
      // nose
      [1,9,1,1,'#e88'],
      // whisker
      [0,9,1,1,'#ccc']
    ])
  },
  {
    id:'pet_bear', name:'Bear', cost:900, kind:'basic',
    blurb:'big, grumpy, huggable',
    svg: pixelSVG(16,16,[
      // body
      [4,7,8,7,'#6b4a2a'],
      // legs
      [4,13,2,2,'#5a3a1f'],[10,13,2,2,'#5a3a1f'],
      // head
      [4,2,8,6,'#7a5230'],
      // ears
      [4,1,2,2,'#6b4a2a'],[10,1,2,2,'#6b4a2a'],
      [4,1,1,1,'#8a6240'],[11,1,1,1,'#8a6240'],
      // snout
      [6,5,4,3,'#c9a877'],
      // eyes
      [5,3,1,1,'#1a1a1a'],[10,3,1,1,'#1a1a1a'],
      // nose
      [7,5,2,1,'#1a1a1a'],
      // belly
      [6,9,4,3,'#8a6240']
    ])
  },
  {
    id:'pet_dragon', name:'Dragon', cost:2500, kind:'funny', limited:5,
    blurb:'tiny, breathes tinier fire',
    svg: pixelSVG(16,16,[
      // tail
      [1,10,2,1,'#2a8a4a'],[2,11,2,1,'#2a8a4a'],
      // body
      [4,7,7,5,'#33a055'],[5,12,2,1,'#2a8a4a'],[8,12,2,1,'#2a8a4a'],
      // belly scales
      [5,9,5,2,'#bfe8a0'],
      // wing
      [3,4,4,4,'#2a8a4a'],[4,3,2,2,'#33a055'],
      // head
      [9,4,5,5,'#33a055'],
      // horns
      [9,3,1,2,'#e8e0c0'],[12,3,1,2,'#e8e0c0'],
      // eye
      [12,5,1,1,'#1a1a1a'],
      // nostril + tiny fire
      [14,6,1,1,'#1a1a1a'],[15,6,1,1,'#ff9a3c'],[15,7,1,1,'#ffd23c']
    ])
  },
  {
    id:'pet_goblin', name:'Goblin', cost:1800, kind:'funny',
    blurb:'schemes constantly, smells faintly',
    svg: pixelSVG(16,16,[
      // body
      [5,8,6,5,'#5a8a3a'],[5,13,2,2,'#3a5a22'],[9,13,2,2,'#3a5a22'],
      // arms
      [3,9,2,2,'#6a9a4a'],[11,9,2,2,'#6a9a4a'],
      // head
      [4,3,8,5,'#6a9a4a'],
      // ears (big pointy)
      [2,3,2,2,'#5a8a3a'],[3,2,1,1,'#6a9a4a'],[12,3,2,2,'#5a8a3a'],[12,2,1,1,'#6a9a4a'],
      // eyes (beady)
      [6,4,1,1,'#ffd23c'],[9,4,1,1,'#ffd23c'],
      // grin
      [6,6,4,1,'#2a3a1a'],[7,5,1,1,'#fff'],[8,5,1,1,'#fff'],
      // nose
      [7,5,1,1,'#5a8a3a']
    ])
  },
  {
    id:'pet_oldman', name:'Old Man', cost:1500, kind:'funny', limited:10,
    blurb:'yells at the other pets',
    svg: pixelSVG(16,16,[
      // body (cardigan)
      [5,8,6,6,'#7a4a3a'],[5,8,6,1,'#8a5a4a'],
      // arms
      [3,8,2,4,'#7a4a3a'],[11,8,2,4,'#7a4a3a'],
      // hands
      [3,12,2,1,'#e0c0a0'],[11,12,2,1,'#e0c0a0'],
      // legs
      [5,14,2,2,'#3a3a4a'],[9,14,2,2,'#3a3a4a'],
      // head
      [5,3,6,5,'#e8c8a8'],
      // bald top + side hair
      [5,3,6,1,'#e8c8a8'],[4,5,1,3,'#cfd6e0'],[11,5,1,3,'#cfd6e0'],
      // eyebrows (bushy)
      [5,4,2,1,'#cfd6e0'],[9,4,2,1,'#cfd6e0'],
      // eyes (squint)
      [6,5,1,1,'#1a1a1a'],[9,5,1,1,'#1a1a1a'],
      // glasses
      [5,5,3,1,'#888'],[8,5,3,1,'#888'],
      // mustache
      [6,7,4,1,'#cfd6e0'],
      // mouth (frown)
      [7,8,2,1,'#7a4a3a']
    ])
  }
];

function petById(id){ return PETS.find(p=>p.id===id); }
