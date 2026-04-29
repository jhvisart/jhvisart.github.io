document.addEventListener('DOMContentLoaded', () => {
  const heroCard = document.querySelector('.hero-card');
  const projectsContainer = document.getElementById("projects-container");

  // =====================================================
  // 1. ANIMACIÓN DEL HERO
  // =====================================================
  window.addEventListener('mousemove', (e) => {
    if (!heroCard) return;

    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;

    heroCard.style.transform =
      `perspective(900px) rotateY(${x * 0.35}deg) rotateX(${y * -0.25}deg)`;
  });

  window.addEventListener('mouseleave', () => {
    if (!heroCard) return;

    heroCard.style.transform =
      'perspective(900px) rotateY(0deg) rotateX(0deg)';
  });

  // =====================================================
  // 2. DETECTAR PÁGINA ACTUAL
  // =====================================================
  const path = window.location.pathname.toLowerCase();

  let tipoPagina = null;

  if (path.includes("visualizers")) {
    tipoPagina = "visualizer";
  }

  if (path.includes("interactivos")) {
    tipoPagina = "interactivo";
  }

  if (path.includes("visuales")) {
    tipoPagina = "visual";
  }

  // =====================================================
  // 3. CARGAR PROYECTOS DESDE JSON
  // =====================================================
  if (projectsContainer) {
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
  // 4. VIDEO DE FONDO SEGURO
  // =====================================================
  iniciarVideoFondo();

  // =====================================================
  // 5. FONDO CANVAS
  // =====================================================
  iniciarFondoCanvas();
});


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

  const playSafe = () => {
    video.play().catch(() => {});
  };

  video.addEventListener('ended', () => {
    video.currentTime = 0;
    playSafe();
  });

  video.addEventListener('pause', () => {
    playSafe();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      playSafe();
    }
  });

  playSafe();
}


// =====================================================
// FONDO CANVAS
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
