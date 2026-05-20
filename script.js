/* =========================================================
   VISART ENGINE CORE
========================================================= */

const VISART_ENGINE = {

  cards: [],

  hero: null,

pointer: {

  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.5,

  targetX: window.innerWidth * 0.5,
  targetY: window.innerHeight * 0.5,

  lastX: window.innerWidth * 0.5,
  lastY: window.innerHeight * 0.5,

  velocity: 0,

  energy: 0,

   smoothedVelocity: 0
},

  running: false,

   atmosphere: {

  current: 0,
  target: 0,

  pulse: 0,

  breathing: 0

},

  addCard(card) {
    this.cards.push(card);
  },

  setHero(hero) {
    this.hero = hero;
  },

  start() {

    if (this.running) return;

    this.running = true;

    const tick = () => {

      this.update();

      requestAnimationFrame(tick);

    };

    requestAnimationFrame(tick);

  },

   updatePointer() {

  const pointer =
    this.pointer;

   pointer.smoothedVelocity +=
  (
    pointer.velocity -
    pointer.smoothedVelocity
  ) * 0.12;

  const targetEnergy =

    pointer.smoothedVelocity *

    (
      pointer.velocity > 0.08
        ? 1
        : 0.35
    );

  pointer.energy +=
    (
      targetEnergy -
      pointer.energy
    ) * 0.018;

      pointer.heroAuthority =

  Math.max(
    0,
    1 - (pointer.energy * 1.8)
  );

pointer.cardsAuthority =

  Math.min(
    1,
    0.35 + (pointer.energy * 1.4)
  );

  pointer.x +=
    (pointer.targetX - pointer.x) * 0.11;

  pointer.y +=
    (pointer.targetY - pointer.y) * 0.11;

},

updateAtmosphere(time) {

  const pointer =
    this.pointer;

  const atmosphere =
    this.atmosphere;

  const energy =
    pointer.energy;

  atmosphere.target =

    pointer.velocity > 0.04

      ? energy

      : 0;

  atmosphere.current +=
    (
      atmosphere.target -
      atmosphere.current
    ) * 0.022;

  atmosphere.pulse =

    Math.sin(
      time * 0.00032
    ) * 0.5 + 0.5;

  atmosphere.breathing =

    (
      atmosphere.pulse * 0.12
    ) *

    atmosphere.current;

  document.body.style.setProperty(
    "--globalAtmosphere",
    atmosphere.current.toFixed(3)
  );

},

   updateCards(time) {

  const pointer =
    this.pointer;

 const energy =
  pointer.energy;

this.cards.forEach(card => {

  card.energy =
    energy;

     /* =========================
   SPATIAL ANALYSIS
========================= */

if (!card.rect) {

  card.rect =
    card.el.getBoundingClientRect();

}

const rect =
  card.rect;

const centerX = 
   rect.left + rect.width * 0.5;
     
const centerY = 
   rect.top + rect.height * 0.5;

card.centerX = centerX;
card.centerY = centerY;

const dx =
  pointer.x - centerX;

const dy =
  pointer.y - centerY;

 const localX =
  pointer.x - rect.left;

const localY =
  pointer.y - rect.top;

const percentX =
  localX / rect.width;

const percentY =
  localY / rect.height;

card.lightX = 
   percentX * 100;
     
card.lightY = 
   percentY * 100;

card.lightCurrentX +=
  (card.lightX - card.lightCurrentX) * 0.08;

card.lightCurrentY +=
  (card.lightY - card.lightCurrentY) * 0.08;

const distance =
  Math.sqrt(dx * dx + dy * dy);

const maxDistance = 
   420;

const authority =
  pointer.cardsAuthority;

const fieldInfluence =

  (pointer.energy * authority) *

  (
    0.08 +

    (card.proximity * 0.16)
  );

const normalizedDistance =
  Math.max(
     0, 
     1 - distance / maxDistance
  );

card.proximity =

  Math.pow(
    normalizedDistance,
    2.4
  );

const ambientBleed =

  this.cards.reduce(

    (acc, otherCard) => {

      if (otherCard === card) return acc;

      const ox =
  otherCard.centerX || 0;

const oy =
  otherCard.centerY || 0;

      const ddx = 
         centerX - ox;
       
      const ddy = 
         centerY - oy;

      const dist =
        Math.sqrt(
           ddx * ddx + ddy * ddy);

      return (
        acc +
        Math.max(
           0,
           1 - dist / 420) *
        otherCard.proximity *
        0.018
      );

    },

    0

  );

card.proximity += 
   ambientBleed;

    card.priority =
  Math.pow(
     card.proximity,
     2.1);

     /* =========================
   MAGNETIC FIELD
========================= */

   const magneticStrength =

(card.hover ? (

  IS_TOUCH_DEVICE

    ? 0.014

    : 0.032

) : 0.0008) *

Math.pow(
  0.35 + card.priority,
  1.18
);

card.magneticX =
  dx * magneticStrength * card.proximity;

card.magneticY =
  dy * magneticStrength * card.proximity;

const magneticCompression =

  0.034 +

  (card.priority * 0.008);

card.magneticCurrentX +=
  (
    card.magneticX -
    card.magneticCurrentX
  ) * magneticCompression;

card.magneticCurrentY +=
  (
    card.magneticY -
    card.magneticCurrentY
  ) * magneticCompression;

 card.currentX +=
  Math.sin(
    time * 0.0015 +
    distance * 0.01
  ) * fieldInfluence * 0.015;

card.currentY +=
  Math.cos(
    time * 0.0012 +
    distance * 0.008
  ) * fieldInfluence * 0.015;

  const restDecay =

  Math.max(
    0.08,
    pointer.energy
  );

const ambientStillness =

  Math.max(
    0,
    restDecay - 0.12
  );

const ambientFloat =

  Math.sin(

    time * 0.00018 +

    card.floatSeed +

    distance * 0.0002

  ) *

  0.0022 *

  card.floatIntensity *

  ambientStillness;

card.currentY += ambientFloat;

     /* =========================
   PHYSICS SYNTHESIS
========================= */
    
 const adaptiveSpeed =
  card.speed +
  (pointer.energy * 0.12);

const forceX =
  (card.targetX - card.currentX) * adaptiveSpeed;

const forceY =
  (card.targetY - card.currentY) * adaptiveSpeed;
    
card.velocityX += forceX;
card.velocityY += forceY;

const adaptiveDamping =

  0.72 +

  (card.proximity * 0.018) -

  (pointer.energy * 0.012);

card.velocityX *= adaptiveDamping;
card.velocityY *= adaptiveDamping;
    
card.velocityX *= 0.985;
card.velocityY *= 0.985;

     /* =========================
   MOTION COMPRESSION
========================= */

const residualEnergy =

  energy > 0.085

    ? (
        energy - 0.085
      )

    : 0;

const silenceGate =

  Math.max(
    0,
    card.proximity - 0.08
  );

const microMotion =

  Math.sin(

    time * 0.00032 +

    card.floatSeed

  ) *

  0.00028 *

  silenceGate *

  residualEnergy;

card.currentX +=
  card.velocityX + microMotion;

card.currentY +=
  card.velocityY + (microMotion * 0.7);

     

    });
   },

  renderCards(time) {

   const energy =
  this.pointer.energy; 

  this.cards.forEach(card => {

     const style =
  card.el.style;

     style.cssText += `
  --tiltX:${card.currentX}deg;
  --tiltY:${card.currentY}deg;

  --magneticX:${card.magneticCurrentX}px;
  --magneticY:${card.magneticCurrentY}px;

  --proximity:${card.proximity.toFixed(3)};
  --energy:${card.energy.toFixed(3)};

  --mx:${card.lightCurrentX}%;
  --my:${card.lightCurrentY}%;
`;

const restEnergy =

  energy > 0.025

    ? energy * 0.52

    : 0;

const idleField =

  Math.sin(
    time * 0.00022 +
    card.floatSeed
  ) *

  0.5 +

  0.5;

const lightBreath =

  (
    Math.sin(
      time * 0.00045
    ) * 0.5 + 0.5
  ) *

  0.16 *

  restEnergy +

  idleField * 0.018;

style.setProperty(
  "--breath",
  lightBreath.toFixed(3)
);

   
    });
  },

   updateHero() {

  const hero =
    this.hero;

  const atmosphere =
    this.atmosphere;

  if (!hero) return;

 const authority =
  this.pointer.heroAuthority;

hero.currentX +=
  (
    (hero.targetX * authority) -
    hero.currentX
  ) * 0.032;

hero.currentY +=
  (
    (hero.targetY * authority) -
    hero.currentY
  ) * 0.032;

  hero.el.style.setProperty(
    "--atmosphere",
    atmosphere.breathing.toFixed(3)
  );

  hero.el.style.transform = `
    perspective(900px)
    rotateY(${hero.currentX * 0.9}deg)
    rotateX(${hero.currentY * 0.9}deg)
  `;

},
   
   update() {

   const time =
  performance.now();

     this.updatePointer();

     const pointer =
  this.pointer;

this.updateAtmosphere(time);

const atmosphere =
  this.atmosphere;

const energy =
  pointer.energy;

 this.updateCards(time);

 this.renderCards(time);


   this.updateHero();

  }

};

