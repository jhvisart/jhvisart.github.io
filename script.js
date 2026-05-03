document.addEventListener("DOMContentLoaded", () => {
  iniciarTransicionPaginas();
  iniciarScrollReveal();
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
          if (tipoPagina === "landing") return p.landing === true;
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

      filtrados.forEach((p, index) => {
        const card = document.createElement("article");
/* TILT PRO SUAVE */
/* ========================= */

let currentX = 0;
let currentY = 0;

let targetX = 0;
let targetY = 0;

card.addEventListener("mousemove", (e) => {
  const rect = card.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const px = x / rect.width;
  const py = y / rect.height;

  targetY = (px - 0.5) * 10;
  targetX = (0.5 - py) * 10;

  // luz sigue el mouse (esto lo mantienes)
  card.style.setProperty('--mx', `${px * 100}%`);
  card.style.setProperty('--my', `${py * 100}%`);
});

function animateTilt() {
  currentX += (targetX - currentX) * 0.08;
  currentY += (targetY - currentY) * 0.08;

  card.style.setProperty('--tiltX', currentX + 'deg');
  card.style.setProperty('--tiltY', currentY + 'deg');

  requestAnimationFrame(animateTilt);
}

animateTilt();

card.addEventListener("mouseleave", () => {
  targetX = 0;
  targetY = 0;
});
        card.addEventListener("mouseenter", () => {
          card.style.transform = "";
          document.body.style.setProperty('--accent1', p.color || "#00eaff");
        });
        card.className = index === 0 && tipoPagina === "landing"
         ? "project-card project-featured"
         : "project-card";

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

    const accent1 = getCssVar("--accent1");
    const accent2 = getCssVar("--accent2");

    const colores = [
      accent1,
      accent2,
      mezclarColor(accent1, accent2, 0.5),
      mezclarColor(accent1, "#ffffff", 0.28),
      mezclarColor(accent2, "#ffffff", 0.28)
    ];

   particles.push({
  x: x + (Math.random() - 0.5) * 1.6,
  y: y + (Math.random() - 0.5) * 1.6,
  vx: (Math.random() - 0.5) * 0.18,
  vy: (Math.random() - 0.5) * 0.18,
  size: 0.45 + Math.random() * 0.9,
  life: 1,
  decay: 0.006 + Math.random() * 0.01,
  color: colores[Math.floor(Math.random() * colores.length)]
 });
  }

  function animar() {
    const rect = canvas.getBoundingClientRect();

    ctx.clearRect(0, 0, rect.width, rect.height);

    for (let i = 0; i < 2; i++) {
      crearParticula();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.shadowBlur = 9;
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
  return getComputedStyle(document.body).getPropertyValue(nombre).trim()
    || getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
    || "#00eaff";
}

function mezclarColor(c1, c2, factor) {
  const parse = (color) => {
    color = String(color).trim();

    if (color.startsWith("#")) {
      let hex = color.slice(1);

      if (hex.length === 3) {
        hex = hex.split("").map(x => x + x).join("");
      }

      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);

      return [r, g, b];
    }

    const nums = color.match(/\d+/g);
    if (nums && nums.length >= 3) {
      return nums.slice(0, 3).map(Number);
    }

    return [0, 234, 255];
  };

  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `rgb(${r}, ${g}, ${b})`;
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
      ctx.shadowBlur = 14;
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
document.addEventListener("pointermove", (e) => {
  document.querySelectorAll(".project-card").forEach((card) => {
    const rect = card.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    card.style.setProperty("--mx", `${x}%`);
    card.style.setProperty("--my", `${y}%`);
  });
});
function iniciarTransicionPaginas() {
  const links = document.querySelectorAll("a[href]");

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      link.target === "_blank"
    ) {
      return;
    }

    link.addEventListener("click", (e) => {
      e.preventDefault();

      document.body.classList.add("is-leaving");

      setTimeout(() => {
        window.location.href = href;
      }, 280);
    });
  });
}

function iniciarScrollReveal() {
  const elementos = document.querySelectorAll(
    ".hero-content, .hero-card, .section-head, .project-card, .glass"
  );

  elementos.forEach((el) => el.classList.add("reveal"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  elementos.forEach((el) => observer.observe(el));
}
