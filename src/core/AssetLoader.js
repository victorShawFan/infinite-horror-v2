// ═══════════════════════════════════════════════════════════════
// 资产加载器 — 预加载所有图片资源
// ═══════════════════════════════════════════════════════════════

class AssetLoaderClass {
  constructor() {
    this.images = new Map();
    this.loaded = false;
  }

  async loadAll() {
    const manifest = {
      // 场景背景
      'scene_1-1': '/assets/scenes/1-1_列车醒来_背景.jpg',
      'scene_1-2': '/assets/scenes/1-2_蜂巢入口_背景.jpg',
      'scene_1-3': '/assets/scenes/1-3_红后机房_背景.jpg',
      'scene_1-4': '/assets/scenes/1-4_激光走廊_背景.jpg',
      'scene_1-5': '/assets/scenes/1-5_终端控制室_背景.jpg',
      'scene_1-6': '/assets/scenes/1-6_六小时回归_背景.jpg',
      'scene_lord_god': '/assets/scenes/lord_god_space.jpg',

      // 角色立绘
      'char_zheng_zha': '/assets/characters/zheng_zha.jpg',
      'char_zhang_jie': '/assets/characters/zhang_jie.jpg',
      'char_zhan_lan': '/assets/characters/zhan_lan.jpg',
      'char_li_xiaoyi': '/assets/characters/li_xiaoyi.jpg',

      // 敌人概念图
      'enemy_zombie_worker': '/assets/enemies/zombie_worker.jpg',
      'enemy_zombie_guard': '/assets/enemies/zombie_guard.jpg',
      'enemy_crawler': '/assets/enemies/crawler.jpg',
      'enemy_tyrant': '/assets/enemies/tyrant.jpg',
    };

    const promises = Object.entries(manifest).map(([key, src]) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.images.set(key, img);
          resolve(true);
        };
        img.onerror = () => {
          console.warn(`[AssetLoader] Failed to load: ${key} (${src})`);
          resolve(false);
        };
        img.src = src;
      });
    });

    await Promise.all(promises);
    this.loaded = true;
    console.log(`[AssetLoader] Loaded ${this.images.size}/${Object.keys(manifest).length} assets`);
  }

  get(key) {
    return this.images.get(key) || null;
  }

  /** 获取场景背景图 */
  getSceneBg(floorId) {
    return this.get(`scene_${floorId}`);
  }

  /** 获取角色立绘 */
  getCharPortrait(charId) {
    const map = {
      'zheng_zha': 'char_zheng_zha',
      'zhang_jie': 'char_zhang_jie',
      'zhan_lan': 'char_zhan_lan',
      'li_xiaoyi': 'char_li_xiaoyi',
      '郑吒': 'char_zheng_zha',
      '张杰': 'char_zhang_jie',
      '詹岚': 'char_zhan_lan',
      '李萧毅': 'char_li_xiaoyi',
    };
    return this.get(map[charId]) || null;
  }

  /** 获取敌人概念图 */
  getEnemyPortrait(enemyId) {
    if (enemyId.includes('zombie_worker') || enemyId.includes('zombie_1')) return this.get('enemy_zombie_worker');
    if (enemyId.includes('zombie_guard') || enemyId.includes('zombie_2')) return this.get('enemy_zombie_guard');
    if (enemyId.includes('crawler')) return this.get('enemy_crawler');
    if (enemyId.includes('tyrant') || enemyId.includes('boss')) return this.get('enemy_tyrant');
    // 默认返回工人丧尸
    if (enemyId.includes('zombie')) return this.get('enemy_zombie_worker');
    return this.get('enemy_zombie_worker');
  }
}

export const assetLoader = new AssetLoaderClass();
