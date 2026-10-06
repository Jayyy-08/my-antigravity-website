/**
 * Game of Thrones Enhanced Particle System
 * Winterfell: Multi-layer falling snow crystals & icy drafts (small to very big)
 * The Wall: Raging mountain blizzard with diamond frost & wind gusts (small to very big)
 * King's Landing: Golden lion dust & twirling royal embers
 * Dragonstone: Fiery rising volcanic cinders & convective dragon sparks
 * Castle Black: Midnight silver frost crystals & cold obsidian ash
 */

class RealmParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.realm = 'winterfell';
    this.maxParticles = 140;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.mouse = { x: this.width / 2, y: this.height / 2, radius: 120 };

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }, { passive: true });

    this.createParticles();
    this.animate();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  setRealm(realm) {
    if (realm === 'ice') realm = 'winterfell';
    if (realm === 'fire') realm = 'dragonstone';
    this.realm = realm;
    this.maxParticles = (realm === 'winterfell' || realm === 'thewall') ? 150 : 110;
    this.particles = [];
    this.createParticles();
  }

  createParticles() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.spawnParticle(true));
    }
  }

  spawnParticle(randomY = false) {
    const isWinterfell = (this.realm === 'winterfell' || this.realm === 'ice');
    const isKingsLanding = (this.realm === 'kingslanding');
    const isCastleBlack = (this.realm === 'castleblack');
    const isTheWall = (this.realm === 'thewall');
    const isSnowRealm = (isWinterfell || isTheWall);

    let colorPrefix, speedY, speedX, shadowColor, shape, size, opacity;
    const tierRand = Math.random();

    if (isSnowRealm) {
      // 3 Tiers of Snowflakes: Small, Medium, and Very Big!
      if (tierRand < 0.42) {
        // Tier 1: Small background snowflakes (micro snow)
        size = Math.random() * 2.2 + 1.2; // 1.2px - 3.4px
        speedY = Math.random() * 1.5 + 0.8;
        opacity = Math.random() * 0.35 + 0.25;
        shape = 'circle';
      } else if (tierRand < 0.82) {
        // Tier 2: Medium midground snowflakes
        size = Math.random() * 3.5 + 4.0; // 4.0px - 7.5px
        speedY = Math.random() * 2.0 + 1.4;
        opacity = Math.random() * 0.35 + 0.55;
        shape = Math.random() > 0.4 ? 'crystal' : 'circle';
      } else {
        // Tier 3: VERY BIG foreground snowflakes (majestic dendritic crystals & fluffy flakes)
        size = Math.random() * 14.0 + 10.0; // 10.0px - 24.0px!
        speedY = Math.random() * 2.4 + 2.0;
        opacity = Math.random() * 0.25 + 0.72;
        shape = Math.random() > 0.45 ? 'dendritic' : 'big_fluffy';
      }

      if (isTheWall) {
        // The Wall: Pure Snow White with wind blowing leftward towards The Wall
        colorPrefix = Math.random() > 0.25 ? 'rgba(255, 255, 255,' : 'rgba(224, 242, 254,';
        speedX = -(Math.random() * 2.6 + 0.8); // Gusting left
        speedY *= 1.25; // Faster mountain blizzard
        shadowColor = '#ffffff';
      } else {
        // Winterfell: Stark winter snow drifting softly
        colorPrefix = Math.random() > 0.35 ? 'rgba(240, 248, 255,' : 'rgba(195, 230, 255,';
        speedX = (Math.random() - 0.5) * 1.8;
        shadowColor = '#93c5fd';
      }
    } else if (isKingsLanding) {
      colorPrefix = Math.random() > 0.4 ? 'rgba(254, 240, 138,' : 'rgba(245, 158, 11,';
      speedY = (Math.random() - 0.6) * 0.95;
      speedX = (Math.random() - 0.5) * 1.1;
      shadowColor = '#f59e0b';
      shape = 'circle';
      size = Math.random() * 2.6 + 1.2;
      opacity = Math.random() * 0.6 + 0.3;
    } else if (isCastleBlack) {
      colorPrefix = Math.random() > 0.4 ? 'rgba(240, 245, 255,' : 'rgba(148, 163, 184,';
      speedY = Math.random() * 1.8 + 0.7;
      speedX = (Math.random() - 0.5) * 1.5;
      shadowColor = '#cbd5e1';
      shape = Math.random() > 0.6 ? 'crystal' : 'circle';
      size = Math.random() * 3.4 + 1.2;
      opacity = Math.random() * 0.6 + 0.3;
    } else {
      // Dragonstone: fiery rising cinders
      colorPrefix = Math.random() > 0.35 ? 'rgba(255, 135, 50,' : 'rgba(239, 68, 68,';
      speedY = -(Math.random() * 2.2 + 0.9);
      speedX = (Math.random() - 0.5) * 1.1;
      shadowColor = '#ff4500';
      shape = 'circle';
      size = Math.random() * 3.0 + 1.2;
      opacity = Math.random() * 0.6 + 0.3;
    }

    const fallsDown = (isSnowRealm || isCastleBlack);
    return {
      x: Math.random() * this.width,
      y: randomY ? Math.random() * this.height : (fallsDown ? -25 : this.height + 25),
      size: size,
      speedX: speedX,
      speedY: speedY,
      opacity: opacity,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.05 + 0.02,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.015,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.035,
      color: colorPrefix,
      shadowColor: shadowColor,
      shape: shape
    };
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const isWinterfell = (this.realm === 'winterfell' || this.realm === 'ice');
    const isKingsLanding = (this.realm === 'kingslanding');
    const isCastleBlack = (this.realm === 'castleblack');
    const isTheWall = (this.realm === 'thewall');
    const fallsDown = (isWinterfell || isCastleBlack || isTheWall);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.wobble += p.wobbleSpeed;
      p.pulse += p.pulseSpeed;
      p.rot += p.rotSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * 0.75;
      p.y += p.speedY;

      // Mouse gentle evasion
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const dist = Math.hypot(dx, dy);
      if (dist < this.mouse.radius) {
        const force = (1 - dist / this.mouse.radius) * 1.8;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Bounds wrapping with margin for very big flakes
      const margin = p.size + 15;
      if (fallsDown && p.y > this.height + margin) {
        this.particles[i] = this.spawnParticle(false);
      } else if (!fallsDown && !isKingsLanding && p.y < -margin) {
        this.particles[i] = this.spawnParticle(false);
      } else if (isKingsLanding && (p.y < -margin || p.y > this.height + margin)) {
        this.particles[i] = this.spawnParticle(false);
      }
      if (p.x < -margin) p.x = this.width + margin;
      if (p.x > this.width + margin) p.x = -margin;

      const currentOpacity = Math.max(0.12, p.opacity * (0.85 + 0.25 * Math.sin(p.pulse)));
      this.ctx.save();
      this.ctx.fillStyle = `${p.color} ${currentOpacity})`;
      this.ctx.shadowBlur = p.size > 8 ? 16 : 8;
      this.ctx.shadowColor = p.shadowColor;

      if (p.shape === 'dendritic') {
        // VERY BIG 6-ARM INTRICATE DENDRITIC SNOWFLAKE
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.strokeStyle = `${p.color} ${currentOpacity})`;
        this.ctx.lineWidth = Math.max(1.2, p.size * 0.10);
        this.ctx.lineCap = 'round';

        const r = p.size;
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          // Main crystalline arm
          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(cos * r, sin * r);
          this.ctx.stroke();

          // Sub-branch pair 1 (at 50% along the arm)
          const b1x = cos * r * 0.50;
          const b1y = sin * r * 0.50;
          const b1r = r * 0.32;
          const leftAngle = angle - Math.PI / 4;
          const rightAngle = angle + Math.PI / 4;
          this.ctx.beginPath();
          this.ctx.moveTo(b1x, b1y);
          this.ctx.lineTo(b1x + Math.cos(leftAngle) * b1r, b1y + Math.sin(leftAngle) * b1r);
          this.ctx.moveTo(b1x, b1y);
          this.ctx.lineTo(b1x + Math.cos(rightAngle) * b1r, b1y + Math.sin(rightAngle) * b1r);
          this.ctx.stroke();

          // Sub-branch pair 2 (at 80% along the arm)
          const b2x = cos * r * 0.80;
          const b2y = sin * r * 0.80;
          const b2r = r * 0.22;
          this.ctx.beginPath();
          this.ctx.moveTo(b2x, b2y);
          this.ctx.lineTo(b2x + Math.cos(leftAngle) * b2r, b2y + Math.sin(leftAngle) * b2r);
          this.ctx.moveTo(b2x, b2y);
          this.ctx.lineTo(b2x + Math.cos(rightAngle) * b2r, b2y + Math.sin(rightAngle) * b2r);
          this.ctx.stroke();
        }

        // Tiny central crystal star core
        this.ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const cx = Math.cos(angle) * (r * 0.22);
          const cy = Math.sin(angle) * (r * 0.22);
          if (a === 0) this.ctx.moveTo(cx, cy);
          else this.ctx.lineTo(cx, cy);
        }
        this.ctx.closePath();
        this.ctx.fill();

      } else if (p.shape === 'big_fluffy') {
        // VERY BIG SOFT FLUFFY SNOWFLAKE (multi-layered feathered puff)
        const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, `${p.color} ${currentOpacity * 0.95})`);
        grad.addColorStop(0.4, `${p.color} ${currentOpacity * 0.65})`);
        grad.addColorStop(0.8, `${p.color} ${currentOpacity * 0.25})`);
        grad.addColorStop(1, `${p.color} 0)`);
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();

      } else if (p.shape === 'crystal') {
        // MEDIUM 6-POINT HEXAGONAL CRYSTAL
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);
        this.ctx.beginPath();
        const r = p.size;
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (a === 0) this.ctx.moveTo(px, py);
          else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();

      } else {
        // SMALL ROUND SNOWFLAKE / EMBERS
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    requestAnimationFrame(() => this.animate());
  }
}

window.RealmParticles = RealmParticles;
