document.addEventListener('DOMContentLoaded', () => {
  const heroCard = document.querySelector('.hero-card');
  const projectsContainer = document.getElementById("projects-container");

  iniciarHeroTilt(heroCard);
  iniciarParticulasV();
  iniciarProyectos(projectsContainer);
  iniciarVideoFondo();
  iniciarFondoCanvas();
});


// =====================================================
// 1. ANIMACIÓN DEL HERO
// =====================================================
function iniciarHeroTilt(heroCard) {
  if (!heroCard) return;

  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;

    heroCard.style.transform =
      `perspective(900px) rotateY(${x * 0.35}deg) rotateX(${y * -0.25}deg)`;
  });

  window.addEventListener('mouseleave', () => {
    heroCard.style.transform =
      'perspective(900px) rotateY(0deg) rotateX(0deg)';
  });
}


// =====================================================
// 2. PARTICULAS PRO EN LA V
// =====================================================
function iniciarParticulasV() {
  const canvas = document.querySelector(".v-canvas");
  const svg = document.querySelector(".v-nav");
  const path = document.querySelector(".v-nav path");

  if (!canvas || !svg || !path) return;

  const ctx = canvas.getContext("2d");
  const particles = [];
  const pathLength = path.getTotalLength();

  let dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    const rect = canvas.getBoundingClientRect();

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function randomColor() {
    const colors = [
      "rgba(0, 234, 255,",
      "rgba(59, 130, 246,",
      "rgba(123, 97, 255,",
      "rgba(255, 0, 200,"
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  }

  function crearParticula() {
    const canvasRect = canvas.getBoundingClientRect();
    const t = Math.random() * pathLength;
    const point = path.getPointAtLength(t);

    const viewBox = svg.viewBox.baseVal;

    const x = ((point.x - viewBox.x) / viewBox.width) * canvasRect.width;
    const y = ((point.y - viewBox.y) / viewBox.height) * canvasRect.height;

    const centerX = canvasRect.width / 2;
    const centerY = canvasRect.height / 2;

    const dx = x - centerX;
    const dy = y - centerY;
    const len = Math.hypot(dx, dy) || 1;

    const force = 0.18 + Math.random() * 0.65;

    particles.push({
      x,
      y,
      vx: (dx / len) * force + (Math.random() - 0.5) * 1.1,
      vy: (dy / len) * force - Math.random() * 0.55,
      life: 1,
      decay: 0.015 + Math.random() * 0.018,
      size: 0.45 + Math.random() * 1.1,
      color: randomColor(),
      glow: 4 + Math.random() * 7
    });
  }

  function pintarParticula(p) {
    const alpha = Math.max(0, p.life);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.6 + alpha), 0, Math.PI * 2);

    const color = `${p.color}${alpha})`;

    ctx.fillStyle = color;
    ctx.shadowBlur = p.glow;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function loop() {
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);

    for (let i = 0; i < 1; i++) {
      crearParticula();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      p.vx *= 0.985;
      p.vy *= 0.985;
      p.vy += 0.012;

      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      pintarParticula(p);
    }

    if (particles.length > 70) {
      particles.splice(0, particles.length - 70);
    }

    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);
  loop();
}


