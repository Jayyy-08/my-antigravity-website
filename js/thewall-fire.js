/**
 * The Wall — 3X Thicker Dragonfire Engine: Fire Ends 200px Inside Intro (-400px from intro)
 * 
 * Features:
 * 1. 3X MORE THICKER DRAGONFIRE & SMOKE:
 *    - Roaring 96px nozzle expanding to a colossal ~2200px tempest across the sky
 *    - Broad supersonic plasma core (wCore = 42% of w) enveloped in titanic rolling smoke billows
 *    - Expanded lateral sampling with soft exponential density falloff
 * 2. FIRE ENDS 200PX INSIDE INTRO (-400PX FROM PREVIOUS POSITION):
 *    - Dragonfire enters through the right edge of .hero-content
 *    - Penetrates 200px deep into the intro words with full 100% roaring intensity
 *    - Smoothly terminates and ends completely at 200px inside (-200px from right edge)
 * 3. NO GLOWING EFFECT ON INTRO:
 *    - Intro text and crest remain clean and crisp without artificial glow rings or shield borders
 * 4. VERTICAL-ONLY CURSOR NECK & FIRE AIMING:
 *    - Strictly tracks vertical (Y) cursor movement; horizontal (X) is 100% ignored
 *    - Articulates dragon neck on background image and pivots fire trajectory
 * 5. PICTURE-ACCURATE PALETTE & SILKY 60 FPS PERFORMANCE
 */

