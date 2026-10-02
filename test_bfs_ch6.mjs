import { generateChapter6 } from './src/core/MapGenerator_Ch6.js';
import { TILE } from './src/core/constants.js';
function bfs(t,s){const H=t.length,W=t[0].length,v=Array.from({length:H},()=>Array(W).fill(false)),q=[[s.x,s.y]];v[s.y][s.x]=true;const d=[[0,1],[0,-1],[1,0],[-1,0]];while(q.length){const[cx,cy]=q.shift();for(const[dx,dy]of d){const nx=cx+dx,ny=cy+dy;if(nx>=0&&nx<W&&ny>=0&&ny<H&&!v[ny][nx]&&t[ny][nx]===TILE.FLOOR){v[ny][nx]=true;q.push([nx,ny]);}}}return v;}
const ch=generateChapter6();let ok=true;
for(const f of ch.floors){const ps=f.playerStart;if(!f.tiles||!f.width||!f.height){console.error(`${f.id}: bad contract`);ok=false;continue;}if(f.tiles[ps.y][ps.x]!==TILE.FLOOR){console.error(`${f.id}: bad start`);ok=false;continue;}const v=bfs(f.tiles,ps);const ents=f.entities.filter(e=>e.x!==undefined);const bad=ents.filter(e=>!v[e.y]?.[e.x]);if(bad.length){console.error(`${f.id}: ✗ ${bad.map(e=>e.id).join(', ')}`);ok=false;}else console.log(`${f.id}: ✓ ${ents.length} [${f.name}]`);}
console.log();if(ok)console.log('═══ ✅ 第六章BFS全部通过 ═══');else{console.error('═══ ❌ ═══');process.exit(1);}
