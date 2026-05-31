/* =========================================================
   VISART ENGINE CORE
   ---------------------------------------------------------
   FASE A — STRUCTURE PASS
   updateCards() dividido en:
     updateSpatial() · updateMagnetic() · updatePhysics() · updateCompression()
   Sin cambios de comportamiento, física ni efectos.
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
    smoothedVelocity: 0,
    heroAuthority: 1,
    cardsAuthority: 0.35
  },

  running: false,

  isVisible: true,

  _isScrolling: () => false,

  audioEngine: {
    context: null,
    analyser: null,
    source: null,
    dataArray: null,
    fftSize: 512,
    enabled: false,
    initialized: false,
    energy: 0,
    bass: 0,
    mids: 0,
    highs: 0,
    cinematicWeight: 0
  },

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

  /* =========================================================
     POINTER
  ========================================================= */
  updatePointer() {
    const pointer = this.pointer;

    pointer.smoothedVelocity +=
      (pointer.velocity - pointer.smoothedVelocity) * 0.12;

    const targetEnergy =
      pointer.smoothedVelocity *
      (pointer.velocity > 0.08 ? 1 : 0.35);

    pointer.energy += (targetEnergy - pointer.energy) * 0.018;
    pointer.energy = Math.min(pointer.energy, 1);

    pointer.heroAuthority = Math.max(0, 1 - (pointer.energy * 1.8));
    pointer.cardsAuthority = Math.min(1, 0.35 + (pointer.energy * 1.4));

    pointer.x += (pointer.targetX - pointer.x) * 0.11;
    pointer.y += (pointer.targetY - pointer.y) * 0.11;
  },

  /* =========================================================
     AUDIO
  ========================================================= */
  updateAudio() {
    const audio = this.audioEngine;

    if (!audio.enabled || !audio.analyser || !audio.dataArray) {
      return;
    }

    audio.analyser.getByteFrequencyData(audio.dataArray);

    let bass = 0;
    let mids = 0;
    let highs = 0;

    const buffer = audio.dataArray;
    const length = buffer.length;

    for (let i = 0; i < length; i++) {
      const value = buffer[i] / 255;

      if (i < length * 0.12) {
        bass += value;
      } else if (i < length * 0.45) {
        mids += value;
      } else {
        highs += value;
      }
    }

    bass /= length * 0.12;
    mids /= length * 0.33;
    highs /= length * 0.55;

    audio.bass += (bass - audio.bass) * 0.12;
    audio.mids += (mids - audio.mids) * 0.08;
    audio.highs += (highs - audio.highs) * 0.06;

    const totalEnergy =
      audio.bass * 0.52 +
      audio.mids * 0.32 +
      audio.highs * 0.16;

    audio.energy += (totalEnergy - audio.energy) * 0.08;
  },

  /* =========================================================
     ATMOSPHERE
  ========================================================= */
  updateAtmosphere(time) {
    const pointer = this.pointer;
    const atmosphere = this.atmosphere;
    const energy = pointer.energy;
    const audioEnergy = this.audioEngine.energy;

    atmosphere.target =
      (pointer.velocity > 0.04 ? energy : 0) +
      (audioEnergy * 0.42);

    const cardFieldPressure = this.cards.reduce(
      (acc, card) => acc + (card.priority * 0.028),
      0
    );

    const nextAtmosphere = (
      Math.min(atmosphere.target + cardFieldPressure, 1) -
      atmosphere.current
    ) * 0.022;

    atmosphere.current = isNaN(atmosphere.current)
      ? 0
      : atmosphere.current + nextAtmosphere;

    atmosphere.pulse = Math.sin(time * 0.00032) * 0.5 + 0.5;
    atmosphere.breathing = (atmosphere.pulse * 0.12) * atmosphere.current;

    document.body.style.setProperty(
      "--globalAtmosphere",
      atmosphere.current.toFixed(3)
    );
  },

  /* =========================================================
     CARDS — orquestador
     Cada card recibe un ctx limpio que viaja por los 4 módulos.
     ctx lleva los valores temporales del frame (dx, dy,
     distance, fieldInfluence) que antes eran variables locales.
  ========================================================= */
  updateCards(time) {
    const pointer = this.pointer;
    const energy = pointer.energy;

    this.cards.forEach(card => {
      card.energy = energy;

      const ctx = {
        time,
        pointer,
        energy,
        dx: 0,
        dy: 0,
        distance: 0,
        fieldInfluence: 0
      };

      // updateSpatial devuelve false si la card no es visible:
      // ese es el reemplazo exacto del "return" que antes
      // cortaba el forEach.
      if (this.updateSpatial(card, ctx) === false) return;

      this.updateMagnetic(card, ctx);
      this.updatePhysics(card, ctx);
      this.updateCompression(card, ctx);
    });
  },

  /* ─────────────────────────────────────────────
     SPATIAL ANALYSIS
     rect · visibilidad · centro · luz · distancia
     proximity · ambientBleed · spatialCoupling · priority
  ───────────────────────────────────────────── */
  updateSpatial(card, ctx) {
    const pointer = ctx.pointer;

    if (!card.rect || card.needsRectUpdate) {
      card.rect = card.el.getBoundingClientRect();
      card.needsRectUpdate = false;
    }

    const rect = card.rect;
    const viewportPadding = 260;

    const isVisible =
      rect.bottom > -viewportPadding &&
      rect.top < (window.innerHeight + viewportPadding);

    if (!isVisible) return false;

    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;
    card.centerX = centerX;
    card.centerY = centerY;

    const dx = pointer.x - centerX;
    const dy = pointer.y - centerY;

    const localX = pointer.x - rect.left;
    const localY = pointer.y - rect.top;
    const percentX = localX / rect.width;
    const percentY = localY / rect.height;

    card.lightX = percentX * 100;
    card.lightY = percentY * 100;
    card.lightCurrentX += (card.lightX - card.lightCurrentX) * 0.08;
    card.lightCurrentY += (card.lightY - card.lightCurrentY) * 0.08;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 420;
    const authority = pointer.cardsAuthority;

    const fieldInfluence =
      (pointer.energy * authority) *
      (0.08 + (card.proximity * 0.16));

    const normalizedDistance = Math.max(0, 1 - distance / maxDistance);
    card.proximity = Math.pow(normalizedDistance, 2.4);

    const ambientBleed = this._isScrolling()
      ? 0
      : this.cards.reduce((acc, otherCard) => {
          if (otherCard === card) return acc;
          const ox = otherCard.centerX || 0;
          const oy = otherCard.centerY || 0;
          const ddx = centerX - ox;
          const ddy = centerY - oy;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          return acc + Math.max(0, 1 - dist / 420) * otherCard.proximity * 0.018;
        }, 0);

    card.proximity += ambientBleed;

    const spatialCoupling = this._isScrolling()
      ? 0
      : this.cards.reduce((acc, otherCard) => {
          if (otherCard === card) return acc;
          return acc + (otherCard.priority * 0.0035);
        }, 0);

    card.priority += spatialCoupling;
    card.priority = Math.min(1, Math.pow(card.proximity, 2.1));

    // Exponer al resto de módulos lo que necesitan
    ctx.dx = dx;
    ctx.dy = dy;
    ctx.distance = distance;
    ctx.fieldInfluence = fieldInfluence;

    return true;
  },

  /* ─────────────────────────────────────────────
     MAGNETIC FIELD
     fuerza magnética · interpolación · field float · ambient float
  ───────────────────────────────────────────── */
  updateMagnetic(card, ctx) {
    const pointer = ctx.pointer;
    const time = ctx.time;
    const dx = ctx.dx;
    const dy = ctx.dy;
    const distance = ctx.distance;
    const fieldInfluence = ctx.fieldInfluence;

    const magneticStrength =
      (card.hover
        ? (PLATFORM.isDesktop ? 0.032 : 0.014)
        : 0.0008) *
      Math.pow(0.35 + card.priority, 1.18);

    card.magneticX = dx * magneticStrength * card.proximity;
    card.magneticY = dy * magneticStrength * card.proximity;

    const magneticCompression = 0.034 + (card.priority * 0.008);

    card.magneticCurrentX +=
      (card.magneticX - card.magneticCurrentX) * magneticCompression;
    card.magneticCurrentY +=
      (card.magneticY - card.magneticCurrentY) * magneticCompression;

    card.currentX +=
      Math.sin(time * 0.0011 + distance * 0.006) * fieldInfluence * 0.008;
    card.currentY +=
      Math.cos(time * 0.0010 + distance * 0.005) * fieldInfluence * 0.008;

    const restDecay = Math.max(0.08, pointer.energy);
    const ambientStillness = Math.max(0, restDecay - 0.12);

    const ambientFloat =
      Math.sin(time * 0.00016 + card.floatSeed + distance * 0.00016) *
      0.0012 *
      card.floatIntensity *
      ambientStillness;

    card.currentY += ambientFloat;
  },

  /* ─────────────────────────────────────────────
     PHYSICS SYNTHESIS
     velocidad · masa espacial · damping
  ───────────────────────────────────────────── */
  updatePhysics(card, ctx) {
    const pointer = ctx.pointer;

    const adaptiveSpeed = card.speed + (pointer.energy * 0.12);

    const forceX = (card.targetX - card.currentX) * adaptiveSpeed;
    const forceY = (card.targetY - card.currentY) * adaptiveSpeed;

    card.velocityX += forceX;
    card.velocityY += forceY;

    const spatialMass =
      1 +
      (card.priority * 1.8) +
      (card.proximity * 0.9);

    const inertialResistance = 0.78 + (spatialMass * 0.028);
    const adaptiveDamping = inertialResistance - (pointer.energy * 0.010);

    card.velocityX *= adaptiveDamping;
    card.velocityY *= adaptiveDamping;

    card.velocityX *= 0.985;
    card.velocityY *= 0.985;
  },

  /* ─────────────────────────────────────────────
     MOTION COMPRESSION
     micro-motion · curva de compresión · clamp final
  ───────────────────────────────────────────── */
  updateCompression(card, ctx) {
    const time = ctx.time;
    const energy = ctx.energy;

    const residualEnergy = energy > 0.11 ? (energy - 0.11) : 0;
    const silenceGate = Math.max(0, card.proximity - 0.08);

    const microMotion =
      Math.sin(time * 0.00032 + card.floatSeed) *
      0.00028 *
      silenceGate *
      residualEnergy;

    const compressionCurve = 1 - Math.min(0.32, card.priority * 0.22);

    card.currentX += Math.max(
      -18,
      Math.min(18, (card.velocityX + microMotion) * compressionCurve)
    );

    card.currentY += Math.max(
      -18,
      Math.min(18, (card.velocityY + (microMotion * 0.7)) * compressionCurve)
    );
  },

  /* =========================================================
     RENDER CARDS
  ========================================================= */
  renderCards(time) {
    const energy = this.pointer.energy;

    this.cards.forEach(card => {
      const style = card.el.style;

      // setProperty individual — sin cssText +=
      style.setProperty("--tiltX", `${card.currentX.toFixed(3)}deg`);
      style.setProperty("--tiltY", `${card.currentY.toFixed(3)}deg`);

      style.setProperty("--magneticX", `${card.magneticCurrentX.toFixed(2)}px`);
      style.setProperty("--magneticY", `${card.magneticCurrentY.toFixed(2)}px`);

      style.setProperty("--proximity", card.proximity.toFixed(3));
      style.setProperty("--energy", card.energy.toFixed(3));

      style.setProperty("--mx", `${card.lightCurrentX.toFixed(2)}%`);
      style.setProperty("--my", `${card.lightCurrentY.toFixed(2)}%`);

      style.setProperty("--haloX", `${(card.lightCurrentX + card.currentY * 0.9).toFixed(2)}%`);
      style.setProperty("--haloY", `${(card.lightCurrentY + card.currentX * -0.9).toFixed(2)}%`);

      style.setProperty("--depthShiftX", `${(card.currentY * 0.045).toFixed(2)}px`);
      style.setProperty("--depthShiftY", `${(card.currentX * -0.045).toFixed(2)}px`);

      style.setProperty("--depthPresence", (card.proximity * 0.9 + card.energy * 0.25).toFixed(3));
      style.setProperty("--focusDepth", (0.72 + card.priority * 0.28).toFixed(3));
      style.setProperty("--atmosphericDepth", (card.proximity * 0.6 + card.energy * 0.18 + card.priority * 0.22).toFixed(3));
      style.setProperty("--foregroundAuthority", (card.priority * 0.72 + card.proximity * 0.28).toFixed(3));
      style.setProperty("--fieldPresence", (card.priority * 0.58 + card.energy * 0.16 + card.proximity * 0.22).toFixed(3));

      // breath
      const restEnergy = energy > 0.025 ? energy * 0.52 : 0;

      const idleField =
        Math.sin(time * 0.00022 + card.floatSeed) * 0.5 + 0.5;

      const lightBreath =
        (Math.sin(time * 0.00045) * 0.5 + 0.5) * 0.16 * restEnergy +
        idleField * 0.018;

      style.setProperty("--breath", lightBreath.toFixed(3));
    });
  },

  /* =========================================================
     HERO
  ========================================================= */
  updateHero() {
    const hero = this.hero;
    const atmosphere = this.atmosphere;

    if (!hero) return;

    if (this._isScrolling()) {
      hero.el.style.setProperty(
        "--atmosphere",
        atmosphere.breathing.toFixed(3)
      );
      return;
    }

    const authority = this.pointer.heroAuthority;

    hero.currentX += ((hero.targetX * authority) - hero.currentX) * 0.08;
    hero.currentY += ((hero.targetY * authority) - hero.currentY) * 0.08;

    const heroAtmosphere = Math.max(
      atmosphere.breathing,
      atmosphere.current * 0.9
    );

    hero.el.style.setProperty("--atmosphere", heroAtmosphere.toFixed(3));

    const tiltMagnitude = Math.sqrt(
      hero.currentX * hero.currentX +
      hero.currentY * hero.currentY
    ) / 6;

    // Respuesta rápida propia del hero — independiente de atmosphere
   // Respuesta rápida propia del hero — independiente de atmosphere
    hero._glowLevel = hero._glowLevel || 0;
    hero._glowLevel += (tiltMagnitude - hero._glowLevel) * 0.25;

    // 1) Apagado total en reposo: por debajo de este umbral, glow = 0
    const glowFloor = 0.04;
    let glow = Math.max(0, hero._glowLevel - glowFloor);

    // 2) Amplificar para que llegue a full (1) con un tilt normal
    glow = Math.min(glow * 2.6, 1);

   hero.el.parentElement.style.setProperty("--heroGlow", glow.toFixed(3));

   hero.el.parentElement.style.transform = `
      perspective(600px)
      rotateY(${hero.currentX * 0.9}deg)
      rotateX(${hero.currentY * 0.9}deg)
    `;
  },

  /* =========================================================
     UPDATE — loop principal
  ========================================================= */
  update() {
    const time = performance.now();

    if (!this.isVisible) {
      this.pointer.energy *= 0.92;
      return;
    }

    this.updatePointer();
    this.updateAudio();
    this.updateAtmosphere(time);
    this.updateCards(time);

    if (!this._isScrolling()) {
      this.renderCards(time);
    }

    this.updateHero();
  }

};

