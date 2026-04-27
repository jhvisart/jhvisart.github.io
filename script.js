document.addEventListener('DOMContentLoaded', () => {
    const heroCard = document.querySelector('.hero-card');
    const container = document.getElementById("projects-container");

    // 1. Animación del Hero (Mouse)
    window.addEventListener('mousemove', (e) => {
        if (!heroCard) return;
        const x = (e.clientX / window.innerWidth - 0.5) * 10;
        const y = (e.clientY / window.innerHeight - 0.5) * 10;
        heroCard.style.transform = `perspective(900px) rotateY(${x * 0.35}deg) rotateX(${y * -0.25}deg)`;
    });

    window.addEventListener('mouseleave', () => {
        if (heroCard) heroCard.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
    });
    
const path = window.location.pathname;

let tipo = null;

if (path.includes("visualizers")) {
  tipo = "visualizer";
}

if (path.includes("interactivos")) {
  tipo = "interactivo";
}
    // 2. Carga de Proyectos desde JSON
    fetch('data/proyectos.json')
        .then(res => res.json())
        .then(data => {
            // Asumimos estructura { "proyectos": [...] }
            const listaProyectos = data.proyectos || [];
            
            // Ordenar por fecha (descendente)
            listaProyectos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            listaProyectos.forEach(p => {
                const card = document.createElement("article");
                card.className = "project-card";
                card.innerHTML = `
                    <div class="project-thumb">
                        <img src="${p.img}" alt="${p.titulo}" crossorigin="anonymous" loading="lazy">
                        <span class="project-badge">Demo en vivo</span>
                    </div>
                    <div class="project-body">
                        <div class="project-top">
                            <h3>${p.titulo}</h3>
                            <span class="project-tag">${p.tag || 'Proyecto'}</span>
                        </div>
                        <p>${p.descripcion}</p>
                        <div class="project-actions">
                            <a class="btn btn-primary" href="${p.manifestacion}" target="_blank">Ver demo</a>
                        </div>
                    </div>
                `;
                container.appendChild(card);

                // Aplicar color dominante al badge
                const img = card.querySelector("img");
                const badge = card.querySelector(".project-badge");
                aplicarColorDominante(img, badge);
            });
        })
        .catch(err => console.error("Error cargando JSON:", err));
});

// Función para color dominante (Mejorada para no romper la carga)
function aplicarColorDominante(img, badge) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    img.onload = () => {
        try {
            canvas.width = 10; // Reducido para velocidad
            canvas.height = 10;
            ctx.drawImage(img, 0, 0, 10, 10);
            const data = ctx.getImageData(0, 0, 10, 10).data;

            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 125) continue;
                r += data[i]; g += data[i + 1]; b += data[i + 2];
                count++;
            }

            if (count > 0) {
                const color = `rgb(${Math.round(r/count)}, ${Math.round(g/count)}, ${Math.round(b/count)})`;
                badge.style.borderColor = color;
                badge.style.boxShadow = `0 0 14px ${color}`;
            }
        } catch (e) {
            badge.style.borderColor = "#00ffe0";
        }
    };
    // Forzar ejecución si ya cargó
    if (img.complete) img.onload();
}
const c = document.getElementById('bgFX');

