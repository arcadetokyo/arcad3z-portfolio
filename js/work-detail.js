document.addEventListener('DOMContentLoaded', () => {
    initWorkCards();
    initGalleries();
    initBackButton();
    initLightbox();
  });
  
  /* ============================
     SMOOTH SCROLL — card clicks
  ============================ */
  function initWorkCards() {
    document.querySelectorAll('[data-scroll-to]').forEach(card => {
      card.addEventListener('click', e => {
        e.preventDefault();
        const id = card.dataset.scrollTo;
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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
  
      // Position offsets per distance from center
      const POS = {
        tx:      [0,   240, 420,  580],   // translateX (px)
        scale:   [1, 0.74, 0.52, 0.35],
        opacity: [1, 0.50, 0.18, 0],
        zIndex:  [10,   6,   3,   0],
      };
  
      function render() {
        slides.forEach((slide, i) => {
          // distance from current, normalized to wrap around
          let d = i - current;
          if (d > total / 2)  d -= total;
          if (d < -total / 2) d += total;
  
          const abs = Math.min(Math.abs(d), 3);
          const dir = d < 0 ? -1 : d > 0 ? 1 : 0;
  
          slide.style.transform = `translateX(${dir * POS.tx[abs]}px) scale(${POS.scale[abs]})`;
          slide.style.opacity   = POS.opacity[abs];
          slide.style.zIndex    = POS.zIndex[abs];
          slide.style.pointerEvents = abs <= 2 ? 'auto' : 'none';
          slide.dataset.distance = d;
        });
  
        if (counterEl) counterEl.textContent = `${current + 1} / ${total}`;
      }
  
      function go(delta) {
        current = (current + delta + total) % total;
        render();
      }
  
      // Click side images → bring to center; click center → open lightbox
      slides.forEach(slide => {
        slide.addEventListener('click', () => {
          const d = parseInt(slide.dataset.distance || '0');
          if (d === 0) {
            // open lightbox with all images from this gallery
            openLightbox(slides, current);
          } else {
            go(d);
          }
        });
      });
  
      if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
      if (nextBtn) nextBtn.addEventListener('click', () => go(1));
  
      // Keyboard nav (when hovering over a gallery)
      galleryEl.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  go(-1);
        if (e.key === 'ArrowRight') go(1);
      });
  
      render();
    });
  }
  
  /* ============================
     BACK BUTTON — show/hide + color
  ============================ */
  function initBackButton() {
    const btn       = document.getElementById('wdBack');
    const workTop   = document.getElementById('work-top');
    const sections  = Array.from(document.querySelectorAll('.wd-section'));
    if (!btn || !sections.length) return;
  
    // BACK scrolls to page top (the header)
    btn.addEventListener('click', e => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const theme = entry.target.dataset.theme || 'dark';
          btn.classList.add('is-visible');
          btn.classList.remove('theme-dark', 'theme-light');
          btn.classList.add(`theme-${theme}`);
        }
      });
    }, { threshold: 0.4 });
  
    // When the card grid is fully visible, hide the BACK button
    const topObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          btn.classList.remove('is-visible');
        }
      });
    }, { threshold: 0.3 });
  
    sections.forEach(s => observer.observe(s));
    if (workTop) topObserver.observe(workTop);
  }
  
  /* ============================
     LIGHTBOX
  ============================ */
  let lightboxImages = [];
  let lightboxIndex  = 0;
  
  function openLightbox(slides, startIndex) {
    lightboxImages = slides.map(s => s.querySelector('.wd-img'));
    lightboxIndex  = startIndex;
    renderLightboxImage();
  
    const lb = document.getElementById('wdLightbox');
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  
  function closeLightbox() {
    const lb = document.getElementById('wdLightbox');
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  
  function renderLightboxImage() {
    const imgEl     = document.getElementById('wdLightboxImg');
    const counterEl = document.getElementById('wdLightboxCounter');
    const src       = lightboxImages[lightboxIndex].src;
  
    imgEl.classList.remove('is-loaded');
    imgEl.src = src;
    imgEl.onload = () => requestAnimationFrame(() => imgEl.classList.add('is-loaded'));
  
    if (counterEl) {
      counterEl.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
    }
  }
  
  function initLightbox() {
    const lb      = document.getElementById('wdLightbox');
    const closeBtn = document.getElementById('wdLightboxClose');
    const prevBtn  = document.getElementById('wdLightboxPrev');
    const nextBtn  = document.getElementById('wdLightboxNext');
    if (!lb) return;
  
    closeBtn.addEventListener('click', closeLightbox);
  
    nextBtn.addEventListener('click', () => {
      lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
      renderLightboxImage();
    });
  
    prevBtn.addEventListener('click', () => {
      lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
      renderLightboxImage();
    });
  
    lb.addEventListener('click', e => {
      if (e.target === lb) closeLightbox();
    });
  
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % lightboxImages.length; renderLightboxImage(); }
      if (e.key === 'ArrowLeft')  { lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length; renderLightboxImage(); }
    });
  }