const IS_TOUCH_DEVICE =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0;
window.matchMedia("(pointer: coarse)").matches;

function visartGetPoint(e) {
  const touch = e.touches?.[0] || e.changedTouches?.[0];

  return {
    x: touch ? touch.clientX : e.clientX,
    y: touch ? touch.clientY : e.clientY
  };
}

document.addEventListener("DOMContentLoaded", () => {

  window.addEventListener("pointermove", (e) => {
   const dx =
  e.clientX - VISART_ENGINE.pointer.lastX;

const dy =
  e.clientY - VISART_ENGINE.pointer.lastY;

const rawVelocity =

  Math.min(
    Math.sqrt(dx * dx + dy * dy) * 0.065,
    1
  );
     
VISART_ENGINE.pointer.velocity =

  rawVelocity < 0.035

    ? 0

    : Math.pow(
        rawVelocity,
        1.58
      );

 VISART_ENGINE.pointer.targetX = e.clientX;
VISART_ENGINE.pointer.targetY = e.clientY;

 VISART_ENGINE.pointer.lastX = e.clientX;
 VISART_ENGINE.pointer.lastY = e.clientY;

}, { passive: true });
   
  iniciarHeroTilt();
  iniciarParticulasV();
  iniciarProyectos();
  iniciarVideoFondo();
  iniciarFondoCanvas();
  iniciarScrollReveal();
  iniciarPageTransition();
  corregirIOSViewport();
});

