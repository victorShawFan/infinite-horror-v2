// ═══════════════════════════════════════════════════════════════
// 快捷键帮助面板
// ═══════════════════════════════════════════════════════════════

export function showKeybindHelp() {
  const old = document.getElementById('keybind-help');
  if (old) { old.remove(); return; }
  
  const binds = [
    { group: '移动与探索', keys: [
      { key: 'WASD / 方向键', desc: '移动' },
      { key: '空格', desc: '互动 / 对话推进' },
      { key: 'Shift+移动', desc: '潜行模式' },
      { key: 'Shift+P', desc: '玩家统计面板' },
      { key: 'T', desc: '策略模式开关 (每回合手选行动)' },
    ]},
    { group: '战斗与装备', keys: [
      { key: '碰撞敌人', desc: '触发战斗（自动）' },
      { key: '1-3', desc: '装备掉落选择' },
      { key: 'Q', desc: '战前使用道具' },
    ]},
    { group: '面板与信息', keys: [
      { key: 'Tab', desc: '角色详情' },
      { key: 'I', desc: '背包/消耗品' },
      { key: 'C', desc: '知识典籍' },
      { key: 'T', desc: '天赋/属性分配' },
      { key: 'V', desc: '楼层战略扫描' },
      { key: 'Y', desc: '成长轨迹' },
      { key: 'F', desc: '战斗回放' },
      { key: 'B', desc: '怪物图鉴' },
      { key: 'M', desc: '里程碑记录' },
      { key: 'L', desc: '传说/世界观' },
      { key: 'J', desc: '任务追踪' },
    ]},
    { group: '系统', keys: [
      { key: 'F5', desc: '快速存档' },
      { key: 'F9', desc: '快速读档' },
      { key: 'P', desc: '设置' },
      { key: 'H / ?', desc: '快捷键帮助' },
      { key: 'N', desc: '切换姿态' },
      { key: 'G', desc: '基因锁激活' },
      { key: 'K', desc: '连杀信息' },
      { key: 'X', desc: '探索/解除陷阱' },
    ]},
  ];
  
  const panel = document.createElement('div');
  panel.id = 'keybind-help';
  panel.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 450;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.88); animation: kb-fadeIn 0.3s;
  `;
  
  const groupsHTML = binds.map(group => `
    <div style="margin-bottom:14px;">
      <p style="color:#aa8844;font-size:11px;letter-spacing:2px;margin-bottom:6px;border-bottom:1px solid #aa884420;padding-bottom:4px;">${group.group}</p>
      ${group.keys.map(k => `
        <div style="display:flex;gap:12px;padding:2px 0;">
          <span style="color:#ffcc44;font-size:12px;min-width:120px;text-align:right;font-family:monospace;">${k.key}</span>
          <span style="color:#aaa;font-size:12px;">${k.desc}</span>
        </div>
      `).join('')}
    </div>
  `).join('');
  
  panel.innerHTML = `
    <style>@keyframes kb-fadeIn { from { opacity: 0 } to { opacity: 1 } }</style>
    <div style="max-width:500px;width:92%;max-height:85vh;overflow-y:auto;
      background:linear-gradient(180deg,rgba(10,8,5,0.98),rgba(5,4,3,0.98));
      border:1px solid #aa884420;border-radius:16px;padding:24px;">
      <p style="text-align:center;color:#aa8844;font-size:10px;letter-spacing:6px;margin-bottom:16px;">— 快捷键一览 —</p>
      ${groupsHTML}
      <div style="text-align:center;margin-top:12px;">
        <button id="kb-close" style="background:transparent;border:1px solid #444;color:#888;
          padding:8px 30px;cursor:pointer;font-size:12px;font-family:inherit;border-radius:6px;">
          关闭 (H/Esc)
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  const close = () => { panel.remove(); document.removeEventListener('keydown', kh); };
  const kh = (e) => { if (e.key === 'h' || e.key === 'H' || e.key === '?' || e.key === 'Escape') { e.preventDefault(); close(); } };
  document.getElementById('kb-close')?.addEventListener('click', close);
  document.addEventListener('keydown', kh);
}
