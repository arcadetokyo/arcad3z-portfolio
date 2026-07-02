document.addEventListener('DOMContentLoaded', () => {
  initWorkCards();
  initGalleries();
  initBackButton();
  initLightbox();
  initRelevantLinks();
});

/* ============================
   SMOOTH SCROLL — card clicks
============================ */
function initWorkCards() {
  document.querySelectorAll('[data-scroll-to]').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(card.dataset.scrollTo);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ============================
   COVERFLOW GALLERY
============================ */
function initGalleries() {
  document.querySelectorAll('.wd-gallery[data-gallery]').forEach(galleryEl => {
    const slides = Array.from(galleryEl.querySelectorAll('.wd-slide'));
    if (!slides.length) return;

    const counterEl = galleryEl.querySelector('.wd-gallery__counter');
    const prevBtn   = galleryEl.querySelector('.wd-gallery__btn--prev');
    const nextBtn   = galleryEl.querySelector('.wd-gallery__btn--next');

    let current = 0;
    const total = slides.length;

    const POS = {
      tx:      [0,   240, 420,  580],
      scale:   [1, 0.74, 0.52, 0.35],
      opacity: [1, 0.50, 0.18,    0],
      zIndex:  [10,   6,   3,    0],
    };

    function render() {
      slides.forEach((slide, i) => {
        let d = i - current;
        if (d >  total / 2) d -= total;
        if (d < -total / 2) d += total;

        const abs = Math.min(Math.abs(d), 3);
        const dir = d < 0 ? -1 : d > 0 ? 1 : 0;

        slide.style.transform    = `translateX(${dir * POS.tx[abs]}px) scale(${POS.scale[abs]})`;
        slide.style.opacity      = POS.opacity[abs];
        slide.style.zIndex       = POS.zIndex[abs];
        slide.style.pointerEvents = abs <= 2 ? 'auto' : 'none';
        slide.dataset.distance   = d;

        // Pause any video in the carousel — only plays in the lightbox
        const video = slide.querySelector('video');
        if (video) video.pause();
      });

      if (counterEl) counterEl.textContent = `${current + 1} / ${total}`;
    }

    function go(delta) {
      current = (current + delta + total) % total;
      render();
    }

    slides.forEach(slide => {
      slide.addEventListener('click', () => {
        const d = parseInt(slide.dataset.distance || '0');
        if (d === 0) {
          openLightbox(slides, current);
        } else {
          go(d);
        }
      });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => go(1));

    render();
  });
}

/* ============================
   BACK BUTTON
============================ */
function initBackButton() {
  const btn      = document.getElementById('wdBack');
  const workTop  = document.getElementById('work-top');
  const sections = Array.from(document.querySelectorAll('.wd-section'));
  if (!btn || !sections.length) return;

  btn.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const theme = entry.target.dataset.theme || 'dark';
        btn.classList.add('is-visible');
        btn.classList.remove('theme-dark', 'theme-light');
        btn.classList.add(`theme-${theme}`);
      }
    });
  }, { threshold: 0.4 });

  const topObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) btn.classList.remove('is-visible');
    });
  }, { threshold: 0.3 });

  sections.forEach(s => sectionObserver.observe(s));
  if (workTop) topObserver.observe(workTop);
}

/* ============================
   LIGHTBOX — supports img and video
============================ */
let lightboxSlides = [];
let lightboxIndex  = 0;

function isVideoSlide(slide) {
  return !!slide.querySelector('video');
}

function openLightbox(slides, startIndex) {
  lightboxSlides = slides;
  lightboxIndex  = startIndex;
  renderLightbox();

  const lb = document.getElementById('wdLightbox');
  lb.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('wdLightbox');
  lb.classList.remove('is-open');
  document.body.style.overflow = '';

  // Pause any playing lightbox video
  const lbVideo = document.getElementById('wdLightboxVideo');
  if (lbVideo) { lbVideo.pause(); lbVideo.src = ''; }
}

function renderLightbox() {
  const slide      = lightboxSlides[lightboxIndex];
  const lbImg      = document.getElementById('wdLightboxImg');
  const lbVideo    = document.getElementById('wdLightboxVideo');
  const counterEl  = document.getElementById('wdLightboxCounter');

  if (isVideoSlide(slide)) {
    // Show video, hide img
    const sourceEl = slide.querySelector('source');
    const src      = sourceEl ? sourceEl.src : slide.querySelector('video').src;
    const type     = sourceEl ? sourceEl.type : 'video/mp4';

    lbImg.style.display   = 'none';
    lbVideo.style.display = 'block';
    lbVideo.classList.remove('is-loaded');

    // Swap source
    const lbSource = lbVideo.querySelector('source') || lbVideo.appendChild(document.createElement('source'));
    lbSource.src  = src;
    lbSource.type = type;
    lbVideo.load();
    lbVideo.play().catch(() => {});
    requestAnimationFrame(() => lbVideo.classList.add('is-loaded'));
  } else {
    // Show img, hide video
    if (lbVideo) { lbVideo.pause(); lbVideo.style.display = 'none'; }
    lbImg.style.display = 'block';
    lbImg.classList.remove('is-loaded');

    const src = slide.querySelector('img').src;
    lbImg.src = src;
    lbImg.onload = () => requestAnimationFrame(() => lbImg.classList.add('is-loaded'));
  }

  if (counterEl) counterEl.textContent = `${lightboxIndex + 1} / ${lightboxSlides.length}`;
}

function initLightbox() {
  const lb       = document.getElementById('wdLightbox');
  const closeBtn = document.getElementById('wdLightboxClose');
  const prevBtn  = document.getElementById('wdLightboxPrev');
  const nextBtn  = document.getElementById('wdLightboxNext');
  if (!lb) return;

  closeBtn.addEventListener('click', closeLightbox);

  nextBtn.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxSlides.length;
    renderLightbox();
  });

  prevBtn.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxSlides.length) % lightboxSlides.length;
    renderLightbox();
  });

  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % lightboxSlides.length; renderLightbox(); }
    if (e.key === 'ArrowLeft')  { lightboxIndex = (lightboxIndex - 1 + lightboxSlides.length) % lightboxSlides.length; renderLightbox(); }
  });
}

/* ============================
   RELEVANT LINKS POPUP
============================ */
function initRelevantLinks() {
  const allBtns = document.querySelectorAll('.rel-links__btn');

  allBtns.forEach(btn => {
    const wrapper = btn.closest('.rel-links');
    const panel   = wrapper.querySelector('.rel-links__panel');

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = panel.classList.contains('is-open');
      // Close all other open panels first
      document.querySelectorAll('.rel-links__panel.is-open').forEach(p => {
        p.classList.remove('is-open');
      });
      // Toggle this one
      if (!isOpen) panel.classList.add('is-open');
    });
  });

  // Click outside → close all panels
  document.addEventListener('click', () => {
    document.querySelectorAll('.rel-links__panel.is-open').forEach(p => {
      p.classList.remove('is-open');
    });
  });

  // Prevent clicks inside panel from closing it
  document.querySelectorAll('.rel-links__panel').forEach(panel => {
    panel.addEventListener('click', e => e.stopPropagation());
  });
}