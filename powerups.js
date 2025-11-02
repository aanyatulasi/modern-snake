// Power-ups system for modern-snake
// Exports PowerUpManager

const TYPES = {
  SPEED: 'speed',          // ⚡ Speed Boost - snake moves faster (5s)
  SLOW: 'slow',            // 🐌 Slow Motion - everything slows down (3s)
  SHIELD: 'shield',        // 🛡️ Shield - invincible for 3s
  DOUBLE: 'double',        // 2️⃣ Double Points - 2x score (10s)
  MAGNET: 'magnet',        // 🎯 Magnet - food comes to you (5s)
  GHOST: 'ghost'           // 👻 Ghost Mode - pass through walls (3s)
};

const CONFIG_PU = {
  spawnIntervalMs: 10000,
  lifetimeMs: 5000,
  durations: {
    [TYPES.SPEED]: 5000,
    [TYPES.SLOW]: 3000,
    [TYPES.SHIELD]: 3000,
    [TYPES.DOUBLE]: 10000,
    [TYPES.MAGNET]: 5000,
    [TYPES.GHOST]: 3000,
  },
  // Visual colors per power-up
  colors: {
    [TYPES.SPEED]: '#ff6b6b',
    [TYPES.SLOW]: '#4dabf7',
    [TYPES.SHIELD]: '#22c55e',
    [TYPES.DOUBLE]: '#f59e0b',
    [TYPES.MAGNET]: '#a78bfa',
    [TYPES.GHOST]: '#a3a3a3',
  },
};

export class PowerUpManager {
  constructor(game) {
    this.game = game;
    this.active = new Map(); // type -> expiresAt (ms)
    this.spawned = null; // { type, x, y, spawnedAt }
    this.lastSpawnAt = 0;
  }

  reset(nowMs) {
    this.active.clear();
    this.spawned = null;
    this.lastSpawnAt = nowMs || performance.now();
  }

  // Called from gameStep with current timestamp
  update(nowMs) {
    // Despawn expired active effects
    for (const [type, expiry] of this.active) {
      if (nowMs >= expiry) this.active.delete(type);
    }

    // Despawn spawned pickup if lifetime exceeded
    if (this.spawned && nowMs - this.spawned.spawnedAt >= CONFIG_PU.lifetimeMs) {
      this.spawned = null;
    }

    // Spawn new pickup every interval if none is present
    if (!this.spawned && nowMs - this.lastSpawnAt >= CONFIG_PU.spawnIntervalMs) {
      this.spawnRandom(nowMs);
    }
  }

  spawnRandom(nowMs) {
    const types = Object.values(TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const { TILE_COUNT } = this.game.constructor.CONFIG || window.CONFIG || { TILE_COUNT: 20 };

    // Find a free tile not occupied by snake or food
    let x, y, tries = 0;
    do {
      x = Math.floor(Math.random() * TILE_COUNT);
      y = Math.floor(Math.random() * TILE_COUNT);
      tries++;
      if (tries > 200) break; // fail-safe
    } while (
      this.game.snake.some(seg => seg.x === x && seg.y === y) ||
      (this.game.food && this.game.food.x === x && this.game.food.y === y)
    );

    this.spawned = { type, x, y, spawnedAt: nowMs };
    this.lastSpawnAt = nowMs;
  }

  tryCollect(head, nowMs) {
    if (!this.spawned) return false;
    if (head.x === this.spawned.x && head.y === this.spawned.y) {
      this.activate(this.spawned.type, nowMs);
      this.spawned = null;
      return true;
    }
    return false;
  }

  activate(type, nowMs) {
    const duration = CONFIG_PU.durations[type] || 3000;
    const expiresAt = nowMs + duration;
    this.active.set(type, expiresAt);
  }

  isActive(type) {
    return this.active.has(type);
  }

  // Gameplay scalars and flags consumed by Game
  getSpeedScale() {
    // base 1.0; SPEED makes faster, SLOW makes slower
    let scale = 1.0;
    if (this.isActive(TYPES.SPEED)) scale *= 1.8;
    if (this.isActive(TYPES.SLOW)) scale *= 0.6;
    return Math.max(0.2, scale);
  }

  getScoreMultiplier() {
    return this.isActive(TYPES.DOUBLE) ? 2 : 1;
  }

  hasShield() {
    return this.isActive(TYPES.SHIELD);
  }

  hasGhost() {
    return this.isActive(TYPES.GHOST);
  }

  hasMagnet() {
    return this.isActive(TYPES.MAGNET);
  }

  // Rendering helpers
  drawPickup(ctx, tileSize) {
    if (!this.spawned) return;
    const { x, y, type, spawnedAt } = this.spawned;
    const now = performance.now();
    const t = (now - spawnedAt) / CONFIG_PU.lifetimeMs;
    const pulse = 0.85 + Math.sin(now / 150) * 0.15;
    const cx = x * tileSize + tileSize / 2;
    const cy = y * tileSize + tileSize / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    // Glow
    ctx.shadowColor = CONFIG_PU.colors[type];
    ctx.shadowBlur = 25;

    // Core shape
    ctx.fillStyle = CONFIG_PU.colors[type];
    ctx.beginPath();
    // Star-like flashy marker
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const r = tileSize * (i % 2 === 0 ? 0.45 : 0.25);
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Center dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, 0, tileSize * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Lifetime ring
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, tileSize * 0.48, -Math.PI / 2, -Math.PI / 2 + (1 - t) * Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawHUD(ctx, canvasWidth) {
    const now = performance.now();
    const entries = Array.from(this.active.entries())
      .map(([type, exp]) => ({ type, remaining: Math.max(0, Math.ceil((exp - now) / 1000)) }))
      .sort((a, b) => a.type.localeCompare(b.type));
    if (!entries.length) return;

    ctx.save();
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    let x = canvasWidth - 12;
    let y = 18;
    entries.forEach(({ type, remaining }) => {
      const label = this.getLabel(type);
      ctx.fillStyle = CONFIG_PU.colors[type];
      ctx.fillRect(x - 130, y - 12, 120, 16);
      ctx.fillStyle = 'black';
      ctx.fillText(`${label} ${remaining}s`, x - 10, y);
      y += 20;
    });
    ctx.restore();
  }

  getLabel(type) {
    switch (type) {
      case TYPES.SPEED: return '⚡ Speed';
      case TYPES.SLOW: return '🐌 Slow';
      case TYPES.SHIELD: return '🛡️ Shield';
      case TYPES.DOUBLE: return '2x Points';
      case TYPES.MAGNET: return '🎯 Magnet';
      case TYPES.GHOST: return '👻 Ghost';
      default: return type;
    }
  }
}

export { TYPES as POWER_UP_TYPES };
