/**
 * Jaydev Portfolio - Main Application Orchestrator
 * Full Realm Synchronization (Winterfell, King's Landing, Dragonstone)
 * Fading Game of Thrones Orchestral Intro Theme Audio
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Particles Engine
  const particles = new RealmParticles('particles-canvas');

  // 2. Initialize 3D Sword Scene
  const swordScene = new ValyrianSwordScene('sword-canvas-container');

  // 3. Audio Controller for Game of Thrones Intro Theme
  const bgMusic = document.getElementById('got-bg-music');
  const musicBtn = document.getElementById('music-toggle-btn');
  const musicIcon = document.getElementById('music-icon');
  const musicLabel = document.getElementById('music-label');
  let isMusicPlaying = false;
  let fadeInterval = null;

  function updateMusicUI(playing) {
    if (!musicBtn) return;
    if (playing) {
      musicBtn.classList.add('playing');
      if (musicIcon) musicIcon.textContent = '🔊';
      if (musicLabel) musicLabel.textContent = 'GoT Music';
    } else {
      musicBtn.classList.remove('playing');
      if (musicIcon) musicIcon.textContent = '🔇';
      if (musicLabel) musicLabel.textContent = 'Muted';
    }
  }

  function fadeInMusic(targetVolume = 0.38, durationMs = 3500) {
    if (!bgMusic) return;
    clearInterval(fadeInterval);
    bgMusic.volume = 0.0;
    const playPromise = bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isMusicPlaying = true;
        updateMusicUI(true);
        const steps = 30;
        const stepTime = durationMs / steps;
        const volumeIncrement = targetVolume / steps;
        fadeInterval = setInterval(() => {
          if (bgMusic.volume + volumeIncrement < targetVolume) {
            bgMusic.volume += volumeIncrement;
          } else {
            bgMusic.volume = targetVolume;
            clearInterval(fadeInterval);
          }
        }, stepTime);
      }).catch((err) => {
        // Autoplay blocked by browser policy until interaction
        console.log("Autoplay waiting for user gesture:", err);
        const startOnUserGesture = () => {
          fadeInMusic(targetVolume, durationMs);
          window.removeEventListener('click', startOnUserGesture);
          window.removeEventListener('scroll', startOnUserGesture);
          window.removeEventListener('keydown', startOnUserGesture);
          window.removeEventListener('touchstart', startOnUserGesture);
        };
        window.addEventListener('click', startOnUserGesture, { once: true });
        window.addEventListener('scroll', startOnUserGesture, { once: true });
        window.addEventListener('keydown', startOnUserGesture, { once: true });
        window.addEventListener('touchstart', startOnUserGesture, { once: true });
      });
    }
  }

  function fadeOutMusic(durationMs = 700) {
    if (!bgMusic || !isMusicPlaying) return;
    clearInterval(fadeInterval);
    const steps = 15;
    const stepTime = durationMs / steps;
    const volumeDecrement = bgMusic.volume / steps;
    fadeInterval = setInterval(() => {
      if (bgMusic.volume - volumeDecrement > 0.02) {
        bgMusic.volume -= volumeDecrement;
      } else {
        bgMusic.volume = 0;
        bgMusic.pause();
        isMusicPlaying = false;
        updateMusicUI(false);
        clearInterval(fadeInterval);
      }
    }, stepTime);
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (isMusicPlaying) {
        fadeOutMusic(600);
        showToast('🔇 Game of Thrones Theme muted.');
      } else {
        fadeInMusic(0.38, 1500);
        showToast('🎵 Game of Thrones Orchestral Intro playing.');
      }
    });
  }

  // Fade in softly right after page loads
  setTimeout(() => {
    fadeInMusic(0.38, 4000);
  }, 400);

  // 4. Realm Theme Switcher (4 Castles: Winterfell ❄️ -> King's Landing 🦁 -> Dragonstone 🔥 -> Castle Black 🌑)
  const realmBtn = document.getElementById('realm-toggle-btn');
  const realmIcon = document.getElementById('realm-icon');
  const realmLabel = document.getElementById('realm-label');

  // Dynamic elements that shift with each realm
  const heroSigilImg = document.getElementById('hero-sigil-img');
  const heroSubtitle = document.getElementById('hero-subtitle');
  const heroMotto = document.getElementById('hero-motto');
  const statAllegiance = document.getElementById('stat-allegiance');
  const profileRole = document.getElementById('profile-role');
  
  const realms = ['winterfell', 'kingslanding', 'dragonstone', 'castleblack', 'thewall'];
  let currentRealm = localStorage.getItem('jaydev_realm') || 'winterfell';
  if (currentRealm === 'ice') currentRealm = 'winterfell';
  if (currentRealm === 'fire') currentRealm = 'dragonstone';

  function applyRealm(realm) {
    currentRealm = realm;
    document.documentElement.setAttribute('data-realm', realm);
    localStorage.setItem('jaydev_realm', realm);

    if (realm === 'thewall') {
      if (realmIcon) realmIcon.textContent = '🧊';
      if (realmLabel) realmLabel.textContent = 'The Wall';
      if (heroSigilImg) heroSigilImg.src = 'assets/images/sigil_thewall.svg';
      if (heroSubtitle) heroSubtitle.textContent = 'First of His Name • Guardian of The Wall';
      if (heroMotto) heroMotto.textContent = '"I am the watcher on the walls. The horn that wakes the sleepers. The living blue fire in the ice that guards the realms of men."';
      if (statAllegiance) statAllegiance.textContent = 'The Wall & The Living Blue Fire';
      if (profileRole) profileRole.textContent = "Guardian of The Wall • B.Tech CSE";

      particles.setRealm('thewall');
      swordScene.setRealm('thewall');
      if (window.theWallFire) window.theWallFire.setActive(true);
      showToast("🧊 Realm: The Wall — Pure Snow White & Living Blue Dragonfire");
    } else if (realm === 'kingslanding') {
      if (window.theWallFire) window.theWallFire.setActive(false);
      if (realmIcon) realmIcon.textContent = '🦁';
      if (realmLabel) realmLabel.textContent = "King's Landing";
      if (heroSigilImg) heroSigilImg.src = 'assets/images/sigil_lannister.svg';
      if (heroSubtitle) heroSubtitle.textContent = 'Warden of the West • House Lannister of Casterly Rock';
      if (heroMotto) heroMotto.textContent = '"Hear Me Roar! A Lannister always pays his debts in gold and flawless code structure."';
      if (statAllegiance) statAllegiance.textContent = 'House Lannister & Iron Citadel';
      if (profileRole) profileRole.textContent = "Hand of the King • B.Tech CSE";

      particles.setRealm('kingslanding');
      swordScene.setRealm('kingslanding');
      showToast("🦁 Realm: King's Landing — The Red Keep & House Lannister");
    } else if (realm === 'dragonstone') {
      if (window.theWallFire) window.theWallFire.setActive(false);
      if (realmIcon) realmIcon.textContent = '🔥';
      if (realmLabel) realmLabel.textContent = 'Dragonstone';
      if (heroSigilImg) heroSigilImg.src = 'assets/images/sigil_targaryen.svg';
      if (heroSubtitle) heroSubtitle.textContent = 'Blood of the Dragon • House Targaryen of Dragonstone';
      if (heroMotto) heroMotto.textContent = '"Fire and Blood. In the crucible of software, only high-performance systems survive."';
      if (statAllegiance) statAllegiance.textContent = 'House Targaryen & Valyrian Forge';
      if (profileRole) profileRole.textContent = "Dragon Lord of Code • B.Tech CSE";

      particles.setRealm('dragonstone');
      swordScene.setRealm('dragonstone');
      showToast("🔥 Realm: Dragonstone — Volcanic Citadel & Dragon Fire");
    } else if (realm === 'castleblack') {
      if (window.theWallFire) window.theWallFire.setActive(false);
      if (realmIcon) realmIcon.textContent = '🌑';
      if (realmLabel) realmLabel.textContent = 'Castle Black';
      if (heroSigilImg) heroSigilImg.src = 'assets/images/sigil_nightswatch.svg';
      if (heroSubtitle) heroSubtitle.textContent = "Brother of the Night's Watch • The Wall & Castle Black";
      if (heroMotto) heroMotto.textContent = '"Night gathers, and now my watch begins. I am the sword in the darkness, the watcher on the walls, the shield that guards the realms of men."';
      if (statAllegiance) statAllegiance.textContent = "The Night's Watch of Castle Black";
      if (profileRole) profileRole.textContent = "Lord Commander of Code • B.Tech CSE";

      particles.setRealm('castleblack');
      swordScene.setRealm('castleblack');
      showToast("🌑 Realm: Castle Black — The Wall, True Z-Black & Night's Watch");
    } else {
      if (window.theWallFire) window.theWallFire.setActive(false);
      if (realmIcon) realmIcon.textContent = '❄️';
      if (realmLabel) realmLabel.textContent = 'Winterfell';
      if (heroSigilImg) heroSigilImg.src = 'assets/images/house_sigil.svg';
      if (heroSubtitle) heroSubtitle.textContent = 'First of His Name • House Jaydev of Winterfell';
      if (heroMotto) heroMotto.textContent = '"Winter is Coming. Words are wind. Code is Valyrian steel. In the realm of software, logic conquers all kingdoms."';
      if (statAllegiance) statAllegiance.textContent = 'House Jaydev of Winterfell';
      if (profileRole) profileRole.textContent = "Knight of Winterfell • B.Tech CSE";

      particles.setRealm('winterfell');
      swordScene.setRealm('winterfell');
      showToast("❄️ Realm: Winterfell — Ancient Granite & Stark Vigilance");
    }
  }

  if (realmBtn) {
    realmBtn.addEventListener('click', () => {
      const currentIndex = realms.indexOf(currentRealm);
      const nextRealm = realms[(currentIndex + 1) % realms.length];
      applyRealm(nextRealm);
    });
  }
  // Set initial realm
  applyRealm(currentRealm);

  // 5. Inspect 3D Sword Mode
  const inspectBtn = document.getElementById('inspect-btn');
  const exitInspectBtn = document.getElementById('exit-inspect-btn');
  const inspectBanner = document.getElementById('inspect-banner');
  const swordContainer = document.getElementById('sword-canvas-container');

  function setInspectMode(enable) {
    const active = swordScene.toggleInspectMode(enable);
    if (active) {
      swordContainer.classList.add('inspecting');
      inspectBanner.classList.add('active');
      if (ironThroneImg) ironThroneImg.style.visibility = 'hidden';
      showToast('⚔️ 3D Inspection: Drag to rotate the blade. Examine the Valyrian steel craftsmanship!');
    } else {
      swordContainer.classList.remove('inspecting');
      inspectBanner.classList.remove('active');
      if (ironThroneImg) onScroll();
    }
  }

  if (inspectBtn) {
    inspectBtn.addEventListener('click', () => setInspectMode(true));
  }
  if (exitInspectBtn) {
    exitInspectBtn.addEventListener('click', () => setInspectMode(false));
  }

  // 5b. Mobile Navigation Drawer Toggle
  const mobileToggleBtn = document.getElementById('mobile-toggle-btn');
  const navContainer = document.getElementById('nav-container');

  if (mobileToggleBtn && navContainer) {
    mobileToggleBtn.addEventListener('click', () => {
      navContainer.classList.toggle('mobile-open');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navContainer.classList.remove('mobile-open');
      });
    });
  }

  // 6. Scroll Synchronization across Sections
  const sections = [
    document.getElementById('hero'),
    document.getElementById('about'),
    document.getElementById('skills'),
    document.getElementById('projects'),
    document.getElementById('contact')
  ].filter(Boolean);

  const navLinks = document.querySelectorAll('.nav-link');
  let lastSectionIndex = 0;

  function onScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const maxScroll = document.documentElement.scrollHeight - windowHeight;

    let totalProgress = 0;

    // Guaranteed Contact stance when scrolled to the bottom of the page
    if (maxScroll > 50 && scrollY >= maxScroll - 40) {
      totalProgress = sections.length - 1; // 4.0
      lastSectionIndex = sections.length - 1;
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === '#contact') link.classList.add('active');
        else link.classList.remove('active');
      });
    } else {
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const rect = sec.getBoundingClientRect();
        const top = rect.top;
        const height = rect.height;

        if (top <= windowHeight / 2 && top + height > windowHeight / 2) {
          const localProgress = Math.max(0, Math.min(1, (-top + windowHeight * 0.2) / height));
          totalProgress = i + localProgress;

          if (i !== lastSectionIndex) {
            lastSectionIndex = i;
            navLinks.forEach(link => {
              const href = link.getAttribute('href');
              if (href === `#${sec.id}`) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
          break;
        }
      }
    }

    swordScene.setScrollProgress(totalProgress);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 7. Profile Photo Uploader & Persistence
  const photoInput = document.getElementById('photo-upload-input');
  const profileImg = document.getElementById('profile-img');
  const resetPhotoBtn = document.getElementById('reset-photo-btn');
  const defaultPhotoSrc = 'assets/images/jaydev_got_avatar.jpg';

  const savedPhoto = localStorage.getItem('jaydev_custom_photo');
  if (savedPhoto && profileImg) {
    profileImg.src = savedPhoto;
    if (resetPhotoBtn) resetPhotoBtn.style.display = 'inline-block';
  }

  if (photoInput && profileImg) {
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target.result;
          profileImg.src = result;
          localStorage.setItem('jaydev_custom_photo', result);
          if (resetPhotoBtn) resetPhotoBtn.style.display = 'inline-block';
          showToast('🛡️ Portrait updated! Your custom photo is now enshrined in the Hall.');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (resetPhotoBtn && profileImg) {
    resetPhotoBtn.addEventListener('click', () => {
      localStorage.removeItem('jaydev_custom_photo');
      profileImg.src = defaultPhotoSrc;
      resetPhotoBtn.style.display = 'none';
      showToast('Restored Game of Thrones Knight portrait.');
    });
  }

  // 8. Contact Form & Wax Seal Animation
  const ravenForm = document.getElementById('raven-form');
  const waxSealBtn = document.getElementById('wax-seal-btn');

  if (waxSealBtn && ravenForm) {
    waxSealBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = document.getElementById('sender-name')?.value.trim() || 'Lord Traveler';
      const house = document.getElementById('sender-house')?.value.trim() || 'Allied House';
      const message = document.getElementById('raven-message')?.value.trim();

      if (!message) {
        showToast('⚠️ Write your message in the parchment before dispatching the raven!');
        return;
      }

      waxSealBtn.style.transform = 'scale(0.88)';
      setTimeout(() => {
        waxSealBtn.style.transform = '';
      }, 250);

      const subject = encodeURIComponent(`Raven from ${name} of ${house} [Portfolio Dispatch]`);
      const body = encodeURIComponent(`Hail Jaydev,\n\nSender: ${name}\nHouse: ${house}\n\nMessage:\n${message}\n\nDispatched from the JECRC Citadel.`);
      
      showToast(`🦅 The Raven has taken flight bearing ${name}'s scroll to Jaydev!`);

      setTimeout(() => {
        window.location.href = `mailto:jaydev@example.com?subject=${subject}&body=${body}`;
      }, 700);
    });
  }

  // 9. Toast Notification Helper
  function showToast(msg) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast-msg';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
});
