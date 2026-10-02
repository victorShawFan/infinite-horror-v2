import { readFileSync } from 'fs';

const mapSrc = readFileSync('src/core/MapGenerator.js', 'utf8');

console.log('═══ 实体位置验证 ═══\n');

// Floor definitions with their carving
const floors = [
  { num: 1, w: 13, h: 13, carve: (t) => {
    for (let y = 2; y <= 10; y++) for (let x = 2; x <= 10; x++) t[y][x] = 1;
    for (const y of [3,5,7,9]) { t[y][3]=2; t[y][4]=2; t[y][8]=2; t[y][9]=2; }
    t[1][6] = 4;
  }},
  { num: 2, w: 17, h: 15, carve: (t) => {
    const rooms = [[1,1,7,7],[9,1,15,5],[1,9,7,13],[9,8,15,13]];
    const corrs = [[7,3,9,3],[4,7,4,9],[9,5,12,8]];
    for (const [x1,y1,x2,y2] of rooms) for (let y=y1;y<=y2;y++) for (let x=x1;x<=x2;x++) if(y<15&&x<17) t[y][x]=1;
    for (const [x1,y1,x2,y2] of corrs) { const sx=Math.min(x1,x2),ex=Math.max(x1,x2),sy=Math.min(y1,y2),ey=Math.max(y1,y2); for(let y=sy;y<=ey;y++) for(let x=sx;x<=ex;x++) if(y<15&&x<17) t[y][x]=1; }
    t[1][8]=4;
  }},
  { num: 3, w: 17, h: 17, carve: (t) => {
    const rooms = [[1,1,7,7],[9,1,15,7],[1,9,7,15],[9,9,15,15]];
    const corrs = [[7,4,9,4],[4,7,4,9],[12,7,12,9]];
    for (const [x1,y1,x2,y2] of rooms) for (let y=y1;y<=y2;y++) for (let x=x1;x<=x2;x++) if(y<17&&x<17) t[y][x]=1;
    for (const [x1,y1,x2,y2] of corrs) { const sx=Math.min(x1,x2),ex=Math.max(x1,x2),sy=Math.min(y1,y2),ey=Math.max(y1,y2); for(let y=sy;y<=ey;y++) for(let x=sx;x<=ex;x++) if(y<17&&x<17) t[y][x]=1; }
    t[15][13]=4;
  }},
  { num: 4, w: 21, h: 9, carve: (t) => {
    for (let x=1;x<20;x++) for (let y=2;y<=6;y++) t[y][x]=1;
    t[4][19]=4;
  }},
  { num: 5, w: 17, h: 17, carve: (t) => {
    const rooms = [[1,1,7,7],[9,1,15,7],[1,9,7,15],[9,9,15,15]];
    const corrs = [[7,4,9,4],[4,7,4,9],[12,7,12,9]];
    for (const [x1,y1,x2,y2] of rooms) for (let y=y1;y<=y2;y++) for (let x=x1;x<=x2;x++) if(y<17&&x<17) t[y][x]=1;
    for (const [x1,y1,x2,y2] of corrs) { const sx=Math.min(x1,x2),ex=Math.max(x1,x2),sy=Math.min(y1,y2),ey=Math.max(y1,y2); for(let y=sy;y<=ey;y++) for(let x=sx;x<=ex;x++) if(y<17&&x<17) t[y][x]=1; }
    t[15][13]=4;
  }},
  { num: 6, w: 19, h: 15, carve: (t) => {
    const rooms = [[1,1,7,6],[1,8,7,13],[9,1,17,5],[13,8,17,13]];
    const corrs = [[7,3,9,3],[4,6,4,8],[9,5,12,8]];
    for (const [x1,y1,x2,y2] of rooms) for (let y=y1;y<=y2;y++) for (let x=x1;x<=x2;x++) if(y<15&&x<19) t[y][x]=1;
    for (const [x1,y1,x2,y2] of corrs) { const sx=Math.min(x1,x2),ex=Math.max(x1,x2),sy=Math.min(y1,y2),ey=Math.max(y1,y2); for(let y=sy;y<=ey;y++) for(let x=sx;x<=ex;x++) if(y<15&&x<19) t[y][x]=1; }
    t[1][16]=4;
  }},
];

let totalIssues = 0;

for (const floor of floors) {
  const tiles = Array.from({length: floor.h}, () => Array(floor.w).fill(2));
  floor.carve(tiles);
  
  // Extract entities for this floor
  const regex = new RegExp(`function generateFloor_1_${floor.num}\\(\\)(.*?)(?=function generateFloor_1_${floor.num+1}|function makeChest|$)`, 's');
  const match = mapSrc.match(regex);
  if (!match) { console.log(`Floor 1-${floor.num}: PARSE ERROR`); continue; }
  
  const body = match[1];
  const entities = [...body.matchAll(/id:\s*'([^']+)'.*?name:\s*'([^']+)'.*?x:\s*(\d+),\s*y:\s*(\d+)/gs)];
  
  let floorOk = true;
  for (const m of entities) {
    const [, id, name, xs, ys] = m;
    const x = parseInt(xs), y = parseInt(ys);
    const tile = (y >= 0 && y < floor.h && x >= 0 && x < floor.w) ? tiles[y][x] : -1;
    if (tile === 2 || tile === 0 || tile === -1) {
      console.log(`  1-${floor.num} ✗ (${x},${y}) WALL → ${name} [${id}]`);
      floorOk = false;
      totalIssues++;
    }
  }
  if (floorOk) console.log(`Floor 1-${floor.num}: ✓ 所有实体位置正确`);
}

console.log(`\n═══ ${totalIssues === 0 ? '✅ 全部通过' : `❌ ${totalIssues}个问题`} ═══`);
process.exit(totalIssues > 0 ? 1 : 0);