/* ======================================= */
/* HERO TILT */
/* ======================================= */

function iniciarHeroTilt() {
  const heroCard = document.querySelector(".hero-card");

  if (!heroCard || IS_TOUCH_DEVICE) return;
   
   const heroData = {

  el: heroCard,

  currentX: 0,
  currentY: 0,

  targetX: 0,
  targetY: 0

};

VISART_ENGINE.setHero(heroData);


window.addEventListener("pointermove", (e) => {

  const x =
  (VISART_ENGINE.pointer.x / window.innerWidth - 0.5) * 1.8;

const y =
  (VISART_ENGINE.pointer.y / window.innerHeight - 0.5) * -1.2;

  heroData.targetX = x;
  heroData.targetY = y;

}, { passive: true });

window.addEventListener("pointerleave", () => {

  heroData.targetX = 0;
  heroData.targetY = 0;

});
  
}

/* ======================================= */
/* PROYECTOS */
/* ======================================= */

function iniciarProyectos() {
  const container = document.getElementById("projects-container");

  if (!container) return;

  const tipoPagina = document.body.dataset.tipo || "landing";
  const jsonPath = document.body.dataset.json || "data/proyectos.json";

  fetch(jsonPath)
    .then((res) => {
      if (!res.ok) {
        throw new Error("No se pudo cargar proyectos.json");
      }

      return res.json();
    })

    .then((data) => {
      const proyectos =
        Array.isArray(data)
          ? data
          : data.proyectos || [];

      const filtrados = proyectos
        .filter((p) => {
         if (tipoPagina === "landing") {
          return p.landing === true;
          }
          return p.tipo === tipoPagina;
        })
        .sort((a, b) => {
          return new Date(b.fecha || 0)
            - new Date(a.fecha || 0);
        });

      container.innerHTML = "";

      if (!filtrados.length) {
        container.innerHTML = `
          <article class="project-card">
            <div class="project-body">
              <h3>No hay proyectos para esta sección</h3>
              <p>
                Agrega en el JSON un proyecto con tipo:
                <strong>${limpiar(tipoPagina)}</strong>
              </p>
            </div>
          </article>
        `;

        return;
      }

      filtrados.forEach((p) => {
        const card = document.createElement("article");
        card.className = "project-card reveal";

        const img = resolverRuta(p.img || "");
        const demo = p.manifestacion || p.demo || p.url || "#";

        card.innerHTML = `
          <div class="project-thumb">
            <img
              src="${img}"
              alt="${limpiar(p.titulo)}"
              loading="lazy"
              decoding="async"
            >

            <span class="project-badge">
              ${limpiar(p.labelTipo || p.tipo || "Proyecto")}
            </span>
          </div>

          <div class="project-body">

            <div class="project-top">
              <h3>${limpiar(p.titulo)}</h3>

              <span class="project-tag">
                ${limpiar(p.categoria || "Proyecto")}
              </span>
            </div>

            <p>${limpiar(p.descripcion || "")}</p>

            <div class="project-actions">
              <a
                class="btn btn-primary"
                href="${demo}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver demo
              </a>
            </div>

          </div>
        `;

        iniciarTiltCard(card);
        container.appendChild(card);
      });

    setTimeout(() => {
  iniciarScrollReveal();
}, 80);
    })

    .catch((err) => {
      console.error("Error cargando JSON:", err);

      container.innerHTML = `
        <article class="project-card">
          <div class="project-body">
            <h3>No se pudieron cargar los proyectos</h3>
            <p>
              Revisa la ruta del JSON:
              <strong>${limpiar(jsonPath)}</strong>
            </p>
          </div>
        </article>
      `;
    });
}

