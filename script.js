document.addEventListener("DOMContentLoaded", () => {
  iniciarHeroTilt();
  iniciarParticulasV();
  iniciarProyectos();
  iniciarVideoFondo();
  iniciarFondoCanvas();
});

function iniciarHeroTilt() {
  const heroCard = document.querySelector(".hero-card");
  if (!heroCard) return;

  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 10;
    const y = (e.clientY / window.innerHeight - 0.5) * 10;

    heroCard.style.transform =
      `perspective(900px) rotateY(${x * 0.35}deg) rotateX(${y * -0.25}deg)`;
  });

  window.addEventListener("mouseleave", () => {
    heroCard.style.transform =
      "perspective(900px) rotateY(0deg) rotateX(0deg)";
  });
}

function iniciarProyectos() {
  const container = document.getElementById("projects-container");
  if (!container) return;

  const tipoPagina = document.body.dataset.tipo || "todos";
  const jsonPath = document.body.dataset.json || "data/proyectos.json";

  fetch(jsonPath)
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo cargar proyectos.json");
      return res.json();
    })
    .then((data) => {
      const proyectos = Array.isArray(data) ? data : data.proyectos || [];

      const filtrados = proyectos
        .filter((p) => {
          if (tipoPagina === "todos") return true;
          return p.tipo === tipoPagina;
        })
        .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

      container.innerHTML = "";

      if (!filtrados.length) {
        container.innerHTML = `
          <article class="project-card">
            <div class="project-body">
              <h3>No hay proyectos para esta sección</h3>
              <p>Agrega en el JSON un proyecto con tipo: <strong>${limpiar(tipoPagina)}</strong>.</p>
            </div>
          </article>
        `;
        return;
      }

      filtrados.forEach((p) => {
        const card = document.createElement("article");
        card.className = "project-card";

        const img = resolverRuta(p.img || "");
        const demo = p.manifestacion || p.demo || p.url || "#";

        card.innerHTML = `
          <div class="project-thumb">
            <img src="${img}" alt="${limpiar(p.titulo)}" loading="lazy">
            <span class="project-badge">${limpiar(p.labelTipo || p.tipo || "Proyecto")}</span>
          </div>

          <div class="project-body">
            <div class="project-top">
              <h3>${limpiar(p.titulo)}</h3>
              <span class="project-tag">${limpiar(p.categoria || "Proyecto")}</span>
            </div>

            <p>${limpiar(p.descripcion || "")}</p>

            <div class="project-actions">
              <a class="btn btn-primary" href="${demo}" target="_blank" rel="noopener noreferrer">
                Ver demo
              </a>
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Error cargando JSON:", err);

      container.innerHTML = `
        <article class="project-card">
          <div class="project-body">
            <h3>No se pudieron cargar los proyectos</h3>
            <p>Revisa la ruta del JSON: <strong>${limpiar(jsonPath)}</strong></p>
          </div>
        </article>
      `;
    });
}

function resolverRuta(ruta) {
  if (!ruta) return "";
  if (ruta.startsWith("http") || ruta.startsWith("/")) return ruta;

  const prefijoAssets = document.body.dataset.assets || "";
  return prefijoAssets + ruta;
}

function limpiar(texto) {
  return String(texto || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function iniciarVideoFondo() {
  const video = document.querySelector(".bg-video");
  if (!video) return;

  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = true;

  const playSafe = () => {
    if (video.paused) video.play().catch(() => {});
  };

  video.addEventListener("loadeddata", playSafe);
  video.addEventListener("canplay", playSafe);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) playSafe();
  });

  playSafe();
}

function iniciarParticulasV() {
  const canvas = document.querySelector(".v-canvas");
  const svg = document.querySelector(".v-nav");
  const path = document.querySelector(".v-nav path");

  if (!canvas || !svg || !path) return;

  const ctx = canvas.getContext("2d");
  const particles = [];
  const pathLength = path.getTotalLength();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function crearParticula() {
    const rect = canvas.getBoundingClientRect();
    const point = path.getPointAtLength(Math.random() * pathLength);
    const viewBox = svg.viewBox.baseVal;

    const x = ((point.x - viewBox.x) / viewBox.width) * rect.width;
    const y = ((point.y - viewBox.y) / viewBox.height) * rect.height;

    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const dx = x - cx;
    const dy = y - cy;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;

    const colores = [
      getCssVar("--accent1"),
      getCssVar("--accent2"),
      "#ffffff",
      "#7dd3fc",
      "#c084fc"
    ];

    particles.push({
      x,
      y,
      vx: (dx / len) * (0.25 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.7,
      vy: (dy / len) * (0.25 + Math.random() * 0.8) + (Math.random() - 0.5) * 0.7,
      size: 1.2 + Math.random() * 2.4,
      life: 1,
      decay: 0.012 + Math.random() * 0.018,
      color: colores[Math.floor(Math.random() * colores.length)]
    });
  }

  function animar() {
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);

    for (let i = 0; i < 4; i++) {
      crearParticula();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(animar);
  }

  resize();
  window.addEventListener("resize", resize);
  animar();
}

function getCssVar(nombre) {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
    || getComputedStyle(document.body).getPropertyValue(nombre).trim()
    || "#00eaff";
}

function iniciarFondoCanvas() {
  const canvas = document.getElementById("bgFX");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const puntos = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    puntos.length = 0;

    for (let i = 0; i < 48; i++) {
      puntos.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r: 1 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: 0.25 + Math.random() * 0.45
      });
    }
  }

  function animar() {
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);

    const accent1 = getCssVar("--accent1");
    const accent2 = getCssVar("--accent2");

    puntos.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > rect.width) p.vx *= -1;
      if (p.y < 0 || p.y > rect.height) p.vy *= -1;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 18;
      ctx.shadowColor = index % 2 === 0 ? accent1 : accent2;
      ctx.fillStyle = index % 2 === 0 ? accent1 : accent2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animar);
  }

  resize();
  window.addEventListener("resize", resize);
  animar();
}
