document.addEventListener('DOMContentLoaded', () => {
  initCounter();
  initBook();
  initGallery();
  initDecor();
  initSectionModals();
  initDistance();
  initTimezones();
  initCountdown();
  initGalleryPreview();
  initBackgroundMusic();
  initModelModal();
  initDistanceGame();
  initCasettesModal();
  initFullscreenToggle();
  initCameraModal();
});

/* -----------------------------------------------------------------------
   Counter - days since 31 July 2025. Updates every element with
   .js-day-count (there's one in the hero and one in the panels).
   ----------------------------------------------------------------------- */
function initCounter() {
  const targets = document.querySelectorAll('.js-day-count');
  if (targets.length === 0) return;

  const start = new Date(2025, 6, 31); // month is 0-indexed: 6 = July
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const days = Math.max(Math.round((today - start) / (1000 * 60 * 60 * 24)), 0);
  targets.forEach((el) => {
    el.textContent = days;
  });
}

/* -----------------------------------------------------------------------
   Story - "La hada y la flor olvidada"
   Each page image already has its art + text designed together (from
   story.pdf), so the book just flips through them full-bleed. Add more
   pages by dropping pagina-NN.jpg in fotos/cuento/ and listing it here.
   ----------------------------------------------------------------------- */
const STORY_PAGES = [
  'fotos/cuento/pagina-01.jpg',
  'fotos/cuento/pagina-02.jpg',
  'fotos/cuento/pagina-03.jpg',
  'fotos/cuento/pagina-04.jpg',
  'fotos/cuento/pagina-05.jpg',
  'fotos/cuento/pagina-06.jpg',
  'fotos/cuento/pagina-07.jpg',
  'fotos/cuento/pagina-08.jpg',
  'fotos/cuento/pagina-09.jpg',
  'fotos/cuento/pagina-10.jpg',
];

