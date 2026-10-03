// ═══════════════════════════════════════════════════════════════
// 大气效果系统 — 每章主题的环境粒子与光影
// ═══════════════════════════════════════════════════════════════
//
// 为不同世界观提供沉浸式视觉层：
// - 生化: 绿色飘浮粒子 + 暗角
// - 异形: 蓝色雾气 + 闪烁灯光
// - 咒怨: 幽灵粒子 + 颤抖扭曲
// - 木乃伊: 沙尘粒子 + 暖色调
// - 死神: 白色灵魂粒子 + 冷色调
// - 恶魔: 红色烟雾
// - 魔戒: 金色光点
// - 终章: 混合效果

export const ATMOSPHERE_THEMES = {
  biolab: {
    name: '生化实验室',
    particleColor: 'rgba(68,255,68,0.3)',
    particleCount: 15,
    particleSpeed: 0.3,
    particleSize: [1, 3],
    vignetteColor: 'rgba(0,30,0,0.15)',
    vignetteIntensity: 0.6,
    flickerChance: 0.002,
    flickerColor: 'rgba(0,255,0,0.05)',
  },
  alien: {
    name: '异形飞船',
    particleColor: 'rgba(68,136,255,0.2)',
    particleCount: 10,
    particleSpeed: 0.15,
    particleSize: [2, 5],
    vignetteColor: 'rgba(0,0,40,0.2)',
    vignetteIntensity: 0.7,
    flickerChance: 0.005,
    flickerColor: 'rgba(100,150,255,0.08)',
  },
  juon: {
    name: '咒怨宅邸',
    particleColor: 'rgba(200,200,255,0.15)',
    particleCount: 8,
    particleSpeed: 0.1,
    particleSize: [1, 2],
    vignetteColor: 'rgba(20,0,30,0.25)',
    vignetteIntensity: 0.8,
    flickerChance: 0.008,
    flickerColor: 'rgba(255,255,255,0.03)',
    distortion: true,
  },
  juon_basement: {
    name: '咒怨地下',
    particleColor: 'rgba(150,100,200,0.15)',
    particleCount: 6,
    particleSpeed: 0.08,
    particleSize: [1, 2],
    vignetteColor: 'rgba(30,0,40,0.3)',
    vignetteIntensity: 0.85,
    flickerChance: 0.01,
    flickerColor: 'rgba(200,100,255,0.05)',
    distortion: true,
  },
  desert: {
    name: '沙漠神殿',
    particleColor: 'rgba(220,180,100,0.2)',
    particleCount: 20,
    particleSpeed: 0.5,
    particleSize: [1, 2],
    vignetteColor: 'rgba(40,30,10,0.15)',
    vignetteIntensity: 0.5,
    flickerChance: 0,
    windDirection: 1, // 横向沙尘
  },
  death: {
    name: '死神领域',
    particleColor: 'rgba(255,255,255,0.1)',
    particleCount: 12,
    particleSpeed: 0.2,
    particleSize: [1, 3],
    vignetteColor: 'rgba(0,0,20,0.2)',
    vignetteIntensity: 0.7,
    flickerChance: 0.003,
    flickerColor: 'rgba(200,200,255,0.05)',
  },
  fantasy: {
    name: '奇幻世界',
    particleColor: 'rgba(255,204,68,0.15)',
    particleCount: 10,
    particleSpeed: 0.2,
    particleSize: [1, 3],
    vignetteColor: 'rgba(20,10,0,0.1)',
    vignetteIntensity: 0.4,
    flickerChance: 0,
  },

  jurassic: {
    name: '侏罗纪丛林',
    particleColor: 'rgba(100,180,80,0.2)',
    particleCount: 18,
    particleSpeed: 0.35,
    particleSize: [1, 3],
    vignetteColor: 'rgba(10,30,5,0.18)',
    vignetteIntensity: 0.5,
    flickerChance: 0,
    windDirection: 0.5,
  },
  starship: {
    name: '星际战舰',
    particleColor: 'rgba(180,220,255,0.15)',
    particleCount: 25,
    particleSpeed: 0.6,
    particleSize: [1, 2],
    vignetteColor: 'rgba(0,5,20,0.2)',
    vignetteIntensity: 0.6,
    flickerChance: 0.004,
    flickerColor: 'rgba(200,220,255,0.06)',
  },
  raccoon_city: {
    name: '浣熊市废墟',
    particleColor: 'rgba(150,100,60,0.15)',
    particleCount: 12,
    particleSpeed: 0.2,
    particleSize: [1, 3],
    vignetteColor: 'rgba(30,15,5,0.22)',
    vignetteIntensity: 0.65,
    flickerChance: 0.006,
    flickerColor: 'rgba(255,100,30,0.04)',
  },
  final_war: {
    name: '终极一战',
    particleColor: 'rgba(255,100,50,0.25)',
    particleCount: 30,
    particleSpeed: 0.5,
    particleSize: [1, 5],
    vignetteColor: 'rgba(50,0,0,0.3)',
    vignetteIntensity: 0.85,
    flickerChance: 0.015,
    flickerColor: 'rgba(255,50,0,0.1)',
    distortion: true,
  },
  nightmare: {
    name: '梦境',
    particleColor: 'rgba(255,100,100,0.2)',
    particleCount: 15,
    particleSpeed: 0.4,
    particleSize: [1, 4],
    vignetteColor: 'rgba(40,0,0,0.25)',
    vignetteIntensity: 0.8,
    flickerChance: 0.01,
    flickerColor: 'rgba(255,0,0,0.08)',
    distortion: true,
  },
};

