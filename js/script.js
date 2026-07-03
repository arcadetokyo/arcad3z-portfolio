// Smooth scroll for in-page nav links (get started section, footer links, etc.)
document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  setTimeout(initBackgroundFX, 400);
  
    const links = document.querySelectorAll('a[href^="#"]');
  
    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);
  
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  
    // ---- Scroll reveal ----
    const revealEls = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, i * 80); // slight stagger when multiple items reveal together
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }    );
  
    revealEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('is-visible');
    } else {
      observer.observe(el);
    }
  });
  
    // ---- Pink star cursor with trail ----
    initStarCursor();
  });
  
  function initPageLoader() {
    const loader = document.querySelector('.page-loader');
    if (!loader) return;
  
    const textEl = loader.querySelector('.page-loader__text');
    const rawText = textEl.dataset.text || textEl.textContent.trim();
    const letterDelay = 55; // ms between each letter starting its color cycle
    const letterDuration = 900; // matches the CSS animation duration
  
    textEl.innerHTML = '';
  
    [...rawText].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'page-loader__letter';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.animationDelay = `${i * letterDelay}ms`;
      textEl.appendChild(span);
    });
  
    // Lock scroll while the intro plays
    document.body.style.overflow = 'hidden';
  
    const totalTime = rawText.length * letterDelay + letterDuration + 350; // small hold before fading out
  
    setTimeout(() => {
      loader.classList.add('is-hidden');
      document.body.style.overflow = '';
      setTimeout(() => loader.remove(), 650); // remove from DOM after fade transition completes
    }, totalTime);
  }
  
  function initBackgroundFX() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
  
    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
    let width, height;
    let time = 0;
  
    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
  
    resize();
    window.addEventListener('resize', resize);
  
    // Layered sine terms standing in for cheap noise — combining a few different
    // frequencies/phases breaks up any perfectly regular, "uniform" repetition.
    function noise(x, seed, t) {
      return (
        Math.sin(x * 0.004 * seed + t * 0.6 + seed) * 0.5 +
        Math.sin(x * 0.011 * seed * 1.7 - t * 0.35 + seed * 2) * 0.3 +
        Math.sin(x * 0.023 * seed * 0.6 + t * 0.9 + seed * 3) * 0.2
      );
    }
  
    const dotSpacingX = 6; // how far apart each vertical "column" of dots is
    const dotsPerColumn = 6; // how many dots stacked per column, forming each band's thickness
  
    // Multiple overlapping bands at different heights/seeds create layered depth
    // instead of one flat lump — like several smoke trails drifting past each other.
    const bands = [
      { yFrac: 0.42, seedOffset: 0, thicknessBase: 50 },
      { yFrac: 0.58, seedOffset: 17, thicknessBase: 42 },
      { yFrac: 0.34, seedOffset: 33, thicknessBase: 34 },
    ];
  
    function drawFrame() {
      ctx.clearRect(0, 0, width, height);
  
      bands.forEach((band) => {
        const centerBase = height * band.yFrac;
        const s = band.seedOffset;
  
        for (let x = 0; x <= width; x += dotSpacingX) {
          // The collective lump's centerline drifts vertically and horizontally over time
          const centerY = centerBase + noise(x, 1 + s, time) * height * 0.12;
  
          // Thickness of the blob itself varies along x — not a uniform band width
          const thickness = band.thicknessBase + noise(x + 800 + s * 50, 1.4 + s, time * 0.8) * 40;
          const safeThickness = Math.max(20, thickness);
  
          for (let k = 0; k < dotsPerColumn; k++) {
            const t01 = dotsPerColumn === 1 ? 0 : k / (dotsPerColumn - 1) - 0.5; // -0.5..0.5
            const jitterY = noise(x * 1.3 + k * 37 + s, 2.1 + s, time) * 3.5;
            const jitterX = noise(x * 0.7 + k * 19 + s, 3.3 + s, time) * 1.8;
  
            const offset = t01 * safeThickness + jitterY;
            const y = centerY + offset;
            const drawX = x + jitterX;
  
            // Depth illusion: dots nearer the band's core read as "closer" — bigger and more opaque;
            // dots near the edges fade and shrink, like the lump has real volume rather than being flat.
            const normalizedOffset = Math.abs(offset) / (safeThickness / 2);
            const depth = Math.max(0, 1 - Math.min(1, normalizedOffset));
  
            const radius = 0.4 + depth * 1.3; // smaller dots overall than before
            const alpha = 0.025 + depth * 0.08;
  
            if (drawX < -10 || drawX > width + 10 || y < -10 || y > height + 10) continue;
  
            ctx.beginPath();
            ctx.fillStyle = `rgba(30, 30, 30, ${alpha.toFixed(3)})`;
            ctx.arc(drawX, y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    }
  
    if (prefersReducedMotion) {
      // Respect reduced-motion preference: render a single static frame, no loop
      drawFrame();
      return;
    }
  
    let frameCount = 0;
  
    function loop() {
      frameCount++;
      // Render at roughly half the browser's refresh rate to keep this lightweight
      if (frameCount % 2 === 0) {
        time += 0.012;
        drawFrame();
      }
      requestAnimationFrame(loop);
    }
  
    loop();
  }
  
  function initStarCursor() {
    // Skip on touch devices — no real cursor to track
    if (window.matchMedia('(pointer: coarse)').matches) return;
  
    const STAR_SVG = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0 L14.6 8.4 L23.4 8.4 L16.2 13.6 L18.8 22 L12 16.8 L5.2 22 L7.8 13.6 L0.6 8.4 L9.4 8.4 Z" fill="#FFC7F2"/>
      </svg>
    `;
  
    // Main cursor star
    const cursorStar = document.createElement('div');
    cursorStar.className = 'cursor-star';
    cursorStar.innerHTML = STAR_SVG;
    document.body.appendChild(cursorStar);
  
    let mouseX = 0;
    let mouseY = 0;
    let lastTrailTime = 0;
    const TRAIL_INTERVAL = 60; // ms between spawned trail stars
  
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorStar.style.transform = `translate(${mouseX}px, ${mouseY}px) rotate(${(mouseX + mouseY) % 360}deg)`;
  
      const now = Date.now();
      if (now - lastTrailTime > TRAIL_INTERVAL) {
        spawnTrailStar(mouseX, mouseY, STAR_SVG);
        lastTrailTime = now;
      }
    });
  
    document.addEventListener('mouseleave', () => {
      cursorStar.style.opacity = '0';
    });
  
    document.addEventListener('mouseenter', () => {
      cursorStar.style.opacity = '1';
    });
  }
  
  function spawnTrailStar(x, y, svgMarkup) {
    const trail = document.createElement('div');
    trail.className = 'cursor-trail-star';
    trail.innerHTML = svgMarkup;
  
    const size = 6 + Math.random() * 6;
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
  
    trail.style.width = `${size}px`;
    trail.style.height = `${size}px`;
    trail.style.left = `${x + offsetX}px`;
    trail.style.top = `${y + offsetY}px`;
  
    document.body.appendChild(trail);
  
    // Trigger fade-out + drift after insertion
    requestAnimationFrame(() => {
      trail.style.opacity = '0';
      trail.style.transform = `translate(-50%, -50%) translateY(${10 + Math.random() * 10}px) scale(0.3) rotate(${Math.random() * 180}deg)`;
    });
  
    setTimeout(() => trail.remove(), 700);
  }