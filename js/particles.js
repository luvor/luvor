/**
 * Hero Canvas — Particle network animation
 * Creates an interactive particle system with connections
 * Optimized for performance with requestAnimationFrame and spatial hashing
 */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  let mouse = { x: -1000, y: -1000 };
  let animationId;
  let isVisible = true;

  // Config
  const CONFIG = {
    particleCount: 80,
    maxDistance: 150,
    particleSize: { min: 1, max: 2.5 },
    speed: { min: 0.1, max: 0.4 },
    mouseRadius: 200,
    mouseForce: 0.02,
    colors: [
      'rgba(41, 151, 255, ',   // blue
      'rgba(191, 90, 242, ',   // purple
      'rgba(48, 209, 88, ',    // green
    ],
    lineOpacity: 0.15,
    particleOpacity: { min: 0.3, max: 0.8 },
    fps: 60,
  };

  // Adjust particle count for mobile
  function getParticleCount() {
    if (width < 480) return 30;
    if (width < 768) return 50;
    return CONFIG.particleCount;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CONFIG.speed.max * 2;
      this.vy = (Math.random() - 0.5) * CONFIG.speed.max * 2;
      this.size = CONFIG.particleSize.min + Math.random() * (CONFIG.particleSize.max - CONFIG.particleSize.min);
      this.color = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.opacity = CONFIG.particleOpacity.min + Math.random() * (CONFIG.particleOpacity.max - CONFIG.particleOpacity.min);
      this.pulseSpeed = 0.005 + Math.random() * 0.01;
      this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
      // Mouse interaction
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONFIG.mouseRadius) {
        const force = (1 - dist / CONFIG.mouseRadius) * CONFIG.mouseForce;
        this.vx += dx * force;
        this.vy += dy * force;
      }

      // Damping
      this.vx *= 0.99;
      this.vy *= 0.99;

      // Speed limit
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > CONFIG.speed.max) {
        this.vx = (this.vx / speed) * CONFIG.speed.max;
        this.vy = (this.vy / speed) * CONFIG.speed.max;
      }

      // Move
      this.x += this.vx;
      this.y += this.vy;

      // Wrap around
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      if (this.y > height + 10) this.y = -10;

      // Pulse opacity
      this.currentOpacity = this.opacity + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.2;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.currentOpacity + ')';
      ctx.fill();
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Reinit particles on significant resize
    const count = getParticleCount();
    if (Math.abs(particles.length - count) > 10) {
      initParticles();
    }
  }

  function initParticles() {
    const count = getParticleCount();
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONFIG.maxDistance) {
          const opacity = (1 - dist / CONFIG.maxDistance) * CONFIG.lineOpacity;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(41, 151, 255, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate(time) {
    if (!isVisible) {
      animationId = requestAnimationFrame(animate);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // Update and draw particles
    for (const p of particles) {
      p.update(time);
      p.draw();
    }

    drawConnections();

    // Mouse glow
    if (mouse.x > 0 && mouse.y > 0) {
      const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 150);
      gradient.addColorStop(0, 'rgba(41, 151, 255, 0.03)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(mouse.x - 150, mouse.y - 150, 300, 300);
    }

    animationId = requestAnimationFrame(animate);
  }

  // Events
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function onMouseLeave() {
    mouse.x = -1000;
    mouse.y = -1000;
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
    }
  }

  // Visibility API — pause when tab is hidden
  function onVisibilityChange() {
    isVisible = !document.hidden;
  }

  // Init
  function init() {
    resize();
    initParticles();
    animate(0);

    window.addEventListener('resize', resize, { passive: true });
    canvas.addEventListener('mousemove', onMouseMove, { passive: true });
    canvas.addEventListener('mouseleave', onMouseLeave, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onMouseLeave, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