function initBook() {
  const frame = document.getElementById('bookFrame');
  const progress = document.getElementById('bookProgress');
  const prevBtn = document.querySelector('.book-nav-prev');
  const nextBtn = document.querySelector('.book-nav-next');

  if (!frame || STORY_PAGES.length === 0) return;

  // Two pages per spread, like an open book, instead of one at a time.
  const spreads = [];
  for (let i = 0; i < STORY_PAGES.length; i += 2) {
    spreads.push(STORY_PAGES.slice(i, i + 2));
  }

  frame.innerHTML = spreads.map((spread, i) => `
    <article class="book-page${i === 0 ? ' is-active' : ''}${spread.length === 1 ? ' is-single' : ''}">
      ${spread.map((src, j) => `<img src="${src}" alt="Page ${i * 2 + j + 1}" loading="lazy">`).join('')}
    </article>
  `).join('');

  const pages = Array.from(frame.querySelectorAll('.book-page'));

  const dots = pages.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'book-dot';
    dot.setAttribute('aria-label', `Go to page ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    progress.appendChild(dot);
    return dot;
  });

  let index = 0;

  function render() {
    pages.forEach((page, i) => page.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === pages.length - 1;
  }

  function goTo(i) {
    index = Math.max(0, Math.min(pages.length - 1, i));
    render();
  }

  prevBtn.addEventListener('click', () => goTo(index - 1));
  nextBtn.addEventListener('click', () => goTo(index + 1));

  document.addEventListener('keydown', (evt) => {
    if (evt.key !== 'ArrowLeft' && evt.key !== 'ArrowRight') return;

    // The book now lives inside a modal that's always laid out (just
    // invisible when closed), so geometry alone can't tell us whether
    // it's actually on screen - check the modal's open state instead.
    const modal = frame.closest('.section-modal');
    if (modal) {
      if (!modal.classList.contains('is-open')) return;
    } else {
      const rect = frame.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
    }

    goTo(evt.key === 'ArrowLeft' ? index - 1 : index + 1);
  });

  let touchStartX = null;
  frame.addEventListener('touchstart', (evt) => {
    touchStartX = evt.touches[0].clientX;
  }, { passive: true });
  frame.addEventListener('touchend', (evt) => {
    if (touchStartX === null) return;
    const dx = evt.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? index + 1 : index - 1);
    touchStartX = null;
  });

  render();
}

/* -----------------------------------------------------------------------
   Gallery - photos and videos, opens in a lightbox
   Add or edit items here; drop files in fotos/ or videos/ with these names.
   ----------------------------------------------------------------------- */
const GALLERY_ITEMS = Array.from({ length: 56 }, (_, i) => ({
  type: 'image',
  src: `fotos/${i + 1}.jpg`,
  tall: i % 7 === 3,
}));

// Add video clips here as they're dropped into videos/, e.g.:
// GALLERY_ITEMS.push({ type: 'video', src: 'videos/1.mp4' });

function initGallery() {
  const grid = document.getElementById('galleryGrid');
  const lightbox = document.getElementById('lightbox');
  const stage = document.getElementById('lightboxStage');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  if (!grid || GALLERY_ITEMS.length === 0) return;

  let current = 0;

  function show(i) {
    current = (i + GALLERY_ITEMS.length) % GALLERY_ITEMS.length;
    const item = GALLERY_ITEMS[current];
    stage.innerHTML = item.type === 'video'
      ? `<video src="${item.src}" controls autoplay playsinline></video>`
      : `<img src="${item.src}" alt="">`;
  }

  function open(i) {
    show(i);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    stage.innerHTML = '';
  }

  // The 56 photos are only built once the gallery is actually opened,
  // not on page load - otherwise the browser has no reason to treat
  // loading="lazy" as "off-screen" (the modal is full-viewport-sized
  // even while hidden) and just fetches all of them immediately.
  let populated = false;
  function populateGrid() {
    if (populated) return;
    populated = true;

    grid.innerHTML = GALLERY_ITEMS.map((item, i) => `
      <button type="button" class="gallery-item${item.tall ? ' is-tall' : ''}" data-index="${i}" aria-label="Open item ${i + 1}">
        ${item.type === 'video'
          ? `<video src="${item.src}" muted loop playsinline preload="metadata"></video>`
          : `<img src="${item.src}" alt="" loading="lazy">`}
      </button>
    `).join('');

    grid.querySelectorAll('.gallery-item').forEach((btn) => {
      const video = btn.querySelector('video');
      if (video) {
        btn.addEventListener('mouseenter', () => video.play().catch(() => {}));
        btn.addEventListener('mouseleave', () => video.pause());
      }
      btn.addEventListener('click', () => open(Number(btn.dataset.index)));
    });
  }

  document.querySelectorAll('[data-open-modal="galleryModal"]').forEach((trigger) => {
    trigger.addEventListener('click', populateGrid);
  });

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(current - 1));
  nextBtn.addEventListener('click', () => show(current + 1));

  lightbox.addEventListener('click', (evt) => {
    if (evt.target === lightbox) close();
  });

  document.addEventListener('keydown', (evt) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (evt.key === 'Escape') close();
    if (evt.key === 'ArrowLeft') show(current - 1);
    if (evt.key === 'ArrowRight') show(current + 1);
  });
}

/* -----------------------------------------------------------------------
   Decor - the crayon doodles from decor/, scattered around each section.
   Each one lives inside a width-capped "stage" centered in its section
   (see STAGE_WIDTH) rather than the raw full-bleed section box, so on wide
   screens they stay anchored near the actual content instead of drifting
   out into the side margins. Positions are percentages of that stage.
   Hidden on small screens (see CSS) - no room there to add them without
   covering content.
   ----------------------------------------------------------------------- */
const STAGE_WIDTH = {
  '.hero': '1500px',
  '.story': '1000px',
  '.gallery': '1200px',
  '.panels': '1500px',
};

const DECOR = [
  // Hero
  // decor/1.png (flower), decor/2.png (sun), decor/6.png (two stars) are
  // pulled for now - saved for later use, not deleted, just not placed.
  { section: '.hero', src: 'decor/8.png', width: '80px', pos: 'bottom:8%; right:4%;', rotate: 12 },
  { section: '.hero', src: 'decor/9.png', width: '80px', pos: 'top:4%; right:2%;', rotate: -8 },
  // Big, soft, behind everything else in the hero - a background flourish
  // rather than a corner sticker, so it's toned down and sits under the
  // text/photo (negative z-index) instead of on top of them.
  {
    section: '.hero',
    src: 'decor/4.png',
    width: '115%',
    pos: 'top:50%; left:50%;',
    transform: 'translate(-50%, -50%)',
    opacity: 0.4,
    zIndex: -1,
  },

  // Story has no decor for now - it lives inside a compact modal and the
  // stickers didn't have room to sit right there. decor/3.png (cloud),
  // decor/11.png (daffodils), decor/12.png (grass), decor/15.png
  // (dinosaur) are all still in regalo/decor/ if we want them elsewhere.

  // Gallery
  { section: '.gallery', src: 'decor/5.png', width: '140px', pos: 'top:1%; left:2%;', rotate: -6 },
  { section: '.gallery', src: 'decor/7.png', width: '90px', pos: 'top:2%; right:3%;', rotate: 10 },
  { section: '.gallery', src: 'decor/13.png', width: '140px', pos: 'bottom:2%; left:2%;', rotate: -8 },
  { section: '.gallery', src: 'decor/14.png', width: '150px', pos: 'bottom:1%; right:2%;', rotate: 6 },
  { section: '.gallery', src: 'decor/16.png', width: '120px', pos: 'top:32%; left:1%;', rotate: -10 },
  { section: '.gallery', src: 'decor/21.png', width: '75px', pos: 'top:38%; right:1%;', rotate: 14 },

  // Panels - the leftover stickers that hadn't found a home yet, framing
  // the card grid down both sides instead of crowding any one spot.
  { section: '.panels', src: 'decor/2.png', width: '110px', pos: 'top:2%; left:1%;', rotate: 8 },
  { section: '.panels', src: 'decor/3.png', width: '110px', pos: 'top:3%; right:1%;', rotate: -6 },
  { section: '.panels', src: 'decor/10.png', width: '130px', pos: 'top:22%; left:0.5%;', rotate: -8 },
  { section: '.panels', src: 'decor/17.png', width: '100px', pos: 'top:25%; right:0.5%;', rotate: 8 },
  { section: '.panels', src: 'decor/18.png', width: '110px', pos: 'top:48%; left:1%;', rotate: -6 },
  { section: '.panels', src: 'decor/20.png', width: '70px', pos: 'top:50%; right:1%;', rotate: 0 },
  { section: '.panels', src: 'decor/1.png', width: '110px', pos: 'bottom:2%; left:1%;', rotate: -10 },
  { section: '.panels', src: 'decor/6.png', width: '70px', pos: 'bottom:18%; right:1%;', rotate: 12 },
];

function getStage(section, selector) {
  let stage = section.querySelector(':scope > .decor-stage');
  if (!stage) {
    stage = document.createElement('div');
    stage.className = 'decor-stage';
    stage.style.maxWidth = STAGE_WIDTH[selector] || '1200px';
    section.appendChild(stage);
  }
  return stage;
}

function initDecor() {
  DECOR.forEach((item) => {
    const section = document.querySelector(item.section);
    if (!section) return;

    const stage = getStage(section, item.section);

    const img = document.createElement('img');
    img.className = 'decor';
    img.src = item.src;
    img.alt = '';
    img.loading = 'lazy';
    img.style.cssText = item.pos;
    img.style.width = item.width;
    img.style.transform = item.transform
      || (item.centered
        ? `translateX(-50%) rotate(${item.rotate}deg)`
        : `rotate(${item.rotate}deg)`);
    if (item.opacity !== undefined) img.style.opacity = item.opacity;
    if (item.zIndex !== undefined) img.style.zIndex = item.zIndex;

    stage.appendChild(img);
  });
}

/* -----------------------------------------------------------------------
   Section modals - Story and Gallery open on top of the current page
   instead of navigating to it. Triggered by any [data-open-modal]
   element (nav links, panel cards); closed via the × button, clicking
   the backdrop, or Escape.
   ----------------------------------------------------------------------- */
function initSectionModals() {
  const modals = document.querySelectorAll('.section-modal');
  if (modals.length === 0) return;

  function open(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function close(modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('[data-open-modal]').forEach((trigger) => {
    trigger.addEventListener('click', (evt) => {
      evt.preventDefault();
      open(trigger.dataset.openModal);
    });
  });

  modals.forEach((modal) => {
    modal.querySelectorAll('[data-modal-close]').forEach((el) => {
      el.addEventListener('click', () => close(modal));
    });
  });

  document.addEventListener('keydown', (evt) => {
    if (evt.key !== 'Escape') return;
    modals.forEach((modal) => {
      if (modal.classList.contains('is-open')) close(modal);
    });
  });
}

/* -----------------------------------------------------------------------
   Distance - straight-line km between Bogotá and Oxnard, via the
   haversine formula (no map/API needed).
   ----------------------------------------------------------------------- */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initDistance() {
  const targets = document.querySelectorAll('.js-distance-km');
  if (targets.length === 0) return;

  const bogota = { lat: 4.711, lon: -74.0721 };
  const oxnard = { lat: 34.1975, lon: -119.1771 };
  const km = haversineKm(bogota.lat, bogota.lon, oxnard.lat, oxnard.lon);
  const label = `${Math.round(km).toLocaleString('en-US')} km`;

  targets.forEach((el) => {
    el.textContent = label;
  });
}

/* -----------------------------------------------------------------------
   Timezones - live clocks for both cities.
   ----------------------------------------------------------------------- */
function initTimezones() {
  const bogotaEl = document.getElementById('tzBogota');
  const oxnardEl = document.getElementById('tzOxnard');
  if (!bogotaEl || !oxnardEl) return;

  function update() {
    const now = new Date();
    bogotaEl.textContent = now.toLocaleTimeString('en-US', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
    });
    oxnardEl.textContent = now.toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  update();
  setInterval(update, 30 * 1000);
}

/* -----------------------------------------------------------------------
   Countdown - the inside joke: "remaining time for make out session".
   No exact plan yet, so this is pinned to Sept 15 as a placeholder -
   move TARGET_DATE whenever the real date is set.
   ----------------------------------------------------------------------- */
function initCountdown() {
  const el = document.getElementById('countdownDays');
  if (!el) return;

  const TARGET_DATE = new Date(2026, 8, 15); // September 15, 2026

  function update() {
    const diff = TARGET_DATE - new Date();
    const days = Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
    el.textContent = days;
  }

  update();
  setInterval(update, 60 * 60 * 1000);
}

/* -----------------------------------------------------------------------
   Gallery preview - the Gallery panel cover crossfades through a few
   photos on a loop, like an iPhone photo widget.
   ----------------------------------------------------------------------- */
function initGalleryPreview() {
  const cover = document.querySelector('.panel-gallery');
  if (!cover) return;

  const slides = cover.querySelectorAll('.panel-cover-img');
  if (slides.length < 2) return;

  let index = 0;
  setInterval(() => {
    slides[index].classList.remove('is-active');
    index = (index + 1) % slides.length;
    slides[index].classList.add('is-active');
  }, 4000);
}

/* -----------------------------------------------------------------------
   Background music - browsers block autoplay-with-sound, so this starts
   muted and autoplaying (which is allowed), then the button unmutes it
   on a direct click, which always counts as a real user gesture.
   ----------------------------------------------------------------------- */
function initBackgroundMusic() {
  const audio = document.getElementById('bgAudio');
  const toggle = document.getElementById('soundToggle');
  if (!audio || !toggle) return;

  audio.volume = 0.5;
  let started = false;

  function render() {
    const silent = audio.paused || audio.muted;
    toggle.classList.toggle('is-muted', silent);
    toggle.setAttribute('aria-pressed', String(!silent));
    toggle.setAttribute('aria-label', silent ? 'Play music' : 'Mute music');
  }

  function tryStart() {
    if (started) return;
    started = true;
    audio.muted = false;
    audio.play().then(render).catch(() => {
      started = false; // still blocked - a later gesture gets to retry
    });
  }

  // Try right away, on load. Most browsers block sound before any
  // interaction has happened on the page, so this quietly fails there -
  // the listener below catches the visitor's very first tap/click/key
  // anywhere else on the page instead.
  tryStart();

  function firstGesture(evt) {
    if (toggle.contains(evt.target)) return; // the button handles itself
    tryStart();
    document.removeEventListener('pointerdown', firstGesture);
    document.removeEventListener('keydown', firstGesture);
  }
  document.addEventListener('pointerdown', firstGesture, { passive: true });
  document.addEventListener('keydown', firstGesture);

  toggle.addEventListener('click', () => {
    if (!started) {
      tryStart();
    } else {
      audio.muted = !audio.muted;
    }
    render();
  });

  render();
}

/* -----------------------------------------------------------------------
   3D model modal - loads globo.html?interactive=1 only once it's actually
   opened (so there isn't a second live Three.js scene running in the
   background the whole time), and drops it again on close.
   ----------------------------------------------------------------------- */
function initModelModal() {
  const modal = document.getElementById('modelModal');
  if (!modal) return;

  const frame = modal.querySelector('.model-modal-frame');
  if (!frame) return;

  // The small dashboard preview card runs its own live Three.js/WebGL
  // scene the whole time. iPad Safari only tolerates so much WebGL memory
  // at once, so it gets paused for as long as the big interactive scene
  // is open - otherwise there are two heavy scenes running at once and
  // Safari kills the page ("A Problem Repeatedly Occurred").
  const previewFrames = document.querySelectorAll('.panel-model-frame');

  // 'about:blank' actually unloads the iframe. An empty string does not -
  // the browser resolves '' against the parent page's own URL, so the
  // iframe would silently start loading a whole second copy of index.html
  // (video, fonts, its own nested preview, everything) inside itself.
  document.querySelectorAll('[data-open-modal="modelModal"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      previewFrames.forEach((f) => { f.src = 'about:blank'; });
      frame.src = 'globo.html?interactive=1';
    });
  });

  const observer = new MutationObserver(() => {
    if (!modal.classList.contains('is-open')) {
      frame.src = 'about:blank';
      previewFrames.forEach((f) => { f.src = 'globo.html'; });
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

/* -----------------------------------------------------------------------
   Distance mini-game - tap the path to send a heart flying from Bogotá
   to Oxnard. The count is kept in localStorage, so it keeps climbing
   across visits instead of resetting every time the page loads.
   ----------------------------------------------------------------------- */
function initDistanceGame() {
  const track = document.getElementById('distanceGameTrack');
  const line = track ? track.querySelector('.distance-game-line') : null;
  const countEl = document.getElementById('heartsSentCount');
  if (!track || !line || !countEl) return;

  const STORAGE_KEY = 'heartsSentCount';
  let count = 0;
  try {
    count = Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch (err) {
    // localStorage can throw in some private-browsing modes - just skip
    // persistence for this visit instead of breaking the game.
  }
  countEl.textContent = count;

  track.addEventListener('click', () => {
    count += 1;
    countEl.textContent = count;
    try {
      localStorage.setItem(STORAGE_KEY, String(count));
    } catch (err) {
      // see above
    }

    const heart = document.createElement('span');
    heart.className = 'distance-heart';
    heart.textContent = '♥';
    heart.addEventListener('animationend', () => heart.remove());
    line.appendChild(heart);
  });
}

/* -----------------------------------------------------------------------
   Cassettes modal - the background music pauses while this is open
   (the 3 cassettes get to be heard, not fought over with the playlist
   track), and only resumes on close, and only if it was actually
   playing before.
   ----------------------------------------------------------------------- */
const CASETTE_SONGS = [
  { title: 'Anhelo', artist: '', src: 'audio/casettes/1.mp3' },
  { title: 'Valentine', artist: 'Laufey', src: 'audio/casettes/2.mp3' },
  { title: 'And I Love Her', artist: 'The Beatles', src: 'audio/casettes/3.mp3' },
];

function initCasettesModal() {
  const modal = document.getElementById('casettesModal');
  const audio = document.getElementById('bgAudio');
  const reveal = document.getElementById('casettesReveal');
  const nowPlayingEl = document.getElementById('casetteNowPlaying');
  if (!modal) return;

  let wasPlaying = false;
  const casetteAudio = new Audio();
  let activeIndex = null;

  const items = reveal ? Array.from(reveal.querySelectorAll('.casette-item')) : [];

  function stopCasette() {
    casetteAudio.pause();
    casetteAudio.currentTime = 0;
    activeIndex = null;
    if (reveal) reveal.classList.remove('has-focus');
    items.forEach((el) => el.classList.remove('is-playing'));
    if (nowPlayingEl) {
      nowPlayingEl.classList.remove('is-visible');
      nowPlayingEl.textContent = '';
    }
  }

  function playCasette(i) {
    if (activeIndex === i) {
      stopCasette();
      return;
    }

    const song = CASETTE_SONGS[i];
    if (!song) return;

    activeIndex = i;
    casetteAudio.src = song.src;
    casetteAudio.currentTime = 0;
    casetteAudio.play().catch(() => {});

    if (reveal) reveal.classList.add('has-focus');
    items.forEach((el, idx) => el.classList.toggle('is-playing', idx === i));

    if (nowPlayingEl) {
      nowPlayingEl.textContent = song.artist ? `${song.title} — ${song.artist}` : song.title;
      nowPlayingEl.classList.add('is-visible');
    }
  }

  items.forEach((el, i) => {
    el.addEventListener('click', () => playCasette(i));
  });

  document.querySelectorAll('[data-open-modal="casettesModal"]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      if (!audio) return;
      wasPlaying = !audio.paused && !audio.muted;
      audio.pause();
    });
  });

  const observer = new MutationObserver(() => {
    if (modal.classList.contains('is-open')) return;

    stopCasette();
    if (wasPlaying && audio) {
      audio.play().catch(() => {});
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

/* -----------------------------------------------------------------------
   Full screen toggle - iPad Safari supports the standard Fullscreen API
   for the whole page (iPhone Safari doesn't), so this hides itself on
   anything that can't actually honor it instead of sitting there as a
   dead button.
   ----------------------------------------------------------------------- */
function initFullscreenToggle() {
  const btn = document.getElementById('fullscreenToggle');
  if (!btn) return;

  const doc = document;
  const requestFullscreen = doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen;
  const exitFullscreen = doc.exitFullscreen || doc.webkitExitFullscreen;

  // iPadOS Safari's fullscreenEnabled/webkitFullscreenEnabled flags are
  // unreliable - just checking that the method itself exists is a more
  // trustworthy signal than checking whether it's "enabled" too.
  if (typeof requestFullscreen !== 'function') {
    btn.style.display = 'none';
    return;
  }

  function isFullscreen() {
    return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
  }

  function updateState() {
    const active = isFullscreen();
    btn.classList.toggle('is-fullscreen', active);
    btn.setAttribute('aria-pressed', String(active));
    btn.setAttribute('aria-label', active ? 'Exit full screen' : 'Full screen');
  }

  btn.addEventListener('click', () => {
    if (isFullscreen()) {
      exitFullscreen.call(doc);
    } else {
      requestFullscreen.call(doc.documentElement);
    }
  });

  doc.addEventListener('fullscreenchange', updateState);
  doc.addEventListener('webkitfullscreenchange', updateState);
}

/* -----------------------------------------------------------------------
   The little video - full screen camera view. Background music pauses
   while it's open (same pattern as the casettes modal) and the video
   itself only plays while the modal is actually open.
   ----------------------------------------------------------------------- */
function initCameraModal() {
  const modal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');
  const audio = document.getElementById('bgAudio');
  if (!modal || !video) return;

  let wasPlaying = false;

  document.querySelectorAll('[data-open-modal="cameraModal"]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      if (audio) {
        wasPlaying = !audio.paused && !audio.muted;
        audio.pause();
      }
      try {
        video.currentTime = 0;
      } catch (err) {
        // No source loaded yet - nothing to rewind.
      }
      video.play().catch(() => {});
    });
  });

  const observer = new MutationObserver(() => {
    if (modal.classList.contains('is-open')) return;

    video.pause();
    if (wasPlaying && audio) {
      audio.play().catch(() => {});
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}