/* ======================================= */
/* TILT CARDS */
/* ======================================= */

function iniciarTiltCard(card) {
  if (!card) return;

  let currentX = 0;
  let currentY = 0;

  let targetX = 0;
  let targetY = 0;

  const engineCard = {

  el: card,

   rect: null,

  currentX,
  currentY,

  targetX,
  targetY,

 velocityX: 0,
 velocityY: 0,

  speed: 0.12,

   floatSeed: Math.random() * 1000,

floatIntensity:
  0.85 + Math.random() * 0.35,
     
  proximity: 0,

 hover: false,

 magneticX: 0,
 magneticY: 0,

 magneticCurrentX: 0,
 magneticCurrentY: 0,

lightX: 50,
lightY: 50,

lightCurrentX: 50,
lightCurrentY: 50,

};

VISART_ENGINE.addCard(engineCard);

  function handleCardMove(e) {
     
    if (!IS_TOUCH_DEVICE) {
  engineCard.hover = true;
}
    const rect = card.getBoundingClientRect();

    const point = visartGetPoint(e);

     const pointer =
  VISART_ENGINE.pointer;

   const px =
  (pointer.x - rect.left) / rect.width;

const py =
  (pointer.y - rect.top) / rect.height;

const centeredX = (px - 0.5);
const centeredY = (py - 0.5);

const responseCurve =

  IS_TOUCH_DEVICE

    ? 1.34

    : 1.22;

const curveX =
  Math.sign(centeredX) *

  Math.pow(
   Math.min(
  Math.abs(centeredX),
  0.92
),
    responseCurve
  );

const curveY =
  Math.sign(centeredY) *

  Math.pow(
   Math.min(
  Math.abs(centeredY),
  0.92
),
    responseCurve
  );

const cinematicTilt =

  IS_TOUCH_DEVICE

    ? (
        7 +
        (engineCard.proximity * 1.8)
      )

    : (
        18 +
        (engineCard.proximity * 5.8)
      );

engineCard.targetY =
  curveX * cinematicTilt;

engineCard.targetX =
  -curveY * cinematicTilt;

    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
  }

  card.addEventListener("pointermove", handleCardMove, {
    passive: true
  });

 function handlePointerLeave() {

  engineCard.hover = false;

  const releaseX =
    engineCard.velocityX * 0.32;

  const releaseY =
    engineCard.velocityY * 0.32;

  engineCard.targetX = releaseX;
  engineCard.targetY = releaseY;

  setTimeout(() => {

    engineCard.targetX = 0;
    engineCard.targetY = 0;

  }, 120);

}

   card.addEventListener(
  "pointerleave",
  handlePointerLeave
   );
}


/* ======================================= */
/* VIDEO FIX IOS */
/* ======================================= */

