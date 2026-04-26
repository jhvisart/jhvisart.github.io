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

    // 2. Carga de Proyectos desde JSON
    fetch('proyectos.json')
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
