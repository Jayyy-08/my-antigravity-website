/**
 * Dragon Cursor & Dragonfire Particle Engine
 * 200px Flying Dragon Companion with Click-Fire Exhale & Dracarys Inferno
 */
class DragonCursorEngine {
  constructor() {
    this.dragonEl = null;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    
    // Position and dynamics
    this.mouseX = window.innerWidth * 0.5;
    this.mouseY = window.innerHeight * 0.5;
    this.currentX = this.mouseX;
    this.currentY = this.mouseY;
    this.vx = 0;
    this.vy = 0;
    this.facingLeft = false;
    this.rotation = 0;
    
    // State
    this.isDracarysMode = false;
    this.isBreathingFire = false;
    this.scale = 1.0;
    this.targetScale = 1.0;
    this.isMouseDown = false;

    this.init();
  }

  init() {
    // 1. Create Dragon Element
    this.dragonEl = document.createElement('div');
    this.dragonEl.id = 'dragon-cursor';
    this.dragonEl.className = 'dragon-cursor';
    this.dragonEl.setAttribute('aria-hidden', 'true');
    this.dragonEl.innerHTML = `
      <div class="dragon-body-wrapper">
        <img src="assets/images/dragon_cursor.png" alt="Flying Dragon Cursor" class="dragon-sprite">
        <div class="dragon-flame-glow" id="dragon-flame-glow"></div>
      </div>
    `;
    document.body.appendChild(this.dragonEl);

    // Pointer reticle at exact mouse coordinates
    this.reticleEl = document.createElement('div');
    this.reticleEl.id = 'dragon-cursor-reticle';
    this.reticleEl.className = 'dragon-cursor-reticle';
    this.reticleEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.reticleEl);

    // 2. Create Fire Canvas
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'dragon-fire-canvas';
    this.canvas.className = 'dragon-fire-canvas';
    this.ctx = this.canvas.getContext('2d');
    document.body.appendChild(this.canvas);
    this.resizeCanvas();