function iniciarVideoFondo() {
  const video = document.querySelector(".bg-video");

  if (!video) return;

  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;

  const playSafe = async () => {
    try {
      if (video.paused) {
        await video.play();
      }
    } catch (err) {}
  };

  video.addEventListener("loadeddata", playSafe);
  video.addEventListener("canplay", playSafe);
  video.addEventListener("suspend", playSafe);
  video.addEventListener("stalled", playSafe);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      playSafe();
    }
  });

  window.addEventListener("pageshow", () => {
    playSafe();
  });

  window.addEventListener("focus", () => {
    playSafe();
  });

  playSafe();
}

/* ======================================= */
/* IOS VIEWPORT FIX */
/* ======================================= */

function corregirIOSViewport() {
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };

  setVH();

  window.addEventListener("resize", setVH, { passive: true });
  window.addEventListener("orientationchange", setVH, { passive: true });
}

/* ======================================= */
/* SCROLL REVEAL */
/* ======================================= */

let visartRevealObserver;

function iniciarScrollReveal() {
  const elementos = document.querySelectorAll(".reveal");

  if (!elementos.length) return;

  if (visartRevealObserver) {
    visartRevealObserver.disconnect();
  }

  visartRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: "0px 0px -60px 0px"
    }
  );

  elementos.forEach((el) => {
    visartRevealObserver.observe(el);
  });
}

/* ======================================= */
/* PAGE TRANSITIONS */
/* ======================================= */

function iniciarPageTransition() {
  const links = document.querySelectorAll("a[href]");

  links.forEach((link) => {
    const href = link.getAttribute("href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto") ||
      href.startsWith("tel") ||
      link.target === "_blank"
    ) {
      return;
    }

    link.addEventListener("click", (e) => {
      if (IS_TOUCH_DEVICE) return;

      e.preventDefault();

      document.body.classList.add("is-leaving");

      setTimeout(() => {
        window.location.href = href;
      }, 280);
    });
  });
}

/* ======================================= */
/* PARTICULAS V */
/* ======================================= */

function iniciarParticulasV() {
  const canvas = document.querySelector(".v-canvas");
  const svg = document.querySelector(".v-nav");
  const path = document.querySelector(".v-nav path");

  if (!canvas || !svg || !path) return;

  const ctx = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
  });

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

    const point = path.getPointAtLength(
      Math.random() * pathLength
    );

    const viewBox = svg.viewBox.baseVal;

    const x =
      ((point.x - viewBox.x) / viewBox.width) * rect.width;

    const y =
      ((point.y - viewBox.y) / viewBox.height) * rect.height;

    const accent1 = getCssVar("--accent1");
    const accent2 = getCssVar("--accent2");

    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: 0.45 + Math.random() * 0.9,
      life: 1,
      decay: 0.012 + Math.random() * 0.015,
      color: Math.random() > 0.5 ? accent1 : accent2
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
      ctx.shadowBlur = 8;
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
  window.addEventListener("resize", resize, { passive: true });
  animar();
}

/* ======================================= */
/* BG FX */
/* ======================================= */

function iniciarFondoCanvas() {
  const canvas = document.getElementById("bgFX");

  if (!canvas) return;

  const ctx = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
  });

  const puntos = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    puntos.length = 0;

    for (let i = 0; i < 18; i++) {
      puntos.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        r: 1 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.045,
        vy: (Math.random() - 0.5) * 0.045,
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
      ctx.shadowBlur = 8;
      ctx.shadowColor =
        index % 2 === 0 ? accent1 : accent2;

      ctx.fillStyle =
        index % 2 === 0 ? accent1 : accent2;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animar);
  }

  resize();
  window.addEventListener("resize", resize, {
    passive: true
  });

  animar();
}

/* ======================================= */
/* HELPERS */
/* ======================================= */

function resolverRuta(ruta) {
  if (!ruta) return "";

  if (ruta.startsWith("http") || ruta.startsWith("/")) {
    return ruta;
  }

  const prefijoAssets =
    document.body.dataset.assets || "";

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

function getCssVar(nombre) {
  return (
    getComputedStyle(document.body)
      .getPropertyValue(nombre)
      .trim() ||

    getComputedStyle(document.documentElement)
      .getPropertyValue(nombre)
      .trim() ||

    "#00eaff"
  );
}

window.addEventListener("resize", () => {

  VISART_ENGINE.cards.forEach(card => {

    card.rect = null;

  });

});

window.addEventListener("orientationchange", () => {

  VISART_ENGINE.cards.forEach(card => {

    card.rect = null;

  });

});


VISART_ENGINE.start();