// =====================================================
// 3. PROYECTOS DESDE JSON
// =====================================================
function iniciarProyectos(projectsContainer) {
  if (!projectsContainer) return;

  const path = window.location.pathname.toLowerCase();

  let tipoPagina = null;

  if (path.includes("visualizers")) tipoPagina = "visualizer";
  if (path.includes("interactivos")) tipoPagina = "interactivo";
  if (path.includes("visuales")) tipoPagina = "visual";

  cargarJSON('/data/proyectos.json')
    .catch(() => cargarJSON('data/proyectos.json'))
    .then(data => {
      const listaProyectos = data.proyectos || [];

      listaProyectos.sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha);
      });

      let proyectosMostrados = 0;

      listaProyectos.forEach(p => {
        if (tipoPagina && p.tipo !== tipoPagina) return;

        proyectosMostrados++;

        const card = document.createElement("article");
        card.className = "project-card";

        card.innerHTML = `
          <div class="project-thumb">
            <img src="${p.img}" alt="${p.titulo}" crossorigin="anonymous" loading="lazy">
            <span class="project-badge">${p.labelTipo || 'Demo en vivo'}</span>
          </div>

          <div class="project-body">
            <div class="project-top">
              <h3>${p.titulo}</h3>
              <span class="project-tag">${p.categoria || 'Proyecto'}</span>
            </div>

            <p>${p.descripcion || ''}</p>

            <div class="project-actions">
              <a class="btn btn-primary" href="${p.manifestacion}" target="_blank" rel="noopener noreferrer">
                Ver demo
              </a>
            </div>
          </div>
        `;

        projectsContainer.appendChild(card);

        const img = card.querySelector("img");
        const badge = card.querySelector(".project-badge");

        aplicarColorDominante(img, badge);
      });

      if (proyectosMostrados === 0) {
        projectsContainer.innerHTML = `
          <article class="project-card">
            <div class="project-body">
              <h3>No hay proyectos para esta sección</h3>
              <p>Revisa que el campo <strong>tipo</strong> del JSON coincida con esta página.</p>
            </div>
          </article>
        `;
      }
    })
    .catch(err => {
      console.error("Error cargando JSON:", err);

      projectsContainer.innerHTML = `
        <article class="project-card">
          <div class="project-body">
            <h3>No se pudieron cargar los proyectos</h3>
            <p>Revisa la ruta del archivo JSON: <strong>/data/proyectos.json</strong></p>
          </div>
        </article>
      `;
    });
}


// =====================================================
// CARGAR JSON
// =====================================================
function cargarJSON(url) {
  return fetch(url).then(res => {
    if (!res.ok) {
      throw new Error(`No se pudo cargar el JSON. Estado: ${res.status}`);
    }

    return res.json();
  });
}


// =====================================================
// COLOR DOMINANTE PARA EL BADGE
// =====================================================
function aplicarColorDominante(img, badge) {
  if (!img || !badge) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  img.onload = () => {
    try {
      canvas.width = 10;
      canvas.height = 10;

      ctx.drawImage(img, 0, 0, 10, 10);

      const data = ctx.getImageData(0, 0, 10, 10).data;

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 125) continue;

        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }

      if (count > 0) {
        const color =
          `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;

        badge.style.borderColor = color;
        badge.style.boxShadow = `0 0 14px ${color}`;
      }
    } catch (e) {
      badge.style.borderColor = "#00ffe0";
      badge.style.boxShadow = "0 0 14px rgba(0,255,224,0.55)";
    }
  };

  if (img.complete) {
    img.onload();
  }
}


// =====================================================
// VIDEO DE FONDO
// =====================================================

function iniciarVideoFondo() {
  const video = document.querySelector('.bg-video');

  if (!video) return;

  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;

  const playSafe = () => {
    if (video.paused) {
      video.play().catch(() => {});
    }
  };

  video.addEventListener('loadeddata', playSafe);
  video.addEventListener('canplay', playSafe);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      playSafe();
    }
  });

  playSafe();
}

// =====================================================
// FONDO CANVAS HERO
// =====================================================
function iniciarFondoCanvas() {
  const c = document.getElementById('bgFX');

  if (!c) return;

  const ctx = c.getContext('2d');

  function resize() {
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  const particulas = [];

  for (let i = 0; i < 100; i++) {
    particulas.push({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * Math.PI * 2
    });
  }

  function loop() {
    ctx.clearRect(0, 0, c.width, c.height);

    const glow = ctx.createRadialGradient(
      c.width / 2,
      c.height / 2,
      0,
      c.width / 2,
      c.height / 2,
      c.width * 0.6
    );

    glow.addColorStop(0, "rgba(40,120,255,0.15)");
    glow.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, c.width, c.height);

    particulas.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.a += 0.02;

      if (p.x < 0 || p.x > c.width) p.vx *= -1;
      if (p.y < 0 || p.y > c.height) p.vy *= -1;

      const pulse = Math.sin(p.a) * 0.7 + 1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,180,255,${0.5 * pulse})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#5aa0ff";
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(loop);
  }

  loop();
}
