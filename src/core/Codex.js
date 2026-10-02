// ═══════════════════════════════════════════════════════════════
// 知识典籍系统 — 世界观/角色/怪物/物品百科全书
// ═══════════════════════════════════════════════════════════════
import { gameState } from './GameState.js';
import { GAME_STATE } from './constants.js';
import { LORE_ENTRIES, loreTracker } from './LoreSystem.js';
import { COMPANION_PROFILES } from './RelationshipSystem.js';

// ── 世界观条目 ──
const WORLD_ENTRIES = {
  lord_god: {
    title: '主神',
    category: '核心设定',
    text: '主神是轮回空间的最高存在。它将不同世界的人类传送至各个恐怖电影世界中进行试炼。完成任务者获得奖励，失败者则会被抹杀。主神的真正目的至今成谜。',
    icon: '🔮',
  },
  lord_god_space: {
    title: '主神空间',
    category: '核心设定',
    text: '位于轮回世界之间的中转空间。在这里，轮回者可以兑换武器、能力、强化身体、购买物资。主神空间是唯一安全的地方——至少看上去如此。',
    icon: '🏛',
  },
  gene_lock: {
    title: '基因锁',
    category: '能力体系',
    text: '人类基因中的限制器。开启基因锁可以大幅提升身体素质和战斗能力。共分为五阶：第一阶至第四阶逐级提升，第五阶被称为"神域"，是人类进化的终极。',
    icon: '🧬',
  },
  reward_points: {
    title: '奖励点',
    category: '核心设定',
    text: '完成轮回任务获得的通货。可以在主神空间兑换一切——武器、药剂、能力增强、甚至复活死去的同伴。奖励点是轮回者最珍贵的资源。',
    icon: '💎',
  },
  zhongzhou_team: {
    title: '中洲队',
    category: '阵营',
    text: '以郑吒为核心的轮回者队伍。经历生死考验逐渐成长，从一群普通人变为能与各路强者抗衡的精英小队。成员关系复杂，有牺牲、有背叛、有超越生死的羁绊。',
    icon: '⚔',
  },
  demon_team: {
    title: '恶魔队',
    category: '阵营',
    text: '以楚轩的复制体为首的强大敌对队伍。实力极为恐怖，是中洲队的宿敌。恶魔队的成员大多经历过极端的痛苦，走上了与中洲队截然不同的道路。',
    icon: '😈',
  },
  bloodline: {
    title: '血统',
    category: '能力体系',
    text: '通过主神兑换的特殊进化路线。不同血统赋予不同的能力：吸血鬼血统提升恢复力、古武血统强化格斗、巫师血统掌控元素之力。血统选择决定了战斗风格。',
    icon: '🩸',
  },
  movie_worlds: {
    title: '恐怖电影世界',
    category: '核心设定',
    text: '主神将轮回者投放的试炼场。从《生化危机》到《异形》、从《咒怨》到《指环王》，每个世界都有独特的危险和任务。完成主线任务是逃离的唯一方式。',
    icon: '🎬',
  },
};

// ── 获取所有已解锁的知识条目 ──
export function getCodexEntries() {
  const entries = [];
  
  // 世界观条目 — 默认全部解锁
  for (const [id, entry] of Object.entries(WORLD_ENTRIES)) {
    entries.push({ ...entry, id, type: 'world' });
  }
  
  // 已发现的线索
  const discovered = [...(loreTracker.discovered || [])];
  for (const loreId of discovered) {
    const lore = LORE_ENTRIES[loreId];
    if (lore) entries.push({ 
      id: loreId, title: lore.title, text: lore.text, 
      category: '线索', icon: '📜', type: 'lore' 
    });
  }
  
  // 同伴档案
  for (const comp of gameState.companions || []) {
    const profile = COMPANION_PROFILES[comp.id];
    if (profile) entries.push({
      id: comp.id, title: profile.name, 
      text: profile.memoir || profile.personality + '。' + (profile.quote || ''),
      category: '同伴', icon: comp.alive ? '👤' : '💀', type: 'companion',
      alive: comp.alive,
    });
  }
  
  return entries;
}

