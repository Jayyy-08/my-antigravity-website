/**
 * Game of Thrones - 3D Valyrian Steel Sword & Authentic Iron Throne
 * Built with Three.js (r128)
 * Features:
 * - Perfectly balanced Valyrian steel blade (dark smoky steel, high metallic luster, rich clearcoat shine)
 * - Authentic high-definition Iron Throne from the internet (iron_throne_chair.png)
 * - 100% visible Iron Throne positioned on-screen in the Contact section
 * - Downward vertical piercing landing animation where the sword settles symmetrically into the throne seat
 * - 3 Realm Themes: Winterfell (Ice), King's Landing (Gold/Lions), Dragonstone (Fire/Dragons)
 * - Free 360° Orbit Inspection mode
 */

class ValyrianSwordScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.swordGroup = null;
    this.bladeMesh = null;
    this.runesMesh = null;
    this.gemLight = null;
    this.gleamLight = null;
    this.glintMesh = null;
    this.throneGroup = null;
    this.convergingSwordsGroup = null;
    this.convergingSwords = [];
    this.dockingGleamLight = null;
    this.convergedClangPlayed = false;
    this.dockingClangPlayed = false;
    this.realm = 'winterfell';
    this.rubySparks = [];
    this.eyeAuraMeshes = [];

    // Interaction & Animation states
    this.isInspectMode = false;
    this.scrollProgress = 0; // 0 (Hero) to 4 (Contact)
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.inspectRotation = { x: 0, y: 0 };
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // Texture Loader
    this.textureLoader = new THREE.TextureLoader();

    // Stances configuration for each section: [Hero, About, Skills, Projects, Contact]
    // Stance 0: Majestic upright vertical guard, positioned on the right (intro text on left)
    // Stance 4: Scaled down (0.58) and merged vertically deep into the Iron Throne swords cluster!
    this.stances = [
      // 0: Hero - Majestic upright vertical guard on the right side of the screen, blade pointing down
      {
        pos: { x: 2.15, y: 0.85, z: 0 },
        rot: { x: 0.05, y: 0, z: Math.PI },
        scale: 1.05
      },
      // 1: About - Slanted slash poise over chronicle background
      {
        pos: { x: 1.85, y: 0.1, z: -0.2 },
        rot: { x: 0.25, y: -0.85, z: -0.45 },
        scale: 0.96
      },
      // 2: Skills - Defensive horizontal stance across the upper/left
      {
        pos: { x: -1.75, y: 0.2, z: -0.1 },
        rot: { x: 0.15, y: 1.1, z: 1.35 },
        scale: 0.92
      },
      // 3: Projects - Thrust stance, pointing with perspective towards viewer
      {
        pos: { x: 1.8, y: -0.1, z: 0.3 },
        rot: { x: 1.05, y: -0.5, z: -0.3 },
        scale: 1.0
      },
      // 4: Contact - Scaled down to match other swords and attached symmetrically at the center of the Iron Throne crown
      {
        pos: { x: 2.15, y: -2.65, z: -0.10 },
        rot: { x: -0.05, y: 0, z: 0 },
        scale: 0.34
      }
    ];

    // Current interpolated transform (initial: pointing down on the right)
    const initW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const initX = initW < 640 ? 0 : (initW < 1024 ? 1.35 : 2.15);
    const initY = initW < 640 ? 0.55 : (initW < 1024 ? 0.70 : 0.85);
    this.currentTransform = {
      pos: { x: initX, y: initY, z: 0 },
      rot: { x: 0.05, y: 0, z: Math.PI },
      scale: 1.05
    };

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Procedural HDR Reflection Environment
    this.setupEnvironment();

    // 5. Lights
    this.setupLights();

    // 6. Build 3D Sword using real internet textures (Gleaming, Dark, Valyrian Metallic)
    this.buildValyrianSword();

    // 7. Build Authentic 3D Iron Throne Dais and Armature Shapes (No 2D Image!)
    this.buildIronThrone();

    // 7b. Build Mapped 3D Throne Swords Array for Procedural Throne Assembly
    this.buildConvergingSwords();

    // 7c. Setup Volcanic Forge Smoke Particle System
    this.setupForgeSmoke();

    // 7d. Setup Specular Light Sweep Shine
    this.setupThroneShine();

    // 7e. Setup Symmetrical Master Sword Docking to Center of Throne
    this.setupThroneDocking();

    // 8. Event listeners
    this.setupEvents();

    // Update responsive initial position
    this.setScrollProgress(0);

    // 9. Animation Loop
    this.animate();
  }

  /**
   * Procedural HDR reflection environment map using PMREMGenerator
   */
  setupEnvironment() {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();

      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0, '#121d2d');
      grad.addColorStop(0.35, '#283a50');
      grad.addColorStop(0.5, '#38485c');
      grad.addColorStop(0.52, '#22262e');
      grad.addColorStop(0.8, '#14171d');
      grad.addColorStop(1, '#0a0d12');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);

      // Moonlight reflection bank
      const moonGrad = ctx.createRadialGradient(260, 140, 5, 260, 140, 170);
      moonGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      moonGrad.addColorStop(0.25, 'rgba(225, 242, 255, 0.95)');
      moonGrad.addColorStop(0.55, 'rgba(140, 200, 250, 0.5)');
      moonGrad.addColorStop(1, 'rgba(15, 30, 50, 0)');
      ctx.fillStyle = moonGrad;
      ctx.fillRect(90, 0, 340, 320);

      // Specular slit window reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(250, 30, 25, 170);

      // Warm forge torches
      const forgeGrad = ctx.createRadialGradient(780, 180, 5, 780, 180, 190);
      forgeGrad.addColorStop(0, 'rgba(255, 242, 210, 1)');
      forgeGrad.addColorStop(0.25, 'rgba(255, 170, 70, 0.9)');
      forgeGrad.addColorStop(0.6, 'rgba(210, 80, 25, 0.45)');
      forgeGrad.addColorStop(1, 'rgba(25, 12, 6, 0)');
      ctx.fillStyle = forgeGrad;
      ctx.fillRect(590, 10, 380, 340);

      const envTexture = new THREE.CanvasTexture(canvas);
      envTexture.mapping = THREE.EquirectangularReflectionMapping;

      const renderTarget = pmremGenerator.fromEquirectangular(envTexture);
      this.scene.environment = renderTarget.texture;

      pmremGenerator.dispose();
      envTexture.dispose();
    } catch (err) {
      console.warn('Environment map initialization note:', err);
    }
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0x3e5066, 1.35);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xe2f0ff, 2.8);
    this.keyLight.position.set(5, 8, 6);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x93c5fd, 2.4);
    this.rimLight.position.set(-5, 4, -4);
    this.scene.add(this.rimLight);

    this.torchLight = new THREE.DirectionalLight(0xffb266, 1.8);
    this.torchLight.position.set(-6, -3, 3);
    this.scene.add(this.torchLight);

    this.gleamLight = new THREE.PointLight(0xffffff, 2.8, 4.2);
    this.gleamLight.position.set(0.2, 1.8, 0.35);
    this.scene.add(this.gleamLight);

    this.gemLight = new THREE.PointLight(0xef233c, 3.2, 5.0);
    this.gemLight.position.set(0, -1.48, 0.15);
    this.scene.add(this.gemLight);
  }

  /**
   * Procedural Damascus Steel Texture Generator
   * Guaranteed to work 100% offline, on file://, and without any CORS network issues!
   */
  createProceduralDamascusTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base smoky dark crucible steel
    ctx.fillStyle = '#222831';
    ctx.fillRect(0, 0, 512, 1024);

    // Flowing wavy crucible folding Damascus bands
    ctx.lineWidth = 2.5;
    for (let y = 0; y < 1024; y += 7) {
      const alpha = 0.22 + Math.sin(y * 0.05) * 0.12;
      ctx.strokeStyle = (y % 14 === 0) ? `rgba(180, 205, 235, ${alpha})` : `rgba(20, 25, 35, ${alpha + 0.1})`;
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const wave = Math.sin(x * 0.025 + y * 0.015) * 14 + Math.cos(x * 0.05 - y * 0.02) * 8;
        if (x === 0) ctx.moveTo(x, y + wave);
        else ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    // Secondary micro-ripples
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = 'rgba(215, 230, 255, 0.14)';
      ctx.beginPath();
      const startY = Math.random() * 1024;
      ctx.moveTo(0, startY);
      ctx.bezierCurveTo(150, startY + 50, 350, startY - 50, 512, startY + 20);
      ctx.stroke();
    }

    // Fine steel grain noise
    const imgData = ctx.getImageData(0, 0, 512, 1024);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 2);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  /**
   * Procedural Gilded Royal Gold Texture Generator
   */
  createProceduralGoldTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, '#f9e38d');
    grad.addColorStop(0.3, '#d4af37');
    grad.addColorStop(0.7, '#aa820a');
    grad.addColorStop(1, '#6b4f04');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.lineWidth = 1;
    for (let y = 0; y < 256; y += 3) {
      ctx.strokeStyle = `rgba(255, 245, 180, ${Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  /**
   * Procedural Leather Grip Texture Generator
   */
  createProceduralLeatherTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c1714';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(80, 60, 45, 0.4)';
    ctx.lineWidth = 2;
    for (let x = -256; x < 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 256, 256);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + 256, 0);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  /**
   * Procedural Carved Pale Stone / Weathered Bone Texture Generator (1024x1024 Ultra-Res)
   * Generates micro-chisel striations, organic quartz veins, directional hair-by-hair fur grain,
   * natural ivory fissures, and calcium micropores for Longclaw's Wolf Pommel
   */
  createProceduralWolfBoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base pale northern alabaster / ivory gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 1024);
    grad.addColorStop(0, '#fcfdfe');
    grad.addColorStop(0.25, '#f4f7fb');
    grad.addColorStop(0.55, '#e9f0f6');
    grad.addColorStop(0.85, '#dde5ef');
    grad.addColorStop(1, '#c8d4e2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 1. Organic marble & quartz mineral veins running through the stone
    ctx.strokeStyle = 'rgba(175, 190, 208, 0.24)';
    ctx.lineWidth = 1.8;
    for (let v = 0; v < 85; v++) {
      let vx = Math.random() * 1024;
      let vy = Math.random() * 1024;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      const segments = 6 + Math.floor(Math.random() * 8);
      for (let s = 0; s < segments; s++) {
        vx += (Math.random() - 0.42) * 60;
        vy += (Math.random() - 0.42) * 60;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }

    // 2. Hair-by-hair directional wolf fur grain (1,200 delicate strokes)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.20)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 1200; i++) {
      const y = Math.random() * 1024;
      const x = Math.random() * 1024;
      const len = 18 + Math.random() * 55;
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.38;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    // 3. Stonemason cross-hatch chisel tool marks
    ctx.strokeStyle = 'rgba(112, 128, 148, 0.18)';
    ctx.lineWidth = 2.2;
    for (let c = 0; c < 240; c++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const len = 35 + Math.random() * 80;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len, y + (Math.random() - 0.5) * 22);
      ctx.stroke();
    }

    // 4. Fine stone hairline fissures
    ctx.strokeStyle = 'rgba(80, 95, 115, 0.15)';
    ctx.lineWidth = 0.9;
    for (let f = 0; f < 300; f++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 35, y + (Math.random() - 0.5) * 35);
      ctx.stroke();
    }

    // 5. Weathered bone micropores and mineral crystal flecks (2,000 pores)
    for (let p = 0; p < 2000; p++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 1024;
      const rad = 0.5 + Math.random() * 1.8;
      const alpha = 0.06 + Math.random() * 0.16;
      ctx.fillStyle = `rgba(71, 85, 105, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  /**
   * Build the complete Valyrian Steel Bastard Sword
   * Perfectly balanced: Dark smoky tone, rich metallic specular sheen, not flat or too opaque!
   */
  buildValyrianSword() {
    this.swordGroup = new THREE.Group();

    // 1. Procedural High-Res Base Textures (Guaranteed 100% Offline & on file:// without CORS!)
    const proceduralDamascus = this.createProceduralDamascusTexture();
    const proceduralGold = this.createProceduralGoldTexture();
    const proceduralLeather = this.createProceduralLeatherTexture();
    const proceduralWolfBone = this.createProceduralWolfBoneTexture();

    // 2. Perfectly Balanced Valyrian Steel Material:
    // Dark smoky crucible steel (0x303844), high metalness (0.95), low roughness (0.14),
    // and deep clearcoat (0.92) - gleaming, highly reflective, realistic!
    this.bladeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x303844,
      map: proceduralDamascus,
      roughnessMap: proceduralDamascus,
      bumpMap: proceduralDamascus,
      bumpScale: 0.005,
      metalness: 0.95,
      roughness: 0.14,
      clearcoat: 0.92,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      envMapIntensity: 2.8,
      transparent: false,
      opacity: 1.0,
      depthWrite: true
    });

    // 3. Gilded Royal Gold Physical Material (Crossguard & Pommel)
    this.goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      map: proceduralGold,
      roughnessMap: proceduralGold,
      metalness: 0.90,
      roughness: 0.22,
      clearcoat: 0.7,
      clearcoatRoughness: 0.06,
      envMapIntensity: 2.2,
      transparent: false,
      depthWrite: true
    });

    // 4. Leather Grip Material
    this.leatherMaterial = new THREE.MeshStandardMaterial({
      color: 0x221e1a,
      map: proceduralLeather,
      bumpMap: proceduralLeather,
      bumpScale: 0.01,
      roughness: 0.82,
      metalness: 0.08,
      transparent: false,
      depthWrite: true
    });

    // 4b. Longclaw Weathered Valyrian Steel (Matte Gunmetal / Antique Chiseled Steel)
    this.longclawSteelMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x363d48,
      metalness: 0.90,
      roughness: 0.28,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      envMapIntensity: 2.4,
      transparent: false,
      depthWrite: true
    });

    // 4c. Longclaw Bastard Sword Midnight Leather Grip
    this.longclawGripMaterial = new THREE.MeshStandardMaterial({
      color: 0x111317,
      map: proceduralLeather,
      bumpMap: proceduralLeather,
      bumpScale: 0.02,
      roughness: 0.78,
      metalness: 0.12,
      transparent: false,
      depthWrite: true
    });

    // 4d. Longclaw Ghost Direwolf Stone Pommel (100X Ultra-Realistic Carved Alabaster & Marble)
    this.longclawWolfMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5f8fc,
      map: proceduralWolfBone,
      bumpMap: proceduralWolfBone,
      bumpScale: 0.014,
      roughness: 0.36,
      metalness: 0.04,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      reflectivity: 0.6,
      envMapIntensity: 1.5,
      transparent: false,
      depthWrite: true
    });

    // 4e. Longclaw Predator Ivory Fangs & Incisors (Ultra-Gloss Polished Enamel)
    this.longclawFangMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xfffff4,
      roughness: 0.08,
      metalness: 0.03,
      clearcoat: 0.95,
      clearcoatRoughness: 0.04,
      reflectivity: 1.0,
      envMapIntensity: 2.0,
      transparent: false,
      depthWrite: true
    });

    // 4f. Longclaw Snarling Mouth Buccal Cavity & Wet Tongue (Deep Crimson Saliva Sheen)
    this.longclawMouthTissueMaterial = new THREE.MeshStandardMaterial({
      color: 0x480c16,
      roughness: 0.24,
      metalness: 0.06
    });

    // 4g. Longclaw Saliva Glint Droplets (Catching Fang Tips)
    this.longclawSalivaMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.0,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    // 4h. Longclaw Basalt Wolf Nose Pad (Porous Matte Leather Rhinarium)
    this.longclawNoseMaterial = new THREE.MeshStandardMaterial({
      color: 0x121418,
      roughness: 0.78,
      metalness: 0.12
    });

    // 4i. Longclaw Shadowed Inner Ear Concha
    this.longclawInnerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0x76808e,
      roughness: 0.62,
      metalness: 0.05
    });

    // 4i. Longclaw Twin Ruby Eyes (Large Faceted Crimson Carbuncle / Blazing Garnet)
    this.longclawRubyEyeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xff0828,
      emissive: 0xff002b,
      emissiveIntensity: 5.2,
      roughness: 0.0,
      metalness: 0.20,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      reflectivity: 1.0,
      transparent: false,
      depthWrite: true
    });
    this.gemMaterial = this.longclawRubyEyeMaterial;

    // 5. Opportunistically Upgrade with Photographic Textures when running on HTTP server
    this.textureLoader.load('assets/textures/valyrian_damascus.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 4);
      tex.encoding = THREE.sRGBEncoding;
      this.bladeMaterial.map = tex;
      this.bladeMaterial.needsUpdate = true;
    });

    this.textureLoader.load('assets/textures/damascus_close.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 6);
      this.bladeMaterial.bumpMap = tex;
      this.bladeMaterial.roughnessMap = tex;
      this.bladeMaterial.needsUpdate = true;
    });

    this.textureLoader.load('assets/textures/gold_metallic.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      this.goldMaterial.map = tex;
      this.goldMaterial.needsUpdate = true;
    });

    this.textureLoader.load('assets/textures/hilt_leather.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 3);
      this.leatherMaterial.map = tex;
      this.leatherMaterial.needsUpdate = true;
    });

    // --- BLADE GEOMETRY ---
    // --- BLADE GEOMETRY ---
    const bladeLength = 5.9;
    const bladeWidth = 0.165;
    const bladeThickness = 0.038;
    const bladeSegments = 48;

    const bladeGeo = new THREE.BufferGeometry();
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let i = 0; i <= bladeSegments; i++) {
      const t = i / bladeSegments;
      const y = t * bladeLength;
      let w = bladeWidth * (1 - Math.pow(t, 2.8) * 0.96);
      if (t > 0.90) {
        w = bladeWidth * (1 - (t - 0.90) / 0.10);
      }
      const th = bladeThickness * (1 - t * 0.74);
      const fullerIndent = (t > 0.025 && t < 0.78) ? 0.007 : 0;

      // Point 0: Front Ridge
      positions.push(0, y, (th - fullerIndent));
      uvs.push(0.5, t);

      // Point 1: Right Razor Edge
      positions.push(w, y, 0);
      uvs.push(1.0, t);

      // Point 2: Back Ridge
      positions.push(0, y, -(th - fullerIndent));
      uvs.push(0.5, t);

      // Point 3: Left Razor Edge
      positions.push(-w, y, 0);
      uvs.push(0.0, t);

      if (i < bladeSegments) {
        const row = i * 4;
        const next = (i + 1) * 4;
        indices.push(row + 0, row + 1, next + 1);
        indices.push(row + 0, next + 1, next + 0);
        indices.push(row + 1, row + 2, next + 2);
        indices.push(row + 1, next + 2, next + 1);
        indices.push(row + 2, row + 3, next + 3);
        indices.push(row + 2, next + 3, next + 2);
        indices.push(row + 3, row + 0, next + 0);
        indices.push(row + 3, next + 0, next + 3);
      }
    }

    bladeGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    bladeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    bladeGeo.setIndex(indices);
    bladeGeo.computeVertexNormals();

    this.bladeMesh = new THREE.Mesh(bladeGeo, this.bladeMaterial);
    this.bladeMesh.castShadow = true;
    this.bladeMesh.receiveShadow = true;
    this.swordGroup.add(this.bladeMesh);

    // --- 1. RICASSO & BLADE SHOULDER BEVELS (5X Detailing) ---
    // Hardened Valyrian steel ricasso block with chiseled blade bevel shoulders
    const ricassoGeo = new THREE.BoxGeometry(0.18, 0.32, 0.046);
    const ricassoMesh = new THREE.Mesh(ricassoGeo, this.bladeMaterial);
    ricassoMesh.position.set(0, 0.20, 0);
    ricassoMesh.castShadow = true;
    this.swordGroup.add(ricassoMesh);

    // Stark Direwolf Relief Medallion inlaid on front and back of ricasso
    const medallionGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.052, 12);
    const medallionFront = new THREE.Mesh(medallionGeo, this.longclawSteelMaterial);
    medallionFront.position.set(0, 0.20, 0);
    medallionFront.rotation.x = Math.PI / 2;
    this.swordGroup.add(medallionFront);

    // Symmetrical Parrying Ricasso Notches (Chiseled hooks catching opposing blades)
    const notchGeo = new THREE.ConeGeometry(0.024, 0.075, 4);
    const notchL = new THREE.Mesh(notchGeo, this.longclawSteelMaterial);
    notchL.position.set(-0.098, 0.35, 0);
    notchL.rotation.z = Math.PI / 3;
    this.swordGroup.add(notchL);

    const notchR = new THREE.Mesh(notchGeo, this.longclawSteelMaterial);
    notchR.position.set(0.098, 0.35, 0);
    notchR.rotation.z = -Math.PI / 3;
    this.swordGroup.add(notchR);

    // Twin Silver Fuller Flanking Rails (Guiding channels along the blade)
    const railGeo = new THREE.CylinderGeometry(0.005, 0.005, 3.65, 6);
    const railL = new THREE.Mesh(railGeo, this.longclawSteelMaterial);
    railL.position.set(-0.032, 2.05, bladeThickness - 0.001);
    this.swordGroup.add(railL);

    const railR = new THREE.Mesh(railGeo, this.longclawSteelMaterial);
    railR.position.set(0.032, 2.05, bladeThickness - 0.001);
    this.swordGroup.add(railR);

    // --- 2. ANCIENT HIGH VALYRIAN RUNIC INLAY ON CENTRAL FULLER ---
    // Procedurally generated Valyrian magic glyph texture
    const runeCanvas = document.createElement('canvas');
    runeCanvas.width = 64;
    runeCanvas.height = 512;
    const rCtx = runeCanvas.getContext('2d');
    rCtx.clearRect(0, 0, 64, 512);

    // Draw intricate High Valyrian rune glyphs & star nodes
    rCtx.strokeStyle = 'rgba(94, 234, 212, 0.95)';
    rCtx.fillStyle = 'rgba(94, 234, 212, 0.95)';
    rCtx.lineWidth = 2.5;
    rCtx.lineCap = 'round';

    for (let gy = 24; gy < 490; gy += 38) {
      rCtx.beginPath();
      rCtx.arc(32, gy, 4, 0, Math.PI * 2);
      rCtx.fill();

      // Intricate branching runic marks
      rCtx.beginPath();
      rCtx.moveTo(32, gy - 14);
      rCtx.lineTo(32, gy + 14);
      rCtx.moveTo(32, gy - 6);
      rCtx.lineTo(20, gy);
      rCtx.lineTo(32, gy + 6);
      rCtx.moveTo(32, gy - 6);
      rCtx.lineTo(44, gy);
      rCtx.lineTo(32, gy + 6);
      rCtx.stroke();

      // Outer mystic nodes
      rCtx.beginPath();
      rCtx.arc(18, gy, 2, 0, Math.PI * 2);
      rCtx.arc(46, gy, 2, 0, Math.PI * 2);
      rCtx.fill();
    }

    const runeTex = new THREE.CanvasTexture(runeCanvas);
    runeTex.wrapS = THREE.RepeatWrapping;
    runeTex.wrapT = THREE.RepeatWrapping;
    runeTex.repeat.set(1, 1);

    const runeGeo = new THREE.PlaneGeometry(0.052, 3.65);
    this.runeMaterial = new THREE.MeshBasicMaterial({
      map: runeTex,
      color: 0x5eead4,
      transparent: true,
      opacity: 0.80,
      blending: THREE.AdditiveBlending
    });
    this.runesMesh = new THREE.Mesh(runeGeo, this.runeMaterial);
    this.runesMesh.position.set(0, 2.05, bladeThickness + 0.002);
    this.swordGroup.add(this.runesMesh);

    const runesMeshBack = this.runesMesh.clone();
    runesMeshBack.position.set(0, 2.05, -(bladeThickness + 0.002));
    runesMeshBack.rotation.y = Math.PI;
    this.swordGroup.add(runesMeshBack);

    // --- DYNAMIC SPECULAR GLINT LENS-FLARE SPARKLE ---
    const glintGeo = new THREE.PlaneGeometry(0.38, 0.38);
    const glintCanvas = document.createElement('canvas');
    glintCanvas.width = 128;
    glintCanvas.height = 128;
    const gCtx = glintCanvas.getContext('2d');
    const gGrad = gCtx.createRadialGradient(64, 64, 2, 64, 64, 64);
    gGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gGrad.addColorStop(0.25, 'rgba(220, 245, 255, 0.85)');
    gGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.3)');
    gGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    gCtx.fillStyle = gGrad;
    gCtx.fillRect(0, 0, 128, 128);

    gCtx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    gCtx.beginPath();
    gCtx.moveTo(0, 64); gCtx.lineTo(64, 61); gCtx.lineTo(128, 64); gCtx.lineTo(64, 67);
    gCtx.fill();
    gCtx.beginPath();
    gCtx.moveTo(64, 0); gCtx.lineTo(61, 64); gCtx.lineTo(64, 128); gCtx.lineTo(67, 64);
    gCtx.fill();

    const glintTex = new THREE.CanvasTexture(glintCanvas);
    this.glintMaterial = new THREE.MeshBasicMaterial({
      map: glintTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.glintMesh = new THREE.Mesh(glintGeo, this.glintMaterial);
    this.glintMesh.position.set(0.14, 2.95, 0.02);
    this.swordGroup.add(this.glintMesh);

    // Secondary Traveling Razor Sparkle Glint
    const glintMesh2 = new THREE.Mesh(glintGeo, this.glintMaterial);
    glintMesh2.position.set(-0.14, 1.65, 0.02);
    glintMesh2.scale.set(0.7, 0.7, 1);
    this.swordGroup.add(glintMesh2);

    // =========================================================================
    // LONGCLAW UPPER PART: Crossguard, Bastard Grip & Sculpted Ghost Pommel
    // =========================================================================

    // --- 3. LONGCLAW CROSSGUARD (Weathered Valyrian Steel - 5X Detailed) ---
    const guardGroup = new THREE.Group();

    // Hexagonal faceted central rain guard / chape block
    const guardCenterGeo = new THREE.CylinderGeometry(0.19, 0.20, 0.19, 6);
    const guardCenter = new THREE.Mesh(guardCenterGeo, this.longclawSteelMaterial);
    guardCenter.rotation.y = Math.PI / 6;
    guardGroup.add(guardCenter);

    // Raised Relief Border Trim around Guard Block
    const guardTrimGeo = new THREE.TorusGeometry(0.192, 0.012, 6, 6);
    const guardTrim = new THREE.Mesh(guardTrimGeo, this.longclawSteelMaterial);
    guardTrim.rotation.x = Math.PI / 2;
    guardGroup.add(guardTrim);

    // Hexagonal Tang Rivets / Bolts (4 securing bolts on guard center)
    const boltGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.025, 6);
    for (let b = 0; b < 4; b++) {
      const bx = (b % 2 === 0 ? -1 : 1) * 0.072;
      const by = (b < 2 ? -1 : 1) * 0.055;
      const boltF = new THREE.Mesh(boltGeo, this.longclawSteelMaterial);
      boltF.position.set(bx, by, 0.105);
      boltF.rotation.x = Math.PI / 2;
      guardGroup.add(boltF);

      const boltB = new THREE.Mesh(boltGeo, this.longclawSteelMaterial);
      boltB.position.set(bx, by, -0.105);
      boltB.rotation.x = Math.PI / 2;
      guardGroup.add(boltB);
    }

    // Diamond Relief Badge centered on Guard Front & Back
    const badgeGeo = new THREE.OctahedronGeometry(0.055, 0);
    const badgeFront = new THREE.Mesh(badgeGeo, this.longclawSteelMaterial);
    badgeFront.scale.set(1.0, 1.5, 0.35);
    badgeFront.position.set(0, 0, 0.108);
    guardGroup.add(badgeFront);

    const badgeBack = new THREE.Mesh(badgeGeo, this.longclawSteelMaterial);
    badgeBack.scale.set(1.0, 1.5, 0.35);
    badgeBack.position.set(0, 0, -0.108);
    guardGroup.add(badgeBack);

    // Blade collar / sleeve hugging the ricasso
    const guardCollarGeo = new THREE.BoxGeometry(0.24, 0.14, 0.12);
    const guardCollar = new THREE.Mesh(guardCollarGeo, this.longclawSteelMaterial);
    guardCollar.position.set(0, 0.12, 0);
    guardGroup.add(guardCollar);

    // Guard Base Protective Lugs (Curved side flanges guarding user's forefinger)
    const lugGeo = new THREE.TorusGeometry(0.052, 0.016, 8, 12, Math.PI);
    const lugL = new THREE.Mesh(lugGeo, this.longclawSteelMaterial);
    lugL.position.set(-0.24, -0.02, 0);
    lugL.rotation.z = -Math.PI / 2;
    guardGroup.add(lugL);

    const lugR = new THREE.Mesh(lugGeo, this.longclawSteelMaterial);
    lugR.position.set(0.24, -0.02, 0);
    lugR.rotation.z = Math.PI / 2;
    guardGroup.add(lugR);

    // Lateral quillon arms - extending outward with subtle downward droop
    const quillonCurveL = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.35, -0.01, 0),
      new THREE.Vector3(-0.70, 0.02, 0),
      new THREE.Vector3(-0.98, 0.05, 0)
    );
    const quillonGeoL = new THREE.TubeGeometry(quillonCurveL, 22, 0.058, 8, false);
    const quillonMeshL = new THREE.Mesh(quillonGeoL, this.longclawSteelMaterial);
    guardGroup.add(quillonMeshL);

    const quillonCurveR = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.35, -0.01, 0),
      new THREE.Vector3(0.70, 0.02, 0),
      new THREE.Vector3(0.98, 0.05, 0)
    );
    const quillonGeoR = new THREE.TubeGeometry(quillonCurveR, 22, 0.058, 8, false);
    const quillonMeshR = new THREE.Mesh(quillonGeoR, this.longclawSteelMaterial);
    guardGroup.add(quillonMeshR);

    // Quillon Fluted Longitudinal Ribs (Dual relief channels along both quillons)
    const ribGeoL = new THREE.CylinderGeometry(0.012, 0.010, 0.85, 6);
    const ribMeshL1 = new THREE.Mesh(ribGeoL, this.longclawSteelMaterial);
    ribMeshL1.position.set(-0.52, 0.02, 0.042);
    ribMeshL1.rotation.z = Math.PI / 2 - 0.05;
    guardGroup.add(ribMeshL1);

    const ribMeshL2 = new THREE.Mesh(ribGeoL, this.longclawSteelMaterial);
    ribMeshL2.position.set(-0.52, 0.02, -0.042);
    ribMeshL2.rotation.z = Math.PI / 2 - 0.05;
    guardGroup.add(ribMeshL2);

    const ribMeshR1 = new THREE.Mesh(ribGeoL, this.longclawSteelMaterial);
    ribMeshR1.position.set(0.52, 0.02, 0.042);
    ribMeshR1.rotation.z = -Math.PI / 2 + 0.05;
    guardGroup.add(ribMeshR1);

    const ribMeshR2 = new THREE.Mesh(ribGeoL, this.longclawSteelMaterial);
    ribMeshR2.position.set(0.52, 0.02, -0.042);
    ribMeshR2.rotation.z = -Math.PI / 2 + 0.05;
    guardGroup.add(ribMeshR2);

    // Faceted quillon terminals (classic bastard sword teardrop/faceted caps)
    const terminalGeo = new THREE.ConeGeometry(0.065, 0.18, 6);
    const terminalL = new THREE.Mesh(terminalGeo, this.longclawSteelMaterial);
    terminalL.position.set(-1.02, 0.055, 0);
    terminalL.rotation.z = Math.PI / 2;
    guardGroup.add(terminalL);

    const terminalR = new THREE.Mesh(terminalGeo, this.longclawSteelMaterial);
    terminalR.position.set(1.02, 0.055, 0);
    terminalR.rotation.z = -Math.PI / 2;
    guardGroup.add(terminalR);

    // Quillon terminal collar rings
    const termRingGeo = new THREE.TorusGeometry(0.058, 0.014, 8, 16);
    const termRingL = new THREE.Mesh(termRingGeo, this.longclawSteelMaterial);
    termRingL.position.set(-0.96, 0.055, 0);
    termRingL.rotation.y = Math.PI / 2;
    guardGroup.add(termRingL);

    const termRingR = new THREE.Mesh(termRingGeo, this.longclawSteelMaterial);
    termRingR.position.set(0.96, 0.055, 0);
    termRingR.rotation.y = Math.PI / 2;
    guardGroup.add(termRingR);

    // Terminal End Caps with Inlaid Micro-Gem Rivets
    const capGeo = new THREE.SphereGeometry(0.028, 8, 8);
    const capL = new THREE.Mesh(capGeo, this.longclawSteelMaterial);
    capL.position.set(-1.12, 0.055, 0);
    guardGroup.add(capL);

    const capR = new THREE.Mesh(capGeo, this.longclawSteelMaterial);
    capR.position.set(1.12, 0.055, 0);
    guardGroup.add(capR);

    guardGroup.position.set(0, 0, 0);
    this.swordGroup.add(guardGroup);

    // --- 4. LONGCLAW BASTARD SWORD HILT / GRIP (5X Detailed Hand-and-a-Half) ---
    const gripLength = 1.22;
    // Anatomical double-swelled grip core
    const gripUpperGeo = new THREE.CylinderGeometry(0.082, 0.088, gripLength * 0.48, 16);
    const gripUpper = new THREE.Mesh(gripUpperGeo, this.longclawGripMaterial);
    gripUpper.position.set(0, -gripLength * 0.24, 0);
    this.swordGroup.add(gripUpper);

    const gripLowerGeo = new THREE.CylinderGeometry(0.085, 0.094, gripLength * 0.48, 16);
    const gripLower = new THREE.Mesh(gripLowerGeo, this.longclawGripMaterial);
    gripLower.position.set(0, -gripLength * 0.74, 0);
    this.swordGroup.add(gripLower);

    // Central Steel Spacer Ring (Ferrule) dividing the hand-and-a-half grip
    const centerRingGeo = new THREE.CylinderGeometry(0.098, 0.098, 0.048, 16);
    const centerRing = new THREE.Mesh(centerRingGeo, this.longclawSteelMaterial);
    centerRing.position.set(0, -gripLength / 2, 0);
    this.swordGroup.add(centerRing);

    // Rope-Twist Braided Filigree on Central Ferrule
    const centerBevelGeo = new THREE.TorusGeometry(0.096, 0.012, 8, 24);
    const centerBevel1 = new THREE.Mesh(centerBevelGeo, this.longclawSteelMaterial);
    centerBevel1.position.set(0, -gripLength / 2 + 0.024, 0);
    centerBevel1.rotation.x = Math.PI / 2;
    this.swordGroup.add(centerBevel1);

    const centerBevel2 = new THREE.Mesh(centerBevelGeo, this.longclawSteelMaterial);
    centerBevel2.position.set(0, -gripLength / 2 - 0.024, 0);
    centerBevel2.rotation.x = Math.PI / 2;
    this.swordGroup.add(centerBevel2);

    // Upper & Lower Grip End Ferrules
    const endFerruleGeo = new THREE.CylinderGeometry(0.092, 0.086, 0.028, 16);
    const upperFerrule = new THREE.Mesh(endFerruleGeo, this.longclawSteelMaterial);
    upperFerrule.position.set(0, -0.018, 0);
    this.swordGroup.add(upperFerrule);

    const lowerFerrule = new THREE.Mesh(endFerruleGeo, this.longclawSteelMaterial);
    lowerFerrule.position.set(0, -gripLength + 0.018, 0);
    this.swordGroup.add(lowerFerrule);

    // Criss-Cross Diamond Risers & Spiral Wire Wraps (14 dual-angle criss-cross wraps)
    const wireCount = 14;
    for (let w = 0; w < wireCount; w++) {
      const ringGeo = new THREE.TorusGeometry(0.088 + (w / wireCount) * 0.007, 0.011, 8, 24);
      // Forward spiral
      const ringFwd = new THREE.Mesh(ringGeo, this.longclawGripMaterial);
      ringFwd.position.set(0, -0.06 - (w * 0.082), 0);
      ringFwd.rotation.x = Math.PI / 2 + 0.14;
      this.swordGroup.add(ringFwd);

      // Inlaid twisted silver micro-wire
      const wireMesh = new THREE.Mesh(new THREE.TorusGeometry(0.089 + (w / wireCount) * 0.007, 0.004, 6, 24), this.longclawSteelMaterial);
      wireMesh.position.set(0, -0.06 - (w * 0.082), 0);
      wireMesh.rotation.x = Math.PI / 2 - 0.14;
      this.swordGroup.add(wireMesh);
    }

    // --- 5. LONGCLAW GHOST DIREWOLF HEAD POMMEL (100X Ultra-Realistic Masterwork Sculpture) ---
    const pommelGroup = new THREE.Group();
    pommelGroup.position.set(0, -gripLength, 0);

    // =========================================================================
    // MODULE 1: VALYRIAN STEEL FERRULE COLLAR & INLAID HARDWARE (25 Meshes)
    // =========================================================================
    // Heavy Forged Valyrian Steel Collar anchoring the pommel to the leather grip
    const pommelCollarGeo = new THREE.CylinderGeometry(0.108, 0.094, 0.065, 24);
    const pommelCollar = new THREE.Mesh(pommelCollarGeo, this.longclawSteelMaterial);
    pommelCollar.position.set(0, -0.032, 0);
    pommelGroup.add(pommelCollar);

    const collarRidgeGeo = new THREE.TorusGeometry(0.102, 0.012, 10, 24);
    const collarRidge = new THREE.Mesh(collarRidgeGeo, this.longclawSteelMaterial);
    collarRidge.position.set(0, -0.052, 0);
    collarRidge.rotation.x = Math.PI / 2;
    pommelGroup.add(collarRidge);

    const collarBevelGeo = new THREE.CylinderGeometry(0.098, 0.106, 0.016, 24);
    const collarBevel = new THREE.Mesh(collarBevelGeo, this.longclawSteelMaterial);
    collarBevel.position.set(0, -0.012, 0);
    pommelGroup.add(collarBevel);

    // 12 Forged Valyrian Steel Rivet Studs around the collar perimeter
    for (let rv = 0; rv < 12; rv++) {
      const angle = (rv / 12) * Math.PI * 2;
      const rivetGeo = new THREE.SphereGeometry(0.011, 8, 8);
      const rivetMesh = new THREE.Mesh(rivetGeo, this.longclawSteelMaterial);
      rivetMesh.position.set(Math.cos(angle) * 0.102, -0.032, Math.sin(angle) * 0.102);
      rivetMesh.scale.set(1.0, 0.7, 1.0);
      pommelGroup.add(rivetMesh);
    }

    // 4 Antique Valyrian Steel Mounting Brackets clamping stone to hilt
    for (let b = 0; b < 4; b++) {
      const angle = (b / 4) * Math.PI * 2 + Math.PI / 4;
      const bracketGeo = new THREE.BoxGeometry(0.016, 0.055, 0.022);
      const bracketMesh = new THREE.Mesh(bracketGeo, this.longclawSteelMaterial);
      bracketMesh.position.set(Math.cos(angle) * 0.106, -0.040, Math.sin(angle) * 0.106);
      bracketMesh.rotation.y = -angle;
      pommelGroup.add(bracketMesh);
    }

    // 6 Engraved Runic Accent Plates around collar perimeter
    for (let r = 0; r < 6; r++) {
      const angle = (r / 6) * Math.PI * 2;
      const plateGeo = new THREE.BoxGeometry(0.020, 0.022, 0.006);
      const plateMesh = new THREE.Mesh(plateGeo, this.longclawSteelMaterial);
      plateMesh.position.set(Math.cos(angle) * 0.104, -0.020, Math.sin(angle) * 0.104);
      plateMesh.rotation.y = -angle;
      pommelGroup.add(plateMesh);
    }

    // =========================================================================
    // MODULE 2: MUSCULAR CERVICAL SPINE & NECK FUR MANTLE (80 Meshes)
    // =========================================================================
    // Flared Pale Stone Neck Base (Carved Alabaster / Weathered Ivory)
    const neckStoneGeo = new THREE.CylinderGeometry(0.142, 0.112, 0.095, 24);
    const neckStone = new THREE.Mesh(neckStoneGeo, this.longclawWolfMaterial);
    neckStone.position.set(0, -0.095, 0.01);
    pommelGroup.add(neckStone);

    const neckTransGeo = new THREE.TorusGeometry(0.125, 0.014, 8, 20);
    const neckTrans = new THREE.Mesh(neckTransGeo, this.longclawWolfMaterial);
    neckTrans.position.set(0, -0.075, 0.01);
    neckTrans.rotation.x = Math.PI / 2;
    pommelGroup.add(neckTrans);

    // Ventral throat jugular furrow (medial groove between neck muscles)
    const throatGrooveGeo = new THREE.BoxGeometry(0.016, 0.09, 0.035);
    const throatGrooveMat = new THREE.MeshStandardMaterial({ color: 0x3a424e, roughness: 0.85 });
    const throatGroove = new THREE.Mesh(throatGrooveGeo, throatGrooveMat);
    throatGroove.position.set(0, -0.10, 0.115);
    pommelGroup.add(throatGroove);

    // Bilateral Sternocleidomastoid Muscle Cords (left & right neck power columns)
    const neckCordGeo = new THREE.CylinderGeometry(0.016, 0.022, 0.11, 8);
    const neckCordL = new THREE.Mesh(neckCordGeo, this.longclawWolfMaterial);
    neckCordL.position.set(-0.065, -0.10, 0.07);
    neckCordL.rotation.set(-0.15, 0, 0.20);
    pommelGroup.add(neckCordL);

    const neckCordR = new THREE.Mesh(neckCordGeo, this.longclawWolfMaterial);
    neckCordR.position.set(0.065, -0.10, 0.07);
    neckCordR.rotation.set(-0.15, 0, -0.20);
    pommelGroup.add(neckCordR);

    // Tier 1: 14 Lower Collar Mantle Tufts
    for (let r1 = 0; r1 < 14; r1++) {
      const angle = (r1 / 14) * Math.PI * 2;
      const ruffGeo1 = new THREE.ConeGeometry(0.024, 0.11, 4);
      const ruffMesh1 = new THREE.Mesh(ruffGeo1, this.longclawWolfMaterial);
      ruffMesh1.position.set(Math.cos(angle) * 0.122, -0.095, Math.sin(angle) * 0.105 + 0.01);
      ruffMesh1.rotation.set(Math.sin(angle) * 0.38, angle, Math.cos(angle) * 0.38);
      pommelGroup.add(ruffMesh1);
    }

    // Tier 2: 18 Mid-Neck Jagged Fur Spikes
    for (let r2 = 0; r2 < 18; r2++) {
      const angle = (r2 / 18) * Math.PI * 2 + 0.18;
      const ruffGeo2 = new THREE.ConeGeometry(0.028, 0.13, 4);
      const ruffMesh2 = new THREE.Mesh(ruffGeo2, this.longclawWolfMaterial);
      ruffMesh2.position.set(Math.cos(angle) * 0.138, -0.130, Math.sin(angle) * 0.118 + 0.015);
      ruffMesh2.rotation.set(Math.sin(angle) * 0.42, angle, Math.cos(angle) * 0.42);
      pommelGroup.add(ruffMesh2);
    }

    // Tier 3: 16 Upper Nape & Throat Fur Ruffs
    for (let r3 = 0; r3 < 16; r3++) {
      const angle = (r3 / 16) * Math.PI * 2 + 0.10;
      const ruffGeo3 = new THREE.ConeGeometry(0.028, 0.125, 4);
      const ruffMesh3 = new THREE.Mesh(ruffGeo3, this.longclawWolfMaterial);
      ruffMesh3.position.set(Math.cos(angle) * 0.145, -0.160, Math.sin(angle) * 0.122 + 0.015);
      ruffMesh3.rotation.set(Math.sin(angle) * 0.45, angle, Math.cos(angle) * 0.45);
      pommelGroup.add(ruffMesh3);
    }

    // Tier 4: 14 Throat Dewlap & Cervical Mantle Fan Spikes
    for (let r4 = 0; r4 < 14; r4++) {
      const angle = (r4 / 14) * Math.PI * 2 + 0.22;
      const ruffGeo4 = new THREE.ConeGeometry(0.025, 0.115, 4);
      const ruffMesh4 = new THREE.Mesh(ruffGeo4, this.longclawWolfMaterial);
      ruffMesh4.position.set(Math.cos(angle) * 0.148, -0.180, Math.sin(angle) * 0.126 + 0.02);
      ruffMesh4.rotation.set(Math.sin(angle) * 0.48, angle, Math.cos(angle) * 0.48);
      pommelGroup.add(ruffMesh4);
    }

    // 14 Nape muscle filler blocks blending spine into skull
    for (let n = 0; n < 14; n++) {
      const nAngle = Math.PI + (n / 13) * Math.PI;
      const nGeo = new THREE.BoxGeometry(0.024, 0.05, 0.035);
      const nMesh = new THREE.Mesh(nGeo, this.longclawWolfMaterial);
      nMesh.position.set(Math.cos(nAngle) * 0.115, -0.145, Math.sin(nAngle) * 0.09 - 0.02);
      nMesh.rotation.y = -nAngle;
      pommelGroup.add(nMesh);
    }

    // =========================================================================
    // MODULE 3: ANATOMICAL CRANIUM, SAGITTAL CREST & ZYGOMATIC ARCHES (30 Meshes)
    // =========================================================================
    // Primary Cranial Vault Dome
    const craniumGeo = new THREE.SphereGeometry(0.162, 24, 20);
    const craniumMesh = new THREE.Mesh(craniumGeo, this.longclawWolfMaterial);
    craniumMesh.scale.set(0.88, 1.20, 1.08);
    craniumMesh.position.set(0, -0.19, 0.02);
    pommelGroup.add(craniumMesh);

    // Massive Sagittal Crest (Sharp dorsal bone ridge running down top of skull)
    const sagittalCrestGeo = new THREE.BoxGeometry(0.024, 0.20, 0.15);
    const sagittalCrest = new THREE.Mesh(sagittalCrestGeo, this.longclawWolfMaterial);
    sagittalCrest.position.set(0, -0.22, -0.04);
    sagittalCrest.rotation.x = -0.32;
    pommelGroup.add(sagittalCrest);

    // 6 Dorsal Serrations / Mini-spikes along Sagittal Crest
    for (let s = 0; s < 6; s++) {
      const sGeo = new THREE.ConeGeometry(0.009, 0.035, 3);
      const sMesh = new THREE.Mesh(sGeo, this.longclawWolfMaterial);
      sMesh.position.set(0, -0.15 - s * 0.026, -0.01 - s * 0.018);
      sMesh.rotation.x = -0.65;
      pommelGroup.add(sMesh);
    }

    // Occipital Bone Crest (Heavy bone protuberance at back of head)
    const occipitalGeo = new THREE.SphereGeometry(0.098, 14, 14);
    const occipitalMesh = new THREE.Mesh(occipitalGeo, this.longclawWolfMaterial);
    occipitalMesh.scale.set(0.92, 0.82, 1.22);
    occipitalMesh.position.set(0, -0.21, -0.09);
    pommelGroup.add(occipitalMesh);

    // Nuchal Crest transverse ridge lines
    const nuchalGeoL = new THREE.BoxGeometry(0.065, 0.020, 0.035);
    const nuchalL = new THREE.Mesh(nuchalGeoL, this.longclawWolfMaterial);
    nuchalL.position.set(-0.045, -0.225, -0.105);
    nuchalL.rotation.set(-0.25, 0.20, -0.15);
    pommelGroup.add(nuchalL);

    const nuchalR = new THREE.Mesh(nuchalGeoL, this.longclawWolfMaterial);
    nuchalR.position.set(0.045, -0.225, -0.105);
    nuchalR.rotation.set(-0.25, -0.20, 0.15);
    pommelGroup.add(nuchalR);

    // Parietal Bone Plates (Left & Right skull sides)
    const parietalGeoL = new THREE.BoxGeometry(0.045, 0.14, 0.11);
    const parietalL = new THREE.Mesh(parietalGeoL, this.longclawWolfMaterial);
    parietalL.position.set(-0.098, -0.20, -0.01);
    parietalL.rotation.set(-0.1, 0.15, 0.18);
    pommelGroup.add(parietalL);

    const parietalR = new THREE.Mesh(parietalGeoL, this.longclawWolfMaterial);
    parietalR.position.set(0.098, -0.20, -0.01);
    parietalR.rotation.set(-0.1, -0.15, -0.18);
    pommelGroup.add(parietalR);

    // Temporal Fossae (Deep muscular hollow depressions behind eyes)
    const temporalGeo = new THREE.BoxGeometry(0.042, 0.065, 0.065);
    const temporalMat = new THREE.MeshStandardMaterial({ color: 0x363c45, roughness: 0.88 });
    const temporalL = new THREE.Mesh(temporalGeo, temporalMat);
    temporalL.position.set(-0.105, -0.17, 0.04);
    pommelGroup.add(temporalL);

    const temporalR = new THREE.Mesh(temporalGeo, temporalMat);
    temporalR.position.set(0.105, -0.17, 0.04);
    pommelGroup.add(temporalR);

    // Massive Zygomatic Arches (Cheekbones giving Direwolf fierce wide predatory bite-width)
    const zygomaticGeoL = new THREE.TorusGeometry(0.088, 0.018, 8, 14, Math.PI * 0.65);
    const zygomaticL = new THREE.Mesh(zygomaticGeoL, this.longclawWolfMaterial);
    zygomaticL.position.set(-0.094, -0.195, 0.08);
    zygomaticL.rotation.set(0.3, 0.25, -0.2);
    pommelGroup.add(zygomaticL);

    const zygomaticR = new THREE.Mesh(zygomaticGeoL, this.longclawWolfMaterial);
    zygomaticR.position.set(0.094, -0.195, 0.08);
    zygomaticR.rotation.set(0.3, -0.25, 0.2);
    pommelGroup.add(zygomaticR);

    // Zygomatic Sub-orbital Flanges
    const zygFlangeGeo = new THREE.BoxGeometry(0.032, 0.055, 0.085);
    const zygFlangeL = new THREE.Mesh(zygFlangeGeo, this.longclawWolfMaterial);
    zygFlangeL.position.set(-0.112, -0.205, 0.075);
    zygFlangeL.rotation.set(0.25, 0.15, -0.15);
    pommelGroup.add(zygFlangeL);

    const zygFlangeR = new THREE.Mesh(zygFlangeGeo, this.longclawWolfMaterial);
    zygFlangeR.position.set(0.112, -0.205, 0.075);
    zygFlangeR.rotation.set(0.25, -0.15, 0.15);
    pommelGroup.add(zygFlangeR);

    // Frontal Bone Sinus Plates
    const frontalGeo = new THREE.BoxGeometry(0.045, 0.065, 0.085);
    const frontalL = new THREE.Mesh(frontalGeo, this.longclawWolfMaterial);
    frontalL.position.set(-0.042, -0.175, 0.10);
    frontalL.rotation.set(0.18, 0.10, -0.08);
    pommelGroup.add(frontalL);

    const frontalR = new THREE.Mesh(frontalGeo, this.longclawWolfMaterial);
    frontalR.position.set(0.042, -0.175, 0.10);
    frontalR.rotation.set(0.18, -0.10, 0.08);
    pommelGroup.add(frontalR);

    // 4 Occipital fur tufts behind the head
    for (let ot = 0; ot < 4; ot++) {
      const otAngle = (ot / 3 - 0.5) * 0.8;
      const otGeo = new THREE.ConeGeometry(0.020, 0.075, 3);
      const otMesh = new THREE.Mesh(otGeo, this.longclawWolfMaterial);
      otMesh.position.set(Math.sin(otAngle) * 0.06, -0.23, -0.115);
      otMesh.rotation.set(-0.7, 0, otAngle);
      pommelGroup.add(otMesh);
    }

    // =========================================================================
    // MODULE 4: MENACING BROW ARCHES, GLABELLA SNARL & CARVED EYELIDS (28 Meshes)
    // =========================================================================
    // Heavy Supraorbital Brow Arches (Ghost's fierce, predatory snarl)
    const browGeoL = new THREE.BoxGeometry(0.092, 0.052, 0.082);
    const browMeshL = new THREE.Mesh(browGeoL, this.longclawWolfMaterial);
    browMeshL.position.set(-0.068, -0.158, 0.135);
    browMeshL.rotation.set(0.22, 0.18, -0.15);
    pommelGroup.add(browMeshL);

    const browMeshR = new THREE.Mesh(browGeoL, this.longclawWolfMaterial);
    browMeshR.position.set(0.068, -0.158, 0.135);
    browMeshR.rotation.set(0.22, -0.18, 0.15);
    pommelGroup.add(browMeshR);

    // Medial Brow Notches & Lateral Orbital Margin Ridges
    const orbRidgeGeo = new THREE.TorusGeometry(0.048, 0.009, 6, 12, Math.PI * 0.7);
    const orbRidgeL = new THREE.Mesh(orbRidgeGeo, this.longclawWolfMaterial);
    orbRidgeL.position.set(-0.076, -0.165, 0.152);
    orbRidgeL.rotation.set(0.35, 0.22, -0.20);
    pommelGroup.add(orbRidgeL);

    const orbRidgeR = new THREE.Mesh(orbRidgeGeo, this.longclawWolfMaterial);
    orbRidgeR.position.set(0.076, -0.165, 0.152);
    orbRidgeR.rotation.set(0.35, -0.22, 0.20);
    pommelGroup.add(orbRidgeR);

    // TRIPLE Glabellar V-Furrows (Deep snarl creases between the eyes)
    const glabellaCentralGeo = new THREE.BoxGeometry(0.024, 0.070, 0.055);
    const glabellaCentral = new THREE.Mesh(glabellaCentralGeo, this.longclawWolfMaterial);
    glabellaCentral.position.set(0, -0.152, 0.144);
    glabellaCentral.rotation.x = 0.28;
    pommelGroup.add(glabellaCentral);

    const glabellaFlankGeo = new THREE.BoxGeometry(0.014, 0.055, 0.045);
    const glabellaFlankL = new THREE.Mesh(glabellaFlankGeo, this.longclawWolfMaterial);
    glabellaFlankL.position.set(-0.024, -0.155, 0.140);
    glabellaFlankL.rotation.set(0.26, 0.15, -0.18);
    pommelGroup.add(glabellaFlankL);

    const glabellaFlankR = new THREE.Mesh(glabellaFlankGeo, this.longclawWolfMaterial);
    glabellaFlankR.position.set(0.024, -0.155, 0.140);
    glabellaFlankR.rotation.set(0.26, -0.15, 0.18);
    pommelGroup.add(glabellaFlankR);

    // Heavy Hooded Carved Upper Eyelids
    const eyelidUpperGeo = new THREE.CylinderGeometry(0.040, 0.046, 0.024, 10, 1, false, 0, Math.PI);
    const eyelidUpperL = new THREE.Mesh(eyelidUpperGeo, this.longclawWolfMaterial);
    eyelidUpperL.position.set(-0.076, -0.160, 0.165);
    eyelidUpperL.rotation.set(0.32, 0.20, -0.15);
    pommelGroup.add(eyelidUpperL);

    const eyelidUpperR = new THREE.Mesh(eyelidUpperGeo, this.longclawWolfMaterial);
    eyelidUpperR.position.set(0.076, -0.160, 0.165);
    eyelidUpperR.rotation.set(0.32, -0.20, 0.15);
    pommelGroup.add(eyelidUpperR);

    // Carved Lower Eyelids
    const eyelidLowerGeo = new THREE.CylinderGeometry(0.038, 0.044, 0.020, 10, 1, false, Math.PI, Math.PI);
    const eyelidLowerL = new THREE.Mesh(eyelidLowerGeo, this.longclawWolfMaterial);
    eyelidLowerL.position.set(-0.076, -0.198, 0.162);
    eyelidLowerL.rotation.set(0.12, 0.20, -0.15);
    pommelGroup.add(eyelidLowerL);

    const eyelidLowerR = new THREE.Mesh(eyelidLowerGeo, this.longclawWolfMaterial);
    eyelidLowerR.position.set(0.076, -0.198, 0.162);
    eyelidLowerR.rotation.set(0.12, -0.20, 0.15);
    pommelGroup.add(eyelidLowerR);

    // Third Eyelid (Nictitating membrane in medial eye corners)
    const nictitateGeo = new THREE.ConeGeometry(0.012, 0.032, 3);
    const nictitateL = new THREE.Mesh(nictitateGeo, this.longclawWolfMaterial);
    nictitateL.position.set(-0.048, -0.178, 0.175);
    nictitateL.rotation.set(0.2, 0.3, -0.5);
    pommelGroup.add(nictitateL);

    const nictitateR = new THREE.Mesh(nictitateGeo, this.longclawWolfMaterial);
    nictitateR.position.set(0.048, -0.178, 0.175);
    nictitateR.rotation.set(0.2, -0.3, 0.5);
    pommelGroup.add(nictitateR);

    // Medial & Lateral Canthi (Tear duct and outer corner notches)
    const canthusGeo = new THREE.BoxGeometry(0.012, 0.016, 0.020);
    const canthusMedL = new THREE.Mesh(canthusGeo, temporalMat);
    canthusMedL.position.set(-0.046, -0.180, 0.172);
    pommelGroup.add(canthusMedL);

    const canthusMedR = new THREE.Mesh(canthusGeo, temporalMat);
    canthusMedR.position.set(0.046, -0.180, 0.172);
    pommelGroup.add(canthusMedR);

    const canthusLatL = new THREE.Mesh(canthusGeo, temporalMat);
    canthusLatL.position.set(-0.104, -0.178, 0.152);
    pommelGroup.add(canthusLatL);

    const canthusLatR = new THREE.Mesh(canthusGeo, temporalMat);
    canthusLatR.position.set(0.104, -0.178, 0.152);
    pommelGroup.add(canthusLatR);

    // Sunken Orbital Sockets (Deep shadowed chambers housing the rubies)
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x1a1212, roughness: 0.90 });
    const socketGeo = new THREE.BoxGeometry(0.108, 0.085, 0.065);
    const socketMeshL = new THREE.Mesh(socketGeo, socketMat);
    socketMeshL.position.set(-0.076, -0.18, 0.138);
    socketMeshL.rotation.set(0.15, 0.22, -0.12);
    pommelGroup.add(socketMeshL);

    const socketMeshR = new THREE.Mesh(socketGeo, socketMat);
    socketMeshR.position.set(0.076, -0.18, 0.138);
    socketMeshR.rotation.set(0.15, -0.22, 0.12);
    pommelGroup.add(socketMeshR);

    // 6 Periorbital Snarl Creases radiating from eye corners
    for (let pc = 0; pc < 3; pc++) {
      const pcGeo = new THREE.BoxGeometry(0.035, 0.007, 0.020);
      const pcL = new THREE.Mesh(pcGeo, this.longclawWolfMaterial);
      pcL.position.set(-0.108 - pc * 0.006, -0.165 - pc * 0.012, 0.135 - pc * 0.010);
      pcL.rotation.set(0.2, 0.25, -0.35 + pc * 0.15);
      pommelGroup.add(pcL);

      const pcR = new THREE.Mesh(pcGeo, this.longclawWolfMaterial);
      pcR.position.set(0.108 + pc * 0.006, -0.165 - pc * 0.012, 0.135 - pc * 0.010);
      pcR.rotation.set(0.2, -0.25, 0.35 - pc * 0.15);
      pommelGroup.add(pcR);
    }

    // =========================================================================
    // MODULE 5: GHOST'S RADIANT RUBY EYES, DUAL GLINTS & CORONAS (61 Items)
    // =========================================================================
    // Large Faceted Octahedral Crimson Rubies tilted towards the camera (+Z)
    const eyeGeo = new THREE.OctahedronGeometry(0.082, 0);

    // Left Ruby Eye (Gleaming large crimson gem)
    const eyeMeshL = new THREE.Mesh(eyeGeo, this.longclawRubyEyeMaterial);
    eyeMeshL.scale.set(1.05, 1.35, 1.05);
    eyeMeshL.position.set(-0.076, -0.18, 0.165);
    eyeMeshL.rotation.set(0.12, 0.25, -0.10);
    pommelGroup.add(eyeMeshL);

    // Right Ruby Eye (Gleaming large crimson gem)
    const eyeMeshR = new THREE.Mesh(eyeGeo, this.longclawRubyEyeMaterial);
    eyeMeshR.scale.set(1.05, 1.35, 1.05);
    eyeMeshR.position.set(0.076, -0.18, 0.165);
    eyeMeshR.rotation.set(0.12, -0.25, 0.10);
    pommelGroup.add(eyeMeshR);

    // Sclerotic Bone Rings framing each ruby gem
    const scleroticGeo = new THREE.TorusGeometry(0.046, 0.007, 6, 16);
    const scleroticL = new THREE.Mesh(scleroticGeo, this.longclawWolfMaterial);
    scleroticL.position.set(-0.076, -0.18, 0.165);
    scleroticL.rotation.set(0.12, 0.25, -0.10);
    pommelGroup.add(scleroticL);

    const scleroticR = new THREE.Mesh(scleroticGeo, this.longclawWolfMaterial);
    scleroticR.position.set(0.076, -0.18, 0.165);
    scleroticR.rotation.set(0.12, -0.25, 0.10);
    pommelGroup.add(scleroticR);

    // Primary Specular Pupil Diamond Glints
    const glintEyeGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const glintEyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const glintEyeL = new THREE.Mesh(glintEyeGeo, glintEyeMat);
    glintEyeL.position.set(-0.070, -0.168, 0.228);
    pommelGroup.add(glintEyeL);

    const glintEyeR = new THREE.Mesh(glintEyeGeo, glintEyeMat);
    glintEyeR.position.set(0.070, -0.168, 0.228);
    pommelGroup.add(glintEyeR);

    // Secondary Specular Glints
    const glintSecGeo = new THREE.SphereGeometry(0.011, 8, 8);
    const glintSecL = new THREE.Mesh(glintSecGeo, glintEyeMat);
    glintSecL.position.set(-0.082, -0.188, 0.222);
    pommelGroup.add(glintSecL);

    const glintSecR = new THREE.Mesh(glintSecGeo, glintEyeMat);
    glintSecR.position.set(0.082, -0.188, 0.222);
    pommelGroup.add(glintSecR);

    // Tertiary Prism Glints (micro-facets catching light)
    const glintTriGeo = new THREE.SphereGeometry(0.007, 6, 6);
    const glintTriL = new THREE.Mesh(glintTriGeo, glintEyeMat);
    glintTriL.position.set(-0.062, -0.192, 0.218);
    pommelGroup.add(glintTriL);

    const glintTriR = new THREE.Mesh(glintTriGeo, glintEyeMat);
    glintTriR.position.set(0.062, -0.192, 0.218);
    pommelGroup.add(glintTriR);

    // Soft Glowing Crimson Eye Coronas (Pulsing glowing auras around both rubies)
    const auraCanvas = document.createElement('canvas');
    auraCanvas.width = 128;
    auraCanvas.height = 128;
    const aCtx = auraCanvas.getContext('2d');
    const aGrad = aCtx.createRadialGradient(64, 64, 2, 64, 64, 62);
    aGrad.addColorStop(0, 'rgba(255, 60, 90, 0.95)');
    aGrad.addColorStop(0.28, 'rgba(255, 0, 45, 0.7)');
    aGrad.addColorStop(0.65, 'rgba(190, 0, 30, 0.25)');
    aGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    aCtx.fillStyle = aGrad;
    aCtx.fillRect(0, 0, 128, 128);
    const auraTex = new THREE.CanvasTexture(auraCanvas);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTex,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const auraGeo = new THREE.PlaneGeometry(0.26, 0.26);
    const auraL = new THREE.Mesh(auraGeo, auraMat);
    auraL.position.set(-0.076, -0.18, 0.21);
    pommelGroup.add(auraL);

    const auraR = new THREE.Mesh(auraGeo, auraMat);
    auraR.position.set(0.076, -0.18, 0.21);
    pommelGroup.add(auraR);
    this.eyeAuraMeshes = [auraL, auraR];

    // Dedicated Eye Shine Light embedded directly between Ghost's eyes
    const eyeShineLight = new THREE.PointLight(0xff002b, 5.5, 4.5);
    eyeShineLight.position.set(0, -0.18, 0.32);
    pommelGroup.add(eyeShineLight);
    this.gemLight = eyeShineLight;

    // --- SPRINKLING RED EMBERS / SPARKS SYSTEM (44 Floating magical particles) ---
    const sparkCanvas = document.createElement('canvas');
    sparkCanvas.width = 64;
    sparkCanvas.height = 64;
    const sCtx = sparkCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    sGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    sGrad.addColorStop(0.25, 'rgba(255, 50, 80, 0.95)');
    sGrad.addColorStop(0.65, 'rgba(220, 10, 35, 0.6)');
    sGrad.addColorStop(1, 'rgba(200, 0, 20, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 64, 64);
    const sparkTex = new THREE.CanvasTexture(sparkCanvas);
    const sparkMat = new THREE.MeshBasicMaterial({
      map: sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const sparkGeo = new THREE.PlaneGeometry(0.065, 0.065);

    this.rubySparksGroup = new THREE.Group();
    pommelGroup.add(this.rubySparksGroup);

    const sparkCount = 44;
    this.rubySparks = [];
    for (let s = 0; s < sparkCount; s++) {
      const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat.clone());
      const eyeSide = (s % 2 === 0) ? -0.076 : 0.076;
      sparkMesh.position.set(
        eyeSide + (Math.random() - 0.5) * 0.04,
        -0.18 + (Math.random() - 0.5) * 0.04,
        0.18 + Math.random() * 0.12
      );
      sparkMesh.userData = {
        eyeX: eyeSide,
        eyeY: -0.18,
        eyeZ: 0.18,
        vx: (Math.random() - 0.5) * 0.010 + (eyeSide > 0 ? 0.004 : -0.004),
        vy: (Math.random() - 0.35) * 0.010,
        vz: 0.008 + Math.random() * 0.015,
        life: Math.random(),
        maxLife: 0.7 + Math.random() * 0.7,
        baseScale: 0.7 + Math.random() * 0.9,
        rotSpeed: (Math.random() - 0.5) * 0.12
      };
      this.rubySparksGroup.add(sparkMesh);
      this.rubySparks.push(sparkMesh);
    }

    // Rear Ruby Eyes (For complete 360° Inspect Mode fidelity)
    const eyeRearL = new THREE.Mesh(eyeGeo, this.longclawRubyEyeMaterial);
    eyeRearL.scale.set(1.0, 1.3, 1.0);
    eyeRearL.position.set(-0.076, -0.18, -0.095);
    eyeRearL.rotation.set(-0.12, -0.25, -0.10);
    pommelGroup.add(eyeRearL);

    const eyeRearR = new THREE.Mesh(eyeGeo, this.longclawRubyEyeMaterial);
    eyeRearR.scale.set(1.0, 1.3, 1.0);
    eyeRearR.position.set(0.076, -0.18, -0.095);
    eyeRearR.rotation.set(-0.12, 0.25, 0.10);
    pommelGroup.add(eyeRearR);

    // Rear eye glints
    const glintRearL = new THREE.Mesh(glintEyeGeo, glintEyeMat);
    glintRearL.position.set(-0.070, -0.168, -0.155);
    pommelGroup.add(glintRearL);

    const glintRearR = new THREE.Mesh(glintEyeGeo, glintEyeMat);
    glintRearR.position.set(0.070, -0.168, -0.155);
    pommelGroup.add(glintRearR);

    // =========================================================================
    // MODULE 6: SNOUT, WHISKER FOLLICLES, SULCUS & BI-LOBED NOSE PAD (36 Meshes)
    // =========================================================================
    // Dorsal Snout Nasal Bridge
    const snoutBridgeGeo = new THREE.BoxGeometry(0.128, 0.085, 0.19);
    const snoutBridge = new THREE.Mesh(snoutBridgeGeo, this.longclawWolfMaterial);
    snoutBridge.position.set(0, -0.195, 0.14);
    snoutBridge.rotation.x = -0.06;
    pommelGroup.add(snoutBridge);

    // Lateral Maxilla Bone Flanks
    const muzzleFlankGeo = new THREE.BoxGeometry(0.035, 0.075, 0.16);
    const muzzleFlankL = new THREE.Mesh(muzzleFlankGeo, this.longclawWolfMaterial);
    muzzleFlankL.position.set(-0.058, -0.21, 0.155);
    muzzleFlankL.rotation.set(-0.06, 0.12, -0.12);
    pommelGroup.add(muzzleFlankL);

    const muzzleFlankR = new THREE.Mesh(muzzleFlankGeo, this.longclawWolfMaterial);
    muzzleFlankR.position.set(0.058, -0.21, 0.155);
    muzzleFlankR.rotation.set(-0.06, -0.12, 0.12);
    pommelGroup.add(muzzleFlankR);

    // 6 Transverse Snarl Wrinkles (Arched deep skin folds chiseled across the nose bridge)
    for (let f = 0; f < 6; f++) {
      const foldGeo = new THREE.TorusGeometry(0.066 - f * 0.005, 0.0075, 6, 16, Math.PI);
      const foldMesh = new THREE.Mesh(foldGeo, this.longclawWolfMaterial);
      foldMesh.position.set(0, -0.162 - f * 0.010, 0.110 + f * 0.028);
      foldMesh.rotation.x = Math.PI / 2 + 0.15;
      pommelGroup.add(foldMesh);
    }

    // Tapered Muzzle Apex
    const muzzleTipGeo = new THREE.CylinderGeometry(0.050, 0.090, 0.165, 10);
    const muzzleTip = new THREE.Mesh(muzzleTipGeo, this.longclawWolfMaterial);
    muzzleTip.position.set(0, -0.21, 0.195);
    muzzleTip.rotation.x = Math.PI / 2 - 0.10;
    pommelGroup.add(muzzleTip);

    // Swollen Whisker Pad Bulges (Left & Right)
    const whiskerPadGeo = new THREE.SphereGeometry(0.032, 8, 8);
    const whiskerPadL = new THREE.Mesh(whiskerPadGeo, this.longclawWolfMaterial);
    whiskerPadL.scale.set(1.3, 0.7, 1.4);
    whiskerPadL.position.set(-0.046, -0.222, 0.235);
    pommelGroup.add(whiskerPadL);

    const whiskerPadR = new THREE.Mesh(whiskerPadGeo, this.longclawWolfMaterial);
    whiskerPadR.scale.set(1.3, 0.7, 1.4);
    whiskerPadR.position.set(0.046, -0.222, 0.235);
    pommelGroup.add(whiskerPadR);

    // 16 Whisker Follicle Pores (8 on each pad arranged in orderly rows)
    const poreMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.95 });
    const poreGeo = new THREE.SphereGeometry(0.0035, 6, 6);
    for (let p = 0; p < 8; p++) {
      const row = Math.floor(p / 4);
      const col = p % 4;
      const px = 0.038 + col * 0.006;
      const py = -0.218 - row * 0.008;
      const pz = 0.225 + col * 0.007;

      const pL = new THREE.Mesh(poreGeo, poreMat);
      pL.position.set(-px, py, pz);
      pommelGroup.add(pL);

      const pR = new THREE.Mesh(poreGeo, poreMat);
      pR.position.set(px, py, pz);
      pommelGroup.add(pR);
    }

    // Bi-Lobed Black Basalt Wolf Nose Pad (Rhinarium with medial sulcus)
    const noseLobeGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const noseLobeL = new THREE.Mesh(noseLobeGeo, this.longclawNoseMaterial);
    noseLobeL.scale.set(1.1, 0.8, 1.2);
    noseLobeL.position.set(-0.015, -0.215, 0.260);
    pommelGroup.add(noseLobeL);

    const noseLobeR = new THREE.Mesh(noseLobeGeo, this.longclawNoseMaterial);
    noseLobeR.scale.set(1.1, 0.8, 1.2);
    noseLobeR.position.set(0.015, -0.215, 0.260);
    pommelGroup.add(noseLobeR);

    // Median Sulcus (Philtrum groove dividing the nose lobes)
    const sulcusGeo = new THREE.BoxGeometry(0.004, 0.032, 0.020);
    const sulcusMesh = new THREE.Mesh(sulcusGeo, this.longclawNoseMaterial);
    sulcusMesh.position.set(0, -0.218, 0.266);
    pommelGroup.add(sulcusMesh);

    // Alar Cartilage Nostril Wings & Deep Airway Apertures
    const nostrilGeo = new THREE.CylinderGeometry(0.007, 0.004, 0.020, 8);
    const nostrilL = new THREE.Mesh(nostrilGeo, socketMat);
    nostrilL.position.set(-0.014, -0.224, 0.274);
    nostrilL.rotation.set(0.5, 0.2, -0.2);
    pommelGroup.add(nostrilL);

    const nostrilR = new THREE.Mesh(nostrilGeo, socketMat);
    nostrilR.position.set(0.014, -0.224, 0.274);
    nostrilR.rotation.set(0.5, -0.2, 0.2);
    pommelGroup.add(nostrilR);

    // Philtrum descending to upper lip
    const philtrumGeo = new THREE.BoxGeometry(0.006, 0.025, 0.012);
    const philtrum = new THREE.Mesh(philtrumGeo, this.longclawWolfMaterial);
    philtrum.position.set(0, -0.230, 0.252);
    pommelGroup.add(philtrum);

    // Sensory Vibrissae Tuft accents
    const vibGeo = new THREE.ConeGeometry(0.004, 0.035, 3);
    const vibL = new THREE.Mesh(vibGeo, this.longclawWolfMaterial);
    vibL.position.set(-0.065, -0.225, 0.230);
    vibL.rotation.set(0.3, 0.2, -1.1);
    pommelGroup.add(vibL);

    const vibR = new THREE.Mesh(vibGeo, this.longclawWolfMaterial);
    vibR.position.set(0.065, -0.225, 0.230);
    vibR.rotation.set(0.3, -0.2, 1.1);
    pommelGroup.add(vibR);

    // =========================================================================
    // MODULE 7: VICIOUS SNARL, RETRACTED LIPS, GUMS & 32-TOOTH ARCADE (66 Meshes)
    // =========================================================================
    // Curled Upper Lip Flews (Labial margins drawn back in snarl)
    const lipFlewGeo = new THREE.TorusGeometry(0.042, 0.007, 6, 12, Math.PI * 0.7);
    const lipFlewL = new THREE.Mesh(lipFlewGeo, this.longclawMouthTissueMaterial);
    lipFlewL.position.set(-0.044, -0.224, 0.205);
    lipFlewL.rotation.set(0.3, 0.4, -0.2);
    pommelGroup.add(lipFlewL);

    const lipFlewR = new THREE.Mesh(lipFlewGeo, this.longclawMouthTissueMaterial);
    lipFlewR.position.set(0.044, -0.224, 0.205);
    lipFlewR.rotation.set(0.3, -0.4, 0.2);
    pommelGroup.add(lipFlewR);

    // 6 Juga Alveolaria (Tooth root bone bulges along maxilla)
    for (let ja = 0; ja < 3; ja++) {
      const jaGeo = new THREE.BoxGeometry(0.012, 0.030, 0.016);
      const jaL = new THREE.Mesh(jaGeo, this.longclawWolfMaterial);
      jaL.position.set(-0.022 - ja * 0.012, -0.218, 0.220 - ja * 0.010);
      jaL.rotation.set(0.2, 0.15, -0.10);
      pommelGroup.add(jaL);

      const jaR = new THREE.Mesh(jaGeo, this.longclawWolfMaterial);
      jaR.position.set(0.022 + ja * 0.012, -0.218, 0.220 - ja * 0.010);
      jaR.rotation.set(0.2, -0.15, 0.10);
      pommelGroup.add(jaR);
    }

    // Open Snarling Mouth Cavity (Dark recessed interior)
    const mouthCavityGeo = new THREE.BoxGeometry(0.096, 0.058, 0.098);
    const mouthCavity = new THREE.Mesh(mouthCavityGeo, this.longclawMouthTissueMaterial);
    mouthCavity.position.set(0, -0.240, 0.175);
    pommelGroup.add(mouthCavity);

    // Curved Wet Crimson Tongue with Central Lingual Groove
    const tongueGeo = new THREE.CylinderGeometry(0.032, 0.042, 0.082, 10);
    const tongueMesh = new THREE.Mesh(tongueGeo, this.longclawMouthTissueMaterial);
    tongueMesh.position.set(0, -0.252, 0.178);
    tongueMesh.rotation.x = 0.35;
    pommelGroup.add(tongueMesh);

    const tongueGrooveGeo = new THREE.BoxGeometry(0.005, 0.08, 0.012);
    const tongueGroove = new THREE.Mesh(tongueGrooveGeo, socketMat);
    tongueGroove.position.set(0, -0.250, 0.180);
    tongueGroove.rotation.x = 0.35;
    pommelGroup.add(tongueGroove);

    // Palatal Rugae (3 Transverse ridges across roof of mouth)
    for (let pr = 0; pr < 3; pr++) {
      const prGeo = new THREE.TorusGeometry(0.035 - pr * 0.004, 0.004, 4, 10, Math.PI);
      const prMesh = new THREE.Mesh(prGeo, this.longclawMouthTissueMaterial);
      prMesh.position.set(0, -0.226, 0.180 - pr * 0.018);
      prMesh.rotation.x = Math.PI / 2;
      pommelGroup.add(prMesh);
    }

    // Upper & Lower Gingival Gum Arches
    const gumUpperGeo = new THREE.TorusGeometry(0.046, 0.009, 6, 14, Math.PI);
    const gumUpper = new THREE.Mesh(gumUpperGeo, this.longclawMouthTissueMaterial);
    gumUpper.position.set(0, -0.230, 0.198);
    gumUpper.rotation.x = Math.PI / 2;
    pommelGroup.add(gumUpper);

    const gumLowerGeo = new THREE.TorusGeometry(0.042, 0.008, 6, 14, Math.PI);
    const gumLower = new THREE.Mesh(gumLowerGeo, this.longclawMouthTissueMaterial);
    gumLower.position.set(0, -0.256, 0.182);
    gumLower.rotation.x = -Math.PI / 2;
    pommelGroup.add(gumLower);

    // --- 4 SABER CANINES (Massive Curved Predatory Fangs with Razor Carinae) ---
    const fangUpperGeo = new THREE.ConeGeometry(0.016, 0.072, 8);
    const fangUpperL = new THREE.Mesh(fangUpperGeo, this.longclawFangMaterial);
    fangUpperL.position.set(-0.043, -0.238, 0.208);
    fangUpperL.rotation.set(0.22, 0, 0.09);
    pommelGroup.add(fangUpperL);

    const fangUpperR = new THREE.Mesh(fangUpperGeo, this.longclawFangMaterial);
    fangUpperR.position.set(0.043, -0.238, 0.208);
    fangUpperR.rotation.set(0.22, 0, -0.09);
    pommelGroup.add(fangUpperR);

    const fangLowerGeo = new THREE.ConeGeometry(0.014, 0.060, 8);
    const fangLowerL = new THREE.Mesh(fangLowerGeo, this.longclawFangMaterial);
    fangLowerL.position.set(-0.037, -0.258, 0.192);
    fangLowerL.rotation.set(Math.PI - 0.22, 0, -0.09);
    pommelGroup.add(fangLowerL);

    const fangLowerR = new THREE.Mesh(fangLowerGeo, this.longclawFangMaterial);
    fangLowerR.position.set(0.037, -0.258, 0.192);
    fangLowerR.rotation.set(Math.PI - 0.22, 0, 0.09);
    pommelGroup.add(fangLowerR);

    // Canine Basal Enamel Cingulum Collars
    const cingulumGeo = new THREE.TorusGeometry(0.015, 0.003, 4, 10);
    const cingUpL = new THREE.Mesh(cingulumGeo, this.longclawFangMaterial);
    cingUpL.position.set(-0.043, -0.228, 0.206);
    pommelGroup.add(cingUpL);

    const cingUpR = new THREE.Mesh(cingulumGeo, this.longclawFangMaterial);
    cingUpR.position.set(0.043, -0.228, 0.206);
    pommelGroup.add(cingUpR);

    const cingLowL = new THREE.Mesh(cingulumGeo, this.longclawFangMaterial);
    cingLowL.position.set(-0.037, -0.266, 0.190);
    pommelGroup.add(cingLowL);

    const cingLowR = new THREE.Mesh(cingulumGeo, this.longclawFangMaterial);
    cingLowR.position.set(0.037, -0.266, 0.190);
    pommelGroup.add(cingLowR);

    // --- 12 INCISORS (6 Upper, 6 Lower - Chiseled Ivory Crowns with Cusp Lobes) ---
    for (let u = 0; u < 6; u++) {
      const ix = -0.025 + u * 0.010;
      const incUpper = new THREE.Mesh(new THREE.BoxGeometry(0.0075, 0.018, 0.009), this.longclawFangMaterial);
      incUpper.position.set(ix, -0.228, 0.218 - Math.abs(ix) * 0.3);
      pommelGroup.add(incUpper);
    }
    for (let l = 0; l < 6; l++) {
      const ix = -0.022 + l * 0.0088;
      const incLower = new THREE.Mesh(new THREE.BoxGeometry(0.0070, 0.016, 0.008), this.longclawFangMaterial);
      incLower.position.set(ix, -0.252, 0.198 - Math.abs(ix) * 0.3);
      pommelGroup.add(incLower);
    }

    // --- 16 LATERAL PREMOLARS & MASSIVE CARNASSIAL SHEARS (8 Upper, 8 Lower) ---
    for (let p = 0; p < 4; p++) {
      const pz = 0.195 - p * 0.016;
      const ph = (p === 3) ? 0.026 : (0.022 - p * 0.002); // P4/M1 Carnassial is larger!
      const pw = (p === 3) ? 0.012 : 0.009;
      const pGeo = new THREE.ConeGeometry(pw, ph, 4);

      // Upper Left & Right Premolars / Carnassials
      const pUpL = new THREE.Mesh(pGeo, this.longclawFangMaterial);
      pUpL.position.set(-(0.044 + p * 0.003), -0.234, pz);
      pommelGroup.add(pUpL);

      const pUpR = new THREE.Mesh(pGeo, this.longclawFangMaterial);
      pUpR.position.set(0.044 + p * 0.003, -0.234, pz);
      pommelGroup.add(pUpR);

      // Lower Left & Right Premolars / Carnassials (pointing upward)
      const plGeo = new THREE.ConeGeometry(pw * 0.9, ph * 0.85, 4);
      const pLowL = new THREE.Mesh(plGeo, this.longclawFangMaterial);
      pLowL.position.set(-(0.039 + p * 0.003), -0.254, pz - 0.01);
      pLowL.rotation.x = Math.PI;
      pommelGroup.add(pLowL);

      const pLowR = new THREE.Mesh(plGeo, this.longclawFangMaterial);
      pLowR.position.set(0.039 + p * 0.003, -0.254, pz - 0.01);
      pLowR.rotation.x = Math.PI;
      pommelGroup.add(pLowR);
    }

    // 4 High-Gloss Saliva Droplet Glints caught on the fang tips
    const dropGeo = new THREE.SphereGeometry(0.005, 6, 6);
    const drop1 = new THREE.Mesh(dropGeo, this.longclawSalivaMaterial);
    drop1.position.set(-0.043, -0.272, 0.214);
    pommelGroup.add(drop1);

    const drop2 = new THREE.Mesh(dropGeo, this.longclawSalivaMaterial);
    drop2.position.set(0.043, -0.272, 0.214);
    pommelGroup.add(drop2);

    const drop3 = new THREE.Mesh(dropGeo, this.longclawSalivaMaterial);
    drop3.position.set(-0.037, -0.230, 0.188);
    pommelGroup.add(drop3);

    const drop4 = new THREE.Mesh(dropGeo, this.longclawSalivaMaterial);
    drop4.position.set(0.037, -0.230, 0.188);
    pommelGroup.add(drop4);

    // =========================================================================
    // MODULE 8: LOWER MANDIBLE, MASSETER BULGES & CLEFT CHIN (24 Meshes)
    // =========================================================================
    // Main Jaw Bone Box
    const jawGeo = new THREE.BoxGeometry(0.105, 0.075, 0.155);
    const jawMesh = new THREE.Mesh(jawGeo, this.longclawWolfMaterial);
    jawMesh.position.set(0, -0.268, 0.135);
    jawMesh.rotation.x = -0.12;
    pommelGroup.add(jawMesh);

    // Left & Right Masseter Muscle Bulges (Huge jaw closing muscle swellings)
    const masseterGeo = new THREE.SphereGeometry(0.038, 10, 8);
    const masseterL = new THREE.Mesh(masseterGeo, this.longclawWolfMaterial);
    masseterL.scale.set(0.8, 1.2, 1.4);
    masseterL.position.set(-0.088, -0.260, 0.085);
    masseterL.rotation.set(-0.15, 0.20, -0.15);
    pommelGroup.add(masseterL);

    const masseterR = new THREE.Mesh(masseterGeo, this.longclawWolfMaterial);
    masseterR.scale.set(0.8, 1.2, 1.4);
    masseterR.position.set(0.088, -0.260, 0.085);
    masseterR.rotation.set(-0.15, -0.20, 0.15);
    pommelGroup.add(masseterR);

    // Mandibular Angle Flanges (Posterior jaw corners)
    const mandAngleGeo = new THREE.BoxGeometry(0.025, 0.045, 0.055);
    const mandAngleL = new THREE.Mesh(mandAngleGeo, this.longclawWolfMaterial);
    mandAngleL.position.set(-0.095, -0.275, 0.045);
    mandAngleL.rotation.set(-0.2, 0.15, -0.2);
    pommelGroup.add(mandAngleL);

    const mandAngleR = new THREE.Mesh(mandAngleGeo, this.longclawWolfMaterial);
    mandAngleR.position.set(0.095, -0.275, 0.045);
    mandAngleR.rotation.set(-0.2, -0.15, 0.2);
    pommelGroup.add(mandAngleR);

    // Cleft Chin Protuberances (Dual chiseled mental tubercles)
    const chinGeo = new THREE.ConeGeometry(0.016, 0.045, 4);
    const chinMeshL = new THREE.Mesh(chinGeo, this.longclawWolfMaterial);
    chinMeshL.position.set(-0.012, -0.285, 0.178);
    chinMeshL.rotation.set(0.6, 0, -0.15);
    pommelGroup.add(chinMeshL);

    const chinMeshR = new THREE.Mesh(chinGeo, this.longclawWolfMaterial);
    chinMeshR.position.set(0.012, -0.285, 0.178);
    chinMeshR.rotation.set(0.6, 0, 0.15);
    pommelGroup.add(chinMeshR);

    // Mental Foramina (Left & right nerve holes in jaw)
    const foraminaGeo = new THREE.SphereGeometry(0.0035, 6, 6);
    const foramenL = new THREE.Mesh(foraminaGeo, socketMat);
    foramenL.position.set(-0.042, -0.268, 0.160);
    pommelGroup.add(foramenL);

    const foramenR = new THREE.Mesh(foraminaGeo, socketMat);
    foramenR.position.set(0.042, -0.268, 0.160);
    pommelGroup.add(foramenR);

    // Digastric Muscle Ridge under Throat
    const digastricGeo = new THREE.BoxGeometry(0.030, 0.08, 0.025);
    const digastric = new THREE.Mesh(digastricGeo, this.longclawWolfMaterial);
    digastric.position.set(0, -0.295, 0.10);
    digastric.rotation.x = -0.35;
    pommelGroup.add(digastric);

    // 8 Sub-Mandibular Fur Beard Tufts under the chin
    for (let m = 0; m < 8; m++) {
      const subTuftGeo = new THREE.ConeGeometry(0.018, 0.075, 4);
      const subTuft = new THREE.Mesh(subTuftGeo, this.longclawWolfMaterial);
      const mAngle = (m / 7 - 0.5) * 1.2;
      subTuft.position.set(Math.sin(mAngle) * 0.045, -0.292 - (m % 3) * 0.006, 0.10 + (m % 2) * 0.035);
      subTuft.rotation.set(-0.35, 0, mAngle * 0.6);
      pommelGroup.add(subTuft);
    }

    // 6 Sub-labial Snarl Furrows
    for (let sl = 0; sl < 3; sl++) {
      const slGeo = new THREE.BoxGeometry(0.020, 0.006, 0.012);
      const slL = new THREE.Mesh(slGeo, this.longclawWolfMaterial);
      slL.position.set(-0.025 - sl * 0.010, -0.264, 0.175 - sl * 0.012);
      slL.rotation.set(0.2, 0.1, -0.2);
      pommelGroup.add(slL);

      const slR = new THREE.Mesh(slGeo, this.longclawWolfMaterial);
      slR.position.set(0.025 + sl * 0.010, -0.264, 0.175 - sl * 0.012);
      slR.rotation.set(0.2, -0.1, 0.2);
      pommelGroup.add(slR);
    }

    // =========================================================================
    // MODULE 9: ALERT PRICKED EARS, PINNA FOLDS & INNER EAR FUR (26 Meshes)
    // =========================================================================
    // Alert Pricked Direwolf Ears (Atop the skull cranium)
    const earGeo = new THREE.ConeGeometry(0.054, 0.175, 4);
    const earL = new THREE.Mesh(earGeo, this.longclawWolfMaterial);
    earL.scale.set(0.68, 1.0, 0.38);
    earL.position.set(-0.098, -0.292, -0.015);
    earL.rotation.set(-0.15, -0.25, 0.38);
    pommelGroup.add(earL);

    const earR = new THREE.Mesh(earGeo, this.longclawWolfMaterial);
    earR.scale.set(0.68, 1.0, 0.38);
    earR.position.set(0.098, -0.292, -0.015);
    earR.rotation.set(-0.15, 0.25, -0.38);
    pommelGroup.add(earR);

    // Helical Outer Ear Rim Folds
    const earRimGeo = new THREE.TorusGeometry(0.048, 0.009, 6, 12, Math.PI * 0.8);
    const earRimL = new THREE.Mesh(earRimGeo, this.longclawWolfMaterial);
    earRimL.position.set(-0.118, -0.295, -0.010);
    earRimL.rotation.set(-0.15, -0.25, 0.38);
    pommelGroup.add(earRimL);

    const earRimR = new THREE.Mesh(earRimGeo, this.longclawWolfMaterial);
    earRimR.position.set(0.118, -0.295, -0.010);
    earRimR.rotation.set(-0.15, 0.25, -0.38);
    pommelGroup.add(earRimR);

    // Borda's Pouch (Marginal cutaneous pocket at outer ear base)
    const bordaGeo = new THREE.SphereGeometry(0.012, 6, 6);
    const bordaL = new THREE.Mesh(bordaGeo, this.longclawInnerEarMaterial);
    bordaL.position.set(-0.132, -0.260, -0.025);
    pommelGroup.add(bordaL);

    const bordaR = new THREE.Mesh(bordaGeo, this.longclawInnerEarMaterial);
    bordaR.position.set(0.132, -0.260, -0.025);
    pommelGroup.add(bordaR);

    // Tragus & Antitragus Cartilage Lobes
    const tragusGeo = new THREE.ConeGeometry(0.012, 0.035, 3);
    const tragusL = new THREE.Mesh(tragusGeo, this.longclawWolfMaterial);
    tragusL.position.set(-0.075, -0.262, 0.015);
    tragusL.rotation.set(0.2, -0.2, 0.4);
    pommelGroup.add(tragusL);

    const tragusR = new THREE.Mesh(tragusGeo, this.longclawWolfMaterial);
    tragusR.position.set(0.075, -0.262, 0.015);
    tragusR.rotation.set(0.2, 0.2, -0.4);
    pommelGroup.add(tragusR);

    const antiTragusL = new THREE.Mesh(tragusGeo, this.longclawWolfMaterial);
    antiTragusL.position.set(-0.115, -0.268, 0.005);
    antiTragusL.rotation.set(0.1, -0.3, 0.6);
    pommelGroup.add(antiTragusL);

    const antiTragusR = new THREE.Mesh(tragusGeo, this.longclawWolfMaterial);
    antiTragusR.position.set(0.115, -0.268, 0.005);
    antiTragusR.rotation.set(0.1, 0.3, -0.6);
    pommelGroup.add(antiTragusR);

    // Inner Ear Shading Cavities (Darkened concha)
    const innerEarGeo = new THREE.ConeGeometry(0.035, 0.125, 3);
    const innerEarL = new THREE.Mesh(innerEarGeo, this.longclawInnerEarMaterial);
    innerEarL.scale.set(0.6, 1.0, 0.3);
    innerEarL.position.set(-0.094, -0.286, 0.006);
    innerEarL.rotation.set(-0.10, -0.25, 0.38);
    pommelGroup.add(innerEarL);

    const innerEarR = new THREE.Mesh(innerEarGeo, this.longclawInnerEarMaterial);
    innerEarR.scale.set(0.6, 1.0, 0.3);
    innerEarR.position.set(0.094, -0.286, 0.006);
    innerEarR.rotation.set(-0.10, 0.25, -0.38);
    pommelGroup.add(innerEarR);

    // 8 Inner Ear Protective Fur Tufts (4 per ear across two depth tiers)
    for (let t = 0; t < 4; t++) {
      const tuftGeo = new THREE.ConeGeometry(0.009, 0.048, 3);
      const tuftL = new THREE.Mesh(tuftGeo, this.longclawWolfMaterial);
      tuftL.position.set(-0.090 + t * 0.005, -0.272 - t * 0.016, 0.010 + (t % 2) * 0.006);
      tuftL.rotation.set(0.12, -0.22, 0.28);
      pommelGroup.add(tuftL);

      const tuftR = new THREE.Mesh(tuftGeo, this.longclawWolfMaterial);
      tuftR.position.set(0.090 - t * 0.005, -0.272 - t * 0.016, 0.010 + (t % 2) * 0.006);
      tuftR.rotation.set(0.12, 0.22, -0.28);
      pommelGroup.add(tuftR);
    }

    // 6 Posterior Ear Fur Ridges radiating behind pinnae
    for (let pe = 0; pe < 3; pe++) {
      const peGeo = new THREE.BoxGeometry(0.018, 0.045, 0.010);
      const peL = new THREE.Mesh(peGeo, this.longclawWolfMaterial);
      peL.position.set(-0.095 - pe * 0.008, -0.280 - pe * 0.015, -0.035);
      peL.rotation.set(-0.35, -0.20, 0.30);
      pommelGroup.add(peL);

      const peR = new THREE.Mesh(peGeo, this.longclawWolfMaterial);
      peR.position.set(0.095 + pe * 0.008, -0.280 - pe * 0.015, -0.035);
      peR.rotation.set(-0.35, 0.20, -0.30);
      pommelGroup.add(peR);
    }

    // =========================================================================
    // MODULE 10: 40 MULTI-TIERED WINDSWEPT CHEEK RUFFS (SIDEBURNS) (40 Meshes)
    // =========================================================================
    // Ghost's iconic massive wolf cheek ruffs flaring outwards from jaw across 4 tiers
    const cheekSpikeA = new THREE.ConeGeometry(0.036, 0.13, 4);
    const cheekSpikeB = new THREE.ConeGeometry(0.042, 0.15, 4);
    const cheekSpikeC = new THREE.ConeGeometry(0.046, 0.16, 4);
    const cheekSpikeD = new THREE.ConeGeometry(0.038, 0.12, 4);

    for (const side of [-1, 1]) {
      // Tier A: 5 Upper Sub-Orbital Cheek Ruffs
      for (let k = 0; k < 5; k++) {
        const cMesh = new THREE.Mesh(cheekSpikeA, this.longclawWolfMaterial);
        cMesh.position.set(side * (0.122 + k * 0.007), -0.178 - k * 0.018, 0.06 - k * 0.016);
        cMesh.rotation.set(0.24 - k * 0.07, 0, side * (0.72 + k * 0.07));
        pommelGroup.add(cMesh);
      }
      // Tier B: 5 Mid-Zygomatic Flaring Spikes
      for (let k = 0; k < 5; k++) {
        const cMesh = new THREE.Mesh(cheekSpikeB, this.longclawWolfMaterial);
        cMesh.position.set(side * (0.135 + k * 0.008), -0.202 - k * 0.020, 0.08 - k * 0.014);
        cMesh.rotation.set(0.32 - k * 0.05, side * 0.14, side * (0.82 + k * 0.05));
        pommelGroup.add(cMesh);
      }
      // Tier C: 5 Lower Masseter Spikes
      for (let k = 0; k < 5; k++) {
        const cMesh = new THREE.Mesh(cheekSpikeC, this.longclawWolfMaterial);
        cMesh.position.set(side * (0.128 + k * 0.007), -0.230 - k * 0.018, 0.09 - k * 0.012);
        cMesh.rotation.set(0.38 - k * 0.04, side * 0.18, side * (0.75 + k * 0.04));
        pommelGroup.add(cMesh);
      }
      // Tier D: 5 Angular Jaw-Base Spikes
      for (let k = 0; k < 5; k++) {
        const cMesh = new THREE.Mesh(cheekSpikeD, this.longclawWolfMaterial);
        cMesh.position.set(side * (0.112 + k * 0.006), -0.258 - k * 0.016, 0.10 - k * 0.010);
        cMesh.rotation.set(0.42 - k * 0.04, side * 0.22, side * (0.62 + k * 0.04));
        pommelGroup.add(cMesh);
      }
    }

    // =========================================================================
    // MODULE 11: 16 DOUBLE-SPINE CASCADING DORSAL MANE FUR SPIKES (16 Meshes)
    // =========================================================================
    // Double-row of interlocking chiseled stone dorsal mane spikes cascading down the nape along the spine
    for (let c = 0; c < 8; c++) {
      const h = 0.088 + (7 - c) * 0.006;
      const r = 0.024 + (7 - c) * 0.0025;
      const crestGeo = new THREE.ConeGeometry(r, h, 4);

      // Left spine mane spike
      const crestL = new THREE.Mesh(crestGeo, this.longclawWolfMaterial);
      crestL.position.set(-0.016, -0.115 - c * 0.024, -0.075 - c * 0.014);
      crestL.rotation.set(-0.55 - c * 0.04, 0, 0.15);
      pommelGroup.add(crestL);

      // Right spine mane spike
      const crestR = new THREE.Mesh(crestGeo, this.longclawWolfMaterial);
      crestR.position.set(0.016, -0.115 - c * 0.024, -0.075 - c * 0.014);
      crestR.rotation.set(-0.55 - c * 0.04, 0, -0.15);
      pommelGroup.add(crestR);
    }

    this.gemMesh = eyeMeshL;

    this.swordGroup.add(pommelGroup);

    // Initial positioning in Hero stance: Majestic upright vertical guard in center
    this.swordGroup.position.set(0, -0.2, 0);
    this.swordGroup.rotation.set(0.05, 0, 0.02);
    this.swordGroup.scale.set(1.05, 1.05, 1.05);
    this.scene.add(this.swordGroup);
  }

  /**
   * Helper to compute responsive Iron Throne coordinates
   */
  getResponsiveThrone() {
    const width = window.innerWidth;
    let x, y, scale;
    if (width < 640) {
      x = 0;
      y = -3.28;
      scale = 0.72;
    } else if (width < 1024) {
      x = 1.35;
      y = -3.48;
      scale = 0.85;
    } else {
      x = 2.15;
      y = -3.68;
      scale = 0.98;
    }
    return { x, y, scale };
  }

  /**
   * Build the Authentic 3D Iron Throne Dais & Armature Shapes:
   * 100% Genuine 3D Geometry — Zero 2D plane image!
   * Procedural dark basalt stone steps, internal core, and ground shadow.
   */
  buildIronThrone() {
    this.throneGroup = new THREE.Group();

    // 1. Specialized Metallurgy Materials for Realistic Throne Construction
    this.daisMaterial = new THREE.MeshStandardMaterial({
      color: 0x14171d,
      roughness: 0.86,
      metalness: 0.22,
      bumpScale: 0.04
    });

    // 1. Original Conquered Swords Metallurgy (Dark forged battle-tested crucible iron and steel)
    // Dark Forged Crucible Iron (conquered swords: authentic iron specular)
    this.ironBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x222730,
      roughness: 0.64,
      metalness: 0.68,
      envMapIntensity: 0.40
    });

    // Subdued Antique Steel (contrasting blades: non-glaring satin battle steel)
    this.steelBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x36404e,
      roughness: 0.58,
      metalness: 0.74,
      envMapIntensity: 0.45
    });

    // Weathered Dark Crucible Iron (backrest spine: rough scorched iron)
    this.darkIronMaterial = new THREE.MeshStandardMaterial({
      color: 0x15181f,
      roughness: 0.78,
      metalness: 0.62,
      envMapIntensity: 0.25
    });

    // Dragonfire Scorched Steel (charred, oxidized surface from Balerion's flame)
    this.scorchedBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.82,
      metalness: 0.55,
      envMapIntensity: 0.20
    });

    // Heat-Tempered Steel (subtle iridescent blue/patina sheen from dragonforge)
    this.temperedBladeMaterial = new THREE.MeshStandardMaterial({
      color: 0x2e3848,
      roughness: 0.60,
      metalness: 0.75,
      envMapIntensity: 0.42
    });

    // Weathered Bronze Hilts (aged, tarnished matte bronze)
    this.bronzeHiltMaterial = new THREE.MeshStandardMaterial({
      color: 0x483a28,
      roughness: 0.72,
      metalness: 0.52,
      envMapIntensity: 0.30
    });

    // Forged Matte Black Iron Hilts
    this.ironHiltMaterial = new THREE.MeshStandardMaterial({
      color: 0x181b22,
      roughness: 0.76,
      metalness: 0.55,
      envMapIntensity: 0.25
    });

    // Weathered Antique Brass / Conquered Gold Hilts (tarnished ancient heirloom)
    this.throneGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0x6e5828,
      roughness: 0.68,
      metalness: 0.60,
      envMapIntensity: 0.35
    });

    // Safe fallback alias for theme switcher
    this.throneMat = this.daisMaterial;

    // 2. Grand Multi-Tiered Black Stone Podium (Dais)
    this.blackStonePodium = this.buildBlackStonePodium();
    this.throneGroup.add(this.blackStonePodium);

    // 3. Ergonomic Contoured Royal Leather Seat Cushion
    this.throneCushion = this.buildThroneCushion();
    this.throneGroup.add(this.throneCushion);

    // Initial position in world space: Throne hidden until scrollProgress >= 3.15
    const initPos = this.getResponsiveThrone();
    this.throneGroup.position.set(initPos.x, initPos.y, -0.05);
    this.throneGroup.scale.set(initPos.scale, initPos.scale, initPos.scale);
    this.throneGroup.visible = false;
    this.scene.add(this.throneGroup);
  }

  /**
   * Build the Monumental Multi-Tiered Black Stone Podium (Dais)
   * Deep black chiseled volcanic basalt stone with wide steps and approach stairs
   */
  buildBlackStonePodium() {
    const podiumGroup = new THREE.Group();

    // Authentic Chiseled Black Basalt Stone Material
    this.podiumMaterial = new THREE.MeshStandardMaterial({
      color: 0x0c0e13,
      roughness: 0.82,
      metalness: 0.24,
      bumpScale: 0.05
    });

    // 1. Bottom Stepped Plinth (Wide Foundation)
    const tier1Geo = new THREE.CylinderGeometry(2.35, 2.45, 0.24, 36);
    const tier1 = new THREE.Mesh(tier1Geo, this.podiumMaterial);
    tier1.position.set(0, -1.78, 0.15);
    tier1.receiveShadow = true;
    podiumGroup.add(tier1);

    // 2. Middle Stepped Level
    const tier2Geo = new THREE.CylinderGeometry(1.95, 2.05, 0.22, 36);
    const tier2 = new THREE.Mesh(tier2Geo, this.podiumMaterial);
    tier2.position.set(0, -1.56, 0.18);
    tier2.receiveShadow = true;
    podiumGroup.add(tier2);

    // 3. Upper Platform Step (Direct Throne Bed)
    const tier3Geo = new THREE.CylinderGeometry(1.60, 1.70, 0.20, 36);
    const tier3 = new THREE.Mesh(tier3Geo, this.podiumMaterial);
    tier3.position.set(0, -1.36, 0.20);
    tier3.receiveShadow = true;
    podiumGroup.add(tier3);

    // 4. Ceremonial Front Steps leading up the podium center
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.14, 0.40), this.podiumMaterial);
    step1.position.set(0, -1.70, 1.05);
    podiumGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.14, 0.36), this.podiumMaterial);
    step2.position.set(0, -1.50, 0.88);
    podiumGroup.add(step2);

    const step3 = new THREE.Mesh(new THREE.BoxGeometry(0.90, 0.14, 0.32), this.podiumMaterial);
    step3.position.set(0, -1.32, 0.72);
    podiumGroup.add(step3);

    // 5. Ambient Floor Shadow beneath podium
    const shadowGeo = new THREE.PlaneGeometry(5.4, 3.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 64, 5, 128, 64, 64);
    sGrad.addColorStop(0, 'rgba(0, 0, 0, 0.98)');
    sGrad.addColorStop(0.60, 'rgba(0, 0, 0, 0.50)');
    sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.90, 0.15);
    podiumGroup.add(shadowMesh);

    return podiumGroup;
  }

  /**
   * Build the Ergonomic Contoured Royal Leather Cushion for the sitting area
   */
  buildThroneCushion() {
    const cushionGroup = new THREE.Group();

    // Distressed Royal Leather Material
    this.cushionMaterial = new THREE.MeshStandardMaterial({
      color: 0x181412,
      roughness: 0.72,
      metalness: 0.12,
      bumpScale: 0.02
    });

    this.textureLoader.load('assets/textures/hilt_leather.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 2);
      tex.encoding = THREE.sRGBEncoding;
      this.cushionMaterial.map = tex;
      this.cushionMaterial.bumpMap = tex;
      this.cushionMaterial.needsUpdate = true;
    });

    // Sculpted seat pad with rounded waterfall edges
    const cushionGeo = new THREE.BoxGeometry(0.92, 0.14, 0.66, 8, 3, 8);
    const posAttr = cushionGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      const distFromCenter = Math.sqrt((x / 0.46) ** 2 + (z / 0.33) ** 2);
      if (y > 0) {
        posAttr.setY(i, y + Math.max(0, (1 - distFromCenter * 0.7) * 0.035));
      }
      if (z > 0.22) {
        const drop = (z - 0.22) / 0.11;
        posAttr.setY(i, posAttr.getY(i) - drop * drop * 0.04);
      }
    }
    cushionGeo.computeVertexNormals();

    const cushionMesh = new THREE.Mesh(cushionGeo, this.cushionMaterial);
    cushionMesh.position.set(0, -0.36, 0.25);
    cushionMesh.castShadow = true;
    cushionMesh.receiveShadow = true;
    cushionGroup.add(cushionMesh);

    // Decorative tufting button indents
    const buttonGeo = new THREE.SphereGeometry(0.022, 8, 8);
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0x0d0b09,
      roughness: 0.85,
      metalness: 0.2
    });

    const buttonPositions = [
      [-0.24, -0.28, 0.14],
      [ 0.00, -0.28, 0.14],
      [ 0.24, -0.28, 0.14],
      [-0.14, -0.28, 0.28],
      [ 0.14, -0.28, 0.28],
      [-0.24, -0.29, 0.40],
      [ 0.00, -0.29, 0.40],
      [ 0.24, -0.29, 0.40],
    ];

    buttonPositions.forEach(([bx, by, bz]) => {
      const btn = new THREE.Mesh(buttonGeo, buttonMat);
      btn.position.set(bx, by, bz);
      btn.scale.set(1, 0.45, 1);
      cushionGroup.add(btn);
    });

    return cushionGroup;
  }

  /**
   * Helper to create an authentic 3D sword mesh for the throne
   * Features diamond cross-section blade with cutting edges,
   * medieval crossguards, wire-wrapped grips, and solid pommels.
   */
  createThroneSwordMesh(bladeLength, bladeWidth, hasHilt, hiltType, bladeMatType, archetype = 'longsword') {
    const sword = new THREE.Group();

    // Select blade material
    let bMat = this.ironBladeMaterial;
    if (bladeMatType === 'steel') bMat = this.steelBladeMaterial;
    else if (bladeMatType === 'dark') bMat = this.darkIronMaterial;
    else if (bladeMatType === 'scorched') bMat = this.scorchedBladeMaterial || this.darkIronMaterial;
    else if (bladeMatType === 'tempered') bMat = this.temperedBladeMaterial || this.steelBladeMaterial;

    // 1. Diamond Cross-Section Blade with sharp cutting edges and central fuller ridge
    const bGeo = new THREE.CylinderGeometry(bladeWidth * 0.72, bladeWidth, bladeLength, 4, 1);
    bGeo.rotateY(Math.PI / 4);
    bGeo.scale(1, 1, 0.28);

    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(0, bladeLength * 0.5, 0);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    sword.add(bMesh);

    // 2. Tapered 4-Faceted Spear Point
    const tipLen = bladeLength * 0.18;
    const tipGeo = new THREE.ConeGeometry(bladeWidth * 0.72, tipLen, 4);
    tipGeo.rotateY(Math.PI / 4);
    tipGeo.scale(1, 1, 0.28);

    const tipMesh = new THREE.Mesh(tipGeo, bMat);
    tipMesh.position.set(0, bladeLength + tipLen * 0.5, 0);
    tipMesh.castShadow = true;
    tipMesh.receiveShadow = true;
    sword.add(tipMesh);

    // 3. Authentic Medieval Hilt Assembly
    if (hasHilt) {
      let hMat = this.ironHiltMaterial;
      if (hiltType === 'gold') hMat = this.throneGoldMaterial || this.bronzeHiltMaterial;
      else if (hiltType === 'bronze') hMat = this.bronzeHiltMaterial;

      // Crossguard
      const guardSpan = (archetype === 'greatsword' || archetype === 'claymore') ? bladeWidth * 6.2 : bladeWidth * 5.0;
      const gGeo = new THREE.BoxGeometry(guardSpan, 0.042, 0.046);
      const gMesh = new THREE.Mesh(gGeo, hMat);
      gMesh.position.set(0, 0, 0);
      gMesh.castShadow = true;
      gMesh.receiveShadow = true;

      // Down-turned or quilloned terminal tips
      if (archetype === 'claymore' || archetype === 'greatsword') {
        const qGeo = new THREE.SphereGeometry(0.026, 8, 8);
        const qLeft = new THREE.Mesh(qGeo, hMat);
        qLeft.position.set(-guardSpan * 0.5, 0, 0);
        gMesh.add(qLeft);
        const qRight = new THREE.Mesh(qGeo, hMat);
        qRight.position.set(guardSpan * 0.5, 0, 0);
        gMesh.add(qRight);
      }
      sword.add(gMesh);

      // Grip / Handle (contoured leather with wire bindings)
      const gripLen = archetype === 'greatsword' ? bladeLength * 0.26 : bladeLength * 0.22;
      const hGeo = new THREE.CylinderGeometry(0.022, 0.028, gripLen, 8);
      const hMesh = new THREE.Mesh(hGeo, this.cushionMaterial || this.darkIronMaterial);
      hMesh.position.set(0, -gripLen * 0.5, 0);
      hMesh.castShadow = true;
      sword.add(hMesh);

      // Wire binding rings on grip
      const ringGeo = new THREE.TorusGeometry(0.027, 0.005, 4, 12);
      for (let r = 1; r <= 3; r++) {
        const rMesh = new THREE.Mesh(ringGeo, hMat);
        rMesh.rotation.x = Math.PI / 2;
        rMesh.position.set(0, -gripLen * (r / 4), 0);
        sword.add(rMesh);
      }

      // Pommel (varied historical geometries: dodecahedron, disc, or sphere)
      let pGeo;
      if (archetype === 'greatsword') {
        pGeo = new THREE.DodecahedronGeometry(0.052);
      } else if (archetype === 'claymore') {
        pGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.026, 12);
        pGeo.rotateX(Math.PI / 2);
      } else {
        pGeo = new THREE.SphereGeometry(0.040, 10, 8);
      }
      const pMesh = new THREE.Mesh(pGeo, hMat);
      pMesh.position.set(0, -gripLen - 0.040, 0);
      pMesh.castShadow = true;
      sword.add(pMesh);
    }

    return sword;
  }

  /**
   * Mapped anatomical configuration for all 270 authentic swords on the Iron Throne.
   * Derived from geometric photogrammetric analysis of assets/images/iron_throne_chair.png.
   * Gap-free construction: radial crown with interstitial gap fillers, dense backrest weave,
   * elevated horizontal armrests with front hand grips and vertical corner posts,
   * contoured side wings and grounded aprons maintaining authentic throne physique,
   * and solid under-seat welded core with zero glitching or wild side protrusion.
   */
  getThroneSwordsLayout() {
    const layout = [];

    // --- 1. RADIAL CROWN FAN SPIKES — PRIMARY CREST (28 swords) ---
    // Iconic fanned crest spanning -56° to +56° around the upper throne crown
    for (let i = 0; i < 28; i++) {
      const t = i / 27.0;
      const angle = (t - 0.5) * 1.95;
      // Authentic asymmetry: taller towering spikes on center-left
      const heightBonus = (t >= 0.22 && t <= 0.48) ? 0.28 : (t >= 0.48 && t <= 0.72 ? 0.18 : 0);
      const radius = 1.22 + Math.sin(t * Math.PI) * 0.38 + heightBonus;
      const x = Math.sin(angle) * radius * 0.94;
      const y = 0.28 + Math.cos(angle) * radius * 0.96;
      const z = -0.18 - Math.abs(x) * 0.06;
      const bLen = 1.62 + Math.sin(t * Math.PI) * 0.65 + heightBonus * 0.8;
      const bWid = 0.062 + (i % 3) * 0.006;
      const bladeMat = (i % 4 === 1) ? 'steel' : ((i % 3 === 0) ? 'dark' : 'iron');
      const hiltMat = (i % 5 === 0) ? 'gold' : ((i % 2 === 0) ? 'bronze' : 'iron');
      const arch = (i % 6 === 0) ? 'greatsword' : ((i % 4 === 0) ? 'claymore' : 'longsword');

      layout.push({
        type: 'crown',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(
          -0.08 + (Math.sin(i * 1.7) * 0.05),
          angle * 0.20,
          -angle * 0.94 + (Math.sin(i * 3.1) * 0.04)
        ),
        bladeLength: bLen,
        bladeWidth: bWid,
        hasHilt: (i % 3 !== 0),
        hiltType: hiltMat,
        bladeMatType: bladeMat,
        archetype: arch,
        scale: 0.74 + (i % 3) * 0.05
      });
    }

    // --- 2. SECONDARY CROWN INTERWOVEN LAYER (14 swords) ---
    // Staggered cleanly behind the outer fan to eliminate silhouette gaps
    for (let i = 0; i < 14; i++) {
      const t = i / 13.0;
      const angle = (t - 0.5) * 1.75;
      const radius = 1.08 + Math.sin(t * Math.PI) * 0.34 + ((t >= 0.25 && t <= 0.55) ? 0.20 : 0);
      const x = Math.sin(angle) * radius * 0.92;
      const y = 0.26 + Math.cos(angle) * radius * 0.94;
      const z = -0.23 - Math.abs(x) * 0.05;
      const bLen = 1.55 + Math.sin(t * Math.PI) * 0.52;

      layout.push({
        type: 'crown_layer2',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(-0.06, angle * 0.18, -angle * 0.90),
        bladeLength: bLen,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 3 === 0) ? 'steel' : 'dark',
        archetype: (i % 3 === 0) ? 'claymore' : 'longsword',
        scale: 0.70
      });
    }

    // --- 3. CROWN INTERSTITIAL GAP FILLERS (26 swords) ---
    // Positioned directly between each pair of primary spikes to close all see-through slots
    for (let i = 0; i < 26; i++) {
      const t = (i + 0.5) / 27.0;
      const angle = (t - 0.5) * 1.95;
      const radius = 1.10 + Math.sin(t * Math.PI) * 0.32;
      const x = Math.sin(angle) * radius * 0.93;
      const y = 0.24 + Math.cos(angle) * radius * 0.95;
      const z = -0.14 - Math.abs(x) * 0.05;
      const bLen = 1.48 + Math.sin(t * Math.PI) * 0.45;

      layout.push({
        type: 'crown_gap_filler',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(-0.06, angle * 0.16, -angle * 0.92),
        bladeLength: bLen,
        bladeWidth: 0.060,
        hasHilt: true,
        hiltType: (i % 3 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'dark' : 'iron',
        archetype: 'longsword',
        scale: 0.70
      });
    }

    // --- 4. SIDE WINGS — BRIDGING ARMRESTS TO CROWN BASE (20 swords: 10 left, 10 right) ---
    // Restores the authentic upward-flaring throne silhouette, eliminating empty side gaps
    // Left side wing (10 swords)
    for (let i = 0; i < 10; i++) {
      const t = i / 9.0;
      const x = -0.58 - t * 0.18;
      const y = -0.08 + t * 0.42;
      const z = -0.06 - t * 0.08;
      layout.push({
        type: 'wing_l',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(0.10 + t * 0.05, -0.14 - t * 0.06, 0.32 - t * 0.14),
        bladeLength: 1.35 + t * 0.15,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i % 3 === 0) ? 'gold' : ((i % 2 === 0) ? 'bronze' : 'iron'),
        bladeMatType: (i % 2 === 0) ? 'steel' : 'iron',
        archetype: (i % 3 === 0) ? 'claymore' : 'longsword',
        scale: 0.66
      });
    }
    // Right side wing (10 swords)
    for (let i = 0; i < 10; i++) {
      const t = i / 9.0;
      const x = 0.58 + t * 0.18;
      const y = -0.08 + t * 0.42;
      const z = -0.06 - t * 0.08;
      layout.push({
        type: 'wing_r',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(0.10 + t * 0.05, 0.14 + t * 0.06, -0.32 + t * 0.14),
        bladeLength: 1.35 + t * 0.15,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i % 3 === 0) ? 'gold' : ((i % 2 === 0) ? 'bronze' : 'iron'),
        bladeMatType: (i % 2 === 0) ? 'steel' : 'iron',
        archetype: (i % 3 === 0) ? 'claymore' : 'longsword',
        scale: 0.66
      });
    }

    // --- 5. LOWER SIDE APRONS — GROUNDED FLANK SKIRTS ALONG PODIUM (20 swords: 10 left, 10 right) ---
    // Grounded along the basalt podium tiers, creating a formidable triangular throne physique without upward spikes
    // Left side apron (10 swords)
    for (let i = 0; i < 10; i++) {
      const t = i / 9.0;
      const x = -0.65 - t * 0.16;
      const y = -0.60 - t * 0.38;
      const z = 0.10 + t * 0.40;
      layout.push({
        type: 'apron_l',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(2.50 + (i % 3) * 0.10, -0.18, 0.22 - (i % 2) * 0.10),
        bladeLength: 1.20 + (i % 2) * 0.12,
        bladeWidth: 0.066,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 3 === 0) ? 'dark' : 'iron',
        archetype: 'greatsword',
        scale: 0.65
      });
    }
    // Right side apron (10 swords)
    for (let i = 0; i < 10; i++) {
      const t = i / 9.0;
      const x = 0.65 + t * 0.16;
      const y = -0.60 - t * 0.38;
      const z = 0.10 + t * 0.40;
      layout.push({
        type: 'apron_r',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(2.50 + (i % 3) * 0.10, 0.18, -0.22 + (i % 2) * 0.10),
        bladeLength: 1.20 + (i % 2) * 0.12,
        bladeWidth: 0.066,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 3 === 0) ? 'dark' : 'iron',
        archetype: 'greatsword',
        scale: 0.65
      });
    }

    // --- 6. INNER BACKREST SPINE & VERTICAL CORE (8 swords) ---
    // Fluting the central vertical channel in symmetrical left/right pairs
    for (let i = 0; i < 8; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const tier = Math.floor(i / 2);
      const x = side * (0.07 + tier * 0.09);
      const y = 0.12 + tier * 0.28;
      const z = -0.045 + tier * 0.008;
      layout.push({
        type: 'spine',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(0.04, side * 0.04, -side * 0.05),
        bladeLength: 1.80 + (i % 2) * 0.20,
        bladeWidth: 0.068,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: 'dark',
        archetype: 'greatsword',
        scale: 0.70
      });
    }

    // --- 7. BACKREST DIAGONAL CROSSED LATTICE & HERO CHEVRONS (12 swords) ---
    // Iconic embossed chevron relief with dedicated centerline anchor swords and stratified Z-overlap
    // 7a. Regal Central Upper Sceptre Sword (crowning the dead center of the backrest)
    layout.push({
      type: 'lattice',
      targetPos: new THREE.Vector3(0.00, 0.42, 0.038),
      targetRot: new THREE.Euler(0.02, 0.00, 0.00),
      bladeLength: 1.85,
      bladeWidth: 0.070,
      hasHilt: true,
      hiltType: 'gold',
      bladeMatType: 'steel',
      archetype: 'greatsword',
      scale: 0.72
    });
    // 7b. Regal Central Lower Anchor Sword (anchoring into the seat frame)
    layout.push({
      type: 'lattice',
      targetPos: new THREE.Vector3(0.00, 0.08, 0.035),
      targetRot: new THREE.Euler(0.03, 0.00, 0.00),
      bladeLength: 1.65,
      bladeWidth: 0.068,
      hasHilt: true,
      hiltType: 'bronze',
      bladeMatType: 'steel',
      archetype: 'longsword',
      scale: 0.68
    });
    // 7c. 10 Symmetrical Crossed Diagonal Swords (5 crossing pairs across the centerline)
    // Discrete Z-staggering (0.010 to 0.037) eliminates z-fighting and creates realistic drop shadows
    for (let i = 0; i < 10; i++) {
      const sign = (i % 2 === 0) ? 1 : -1;
      const tier = Math.floor(i / 2);
      const y = 0.14 + tier * 0.22;
      const x = sign * (0.04 + (tier % 2) * 0.06);
      const z = 0.010 + i * 0.003;
      layout.push({
        type: 'lattice',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(0.05, sign * 0.12, sign * (0.42 + (tier % 3) * 0.08)),
        bladeLength: 1.70,
        bladeWidth: 0.066,
        hasHilt: true,
        hiltType: (i % 3 === 0) ? 'gold' : ((i % 2 === 0) ? 'bronze' : 'iron'),
        bladeMatType: (i % 2 === 0) ? 'steel' : 'iron',
        archetype: (i % 2 === 0) ? 'claymore' : 'longsword',
        scale: 0.70
      });
    }

    // --- 8. BACKREST CROSS-WEAVE GAP FILLERS (14 swords) ---
    // Midground diagonal fill layer sealing light gaps between structural core and foreground lattice
    for (let i = 0; i < 14; i++) {
      const sign = (i % 2 === 0) ? 1 : -1;
      const y = 0.10 + (i * 0.08);
      const x = sign * (0.06 + (i % 4) * 0.09);
      const z = -0.080 + (i % 3) * 0.012;
      layout.push({
        type: 'back_gap_filler',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(0.05, sign * 0.15, sign * (0.38 + (i % 3) * 0.08)),
        bladeLength: 1.65,
        bladeWidth: 0.065,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'dark' : 'iron',
        archetype: 'longsword',
        scale: 0.68
      });
    }

    // --- 9. BACKREST CORE SLAB INFILL (16 swords) ---
    // Deep structural background wall of heavy crucible iron blades
    for (let i = 0; i < 16; i++) {
      const u = (i / 15.0 - 0.5) * 0.90;
      const y = 0.08 + (i % 4) * 0.26;
      const z = -0.13 - Math.abs(u) * 0.02;
      const rotZ = (i % 2 === 0 ? 1 : -1) * (0.04 + (i % 3) * 0.06);
      layout.push({
        type: 'core',
        targetPos: new THREE.Vector3(u, y, z),
        targetRot: new THREE.Euler(0.04 + (i % 3) * 0.02, (u > 0 ? -0.05 : 0.05), rotZ),
        bladeLength: 1.82 + (i % 3) * 0.22,
        bladeWidth: 0.072,
        hasHilt: (i % 2 === 0),
        hiltType: (i % 3 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'dark' : 'iron',
        archetype: 'greatsword',
        scale: 0.72
      });
    }

    // --- 10. LEFT ARMREST & HAND REST (10 swords) ---
    // Genuine horizontal armrest ledge elevated above cushion (Y = -0.13 vs cushion Y = -0.29)
    // with prominent medieval crossguards and pommels forming the iconic front hand grips
    // 6 horizontal armrest rail swords (flat along Z axis from rear backrest to front)
    for (let i = 0; i < 6; i++) {
      const z = -0.02 + i * 0.08;
      const x = -0.58 - (i * 0.005);
      const y = -0.13 - (i * 0.002);
      layout.push({
        type: 'arm_l',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(1.57 + (i * 0.008), -0.03, 0.02),
        bladeLength: 0.95,
        bladeWidth: 0.062,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'steel' : 'iron',
        archetype: 'longsword',
        scale: 0.62
      });
    }
    // 4 front hand rest grips (hilts and pommels at front edge, monarch hand grips)
    for (let i = 0; i < 4; i++) {
      const z = 0.50 + i * 0.015;
      const x = -0.57 - (i * 0.008);
      const y = -0.12 - (i * 0.004);
      layout.push({
        type: 'arm_l',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(-1.55 - (i * 0.02), 0.04, -0.02 + i * 0.015),
        bladeLength: 0.98,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i === 1 || i === 2) ? 'gold' : 'bronze',
        bladeMatType: 'steel',
        archetype: (i % 2 === 0) ? 'claymore' : 'greatsword',
        scale: 0.64
      });
    }

    // --- 11. RIGHT ARMREST & HAND REST (10 swords) ---
    // Symmetrical right armrest rail and front hand rest grips
    // 6 horizontal armrest rail swords
    for (let i = 0; i < 6; i++) {
      const z = -0.02 + i * 0.08;
      const x = 0.58 + (i * 0.005);
      const y = -0.13 - (i * 0.002);
      layout.push({
        type: 'arm_r',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(1.57 + (i * 0.008), 0.03, -0.02),
        bladeLength: 0.95,
        bladeWidth: 0.062,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'steel' : 'iron',
        archetype: 'longsword',
        scale: 0.62
      });
    }
    // 4 front hand rest grips
    for (let i = 0; i < 4; i++) {
      const z = 0.50 + i * 0.015;
      const x = 0.57 + (i * 0.008);
      const y = -0.12 - (i * 0.004);
      layout.push({
        type: 'arm_r',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(-1.55 - (i * 0.02), -0.04, 0.02 - i * 0.015),
        bladeLength: 0.98,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i === 1 || i === 2) ? 'gold' : 'bronze',
        bladeMatType: 'steel',
        archetype: (i % 2 === 0) ? 'claymore' : 'greatsword',
        scale: 0.64
      });
    }

    // --- 12. FRONT CORNER PILLARS & UNDER-ARM SIDE WALL PANELS (20 swords: 10 left, 10 right) ---
    // Left: 4 vertical front corner posts directly under hand rest + 6 dense diagonal under-arm side wall panels
    for (let i = 0; i < 4; i++) {
      const x = -0.56 - (i % 2) * 0.03;
      const y = -0.16 - (i * 0.02);
      const z = 0.50 + (Math.floor(i / 2) * 0.025);
      layout.push({
        type: 'under_arm_l',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(3.14, (i % 2 === 0 ? 0.03 : -0.03), (i % 2 === 0 ? -0.04 : 0.04)),
        bladeLength: 1.05 + i * 0.06,
        bladeWidth: 0.066,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: 'dark',
        archetype: 'greatsword',
        scale: 0.64
      });
    }
    for (let i = 0; i < 6; i++) {
      const t = i / 5.0;
      const z = 0.04 + t * 0.40;
      const x = -0.59 - (t * 0.05);
      const y = -0.26 - (t * 0.14);
      layout.push({
        type: 'under_arm_l',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(2.95 + (i % 3) * 0.08, -0.12, 0.18 - (i % 2) * 0.36),
        bladeLength: 1.00,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'steel' : 'dark',
        archetype: 'longsword',
        scale: 0.64
      });
    }
    // Right: 4 vertical front corner posts + 6 dense diagonal under-arm side wall panels
    for (let i = 0; i < 4; i++) {
      const x = 0.56 + (i % 2) * 0.03;
      const y = -0.16 - (i * 0.02);
      const z = 0.50 + (Math.floor(i / 2) * 0.025);
      layout.push({
        type: 'under_arm_r',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(3.14, (i % 2 === 0 ? -0.03 : 0.03), (i % 2 === 0 ? 0.04 : -0.04)),
        bladeLength: 1.05 + i * 0.06,
        bladeWidth: 0.066,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: 'dark',
        archetype: 'greatsword',
        scale: 0.64
      });
    }
    for (let i = 0; i < 6; i++) {
      const t = i / 5.0;
      const z = 0.04 + t * 0.40;
      const x = 0.59 + (t * 0.05);
      const y = -0.26 - (t * 0.14);
      layout.push({
        type: 'under_arm_r',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(2.95 + (i % 3) * 0.08, 0.12, -0.18 + (i % 2) * 0.36),
        bladeLength: 1.00,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i % 2 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'steel' : 'dark',
        archetype: 'longsword',
        scale: 0.64
      });
    }

    // --- 13. SEAT FLANKS & SIDE BOLSTERS (16 swords: 8 left, 8 right) ---
    // Snugly framing the cushion sides to eliminate any gaps between leather seat and armrest structure
    for (let i = 0; i < 8; i++) {
      const t = i / 7.0;
      const z = 0.02 + t * 0.46;
      const x = -0.49 - (i % 2) * 0.02;
      const y = -0.30 - (i % 2) * 0.03;
      layout.push({
        type: 'flank_l',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(1.52 + (i % 2) * 0.06, -0.08, 0.10 - (i % 2) * 0.05),
        bladeLength: 0.95,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i % 3 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'dark' : 'iron',
        archetype: 'longsword',
        scale: 0.62
      });
    }
    for (let i = 0; i < 8; i++) {
      const t = i / 7.0;
      const z = 0.02 + t * 0.46;
      const x = 0.49 + (i % 2) * 0.02;
      const y = -0.30 - (i % 2) * 0.03;
      layout.push({
        type: 'flank_r',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(1.52 + (i % 2) * 0.06, 0.08, -0.10 + (i % 2) * 0.05),
        bladeLength: 0.95,
        bladeWidth: 0.064,
        hasHilt: true,
        hiltType: (i % 3 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'dark' : 'iron',
        archetype: 'longsword',
        scale: 0.62
      });
    }

    // --- 14. SEAT BED SUPPORTS (8 swords) ---
    for (let i = 0; i < 8; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const idx = Math.floor(i / 2);
      const x = side * (0.14 + idx * 0.09);
      const z = 0.08 + idx * 0.08;
      layout.push({
        type: 'seat_bed',
        targetPos: new THREE.Vector3(x, -0.46, z),
        targetRot: new THREE.Euler(1.57, 0, side * (0.22 + idx * 0.08)),
        bladeLength: 1.12,
        bladeWidth: 0.068,
        hasHilt: (i % 2 === 0),
        hiltType: 'iron',
        bladeMatType: 'dark',
        archetype: 'longsword',
        scale: 0.65
      });
    }

    // --- 15. SOLID SEAT UNDER-CORE (24 swords across 3 clean tiers) ---
    for (let i = 0; i < 8; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const x = side * (0.14 + (Math.floor(i / 2) * 0.08));
      const z = 0.06 + (Math.floor(i / 2) * 0.10);
      layout.push({
        type: 'seat_tier1',
        targetPos: new THREE.Vector3(x, -0.54, z),
        targetRot: new THREE.Euler(1.57, 0, side * (0.32 + (i % 3) * 0.12)),
        bladeLength: 1.38,
        bladeWidth: 0.072,
        hasHilt: true,
        hiltType: 'iron',
        bladeMatType: 'dark',
        archetype: 'greatsword',
        scale: 0.68
      });
    }
    for (let i = 0; i < 8; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const x = side * (0.13 + (Math.floor(i / 2) * 0.08));
      const z = 0.08 + (Math.floor(i / 2) * 0.10);
      layout.push({
        type: 'seat_tier2',
        targetPos: new THREE.Vector3(x, -0.68, z),
        targetRot: new THREE.Euler(1.48, side * 0.16, side * (0.50 + (i % 3) * 0.10)),
        bladeLength: 1.42,
        bladeWidth: 0.074,
        hasHilt: true,
        hiltType: (i % 3 === 0) ? 'bronze' : 'iron',
        bladeMatType: 'iron',
        archetype: 'greatsword',
        scale: 0.70
      });
    }
    for (let i = 0; i < 8; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const x = side * (0.13 + (Math.floor(i / 2) * 0.08));
      const z = 0.10 + (Math.floor(i / 2) * 0.10);
      layout.push({
        type: 'seat_tier3',
        targetPos: new THREE.Vector3(x, -0.92, z),
        targetRot: new THREE.Euler(1.35, side * 0.20, side * (0.65 + (i % 3) * 0.12)),
        bladeLength: 1.50,
        bladeWidth: 0.076,
        hasHilt: (i % 2 === 0),
        hiltType: 'iron',
        bladeMatType: 'dark',
        archetype: 'greatsword',
        scale: 0.72
      });
    }

    // --- 16. FRONT SKIRT CASCADE (14 swords) ---
    // Features the iconic large diagonal crossed swords (Front X-Brace) directly below the seat
    // with 4 vertical center drape swords and 8 contoured apron flanks
    // 16a. Iconic Front Center X-Brace (2 swords) - Major centerpiece from HBO's Iron Throne
    // Crossbar 1: Bottom-Left to Top-Right
    layout.push({
      type: 'skirt',
      targetPos: new THREE.Vector3(-0.02, -0.62, 0.58),
      targetRot: new THREE.Euler(0.40, 0.12, 0.72),
      bladeLength: 1.70,
      bladeWidth: 0.072,
      hasHilt: true,
      hiltType: 'bronze',
      bladeMatType: 'steel',
      archetype: 'greatsword',
      scale: 0.72
    });
    // Crossbar 2: Bottom-Right to Top-Left (overlapping cleanly in front at Z = 0.61)
    layout.push({
      type: 'skirt',
      targetPos: new THREE.Vector3(0.02, -0.62, 0.61),
      targetRot: new THREE.Euler(0.40, -0.12, -0.72),
      bladeLength: 1.70,
      bladeWidth: 0.072,
      hasHilt: true,
      hiltType: 'gold',
      bladeMatType: 'steel',
      archetype: 'greatsword',
      scale: 0.72
    });
    // 16b. 4 Center Vertical Drape Swords directly under the cushion edge
    for (let i = 0; i < 4; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const tier = Math.floor(i / 2);
      const x = side * (0.06 + tier * 0.12);
      const y = -0.48 - tier * 0.12;
      const z = 0.54 + tier * 0.03;
      const rotZ = -side * (0.08 + tier * 0.06);
      layout.push({
        type: 'skirt',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(0.38 + tier * 0.05, side * 0.06, rotZ),
        bladeLength: 1.55,
        bladeWidth: 0.066,
        hasHilt: (i % 2 === 0),
        hiltType: (i === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'steel' : 'dark',
        archetype: 'longsword',
        scale: 0.68
      });
    }
    // 16c. 8 Skirt Flanks cascading to left and right
    for (let i = 0; i < 8; i++) {
      const side = (i % 2 === 0) ? -1 : 1;
      const idx = Math.floor(i / 2);
      const t = (idx + 1) / 4.0;
      const x = side * (0.24 + t * 0.28);
      const y = -0.52 - t * 0.26;
      const z = 0.48 + t * 0.14;
      const rotZ = side * (0.32 + (idx % 2) * 0.10);
      layout.push({
        type: 'skirt',
        targetPos: new THREE.Vector3(x, y, z),
        targetRot: new THREE.Euler(0.44 + (idx % 2) * 0.06, side * 0.15, rotZ),
        bladeLength: 1.55 + (idx % 2) * 0.15,
        bladeWidth: 0.066,
        hasHilt: (i % 2 === 0),
        hiltType: (i % 3 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'dark' : 'iron',
        archetype: 'longsword',
        scale: 0.68
      });
    }

    // --- 17. FRONT STAIRWAY CASCADE (16 swords) ---
    // Staggered down the 3 basalt steps in 4 clean depth tiers
    for (let i = 0; i < 16; i++) {
      const tier = Math.floor(i / 4);
      const slot = i % 4;
      const side = (slot % 2 === 0) ? -1 : 1;
      const slot_idx = Math.floor(slot / 2);
      const u = side * (0.08 + slot_idx * 0.22 + tier * 0.06);
      const y = -0.72 - tier * 0.12 - (slot % 2) * 0.04;
      const z = 0.56 + tier * 0.10 + (slot % 2) * 0.025;
      const rotZ = side * (0.24 + ((tier + slot) % 3) * 0.08);
      layout.push({
        type: 'cascade',
        targetPos: new THREE.Vector3(u, y, z),
        targetRot: new THREE.Euler(0.48 + tier * 0.04, side * 0.14, rotZ),
        bladeLength: 1.58 + (tier % 2) * 0.14,
        bladeWidth: 0.070,
        hasHilt: (i % 2 === 0),
        hiltType: (i % 3 === 0) ? 'bronze' : 'iron',
        bladeMatType: (i % 2 === 0) ? 'dark' : 'iron',
        archetype: 'longsword',
        scale: 0.70
      });
    }

    return layout;
  }

  /**
   * Build the array of 270 mapped forged swords that fly in along 3D parabolic trajectories
   * and assemble to form the genuine, gapless 3D Iron Throne.
   */
  buildConvergingSwords() {
    this.convergingSwordsGroup = new THREE.Group();
    this.convergingSwords = [];
    const layout = this.getThroneSwordsLayout();
    const count = layout.length;

    for (let i = 0; i < count; i++) {
      const item = layout[i];
      const sword = this.createThroneSwordMesh(
        item.bladeLength,
        item.bladeWidth,
        item.hasHilt,
        item.hiltType,
        item.bladeMatType,
        item.archetype || 'longsword'
      );

      // Start position: Scattered outward along 3D perimeter outside the visible screen
      const angle = (i / count) * Math.PI * 2 + (Math.sin(i * 2.3) * 0.4);
      const dist = 5.2 + (i % 5) * 0.65;
      const startX = Math.cos(angle) * dist;
      const startY = Math.sin(angle) * dist * 0.85;
      const startZ = ((i % 7) - 3) * 0.65;

      // Parabolic flight arc parameters for dynamic curving flight
      const arcHeight = 0.75 + (i % 4) * 0.35;
      const arcDirX = -Math.sin(angle) * 0.55;
      const arcDirZ = Math.cos(angle) * 0.55;

      sword.userData = {
        startPos: new THREE.Vector3(startX, startY, startZ),
        targetPos: item.targetPos.clone(),
        startRot: new THREE.Euler(
          (Math.sin(i * 1.5) * Math.PI * 2),
          (Math.cos(i * 2.1) * Math.PI * 2),
          (Math.sin(i * 3.7) * Math.PI * 2)
        ),
        targetRot: item.targetRot.clone(),
        arcHeight: arcHeight,
        arcDirX: arcDirX,
        arcDirZ: arcDirZ,
        arrivalOffset: (i / count) * 0.36
      };

      sword.position.copy(sword.userData.startPos);
      sword.rotation.copy(sword.userData.startRot);
      const s = item.scale || 0.65;
      sword.scale.set(s, s, s);

      this.convergingSwordsGroup.add(sword);
      this.convergingSwords.push(sword);
    }

    // Add converging swords directly as children of throneGroup!
    // Ensures parallax, scaling, and responsive placement remain 100% unified!
    this.throneGroup.add(this.convergingSwordsGroup);
  }

  /**
   * Update position and rotation of the converging swords along 3D parabolic flight arcs
   */
  updateConvergingSwords(t) {
    if (!this.convergingSwords) return;
    const count = this.convergingSwords.length;

    for (let i = 0; i < count; i++) {
      const sword = this.convergingSwords[i];
      const offset = sword.userData.arrivalOffset;
      const progress = Math.max(0, Math.min(1.0, (t - offset) / (1.0 - offset + 0.001)));
      const ease = progress * progress * (3 - 2 * progress);

      if (progress >= 1.0) {
        // Locked solidly in throne formation
        sword.position.copy(sword.userData.targetPos);
        sword.rotation.copy(sword.userData.targetRot);
      } else {
        // 3D Parabolic curved flight arc
        const arc = Math.sin(ease * Math.PI) * sword.userData.arcHeight;
        sword.position.x = THREE.MathUtils.lerp(sword.userData.startPos.x, sword.userData.targetPos.x, ease) + sword.userData.arcDirX * arc;
        sword.position.y = THREE.MathUtils.lerp(sword.userData.startPos.y, sword.userData.targetPos.y, ease) + arc;
        sword.position.z = THREE.MathUtils.lerp(sword.userData.startPos.z, sword.userData.targetPos.z, ease) + sword.userData.arcDirZ * arc;

        sword.rotation.x = THREE.MathUtils.lerp(sword.userData.startRot.x, sword.userData.targetRot.x, ease);
        sword.rotation.y = THREE.MathUtils.lerp(sword.userData.startRot.y, sword.userData.targetRot.y, ease);
        sword.rotation.z = THREE.MathUtils.lerp(sword.userData.startRot.z, sword.userData.targetRot.z, ease);
      }
    }
  }

  /**
   * Setup Volcanic Forge Smoke particle system billowing from the dais during assembly
   */
  setupForgeSmoke() {
    this.smokeGroup = new THREE.Group();
    const count = 42;
    const smokeGeo = new THREE.PlaneGeometry(1.6, 1.6);

    // Procedural soft smoke puff texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
    grad.addColorStop(0, 'rgba(230, 235, 245, 0.85)');
    grad.addColorStop(0.35, 'rgba(180, 195, 215, 0.45)');
    grad.addColorStop(0.70, 'rgba(120, 135, 155, 0.15)');
    grad.addColorStop(1.0, 'rgba(30, 35, 45, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const smokeTex = new THREE.CanvasTexture(canvas);
    this.smokeMat = new THREE.MeshBasicMaterial({
      map: smokeTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.smokeParticles = [];
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(smokeGeo, this.smokeMat);
      const rad = 0.5 + Math.random() * 1.3;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * rad;
      const y = 0.4 + Math.random() * 1.8;
      const z = Math.sin(angle) * rad * 0.7 + 0.15;
      mesh.position.set(x, y, z);
      const s = 0.65 + Math.random() * 0.85;
      mesh.scale.set(s, s, s);
      mesh.rotation.z = Math.random() * Math.PI * 2;

      mesh.userData = {
        baseY: 0.4,
        maxY: 2.2 + Math.random() * 0.6,
        speedY: 0.008 + Math.random() * 0.014,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        driftX: (Math.random() - 0.5) * 0.006,
        driftZ: (Math.random() - 0.5) * 0.006
      };

      this.smokeGroup.add(mesh);
      this.smokeParticles.push(mesh);
    }

    this.smokeGroup.visible = false;
    this.throneGroup.add(this.smokeGroup);
  }

  /**
   * Setup Specular Light Sweep Shine traversing across the razor-sharp throne blades
   */
  setupThroneShine() {
    this.throneShineLight = new THREE.SpotLight(0xe8f4ff, 0, 8, Math.PI * 0.35, 0.45, 1.2);
    this.throneShineLight.position.set(-2.5, 1.4, 2.2);
    this.throneGroup.add(this.throneShineLight);
    this.throneShineLight.target = this.throneGroup;
  }

  /**
   * Setup Symmetrical Master Sword Docking to the Iron Throne Center:
   * Replaces violent piercing with majestic royal docking into the backrest crown.
   * Includes crowning docking gleam point light and specular flare.
   */
  setupThroneDocking() {
    // Docking gleam light situated at the crowning juncture of the backrest crown
    this.dockingGleamLight = new THREE.PointLight(0x93c5fd, 0, 5.0, 1.8);
    this.dockingGleamLight.position.set(0, 1.15, -0.05);
    this.throneGroup.add(this.dockingGleamLight);
  }

  /**
   * Realm Theme Switcher for all 3 Realms:
   * 1. Winterfell (Ancient Granite & Sapphire Ice)
   * 2. King's Landing (The Red Keep & Imperial Lion Gold)
   * 3. Dragonstone (Volcanic Sea Fortress & Dragon Fire)
   */
  setRealm(realm) {
    this.realm = realm;
    if (realm === 'thewall') {
      this.keyLight.color.setHex(0xffffff);
      this.rimLight.color.setHex(0xe0f2fe);
      this.torchLight.color.setHex(0x38bdf8);
      this.gemLight.color.setHex(0xbae6fd);
      this.gemMaterial.color.setHex(0xffffff);
      this.gemMaterial.emissive.setHex(0x38bdf8);
      this.runeMaterial.color.setHex(0xffffff);
      this.ambientLight.color.setHex(0x182436);
      if (this.gleamLight) this.gleamLight.color.setHex(0xffffff);
      if (this.throneMat) this.throneMat.color.setHex(0xffffff);
    } else if (realm === 'kingslanding') {
      this.keyLight.color.setHex(0xfff1cf);
      this.rimLight.color.setHex(0xf59e0b);
      this.torchLight.color.setHex(0xd97706);
      this.gemLight.color.setHex(0xf59e0b);
      this.gemMaterial.color.setHex(0xef233c);
      this.gemMaterial.emissive.setHex(0xb45309);
      this.runeMaterial.color.setHex(0xfcd34d);
      this.ambientLight.color.setHex(0x3e3220);
      if (this.gleamLight) this.gleamLight.color.setHex(0xfffbeb);
      if (this.throneMat) this.throneMat.color.setHex(0xfef3c7);
    } else if (realm === 'dragonstone' || realm === 'fire') {
      this.keyLight.color.setHex(0xff7a45);
      this.rimLight.color.setHex(0xef4444);
      this.torchLight.color.setHex(0xf97316);
      this.gemLight.color.setHex(0xdc2626);
      this.gemMaterial.color.setHex(0xef4444);
      this.gemMaterial.emissive.setHex(0x991b1b);
      this.runeMaterial.color.setHex(0xff5722);
      this.ambientLight.color.setHex(0x381e18);
      if (this.gleamLight) this.gleamLight.color.setHex(0xffedd5);
      if (this.throneMat) this.throneMat.color.setHex(0xffedd5);
    } else if (realm === 'castleblack') {
      this.keyLight.color.setHex(0xf8fafc);
      this.rimLight.color.setHex(0x94a3b8);
      this.torchLight.color.setHex(0x64748b);
      this.gemLight.color.setHex(0xef233c);
      this.gemMaterial.color.setHex(0xef233c);
      this.gemMaterial.emissive.setHex(0x990000);
      this.runeMaterial.color.setHex(0xe2e8f0);
      this.ambientLight.color.setHex(0x181a20);
      if (this.gleamLight) this.gleamLight.color.setHex(0xffffff);
      if (this.throneMat) this.throneMat.color.setHex(0xd1d5db);
    } else {
      this.keyLight.color.setHex(0xd9ecff);
      this.rimLight.color.setHex(0x7dd3fc);
      this.torchLight.color.setHex(0xffb766);
      this.gemLight.color.setHex(0xef233c);
      this.gemMaterial.color.setHex(0xef233c);
      this.gemMaterial.emissive.setHex(0x990000);
      this.runeMaterial.color.setHex(0x5eead4);
      this.ambientLight.color.setHex(0x3e5066);
      if (this.gleamLight) this.gleamLight.color.setHex(0xffffff);
      if (this.throneMat) this.throneMat.color.setHex(0xe0f2fe);
    }
  }

  /**
   * Helper to compute responsive stance position
   */
  getResponsiveStance(stance, index) {
    const width = window.innerWidth;
    const pos = { ...stance.pos };
    const rot = { ...stance.rot };
    let scale = stance.scale;

    // Stance 0 (Hero) - Responsive positioning: Pointing down on the right
    if (index === 0) {
      if (width < 640) {
        pos.x = 0;
        pos.y = 0.55;
        scale = 0.82;
      } else if (width < 1024) {
        pos.x = 1.35;
        pos.y = 0.70;
        scale = 0.95;
      } else {
        pos.x = 2.15;
        pos.y = 0.85;
        scale = 1.05;
      }
      rot.x = 0.05;
      rot.y = 0;
      rot.z = Math.PI; // Blade points down in starting hero section
    }

    // Stance 4 (Contact) - Symmetrical Master Sword Docking at Iron Throne Crown
    if (index === 4) {
      const thronePos = this.getResponsiveThrone();
      pos.x = thronePos.x;
      pos.y = thronePos.y + 1.05 * thronePos.scale;
      pos.z = -0.10 * thronePos.scale;
      scale = 0.34 * thronePos.scale;
      rot.x = -0.05;
      rot.y = 0;
      rot.z = 0; // Blade points UP, crowning symmetrically at the throne center
    }

    return { pos, rot, scale };
  }

  /**
   * Set scroll progress from external page scroll
   */
  setScrollProgress(progress) {
    if (this.isInspectMode) return;
    this.scrollProgress = Math.max(0, Math.min(progress, 4.0));

    // Determine current and next stances
    const baseIndex = Math.floor(this.scrollProgress);
    const nextIndex = Math.min(baseIndex + 1, this.stances.length - 1);
    const factor = this.scrollProgress - baseIndex;

    const from = this.getResponsiveStance(this.stances[baseIndex], baseIndex);
    const to = this.getResponsiveStance(this.stances[nextIndex], nextIndex);

    // Smooth cubic easing between stances
    const ease = factor < 0.5 
      ? 2 * factor * factor 
      : 1 - Math.pow(-2 * factor + 2, 2) / 2;

    this.currentTransform.pos.x = from.pos.x + (to.pos.x - from.pos.x) * ease;
    this.currentTransform.pos.y = from.pos.y + (to.pos.y - from.pos.y) * ease;
    this.currentTransform.pos.z = from.pos.z + (to.pos.z - from.pos.z) * ease;

    this.currentTransform.rot.x = from.rot.x + (to.rot.x - from.rot.x) * ease;
    this.currentTransform.rot.y = from.rot.y + (to.rot.y - from.rot.y) * ease;
    this.currentTransform.rot.z = from.rot.z + (to.rot.z - from.rot.z) * ease;

    this.currentTransform.scale = from.scale + (to.scale - from.scale) * ease;

    // --- THRONE EMERGENCE & SWORD-CONVERGENCE ASSEMBLY (ONLY AT VERY END: progress >= 3.15) ---
    const thronePos = this.getResponsiveThrone();
    if (this.throneGroup) {
      this.throneGroup.position.set(thronePos.x, thronePos.y, -0.05);
      this.throneGroup.scale.set(thronePos.scale, thronePos.scale, thronePos.scale);
    }

    if (this.scrollProgress < 3.15) {
      // Hidden across Hero, About, Skills, and Projects
      if (this.throneGroup) this.throneGroup.visible = false;
      if (this.convergingSwordsGroup) this.convergingSwordsGroup.visible = false;
      if (this.smokeGroup) this.smokeGroup.visible = false;
      if (this.dockingGleamLight) this.dockingGleamLight.intensity = 0;
      if (this.throneShineLight) this.throneShineLight.intensity = 0;
      this.convergedClangPlayed = false;
      this.midClangPlayed = false;
      this.dockingClangPlayed = false;
    } else if (this.scrollProgress >= 3.15 && this.scrollProgress < 3.82) {
      // 1. Swords fly along 3D parabolic trajectories, smoke billows up, shine sweeps across!
      const t = Math.min(1.0, (this.scrollProgress - 3.15) / 0.67);
      if (this.throneGroup) this.throneGroup.visible = true;
      if (this.convergingSwordsGroup) {
        this.convergingSwordsGroup.visible = true;
        this.updateConvergingSwords(t);
      }

      // Volcanic forge smoke billows from the dais base
      if (this.smokeGroup) {
        this.smokeGroup.visible = true;
        if (this.smokeMat) {
          const smokeAlpha = t < 0.35 ? (t / 0.35) * 0.65 : (1.0 - (t - 0.35) / 0.65) * 0.45 + 0.20;
          this.smokeMat.opacity = smokeAlpha;
        }
      }

      // Specular shine sweep across the blades as they near final assembly (t: 0.65 -> 1.0)
      if (this.throneShineLight) {
        if (t >= 0.65) {
          const sT = (t - 0.65) / 0.35;
          this.throneShineLight.position.x = -2.8 + sT * 5.6;
          this.throneShineLight.intensity = Math.sin(sT * Math.PI) * 1.2;
        } else {
          this.throneShineLight.intensity = 0;
        }
      }

      // Metallic iron clang milestones
      if (t >= 0.45 && !this.midClangPlayed) {
        this.midClangPlayed = true;
        if (window.dragonAudio) {
          window.dragonAudio.playSwordWhoosh();
          window.dragonAudio.playIronClang(310);
        }
      }
      if (t >= 0.88 && !this.convergedClangPlayed) {
        this.convergedClangPlayed = true;
        if (window.dragonAudio) {
          window.dragonAudio.playIronClang(380);
          window.dragonAudio.playIronClang(520);
        }
      }

      if (this.dockingGleamLight) this.dockingGleamLight.intensity = 0;
    } else {
      // 2. 3D Throne is 100% Assembled & Solidly Visible (progress >= 3.82)
      if (this.throneGroup) this.throneGroup.visible = true;
      if (this.convergingSwordsGroup) {
        this.convergingSwordsGroup.visible = true;
        this.updateConvergingSwords(1.0); // Permanently locked in throne formation
      }
      if (this.smokeGroup) {
        this.smokeGroup.visible = true;
        if (this.smokeMat) this.smokeMat.opacity = 0.12; // gentle resting wisps
      }
      if (this.throneShineLight) this.throneShineLight.intensity = 0;

      // 3. Valyrian Steel Master Sword docks symmetrically into the center of the throne backrest
      if (this.scrollProgress >= 3.84) {
        const dockT = Math.min(1.0, (this.scrollProgress - 3.84) / 0.16);

        // Crowning docking gleam light
        if (this.dockingGleamLight) {
          this.dockingGleamLight.intensity = 0.8 + dockT * 0.6;
        }

        // Audio: Crisp metallic lock resonance when fully docked into the throne spine
        if (dockT >= 0.65 && !this.dockingClangPlayed) {
          this.dockingClangPlayed = true;
          if (window.dragonAudio) {
            window.dragonAudio.playSwordWhoosh();
            window.dragonAudio.playIronClang(480);
          }
        }
      } else {
        if (this.dockingGleamLight) this.dockingGleamLight.intensity = 0;
      }
    }
  }

  /**
   * Toggle 3D Inspection Mode
   */
  toggleInspectMode(enable) {
    this.isInspectMode = enable !== undefined ? enable : !this.isInspectMode;
    if (this.isInspectMode) {
      if (this.throneGroup) this.throneGroup.visible = false;
      this.inspectRotation.x = this.swordGroup.rotation.x;
      this.inspectRotation.y = this.swordGroup.rotation.y;
    } else {
      this.setScrollProgress(this.scrollProgress);
    }
    return this.isInspectMode;
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      const width = this.container.clientWidth || window.innerWidth;
      const height = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.setScrollProgress(this.scrollProgress);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (this.isInspectMode && this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.inspectRotation.y += deltaX * 0.012;
        this.inspectRotation.x += deltaY * 0.012;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    this.container.addEventListener('mousedown', (e) => {
      if (!this.isInspectMode) return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.container.addEventListener('touchstart', (e) => {
      if (!this.isInspectMode || !e.touches[0]) return;
      this.isDragging = true;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!this.isInspectMode || !this.isDragging || !e.touches[0]) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;
      this.inspectRotation.y += deltaX * 0.015;
      this.inspectRotation.x += deltaY * 0.015;
      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    // Smooth mouse lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.06;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.06;

    if (this.swordGroup) {
      if (this.isInspectMode) {
        this.swordGroup.position.set(0, -0.2, 0);
        this.swordGroup.scale.set(1.15, 1.15, 1.15);
        this.swordGroup.rotation.x += (this.inspectRotation.x - this.swordGroup.rotation.x) * 0.12;
        this.swordGroup.rotation.y += (this.inspectRotation.y - this.swordGroup.rotation.y) * 0.12;
        this.swordGroup.rotation.z += (0 - this.swordGroup.rotation.z) * 0.12;
      } else {
        // When sword merges into the Iron Throne at the end of the site (Contact: progress >= 3.8), damp parallax so it stays vertically locked
        const isThroneLanded = (this.scrollProgress >= 3.8);
        const parallaxDamp = isThroneLanded ? 0.2 : (this.scrollProgress <= 0.2 ? 0.7 : 1.0);

        // Cool lock-in settling quiver effect when sword merges into the throne
        let quiverY = 0;
        let quiverRotZ = 0;
        if (this.scrollProgress >= 3.82) {
          const landingFactor = Math.min(1.0, (this.scrollProgress - 3.82) / 0.18);
          quiverY = Math.sin(time * 42) * 0.007 * landingFactor;
          quiverRotZ = Math.cos(time * 36) * 0.005 * landingFactor;
        }

        const breathY = Math.sin(time * 1.6) * 0.035 * (isThroneLanded ? 0.2 : 1.0);
        const breathRotZ = Math.cos(time * 1.2) * 0.018 * (isThroneLanded ? 0.2 : 1.0);

        const targetX = this.currentTransform.pos.x + this.mouse.x * 0.22 * parallaxDamp;
        const targetY = this.currentTransform.pos.y + breathY + quiverY + this.mouse.y * 0.18 * parallaxDamp;
        const targetZ = this.currentTransform.pos.z;

        this.swordGroup.position.x += (targetX - this.swordGroup.position.x) * 0.08;
        this.swordGroup.position.y += (targetY - this.swordGroup.position.y) * 0.08;
        this.swordGroup.position.z += (targetZ - this.swordGroup.position.z) * 0.08;

        const targetRotX = this.currentTransform.rot.x - this.mouse.y * 0.15 * parallaxDamp;
        const targetRotY = this.currentTransform.rot.y + this.mouse.x * 0.25 * parallaxDamp;
        const targetRotZ = this.currentTransform.rot.z + breathRotZ + quiverRotZ;

        this.swordGroup.rotation.x += (targetRotX - this.swordGroup.rotation.x) * 0.08;
        this.swordGroup.rotation.y += (targetRotY - this.swordGroup.rotation.y) * 0.08;
        this.swordGroup.rotation.z += (targetRotZ - this.swordGroup.rotation.z) * 0.08;

        const s = this.currentTransform.scale;
        this.swordGroup.scale.set(s, s, s);
      }

      // Synchronized subtle parallax on the Iron Throne (only active when visible at end of website)
      if (this.throneGroup && this.throneGroup.visible && !this.isInspectMode) {
        const tPos = this.getResponsiveThrone();
        const tParallax = (this.scrollProgress >= 3.8) ? 0.04 : 0.06;
        this.throneGroup.position.x += (tPos.x + this.mouse.x * tParallax - this.throneGroup.position.x) * 0.06;
      }

      const isThroneLanded = (this.scrollProgress >= 3.8);

      // 1. Runes pulse - ancient Valyrian glyphs surge with brilliant fire when claiming the throne!
      if (this.runesMesh) {
        if (isThroneLanded) {
          this.runeMaterial.opacity = 0.85 + Math.sin(time * 6.5) * 0.15;
        } else {
          this.runeMaterial.opacity = 0.45 + Math.sin(time * 3.0) * 0.25;
        }
      }

      // 2. Pommel Gem - surges with concentrated realm energy
      if (this.gemLight) {
        if (isThroneLanded) {
          this.gemLight.intensity = 5.8 + Math.sin(time * 7.5) * 1.5;
        } else {
          this.gemLight.intensity = 4.5 + Math.sin(time * 4.5) * 1.2;
        }
      }

      // 2b. Ruby Eyes - Magical Sprinkling Red Embers & Sparkles
      if (this.rubySparks && this.rubySparks.length > 0) {
        for (let i = 0; i < this.rubySparks.length; i++) {
          const sp = this.rubySparks[i];
          const ud = sp.userData;
          ud.life += 0.018;
          if (ud.life > ud.maxLife) {
            ud.life = 0;
            sp.position.set(
              ud.eyeX + (Math.random() - 0.5) * 0.025,
              ud.eyeY + (Math.random() - 0.5) * 0.025,
              ud.eyeZ + (Math.random() - 0.5) * 0.015
            );
            ud.vx = (Math.random() - 0.5) * 0.010 + (ud.eyeX > 0 ? 0.004 : -0.004);
            ud.vy = (Math.random() - 0.35) * 0.010;
            ud.vz = 0.008 + Math.random() * 0.015;
          } else {
            sp.position.x += ud.vx;
            sp.position.y += ud.vy;
            sp.position.z += ud.vz;
            sp.rotation.z += ud.rotSpeed;
            const progress = ud.life / ud.maxLife;
            const sparkPulse = Math.sin(progress * Math.PI);
            sp.scale.set(ud.baseScale * sparkPulse, ud.baseScale * sparkPulse, 1);
            sp.material.opacity = sparkPulse * (0.80 + Math.sin(time * 14.0 + i) * 0.20);
          }
        }
      }

      // 2c. Ruby Eye Coronas - Breathing Radiant Aura
      if (this.eyeAuraMeshes && this.eyeAuraMeshes.length > 0) {
        const auraScale = 0.90 + Math.sin(time * 6.0) * 0.20;
        const auraOpacity = 0.70 + Math.sin(time * 5.0) * 0.25;
        for (let a = 0; a < this.eyeAuraMeshes.length; a++) {
          this.eyeAuraMeshes[a].scale.set(auraScale, auraScale, 1);
          this.eyeAuraMeshes[a].material.opacity = auraOpacity;
        }
      }

      // 3. Glint / Shockwave Flare - radiant pulse burst at the hilt where the sword settles into the throne!
      if (this.glintMesh) {
        if (isThroneLanded) {
          this.glintMesh.position.y = 0.25;
          const landingPulse = 1.35 + Math.sin(time * 5.0) * 0.35;
          this.glintMesh.scale.set(landingPulse * 1.5, landingPulse * 1.5, 1);
          this.glintMesh.rotation.z = time * 1.4;
          this.glintMaterial.opacity = 0.85 + Math.sin(time * 5.0) * 0.15;
        } else {
          const glintY = 1.4 + Math.sin(time * 1.5) * 1.8;
          this.glintMesh.position.y = glintY;
          const flareCycle = Math.max(0, Math.sin(time * 1.5));
          const flareScale = flareCycle * 1.15;
          this.glintMesh.scale.set(flareScale, flareScale, 1);
          this.glintMesh.rotation.z = time * 0.8;
          this.glintMaterial.opacity = 0.2 + flareCycle * 0.75;
        }
      }

      // 4. Gleam Light - subtle illumination across the sword
      if (this.gleamLight) {
        if (isThroneLanded) {
          this.gleamLight.position.y = -0.5;
          this.gleamLight.intensity = 0.8 + Math.sin(time * 2.0) * 0.2;
        } else {
          this.gleamLight.position.y = 1.4 + Math.sin(time * 1.5) * 1.8;
          this.gleamLight.intensity = 2.2 + Math.sin(time * 3.0) * 0.8;
        }
      }

      // 5. Symmetrical Throne Docking Pulse
      if (this.dockingGleamLight && this.dockingGleamLight.intensity > 0) {
        this.dockingGleamLight.intensity = 1.2 + Math.sin(time * 3.0) * 0.3;
      }

      // Volcanic forge smoke billowing from base during assembly
      if (this.smokeGroup && this.smokeGroup.visible) {
        for (let i = 0; i < this.smokeParticles.length; i++) {
          const p = this.smokeParticles[i];
          const ud = p.userData;
          p.position.y += ud.speedY;
          p.position.x += ud.driftX + Math.sin(time * 0.8 + i) * 0.002;
          p.position.z += ud.driftZ + Math.cos(time * 0.8 + i) * 0.002;
          p.rotation.z += ud.rotSpeed;

          if (p.position.y > ud.maxY) {
            p.position.y = ud.baseY;
          }
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.ValyrianSwordScene = ValyrianSwordScene;