// ⚠️ si no existe, evita errores
if (c) {
  const ctx = c.getContext('2d');

  function resize(){
    c.width = c.offsetWidth;
    c.height = c.offsetHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  const P = [];
  for(let i=0;i<100;i++){
    P.push({
      x: Math.random()*c.width,
      y: Math.random()*c.height,
      r: Math.random()*1.5+0.5,
      vx: (Math.random()-0.5)*0.3,
      vy: (Math.random()-0.5)*0.3,
      a: Math.random()*Math.PI*2
    });
  }

  function loop(){
    ctx.clearRect(0,0,c.width,c.height);

    // glow central suave
    const g = ctx.createRadialGradient(
      c.width/2, c.height/2, 0,
      c.width/2, c.height/2, c.width*0.6
    );
    g.addColorStop(0, "rgba(40,120,255,0.15)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,c.width,c.height);

    // partículas
    P.forEach(p=>{
      p.x += p.vx;
      p.y += p.vy;
      p.a += 0.02;

      if(p.x<0||p.x>c.width) p.vx*=-1;
      if(p.y<0||p.y>c.height) p.vy*=-1;

      const pulse = Math.sin(p.a)*0.7+1;

      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r*pulse,0,Math.PI*2);
      ctx.fillStyle = `rgba(120,180,255,${0.5*pulse})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#5aa0ff";
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    requestAnimationFrame(loop);
  }

  loop();
}

const v = document.querySelector('.bg-video');

if (v) {
  v.muted = true;
  v.loop = true;

  const playSafe = () => v.play().catch(()=>{});

  v.addEventListener('ended', () => {
    v.currentTime = 0;
    playSafe();
  });

  v.addEventListener('pause', () => {
    playSafe();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) playSafe();
  });

  playSafe();
}

const container = document.querySelector('.v-particles');

function createParticle() {
  const p = document.createElement('span');

  // colores VISART
  const colors = ['#00eaff', '#3b82f6', '#7b61ff'];
  p.style.background = colors[Math.floor(Math.random()*colors.length)];
  p.style.boxShadow = `0 0 8px ${p.style.background}`;

  // posición inicial (centro)
  p.style.left = '50%';
  p.style.top = '50%';

  // dirección aleatoria
  const x = (Math.random() - 0.5) * 80 + 'px';
  const y = (Math.random() - 0.5) * 80 + 'px';

  p.style.setProperty('--x', x);
  p.style.setProperty('--y', y);

  container.appendChild(p);

  setTimeout(() => p.remove(), 2000);
}

// generar partículas continuamente
setInterval(createParticle, 120);

(function(){
  const container = document.querySelector('.v-particles');
  if(!container) return;

  const points = [
    { x: 30, y: 20 },
    { x: 40, y: 50 },
    { x: 50, y: 85 },
    { x: 60, y: 50 },
    { x: 70, y: 20 }
  ];

  function createParticle() {
    const p = document.createElement('span');

    const colors = ['#00eaff', '#3b82f6', '#7b61ff'];
    const color = colors[Math.floor(Math.random()*colors.length)];

    p.style.background = color;
    p.style.boxShadow = `0 0 8px ${color}`;

    const point = points[Math.floor(Math.random()*points.length)];

    p.style.left = point.x + '%';
    p.style.top = point.y + '%';

    const x = (Math.random() - 0.5) * 60 + 'px';
    const y = (Math.random() - 0.5) * 60 + 'px';

    p.style.setProperty('--x', x);
    p.style.setProperty('--y', y);

    container.appendChild(p);

    setTimeout(() => p.remove(), 2000);
  }

  setInterval(createParticle, 120);
})();

(function(){
  const path = document.querySelector('.v-nav path');
  const container = document.querySelector('.v-particles');
  if(!path || !container) return;

  const length = path.getTotalLength();

  function createParticle() {
    const p = document.createElement('span');

    // color VISART
    const colors = ['#00eaff', '#3b82f6', '#7b61ff'];
    const color = colors[Math.floor(Math.random()*colors.length)];

    p.style.background = color;
    p.style.boxShadow = `0 0 8px ${color}`;

    // 🔥 punto EXACTO en la V
    const point = path.getPointAtLength(Math.random() * length);

    p.style.left = point.x + 'px';
    p.style.top = point.y + 'px';

    // movimiento
    const x = (Math.random() - 0.5) * 40 + 'px';
    const y = (Math.random() - 0.5) * 40 + 'px';

    p.style.setProperty('--x', x);
    p.style.setProperty('--y', y);

    container.appendChild(p);

    setTimeout(() => p.remove(), 1500);
  }

  setInterval(createParticle, 120);
})();