// ── 打开知识典籍面板 ──
export function openCodex() {
  const prevState = gameState.state;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  const entries = getCodexEntries();
  
  // Group by category
  const categories = {};
  for (const e of entries) {
    if (!categories[e.category]) categories[e.category] = [];
    categories[e.category].push(e);
  }
  
  let selectedEntry = entries[0];
  
  const _close = () => { overlay.innerHTML = ''; gameState.setState(prevState); document.removeEventListener('keydown', _codexKeyHandler); };
  const _codexKeyHandler = (e) => {
    if (e.key === 'Escape' || e.key === 'c') _close();
  };
  document.addEventListener('keydown', _codexKeyHandler);

  function _render() {
    overlay.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;
        display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,0.88);" id="codex-backdrop">
        <div style="background:rgba(8,8,18,0.98);border:1px solid #665533;border-radius:16px;
          padding:24px;max-width:700px;width:96%;max-height:85vh;display:flex;gap:16px;">
          
          <!-- 左侧: 目录 -->
          <div style="width:200px;min-width:180px;overflow-y:auto;border-right:1px solid #333;padding-right:12px;">
            <h3 style="color:#ffcc44;font-size:14px;letter-spacing:3px;margin-bottom:12px;">📖 知识典籍</h3>
            ${Object.entries(categories).map(([cat, items]) => `
              <p style="color:#666;font-size:10px;letter-spacing:2px;margin-top:8px;margin-bottom:4px;">${cat}</p>
              ${items.map(item => `
                <div class="codex-item" data-id="${item.id}" style="
                  padding:4px 8px;cursor:pointer;border-radius:4px;margin-bottom:2px;
                  background:${selectedEntry?.id === item.id ? 'rgba(255,204,68,0.1)' : 'transparent'};
                  color:${selectedEntry?.id === item.id ? '#ffcc44' : '#888'};
                  font-size:12px;transition:all 0.15s;">
                  ${item.icon} ${item.title}
                </div>
              `).join('')}
            `).join('')}
          </div>
          
          <!-- 右侧: 详情 -->
          <div style="flex:1;overflow-y:auto;padding-left:4px;">
            ${selectedEntry ? `
              <h2 style="color:${selectedEntry.type === 'companion' ? '#88bbff' : '#ffcc44'};
                font-size:18px;margin-bottom:4px;">
                ${selectedEntry.icon} ${selectedEntry.title}
              </h2>
              <p style="color:#555;font-size:10px;margin-bottom:12px;">${selectedEntry.category}</p>
              <p style="color:#ccc;font-size:13px;line-height:2;">${selectedEntry.text}</p>
              ${selectedEntry.type === 'companion' ? `
                <p style="color:${selectedEntry.alive ? '#44ff88' : '#ff4444'};
                  font-size:11px;margin-top:12px;">
                  ${selectedEntry.alive ? '● 存活' : '● 已阵亡'}
                </p>
              ` : ''}
            ` : '<p style="color:#444;">选择左侧条目查看详情</p>'}
          </div>
        </div>
      </div>
    `;
    
    // Handlers
    overlay.querySelectorAll('.codex-item').forEach(el => {
      el.addEventListener('click', () => {
        selectedEntry = entries.find(e => e.id === el.dataset.id);
        _render();
      });
      el.addEventListener('mouseover', () => {
        if (selectedEntry?.id !== el.dataset.id) el.style.background = 'rgba(255,255,255,0.03)';
      });
      el.addEventListener('mouseout', () => {
        if (selectedEntry?.id !== el.dataset.id) el.style.background = 'transparent';
      });
    });
    
    document.getElementById('codex-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'codex-backdrop') _close();
    });
  }
  
  _render();
}