// 默认主题(覆盖未配置的章节)
const DEFAULT_THEME = {
  particleColor: 'rgba(200,200,200,0.1)',
  particleCount: 5,
  particleSpeed: 0.15,
  particleSize: [1, 2],
  vignetteColor: 'rgba(0,0,0,0.15)',
  vignetteIntensity: 0.5,
  flickerChance: 0,
};

// 章节→主题映射
const CHAPTER_THEME_MAP = {
  1: 'biolab',
  2: 'alien',
  3: 'juon',
  4: 'desert',
  5: 'death',
  6: 'alien',
  7: 'raccoon_city',
  8: 'jurassic',
  9: 'starship',
  10: 'fantasy',
  11: 'nightmare',
  12: 'final_war',
};

export class AtmosphereRenderer {
  constructor() {
    this.particles = [];
    this.theme = DEFAULT_THEME;
    this._flickerTimer = 0;
    this._distortionPhase = 0;
  }

  /** 切换章节主题 */
  setChapter(chapterNum) {
    const themeId = CHAPTER_THEME_MAP[chapterNum];
    this.theme = ATMOSPHERE_THEMES[themeId] || DEFAULT_THEME;
    this._initParticles();
  }

  /** 根据楼层主题覆盖 */
  setFloorTheme(themeId) {
    if (ATMOSPHERE_THEMES[themeId]) {
      this.theme = ATMOSPHERE_THEMES[themeId];
      this._initParticles();
    }
  }

  _initParticles() {
    this.particles = [];
    for (let i = 0; i < this.theme.particleCount; i++) {
      this.particles.push(this._createParticle());
    }
  }

  _createParticle() {
    const [minS, maxS] = this.theme.particleSize;
    return {
      x: Math.random(),       // 0-1 normalized
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.002 * (this.theme.windDirection || 0),
      vy: -this.theme.particleSpeed * 0.001 * (0.5 + Math.random() * 0.5),
      size: minS + Math.random() * (maxS - minS),
      opacity: 0.3 + Math.random() * 0.7,
      life: 1,
    };
  }

  /**
   * 在canvas上绘制大气效果
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} canvasW
   * @param {number} canvasH
   */
  render(ctx, canvasW, canvasH) {
    const t = this.theme;

    // 暗角 (vignette)
    if (t.vignetteIntensity > 0) {
      const grad = ctx.createRadialGradient(
        canvasW / 2, canvasH / 2, canvasW * 0.3,
        canvasW / 2, canvasH / 2, canvasW * 0.8
      );
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(1, t.vignetteColor);
      ctx.fillStyle = grad;
      ctx.globalAlpha = t.vignetteIntensity;
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.globalAlpha = 1;
    }

    // 粒子
    for (const p of this.particles) {
      p.x += p.vx + (this.theme.windDirection ? this.theme.particleSpeed * 0.001 : 0);
      p.y += p.vy;
      p.life -= 0.003;

      // 回收并重生
      if (p.y < -0.05 || p.life <= 0 || p.x < -0.05 || p.x > 1.05) {
        Object.assign(p, this._createParticle());
        p.y = 1.05; // 从底部重生
      }

      const px = p.x * canvasW;
      const py = p.y * canvasH;

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = t.particleColor;
      ctx.globalAlpha = p.opacity * p.life;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 闪烁效果 (灯光闪烁)
    if (t.flickerChance > 0 && Math.random() < t.flickerChance) {
      ctx.fillStyle = t.flickerColor;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // 扭曲效果标记 (实际扭曲由Renderer处理)
    if (t.distortion) {
      this._distortionPhase += 0.02;
    }
  }

  /** 获取当前扭曲偏移 (供Renderer使用) */
  getDistortion() {
    if (!this.theme.distortion) return { x: 0, y: 0 };
    return {
      x: Math.sin(this._distortionPhase) * 0.5,
      y: Math.cos(this._distortionPhase * 1.3) * 0.3,
    };
  }
}

export const atmosphereRenderer = new AtmosphereRenderer();
