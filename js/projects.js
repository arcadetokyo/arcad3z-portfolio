document.addEventListener('DOMContentLoaded', () => {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxCounter = document.getElementById('lightboxCounter');
  
    if (!lightbox) return;
  
    let currentGallery = [];
    let currentIndex = 0;
  
    function openLightbox(galleryImages, startIndex) {
      currentGallery = galleryImages;
      currentIndex = startIndex;
      renderImage();
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  
    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  
    function renderImage() {
      const img = currentGallery[currentIndex];
      lightboxImg.classList.remove('is-loaded');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
  
      lightboxImg.onload = () => {
        requestAnimationFrame(() => lightboxImg.classList.add('is-loaded'));
      };
  
      lightboxCounter.textContent = `${currentIndex + 1} / ${currentGallery.length}`;
    }
  
    function showNext() {
      currentIndex = (currentIndex + 1) % currentGallery.length; // loops back to start
      renderImage();
    }
  
    function showPrev() {
      currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length; // loops to end
      renderImage();
    }
  
    // Wire up each gallery section independently so prev/next only cycle within that project's set
    document.querySelectorAll('[data-gallery]').forEach((section) => {
      const images = Array.from(section.querySelectorAll('.gallery-img'));
  
      images.forEach((imgEl, idx) => {
        imgEl.addEventListener('click', () => {
          openLightbox(images, idx);
        });
      });
    });
  
    lightboxClose.addEventListener('click', closeLightbox);
    lightboxNext.addEventListener('click', showNext);
    lightboxPrev.addEventListener('click', showPrev);
  
    // Click outside the image (on the dark backdrop) also closes
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  
    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    });
  });