    // 3. Events
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      if (this.reticleEl) {
        this.reticleEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    });

    // Fire effects trigger ONLY when clicking main buttons
    const isMainButton = (target) => {
      if (!target) return null;
      return target.closest('button, .btn, .nav-btn, .btn-primary, .btn-secondary, a.btn, [role="button"], #dracarys-btn, #inspect-btn, #music-toggle-btn, #realm-toggle-btn, #contact-submit');
    };

    window.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      if (this.dragonEl) this.dragonEl.classList.add('sunk');
      if (e.target.closest('#inspect-banner')) return;
      const mainBtn = isMainButton(e.target);
      if (mainBtn) {
        this.onClickFire(e.clientX, e.clientY, mainBtn);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
      if (this.dragonEl) this.dragonEl.classList.remove('sunk');
    });

    // Touch support - only fire on main buttons
    window.addEventListener('touchstart', (e) => {
      this.isMouseDown = true;
      if (this.dragonEl) this.dragonEl.classList.add('sunk');
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        this.mouseX = touch.clientX;
        this.mouseY = touch.clientY;
        const mainBtn = isMainButton(e.target);
        if (mainBtn) {
          this.onClickFire(this.mouseX, this.mouseY, mainBtn);
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isMouseDown = false;
      if (this.dragonEl) this.dragonEl.classList.remove('sunk');
    }, { passive: true });

    // Dracarys Button listener
    const dracarysBtn = document.getElementById('dracarys-btn');
    if (dracarysBtn) {
      dracarysBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.triggerDracarys();
      });
    }

    // Animation Loop
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Calculate Dragon's mouth position in screen coordinates
   */
  getMouthCoords() {
    const rect = this.dragonEl.getBoundingClientRect();
    // Mouth is at the head of the flying dragon (~66.6% X, ~41.8% Y)
    const offsetX = rect.width * 0.666;
    const offsetY = rect.height * 0.418;
    return {
      x: rect.left + offsetX,
      y: rect.top + offsetY
    };
  }

  /**
   * User Click on Main Buttons: Dragon exhales fire towards button + button fiery energy flare
   */
  onClickFire(targetX, targetY, clickedElement) {
    if (this.isDracarysMode) {
      const mouth = this.getMouthCoords();
      this.spawnFireStream(mouth.x, mouth.y, targetX, targetY, 32, 1.2);
      if (window.dragonAudio) {
        window.dragonAudio.playFireBreath(0.8, 0.9);
      }
      return;
    }

    const mouth = this.getMouthCoords();

    // Trigger audio
    if (window.dragonAudio) {
      window.dragonAudio.playFireBreath(0.7, 0.75);
    }

    // Mouth ignition glow
    const glow = document.getElementById('dragon-flame-glow');
    if (glow) {
      glow.classList.add('ignited');
      setTimeout(() => glow.classList.remove('ignited'), 450);
    }

    // Spawn stream of fire particles from mouth to target main button
    this.spawnFireStream(mouth.x, mouth.y, targetX, targetY, 35, 0.9);

    // Apply intense fiery aura effect on the clicked main button
    if (clickedElement) {
      clickedElement.classList.add('main-btn-fiery-burst');
      setTimeout(() => {
        clickedElement.classList.remove('main-btn-fiery-burst');
      }, 650);
    }
  }

  /**
   * Spawn a stream of fire particles from mouth towards a destination
   */
  spawnFireStream(fromX, fromY, toX, toY, count = 35, spread = 1.0) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const baseAngle = Math.atan2(dy, dx);

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * (0.45 * spread);
      const speed = (dist / 22) * (0.7 + Math.random() * 0.7);
      const isCore = Math.random() < 0.25;

      this.particles.push({
        x: fromX + (Math.random() - 0.5) * 10,
        y: fromY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (0.4 + Math.random() * 0.6), // natural buoyancy
        size: isCore ? (6 + Math.random() * 8) : (10 + Math.random() * 16),
        life: 0,
        maxLife: 25 + Math.random() * 20,
        type: isCore ? 'core' : (Math.random() < 0.3 ? 'spark' : 'flame'),
        color: isCore ? '#ffffff' : (Math.random() > 0.4 ? '#ff9e00' : '#e63946')
      });
    }
  }

  /**
   * Explosive radial nova of dragonfire bursting outward in 360 degrees
   */
  spawnFireNova(centerX, centerY, count = 65) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const speed = 6 + Math.random() * 14;
      const isCore = Math.random() < 0.3;

      this.particles.push({
        x: centerX + Math.cos(angle) * 12,
        y: centerY + Math.sin(angle) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: isCore ? (8 + Math.random() * 12) : (14 + Math.random() * 22),
        life: 0,
        maxLife: 28 + Math.random() * 24,
        type: isCore ? 'core' : (Math.random() < 0.35 ? 'spark' : 'flame'),
        color: isCore ? '#ffffff' : (Math.random() > 0.45 ? '#ff9e00' : '#ef4444')
      });
    }
  }

  /**
   * DRACARYS Command Unleashed!
   * Dragon expands larger, fades to 0 opacity, plays Daenerys & roar audio, unleashes panoramic inferno
   */
  triggerDracarys() {
    if (this.isDracarysMode) return;
    this.isDracarysMode = true;

    // Scale up dragon (significantly larger!) and make it 0 opaque
    this.targetScale = 3.0;
    this.dragonEl.classList.add('dracarys-active');
    document.body.classList.add('dracarys-active');

    // Immediate sound: Roar, Daenerys incantation, and roaring flame inferno!
    if (window.dragonAudio) {
      window.dragonAudio.playDracarys();
    }

    // Immediate explosive radial flame nova right at the dragon's current position
    const mouth = this.getMouthCoords();
    this.spawnFireNova(mouth.x, mouth.y, 65);

    // Dracarys Fire Barrage Interval
    let frames = 0;
    const fireInterval = setInterval(() => {
      frames++;
      const currentMouth = this.getMouthCoords();
      
      // Conical sweeping fire across the screen
      const sweepAngle = Math.PI * 0.2 + Math.sin(frames * 0.25) * (Math.PI * 0.65);
      const sweepX = window.innerWidth * 0.5 + Math.cos(sweepAngle) * (window.innerWidth * 0.6);
      const sweepY = window.innerHeight * 0.85 + Math.sin(sweepAngle) * 150;

      this.spawnFireStream(currentMouth.x, currentMouth.y, sweepX, sweepY, 26, 1.8);

      // Random lightning/ember sparks
      for (let s = 0; s < 6; s++) {
        this.particles.push({
          x: currentMouth.x + (Math.random() - 0.5) * 45,
          y: currentMouth.y + (Math.random() - 0.5) * 45,
          vx: (Math.random() - 0.5) * 18,
          vy: Math.random() * 15 + 2,
          size: 3 + Math.random() * 5,
          life: 0,
          maxLife: 35,
          type: 'spark',
          color: '#fbbf24'
        });
      }

      // Reinforce flame audio mid-way through the inferno
      if (frames === 18 && window.dragonAudio) {
        window.dragonAudio.playFireBreath(1.4, 0.95);
      }

      if (frames > 52) { // ~2.2 seconds of inferno
        clearInterval(fireInterval);
        setTimeout(() => {
          this.targetScale = 1.0;
          this.isDracarysMode = false;
          this.dragonEl.classList.remove('dracarys-active');
          document.body.classList.remove('dracarys-active');
        }, 400);
      }
    }, 40);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    // Dragon flight physics & cursor tracking
    if (!this.isDracarysMode) {
      // Align dragon's snout/head precisely at the cursor pointer
      const targetX = this.mouseX - 77;
      const targetY = this.mouseY - 48;

      const dx = targetX - this.currentX;
      const dy = targetY - this.currentY;

      // Ultra-tight cursor synchronization (immediate response without sluggish drag)
      this.vx = dx * 0.55;
      this.vy = dy * 0.55;

      this.currentX += this.vx;
      this.currentY += this.vy;

      // Gentle natural flight banking without any flipping left or right
      this.rotation = Math.max(-12, Math.min(12, this.vx * 0.35));
    } else {
      // Dracarys hovering center
      const centerX = window.innerWidth * 0.5;
      const centerY = window.innerHeight * 0.35;
      this.currentX += (centerX - this.currentX) * 0.08;
      this.currentY += (centerY - this.currentY) * 0.08;
      this.rotation = Math.sin(time * 6) * 6;
    }

    // Stationary hover breathing, wing buoyancy & click sink depth
    const sinkScale = this.isMouseDown ? 0.88 : 1.0;
    const sinkY = this.isMouseDown ? 3 : 0;
    const hoverY = this.isMouseDown ? 0 : Math.sin(time * 3.8) * 3.5 + Math.sin(time * 1.9) * 1.5;
    const hoverScale = this.isMouseDown ? 1.0 : (1.0 + Math.sin(time * 3.8) * 0.02);
    const hoverRot = (!this.isDracarysMode && !this.isMouseDown) ? Math.sin(time * 2.2) * 1.8 : 0;

    // Smooth scale lerp
    this.scale += (this.targetScale - this.scale) * 0.1;

    // Apply CSS Transform (tight sync + tactile click sink, no flipping)
    this.dragonEl.style.transform = `translate3d(${this.currentX}px, ${this.currentY + hoverY + sinkY}px, 0) scale(${this.scale * sinkScale * hoverScale}) rotate(${this.rotation + hoverRot}deg)`;

    // --- RENDER FIRE PARTICLES ---
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;

      // Drag and buoyancy
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx;
      p.y += p.vy;

      const progress = p.life / p.maxLife;
      if (progress >= 1.0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalCompositeOperation = 'lighter';

      if (p.type === 'core') {
        const rad = p.size * (1 - progress * 0.5);
        const alpha = (1 - progress) * 0.9;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'spark') {
        const alpha = (1 - progress);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * (1 - progress * 0.7), 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Billowing Fire Ball
        const rad = p.size * (0.8 + progress * 1.6);
        const alpha = (1 - progress) * 0.75;
        const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        grad.addColorStop(0, `rgba(255, 230, 120, ${alpha})`);
        grad.addColorStop(0.35, `rgba(255, 140, 20, ${alpha * 0.8})`);
        grad.addColorStop(0.7, `rgba(220, 40, 10, ${alpha * 0.5})`);
        grad.addColorStop(1, 'rgba(40, 5, 0, 0)');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.dragonCursor = new DragonCursorEngine();
  });
} else {
  window.dragonCursor = new DragonCursorEngine();
}