const IS_TOUCH_DEVICE =
  "ontouchstart" in window ||
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(pointer: coarse)").matches;

// ─── PLATFORM PROFILE ────────────────────────────────────
const PLATFORM = (() => {
  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isAndroid) return { name: "android", isAndroid: true, isIOS: false, isDesktop: false };
  if (isIOS) return { name: "ios", isAndroid: false, isIOS: true, isDesktop: false };
  return { name: "desktop", isAndroid: false, isIOS: false, isDesktop: true };
})();

document.addEventListener("visibilitychange", () => {
  VISART_ENGINE.isVisible = !document.hidden;
});

window.addEventListener("blur", () => {
  VISART_ENGINE.isVisible = false;
});

window.addEventListener("focus", () => {
  VISART_ENGINE.isVisible = true;
  VISART_ENGINE.pointer.velocity = 0;
  VISART_ENGINE.pointer.energy = 0;
  VISART_ENGINE.pointer.smoothedVelocity = 0;
});

document.addEventListener("DOMContentLoaded", () => {

  document.body.classList.add(`platform-${PLATFORM.name}`);

  window.addEventListener("pointermove", (e) => {
    const dx = e.clientX - VISART_ENGINE.pointer.lastX;
    const dy = e.clientY - VISART_ENGINE.pointer.lastY;

    const rawVelocity = Math.min(
      Math.sqrt(dx * dx + dy * dy) * 0.065,
      1
    );

    VISART_ENGINE.pointer.velocity =
      rawVelocity < 0.035 ? 0 : Math.pow(rawVelocity, 1.58);

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
  if (!heroCard || !PLATFORM.isDesktop) return;

  const heroData = {
    el: heroCard,
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0
  };

  VISART_ENGINE.setHero(heroData);

  window.addEventListener("pointermove", (e) => {
    // Centro del hero en pantalla
    const rect = heroCard.getBoundingClientRect();
    const heroCenterX = rect.left + rect.width * 0.5;
    const heroCenterY = rect.top + rect.height * 0.5;

    // Distancia del mouse al centro del hero
    const dx = e.clientX - heroCenterX;
    const dy = e.clientY - heroCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Radio de influencia: hasta dónde "siente" el hero al mouse.
    // Más grande = reacciona desde más lejos.
    const influenceRadius = Math.max(rect.width, rect.height) * 1.6;

    // Falloff: 1 en el centro, 0 al borde de la zona
    let falloff = 1 - distance / influenceRadius;
    falloff = Math.max(0, falloff);
    falloff = falloff * falloff; // curva suave

    const x = (dx / influenceRadius) * 28 * falloff;
    const y = (dy / influenceRadius) * -20 * falloff;

    heroData.targetX = x;
    heroData.targetY = y;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    heroData.targetX = 0;
    heroData.targetY = 0;
    VISART_ENGINE.pointer.velocity *= 0.4;
    VISART_ENGINE.pointer.energy *= 0.6;
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
      const proyectos = Array.isArray(data)
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
          return new Date(b.fecha || 0) - new Date(a.fecha || 0);
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

  const engineCard = {
    el: card,
    needsRectUpdate: true,
    rect: null,
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    velocityX: 0,
    velocityY: 0,
    speed: 0.12,
    floatSeed: Math.random() * 1000,
    floatIntensity: 0.85 + Math.random() * 0.35,
    proximity: 0,
    priority: 0,
    hover: false,
    magneticX: 0,
    magneticY: 0,
    magneticCurrentX: 0,
    magneticCurrentY: 0,
    lightX: 50,
    lightY: 50,
    lightCurrentX: 50,
    lightCurrentY: 50
  };

  VISART_ENGINE.addCard(engineCard);

  function handleCardMove(e) {
    if (!IS_TOUCH_DEVICE) {
      engineCard.hover = true;
    }

    const rect = card.getBoundingClientRect();
    const pointer = VISART_ENGINE.pointer;

    const px = Math.min(1, Math.max(0, (pointer.x - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (pointer.y - rect.top) / rect.height));

    const centeredX = (px - 0.5);
    const centeredY = (py - 0.5);

    const responseCurve = IS_TOUCH_DEVICE ? 1.34 : 1.22;

    const curveX =
      Math.sign(centeredX) *
      Math.pow(Math.min(Math.abs(centeredX), 0.92), responseCurve);

    const curveY =
      Math.sign(centeredY) *
      Math.pow(Math.min(Math.abs(centeredY), 0.92), responseCurve);

    const cinematicTilt = IS_TOUCH_DEVICE
      ? (7 + (engineCard.proximity * 1.8))
      : (18 + (engineCard.proximity * 5.8));

    engineCard.targetY = curveX * cinematicTilt;
    engineCard.targetX = -curveY * cinematicTilt;

    card.style.setProperty("--mx", `${px * 100}%`);
    card.style.setProperty("--my", `${py * 100}%`);
  }

  card.addEventListener("pointermove", handleCardMove, { passive: true });

  function handlePointerLeave() {
    engineCard.hover = false;

    if (PLATFORM.isAndroid) {
      // En Android el micro-bounce causa flash —
      // reset directo sin residual
      engineCard.targetX = 0;
      engineCard.targetY = 0;
      engineCard.velocityX = 0;
      engineCard.velocityY = 0;
    } else {
      const releaseX = engineCard.velocityX * 0.32;
      const releaseY = engineCard.velocityY * 0.32;
      engineCard.targetX = releaseX;
      engineCard.targetY = releaseY;
      setTimeout(() => {
        engineCard.targetX = 0;
        engineCard.targetY = 0;
      }, 120);
    }
  }

  card.addEventListener("pointerleave", handlePointerLeave);
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
    const point = path.getPointAtLength(Math.random() * pathLength);
    const viewBox = svg.viewBox.baseVal;

    const x = ((point.x - viewBox.x) / viewBox.width) * rect.width;
    const y = ((point.y - viewBox.y) / viewBox.height) * rect.height;

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
    if (VISART_ENGINE._isScrolling()) {
      requestAnimationFrame(animar);
      return;
    }

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
    if (VISART_ENGINE._isScrolling()) {
      requestAnimationFrame(animar);
      return;
    }

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
  window.addEventListener("resize", resize, { passive: true });
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

// ─── LISTENERS UNIFICADOS DE INVALIDACIÓN DE RECT ────────
// Un solo punto de control para resize y orientationchange.

window.addEventListener("resize", () => {
  VISART_ENGINE.cards.forEach(card => {
    card.needsRectUpdate = true;
  });
}, { passive: true });

window.addEventListener("orientationchange", () => {
  VISART_ENGINE.cards.forEach(card => {
    card.needsRectUpdate = true;
  });
}, { passive: true });

// ─── SCROLL FLAG ─────────────────────────────────────────

let _scrolling = false;
let _scrollTimeout;

window.addEventListener("scroll", () => {
  _scrolling = true;
  clearTimeout(_scrollTimeout);
  _scrollTimeout = setTimeout(() => {
    _scrolling = false;
    // Al terminar el scroll, invalidar todos los rects
    VISART_ENGINE.cards.forEach(card => {
      card.needsRectUpdate = true;
    });
  }, 80);
}, { passive: true });

// Exponer flag al engine
VISART_ENGINE._isScrolling = () => _scrolling;

VISART_ENGINE.start();