(function() {
  'use strict';

  const VS_SOURCE = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const FS_SOURCE = `
    precision highp float;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouth;
    uniform vec2 u_impact;
    uniform vec2 u_eye;
    uniform float u_scale;
    uniform float u_dpr;
    uniform vec4 u_intro_box; // (center_x, center_y, half_w, half_h)

    vec2 hash2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float snoise(vec2 p) {
      const float K1 = 0.366025404;
      const float K2 = 0.211324865;

      vec2 i = floor(p + (p.x + p.y) * K1);
      vec2 a = p - i + (i.x + i.y) * K2;
      vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec2 b = a - o + K2;
      vec2 c = a - 1.0 + 2.0 * K2;

      vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
      vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));

      return dot(n, vec3(70.0));
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      v += a * snoise(p); p = rot * p * 2.0 + shift; a *= 0.5;
      v += a * snoise(p); p = rot * p * 2.0 + shift; a *= 0.5;
      v += a * snoise(p); p = rot * p * 2.0 + shift; a *= 0.5;
      return v;
    }

    void main() {
      vec2 uv = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

      // Direction vector from dragon mouth to Wall impact
      vec2 beam = u_impact - u_mouth;
      float beamLen = length(beam);
      vec2 dir = beam / max(beamLen, 1.0);
      vec2 norm = vec2(-dir.y, dir.x);

      vec2 rel = uv - u_mouth;
      float s = dot(rel, dir) / max(beamLen, 1.0);
      float sClamped = clamp(s, 0.0, 1.0);

      // -------------------------------------------------------------
      // 1. CENTERLINE TRAJECTORY (Direct line of sight from oral cavity)
      // -------------------------------------------------------------
      float centerArc = 0.0;
      float h = dot(rel, norm) - centerArc;

      // -------------------------------------------------------------
      // 2. PLUME EXPANSION (Exact 350px End Width)
      // -------------------------------------------------------------
      // Starts at 42px nozzle at dragon mouth, fanning out to exactly 350px at the end
      float w = u_scale * (42.0 + 208.0 * pow(sClamped, 0.95) + 100.0 * pow(sClamped, 2.0));
      float wCore = w * 0.38; // Supersonic plasma core

      // -------------------------------------------------------------
      // 3. SLOW FLUID DISSIPATION & ORGANIC TURBULENCE (NO HARD CUTOFF)
      // -------------------------------------------------------------
      // Right edge of the intro words (.hero-content) in backing canvas pixels
      float introRightEdge = u_intro_box.x + u_intro_box.z;
      // Distance from the right edge in CSS screen pixels (negative = inside intro)
      float distFromRightEdgePx = (uv.x - introRightEdge) / max(u_dpr, 1.0);

      // Multi-scale organic curl displacement so the fade edge never looks like a point or straight line
      float fadeWarp = snoise(vec2(uv.x * 0.007 - u_time * 0.7, uv.y * 0.014)) * 38.0
                     + snoise(vec2(uv.x * 0.018, uv.y * 0.028 + u_time * 0.35)) * 18.0;
      float warpedDistPx = distFromRightEdgePx + fadeWarp;

      // Check vertical distance to intro box
      float dY = abs(uv.y - u_intro_box.y) - u_intro_box.w;
      float dYPx = dY / max(u_dpr, 1.0);
      float verticalInfluence = (dYPx <= 0.0) ? 1.0 : smoothstep(140.0, 0.0, dYPx);

      // Core Plasma fades out gently (from +60px outside down to -160px inside intro)
      float plasmaT = clamp((warpedDistPx - (-160.0)) / 220.0, 0.0, 1.0);
      float plasmaFade = plasmaT * plasmaT * (3.0 - 2.0 * plasmaT);
      plasmaFade = pow(plasmaFade, 1.3);

      // Smoke fades much more slowly over a wide 360px atmospheric zone (from +110px down to -250px)
      float smokeT = clamp((warpedDistPx - (-250.0)) / 360.0, 0.0, 1.0);
      float smokeFade = smokeT * smokeT * (3.0 - 2.0 * smokeT);
      smokeFade = pow(smokeFade, 1.1);

      float effectivePlasmaFade = mix(1.0, plasmaFade, verticalInfluence);
      float effectiveSmokeFade  = mix(1.0, smokeFade,  verticalInfluence);

      // Soft connection to the wall: stream softens into a delicate, faded presence (0.28 min alpha)
      float wallDistPx = (1.05 - s) * beamLen / max(u_dpr, 1.0);
      float wallFade = mix(0.28, 1.0, smoothstep(0.0, 280.0, wallDistPx));
      float mouthFade = smoothstep(-0.14, 0.02, s);

      float baseStreamFade = mouthFade * wallFade;

      float plasmaDensity = 0.0;
      float smokeDensity = 0.0;

      float throatPulse = 0.92 + 0.14 * sin(u_time * 7.5) * cos(u_time * 4.2) + 0.06 * sin(u_time * 19.0);

      if (baseStreamFade > 0.001 && effectiveSmokeFade > 0.001 && s >= -0.14 && s <= 1.12) {
        float normDist = abs(h) / max(w, 1.0);
        float normCore = abs(h) / max(wCore, 1.0);

        // -------------------------------------------------------------
        // 4. SUPERSONIC PLASMA CORE (Dissipates smoothly into smoke)
        // -------------------------------------------------------------
        if (normCore < 1.8 && effectivePlasmaFade > 0.001) {
          vec2 plasmaCoord = vec2(s * 5.5 - u_time * 2.2, (h / max(wCore, 1.0)) * 1.8);
          vec2 q = vec2(fbm(plasmaCoord), fbm(plasmaCoord + vec2(1.8, 3.2)));
          float plasmaNoise = fbm(plasmaCoord + 2.2 * q);
          float plasmaWisps = fbm(plasmaCoord * 2.8 + 1.2 * q);

          // Thermal eruption boost at the mouth fangs: roaring liquid plasma
          float thermalJetBoost = 1.0 + 2.6 * exp(-max(0.0, s) * 7.5) * throatPulse;

          // Mach shock diamonds compressed between the jaws
          float shockDiamond = sin(s * 55.0 - u_time * 22.0) * exp(-max(0.0, s) * 12.0) * exp(-normCore * normCore * 3.0);

          float coreProfile = exp(-1.8 * normCore * normCore);

          plasmaDensity = coreProfile * clamp(0.52 + 0.68 * (plasmaNoise * 0.65 + plasmaWisps * 0.35), 0.0, 1.0) * thermalJetBoost * baseStreamFade * effectivePlasmaFade;
          plasmaDensity += clamp(shockDiamond, 0.0, 1.0) * 0.42 * baseStreamFade * effectivePlasmaFade;
        }

        // -------------------------------------------------------------
        // 5. SURROUNDING VOLUMETRIC SMOKE MANTLE (Slow lingering atmospheric decay)
        // -------------------------------------------------------------
        if (normDist < 2.0) {
          vec2 smokeCoord = vec2(s * 3.2 - u_time * 0.95, (h / max(w * 0.85, 1.0)) * 1.5);
          vec2 r = vec2(fbm(smokeCoord + vec2(2.3, 1.7)), fbm(smokeCoord + vec2(-1.9, 3.1)));
          float smokeNoise = fbm(smokeCoord + 2.4 * r);
          float detailWisps = fbm(smokeCoord * 2.8 + r);

          // Deep rolling smoke profile without artificial hard clipping
          float smokeProfile = exp(-1.2 * pow(normDist, 1.3));
          smokeDensity = smokeProfile * clamp(0.50 + 0.60 * (smokeNoise * 0.70 + detailWisps * 0.30), 0.0, 1.0) * baseStreamFade * effectiveSmokeFade;
        }
      }

      // -------------------------------------------------------------
      // 6. PIERCING DRAGON EYE (Living arctic pupil breathing & reptilian blink)
      // -------------------------------------------------------------
      vec2 eyeRel = (uv - u_eye) / u_scale;
      float eyeDist = length(eyeRel);

      // Living biological eye dynamics: breathing pupil dilation + nictitating membrane blink every ~4.6s
      float eyeBreath = 0.90 + 0.14 * sin(u_time * 1.5) + 0.06 * cos(u_time * 3.8);
      float blinkCycle = mod(u_time + 1.2, 4.6);
      float blink = 1.0 - smoothstep(0.0, 0.07, blinkCycle) * (1.0 - smoothstep(0.07, 0.18, blinkCycle));
      float eyePulse = eyeBreath * blink;

      float eyeCore = exp(-eyeDist * 0.48) * 1.75 * eyePulse;
      float eyeFlareH = exp(-abs(eyeRel.y) * 0.55) * exp(-abs(eyeRel.x) * 0.038) * 0.85 * eyePulse;
      float eyeStar = exp(-(abs(eyeRel.x) + abs(eyeRel.y)) * 0.30) * 0.42 * eyePulse;
      float eyeTotal = eyeCore + eyeFlareH + eyeStar;

      // -------------------------------------------------------------
      // 7. INCANDESCENT DRAGON THROAT & ORAL CAVITY ILLUMINATION
      // -------------------------------------------------------------
      vec2 mouthRel = (uv - u_mouth) / u_scale;
      float mLong = dot(mouthRel, dir); // along beam (negative = inside throat)
      float mLat  = dot(mouthRel, norm); // across jaw opening

      // Living throat breathing surges and acoustic combustion shudder
      float throatBreath = 0.92 + 0.20 * sin(u_time * 1.5 - 0.35); // synced with respiratory exhalation
      float combustionTremor = 0.06 * sin(u_time * 26.0) * cos(u_time * 41.0);
      float livingThroatPulse = (throatBreath + combustionTremor) * throatPulse;

      // Deep glowing throat cavity behind the fangs (centered at mLong = -18px)
      float throatDist = length(vec2((mLong + 18.0) * 0.85, mLat * 1.5));
      float throatAura = exp(-throatDist * 0.075) * 1.85 * livingThroatPulse;

      // Searing white-hot nozzle compression core right at the fangs
      float nozzleDist = length(vec2(mLong * 1.25, mLat * 2.1));
      float nozzleHotCore = exp(-nozzleDist * 0.13) * 2.60 * livingThroatPulse;

      // Internal thoracic esophagus fire tract (glowing deeper through neck scales)
      float neckVeinDist = length(vec2((mLong + 48.0) * 0.42, mLat * 2.4));
      float neckVeinGlow = exp(-neckVeinDist * 0.048) * 0.85 * livingThroatPulse;

      float mouthGlowTotal = throatAura + nozzleHotCore + neckVeinGlow;
      vec3 mouthGlowCol = mix(vec3(0.08, 0.45, 0.95), vec3(0.35, 0.88, 1.00), smoothstep(0.3, 1.2, mouthGlowTotal));
      mouthGlowCol = mix(mouthGlowCol, vec3(0.95, 0.99, 1.00), smoothstep(1.5, 3.2, mouthGlowTotal));
      float mouthGlowAlpha = clamp(mouthGlowTotal * 0.88, 0.0, 0.96);

      // -------------------------------------------------------------
      // 8. ACTIVE BUT EXTREMELY FADED WALL CLASHING & IMPACT ZONE
      // -------------------------------------------------------------
      vec2 impactRel = (uv - u_impact) / u_scale;
      // Perpendicular deflection along the vertical 700-foot ice cliff face
      float impX = impactRel.x * 1.8;  // compressed against vertical ice wall
      float impY = impactRel.y * 0.65; // elongated vertically along the ice cliff
      float impDist = length(vec2(impX, impY));

      // Active high-pressure fluid collision rhythm
      float impactPulse = 0.90 + 0.14 * sin(u_time * 6.5) * cos(u_time * 3.8) + 0.06 * sin(u_time * 15.0);

      // Billowing convective boiling steam / frost vapor rising up the vertical ice wall
      vec2 wallSteamCoord = vec2(impactRel.x * 0.022 - u_time * 0.35, impactRel.y * 0.018 + u_time * 0.80);
      float wallSteam = fbm(wallSteamCoord * 2.2);

      // Elliptical shockwave deflecting against the perpendicular ice cliff
      float clashAura = exp(-impDist * 0.028) * 0.45 * impactPulse;
      float clashCore = exp(-impDist * 0.065) * 0.70 * impactPulse;
      float clashBoil = exp(-impDist * 0.020) * wallSteam * 0.35;

      // Subtle glinting frost sparks flying off the point of impact
      vec2 sparkGrid = floor(impactRel * 0.12);
      vec2 sparkFract = fract(impactRel * 0.12) - 0.5;
      float sparkRnd = hash2(sparkGrid + vec2(floor(u_time * 9.0), floor(u_time * 5.0))).x;
      float sparkGlint = (sparkRnd > 0.91 && impDist < 120.0) ? exp(-length(sparkFract) * 6.0) * (1.0 - impDist / 120.0) * 0.40 : 0.0;

      // Extremely faded opacity: subtle, ethereal, translucent (peaking at ~0.24 - 0.28 max alpha)
      float wallClashTotal = (clashAura + clashCore + clashBoil + sparkGlint) * 0.40;
      vec3 wallClashCol = mix(vec3(0.04, 0.22, 0.65), vec3(0.35, 0.82, 1.00), smoothstep(0.05, 0.35, wallClashTotal));
      wallClashCol = mix(wallClashCol, vec3(0.90, 0.98, 1.00), smoothstep(0.35, 0.65, wallClashTotal));
      float wallClashAlpha = clamp(wallClashTotal, 0.0, 0.26);

      // -------------------------------------------------------------
      // 9. COLOR COMPOSITION (Plasma Core + Smoke + Eye + Mouth + Wall Clash)
      // -------------------------------------------------------------
      vec3 c_smoke_shadow = vec3(0.02, 0.08, 0.32);
      vec3 c_smoke_mantle = vec3(0.08, 0.30, 0.78);
      vec3 c_smoke_azure  = vec3(0.02, 0.55, 0.95);
      vec3 c_plasma_cyan  = vec3(0.15, 0.82, 1.00);
      vec3 c_plasma_hot   = vec3(0.72, 0.92, 0.98);

      vec3 smokeCol = mix(c_smoke_shadow, c_smoke_mantle, smoothstep(0.05, 0.40, smokeDensity));
      smokeCol = mix(smokeCol, c_smoke_azure, smoothstep(0.40, 0.85, smokeDensity));

      vec3 streamCol = mix(smokeCol, c_plasma_cyan, smoothstep(0.15, 0.65, plasmaDensity));
      streamCol = mix(streamCol, c_plasma_hot, smoothstep(0.65, 1.00, plasmaDensity));

      vec3 eyeCol = mix(vec3(0.24, 0.55, 0.82), vec3(0.72, 0.90, 0.97), smoothstep(0.25, 1.0, eyeTotal));

      float streamAlpha = clamp(smokeDensity * 0.90 + plasmaDensity * 0.98, 0.0, 0.98);
      float eyeAlpha = clamp(eyeTotal * 0.85, 0.0, 0.85);

      float totalAlpha = clamp(streamAlpha + eyeAlpha + mouthGlowAlpha + wallClashAlpha, 0.0, 0.98);
      vec3 finalRGB = (totalAlpha > 0.001)
        ? (streamCol * streamAlpha + eyeCol * eyeAlpha + mouthGlowCol * mouthGlowAlpha + wallClashCol * wallClashAlpha) / totalAlpha
        : vec3(0.0);

      gl_FragColor = vec4(finalRGB, totalAlpha);
    }
  `;

  class TheWallFireEngine {
    constructor() {
      this.canvas = document.getElementById('thewall-fire-canvas');
      this.wallBg = document.querySelector('.castle-thewall');
      this.heroContent = document.querySelector('.hero-content');
      this.gl = null;
      this.program = null;
      this.isWebGLSupported = true;
      this.isActive = false;
      this.animId = null;
      this.startTime = 0;
      this.width = 0;
      this.height = 0;
      this.smokePuffs = [];
      this.maxPuffs = 150;
      this.lastPuffSpawn = 0;

      // Vertical cursor tracking (Neck and fire pitch angle)
      this.targetPitch = 0;
      this.pitchAngle = 0;

      this.init();
    }

    init() {
      if (!this.canvas) {
        this.canvas = document.getElementById('thewall-fire-canvas');
      }
      if (!this.wallBg) {
        this.wallBg = document.querySelector('.castle-thewall');
      }
      if (!this.heroContent) {
        this.heroContent = document.querySelector('.hero-content');
      }
      if (!this.canvas) return;

      this.initWebGL();
      if (!this.isWebGLSupported) {
        this.ctx2d = this.canvas.getContext('2d');
      }
      this.resize();

      window.addEventListener('resize', () => this.resize(), { passive: true });

      // Cursor vertical movement (Up/Down ONLY - horizontal movement ignored)
      window.addEventListener('mousemove', (e) => {
        // e.clientX is completely ignored!
        const normY = (e.clientY / window.innerHeight) - 0.5; // [-0.5, 0.5]
        this.targetPitch = normY * 0.40; // Max angle ~ +/- 12 degrees
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
          const normY = (e.touches[0].clientY / window.innerHeight) - 0.5;
          this.targetPitch = normY * 0.40;
        }
      }, { passive: true });

      // Observe realm changes on documentElement
      const observer = new MutationObserver(() => {
        const realm = document.documentElement.getAttribute('data-realm');
        this.setActive(realm === 'thewall');
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-realm'] });

      // Check current initial realm
      const currentRealm = document.documentElement.getAttribute('data-realm');
      if (currentRealm === 'thewall') {
        this.start();
      }
    }

    initWebGL() {
      try {
        const gl = this.canvas.getContext('webgl', {
          alpha: true,
          antialias: true,
          depth: false,
          stencil: false,
          premultipliedAlpha: false
        }) || this.canvas.getContext('experimental-webgl', {
          alpha: true,
          antialias: true,
          depth: false,
          stencil: false,
          premultipliedAlpha: false
        });

        if (!gl) {
          this.isWebGLSupported = false;
          return;
        }

        const vs = this.createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
        const fs = this.createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
        if (!vs || !fs) {
          this.isWebGLSupported = false;
          return;
        }

        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          console.warn('[TheWallFireEngine] WebGL Link failed:', gl.getProgramInfoLog(program));
          this.isWebGLSupported = false;
          return;
        }

        this.gl = gl;
        this.program = program;

        const positions = new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
          -1,  1,
           1, -1,
           1,  1,
        ]);

        const posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        const aPos = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

        this.uniforms = {
          u_resolution: gl.getUniformLocation(program, 'u_resolution'),
          u_time: gl.getUniformLocation(program, 'u_time'),
          u_mouth: gl.getUniformLocation(program, 'u_mouth'),
          u_impact: gl.getUniformLocation(program, 'u_impact'),
          u_eye: gl.getUniformLocation(program, 'u_eye'),
          u_scale: gl.getUniformLocation(program, 'u_scale'),
          u_dpr: gl.getUniformLocation(program, 'u_dpr'),
          u_intro_box: gl.getUniformLocation(program, 'u_intro_box')
        };
      } catch (e) {
        console.warn('[TheWallFireEngine] WebGL initialization error:', e);
        this.isWebGLSupported = false;
      }
    }

    createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('[TheWallFireEngine] Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    resize() {
      if (!this.canvas) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      this.width = W;
      this.height = H;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.floor(W * dpr);
      this.canvas.height = Math.floor(H * dpr);
      this.canvas.style.width = `${W}px`;
      this.canvas.style.height = `${H}px`;

      if (this.gl) {
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    /**
     * Compute image-cover mapping with living stationary dragon breathing & combustion shudder.
     * Purely autonomous biological respiration wave - zero mouse cursor dependency!
     */
    getCoords(time = 0) {
      const W = this.width;
      const H = this.height;
      const imgAspect = 1696 / 768;
      const screenAspect = W / H;

      let renderW, renderH, offsetX, offsetY;
      if (screenAspect > imgAspect) {
        renderW = W;
        renderH = W / imgAspect;
        offsetX = 0;
        offsetY = (H - renderH) * 0.30;
      } else {
        renderH = H;
        renderW = H * imgAspect;
        offsetX = (W - renderW) * 0.50;
        offsetY = (H - renderH) * 0.30;
      }

      const scale = renderW / 1696.0;

      // Base shoulder pivot joint in image coordinates (1420px, 300px) -> 83.73%, 39.06%
      const pivotX = offsetX + renderW * 0.8373;
      const pivotY = offsetY + renderH * 0.3906;

      // -------------------------------------------------------------
      // 1. LIVING STATIONARY DRAGON BREATHING & COMBUSTION SHUDDER
      // Autonomous biological respiration wave - zero mouse cursor dependency!
      // -------------------------------------------------------------
      const breathT = time * 1.5;
      const breathWave = Math.sin(breathT) + 0.35 * Math.sin(breathT * 0.5); // deep biological inhale/exhale

      // Acoustic combustion recoil shudder from high-pressure plasma exhaust
      const shudderX = (Math.sin(time * 26.0) * 0.35 + Math.cos(time * 41.0) * 0.18) * scale;
      const shudderY = (Math.cos(time * 31.0) * 0.35 + Math.sin(time * 47.0) * 0.18) * scale;

      // Living breathing displacements (heave, sway, scale, tilt in place)
      const breathY = (breathWave * 2.2 * scale) + shudderY;
      const breathX = (Math.cos(breathT * 0.7) * 0.9 * scale) + shudderX;
      const breathRotRad = (breathWave * 0.22) * (Math.PI / 180); // ~0.22 deg rotation around shoulder
      const breathScale = 1.0 + (breathWave * 0.0035); // subtle thoracic chest expansion

      // Apply living stationary breathing to dragon background image
      if (this.wallBg) {
        this.wallBg.style.transformOrigin = `${pivotX.toFixed(1)}px ${pivotY.toFixed(1)}px`;
        this.wallBg.style.transform = `translate3d(${breathX.toFixed(2)}px, ${breathY.toFixed(2)}px, 0) rotate(${(breathRotRad * 180 / Math.PI).toFixed(3)}deg) scale(${breathScale.toFixed(4)})`;
      }

      // Base un-transformed mouth nozzle & eye positions:
      const baseMouthX = offsetX + renderW * 0.7500;
      const baseMouthY = offsetY + renderH * 0.3047;
      const baseEyeX   = offsetX + renderW * 0.7630;
      const baseEyeY   = offsetY + renderH * 0.2331;

      // Synchronize mouth & eye coordinates in analytical lockstep with the breathing dragon
      const cosR = Math.cos(breathRotRad);
      const sinR = Math.sin(breathRotRad);

      const relMx = baseMouthX - pivotX;
      const relMy = baseMouthY - pivotY;
      const mouthX = pivotX + breathScale * (relMx * cosR - relMy * sinR) + breathX;
      const mouthY = pivotY + breathScale * (relMx * sinR + relMy * cosR) + breathY;

      const relEx = baseEyeX - pivotX;
      const relEy = baseEyeY - pivotY;
      const eyeX = pivotX + breathScale * (relEx * cosR - relEy * sinR) + breathX;
      const eyeY = pivotY + breathScale * (relEx * sinR + relEy * cosR) + breathY;

      // 2. FIRE ENDING POINT: Wall impact point is the ONLY point that moves with the cursor
      // Base impact point: X = 769px (45.34%), Y = 437px (56.90%)
      const baseImpactX = offsetX + renderW * 0.4534;
      const baseImpactY = offsetY + renderH * 0.5690;
      // Vertical cursor motion dynamically aims only the ending point along the wall
      const impactY = baseImpactY + this.pitchAngle * (renderW * 0.65);

      // Exact Intro Words Bounding Box (.hero-content)
      let introBox = { cx: W * 0.5, cy: H * 0.48, hw: 300, hh: 200 };
      if (this.heroContent) {
        const rect = this.heroContent.getBoundingClientRect();
        introBox = {
          cx: rect.left + rect.width * 0.5,
          cy: rect.top + rect.height * 0.5,
          hw: rect.width * 0.5,
          hh: rect.height * 0.5
        };
      }

      return {
        mouth: { x: mouthX, y: mouthY },
        eye: { x: eyeX, y: eyeY },
        impact: { x: baseImpactX, y: impactY },
        pivot: { x: pivotX, y: pivotY },
        introBox: introBox,
        scale: Math.max(0.35, scale)
      };
    }

    setActive(active) {
      if (active) {
        this.start();
      } else {
        this.stop();
      }
    }

    start() {
      if (this.isActive) return;
      this.isActive = true;
      this.startTime = performance.now();
      this.resize();
      this.render();
    }

    stop() {
      this.isActive = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
      if (this.gl) {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      } else if (this.canvas && this.ctx2d) {
        this.ctx2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      if (this.wallBg) {
        this.wallBg.style.transform = 'none';
        this.wallBg.style.transformOrigin = 'center 30%';
      }
      this.smokePuffs = [];
    }

    render() {
      if (!this.isActive) return;

      const time = (performance.now() - this.startTime) * 0.001;

      // Smooth ending point aim pitch damping
      this.pitchAngle += (this.targetPitch - this.pitchAngle) * 0.06;

      const coords = this.getCoords(time);

      if (this.isWebGLSupported && this.gl && this.program) {
        const gl = this.gl;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        gl.useProgram(this.program);

        gl.uniform2f(this.uniforms.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uniforms.u_time, time);
        gl.uniform2f(this.uniforms.u_mouth, coords.mouth.x * dpr, coords.mouth.y * dpr);
        gl.uniform2f(this.uniforms.u_impact, coords.impact.x * dpr, coords.impact.y * dpr);
        gl.uniform2f(this.uniforms.u_eye, coords.eye.x * dpr, coords.eye.y * dpr);
        gl.uniform1f(this.uniforms.u_scale, coords.scale * dpr);
        gl.uniform1f(this.uniforms.u_dpr, dpr);

        // Pass exact intro words bounding box
        gl.uniform4f(
          this.uniforms.u_intro_box,
          coords.introBox.cx * dpr,
          coords.introBox.cy * dpr,
          coords.introBox.hw * dpr,
          coords.introBox.hh * dpr
        );

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
      } else {
        if (!this.ctx2d && this.canvas) {
          this.ctx2d = this.canvas.getContext('2d');
        }
        if (this.ctx2d) {
          this.render2DFallback(this.ctx2d, coords);
        }
      }

      this.animId = requestAnimationFrame(() => this.render());
    }

    /**
     * 2D Procedural Volumetric Plasma Core & 3X Surrounding Smoke Fallback
     */
    render2DFallback(ctx, coords) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const m = coords.mouth;
      const imp = coords.impact;
      const eye = coords.eye;
      const intro = coords.introBox;
      const s = coords.scale;
      const now = performance.now();

      // 1. Dragon Eye Piercing Glint
      const eyeR = 5.2 * s;
      const eyeG = ctx.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, eyeR * 3.5);
      eyeG.addColorStop(0, 'rgba(220, 248, 255, 0.95)');
      eyeG.addColorStop(0.35, 'rgba(90, 210, 255, 0.80)');
      eyeG.addColorStop(0.70, 'rgba(30, 120, 235, 0.35)');
      eyeG.addColorStop(1, 'rgba(10, 40, 120, 0)');
      ctx.fillStyle = eyeG;
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, eyeR * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Trajectory direction
      const dx = imp.x - m.x;
      const dy = imp.y - m.y;
      const dist = Math.hypot(dx, dy);
      const ndx = dx / dist;
      const ndy = dy / dist;
      const perpX = -ndy;
      const perpY = ndx;

      // 3. INCANDESCENT DRAGON THROAT & ORAL CAVITY ILLUMINATION
      const throatPulse = 0.92 + 0.12 * Math.sin(now * 0.008) * Math.cos(now * 0.004);
      const throatX = m.x - ndx * 16 * s;
      const throatY = m.y - ndy * 16 * s;
      const throatG = ctx.createRadialGradient(throatX, throatY, 0, throatX, throatY, 26 * s);
      throatG.addColorStop(0, `rgba(240, 252, 255, ${0.98 * throatPulse})`);
      throatG.addColorStop(0.35, `rgba(110, 220, 255, ${0.85 * throatPulse})`);
      throatG.addColorStop(0.70, `rgba(30, 110, 235, ${0.45 * throatPulse})`);
      throatG.addColorStop(1, 'rgba(10, 30, 110, 0)');
      ctx.fillStyle = throatG;
      ctx.beginPath();
      ctx.arc(throatX, throatY, 26 * s, 0, Math.PI * 2);
      ctx.fill();

      // 4. SUPERSONIC MOUTH ERUPTION NOZZLE (Between the fangs)
      const nozzleG = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 44 * s);
      nozzleG.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      nozzleG.addColorStop(0.25, 'rgba(180, 240, 255, 0.94)');
      nozzleG.addColorStop(0.55, 'rgba(50, 175, 255, 0.72)');
      nozzleG.addColorStop(0.85, 'rgba(15, 75, 205, 0.30)');
      nozzleG.addColorStop(1, 'rgba(5, 20, 90, 0)');
      ctx.fillStyle = nozzleG;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 44 * s, 0, Math.PI * 2);
      ctx.fill();

      // 5. SURROUNDING SMOKE BILLOWS & 200PX INSIDE INTRO END

      // Spawn volumetric smoke puffs
      if (now - this.lastPuffSpawn > 14 && this.smokePuffs.length < this.maxPuffs) {
        this.lastPuffSpawn = now;
        const lateralOffset = (Math.random() - 0.5) * 8 * s;
        this.smokePuffs.push({
          progress: 0,
          speed: (1 / 140) * (0.90 + Math.random() * 0.20),
          lateral: lateralOffset,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.02
        });
      }

      // Update and draw billowing smoke puffs ending 200px inside intro
      for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
        const p = this.smokePuffs[i];
        p.progress += p.speed;
        p.rot += p.vRot;

        if (p.progress >= 1.05) {
          this.smokePuffs.splice(i, 1);
          continue;
        }

        const prog = Math.min(p.progress, 1.0);
        // Centerline arc
        const tArc = Math.min(prog / 0.22, 1.0) * (1.0 - Math.max(0.0, Math.min(1.0, (prog - 0.30) / 0.28)));
        const centerArc = -14.0 * s * (tArc * tArc * (3.0 - 2.0 * tArc));

        // Exact 350px end width formula: 42px at mouth to 350px at Wall
        const curW = (42.0 + 208.0 * Math.pow(prog, 0.95) + 100.0 * Math.pow(prog, 2.0)) * s;

        const px = m.x + ndx * (dist * prog) + perpX * (centerArc + p.lateral);
        const py = m.y + ndy * (dist * prog) + perpY * (centerArc + p.lateral);

        // Distance from right edge of intro words in CSS screen pixels
        const introRightEdge = intro.cx + intro.hw;
        const distFromRightEdgePx = px - introRightEdge;

        // Multi-frequency organic curl displacement so puffs don't vanish in lockstep along a line
        const puffWarp = Math.sin(p.rot * 3.5 + p.progress * 12.0) * 32.0;
        const warpedDistPx = distFromRightEdgePx + puffWarp;

        // Check vertical distance to intro box
        const dY = Math.abs(py - intro.cy) - intro.hh;
        const verticalInfluence = dY <= 0 ? 1.0 : Math.min(1.0, Math.max(0.0, (140 - dY) / 140));

        // Smoke fades slowly over a 360px atmospheric zone (from +110px down to -250px)
        const smokeT = Math.min(1.0, Math.max(0.0, (warpedDistPx - (-250.0)) / 360.0));
        const smokeFade = smokeT * smokeT * (3.0 - 2.0 * smokeT);

        // Core plasma fades earlier (from +60px down to -160px)
        const plasmaT = Math.min(1.0, Math.max(0.0, (warpedDistPx - (-160.0)) / 220.0));
        const plasmaFade = Math.pow(plasmaT * plasmaT * (3.0 - 2.0 * plasmaT), 1.3);

        const effectiveSmokeFade = (1.0 - verticalInfluence) + verticalInfluence * smokeFade;
        const effectivePlasmaFade = (1.0 - verticalInfluence) + verticalInfluence * plasmaFade;

        if (effectiveSmokeFade <= 0.005) {
          continue; // Fire & smoke have completely dissolved
        }

        // Soft connection to the wall: stream softens into a delicate, faded presence
        const wallDistPx = (1.05 - prog) * dist;
        const wallFade = 0.28 + 0.72 * Math.pow(Math.min(1.0, Math.max(0.0, wallDistPx / 280.0)), 1.2);
        const mouthFade = Math.min(1.0, Math.max(0.0, (prog + 0.05) / 0.08));
        const baseAlpha = Math.min(1.0, Math.sin(prog * Math.PI * 0.95) * 1.4) * mouthFade * wallFade;
        const curR = curW * (0.60 + 0.25 * Math.sin(prog * 6.0 + p.rot));

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rot);

        // Layer A: Surrounding Volumetric Smoke (Fades slowly and lingers)
        const smokeAlpha = baseAlpha * effectiveSmokeFade;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, curR);
        grad.addColorStop(0, `rgba(185, 230, 248, ${smokeAlpha * 0.92})`);
        grad.addColorStop(0.30, `rgba(80, 185, 255, ${smokeAlpha * 0.75})`);
        grad.addColorStop(0.65, `rgba(20, 85, 205, ${smokeAlpha * 0.45})`);
        grad.addColorStop(0.85, `rgba(10, 30, 110, ${smokeAlpha * 0.20})`);
        grad.addColorStop(1, 'rgba(5, 15, 60, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, curR, 0, Math.PI * 2);
        ctx.fill();

        // Layer B: Supersonic Plasma Core Filament (Extinguishes earlier)
        const plasmaAlpha = baseAlpha * effectivePlasmaFade;
        if (plasmaAlpha > 0.01) {
          const coreR = curR * 0.42;
          const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR);
          coreGrad.addColorStop(0, `rgba(225, 245, 255, ${plasmaAlpha * 0.98})`);
          coreGrad.addColorStop(0.40, `rgba(100, 210, 255, ${plasmaAlpha * 0.85})`);
          coreGrad.addColorStop(1, 'rgba(0, 140, 255, 0)');

          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(0, 0, coreR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 6. ACTIVE BUT EXTREMELY FADED WALL CLASHING EFFECT
      const clashPulse = 0.90 + 0.12 * Math.sin(now * 0.0065) * Math.cos(now * 0.0038);
      ctx.save();
      ctx.translate(imp.x, imp.y);
      ctx.scale(0.70, 1.40); // Vertical ice cliff deflection profile
      const clashR = 90 * s;
      const clashG = ctx.createRadialGradient(0, 0, 0, 0, 0, clashR);
      clashG.addColorStop(0, `rgba(225, 245, 255, ${0.24 * clashPulse})`);
      clashG.addColorStop(0.25, `rgba(90, 200, 255, ${0.18 * clashPulse})`);
      clashG.addColorStop(0.60, `rgba(20, 95, 210, ${0.10 * clashPulse})`);
      clashG.addColorStop(1, 'rgba(5, 15, 70, 0)');
      ctx.fillStyle = clashG;
      ctx.beginPath();
      ctx.arc(0, 0, clashR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    }
  }

  // Auto-initialize immediately so window.theWallFire is defined synchronously
  function initEngine() {
    if (!window.theWallFire) {
      window.theWallFire = new TheWallFireEngine();
      window.TheWallFireEngine = TheWallFireEngine;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
})();
