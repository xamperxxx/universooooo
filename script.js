// ==================== CONFIGURACIÓN ====================
const CONFIG = {
    starCount: 1400,
    heartParticles: 2500,
    galaxyArms: 4,
    galaxyParticles: 3000,
    planetCount: 8,
    orbitRadiusX: 340,   // radio horizontal
    orbitRadiusY: 145,   // radio vertical (perspectiva)
    orbitSpeed: 0.00020,
    zoomMin: 1.0,
    zoomMax: 3.0,
    zoomStep: 0.12
};

// ==================== DATOS DE LOS PLANETAS ====================
const PLANETS_DATA = [
    {
        image: 'img/planeta1.png',
        label: 'TU SONRISA',
        title: 'Tu Sonrisa',
        message: 'Tu sonrisa es la luz que atraviesa cualquier oscuridad. Es mi amanecer favorito, mi razón para despertar cada día.'
    },
    {
        image: 'img/planeta2.png',
        label: 'MI LUGAR FAVORITO',
        title: 'Mi Lugar Favorito',
        message: 'Mi lugar favorito en el universo es entre tus brazos. Ahí el tiempo se detiene y todo tiene sentido.'
    },
    {
        image: 'img/planeta3.png',
        label: 'CONSTELACIÓN DE TI',
        title: 'Constelación de Ti',
        message: 'Si pudiera dibujar una constelación, sería con la forma de tu nombre, para tenerte siempre brillando sobre mí.'
    },
    {
        image: 'img/planeta4.png',
        label: 'INFINITO',
        title: 'Infinito',
        message: 'Contigo descubrí que el infinito no es un número, es un sentimiento. Y contigo, quiero que sea para siempre.'
    },
    {
        image: 'img/planeta5.png',
        label: 'NEBULOSA DE BESOS',
        title: 'Nebulosa de Besos',
        message: 'Cada beso tuyo es como una nebulosa: hermoso, misterioso y lleno de estrellas naciendo en mi corazón.'
    },
    {
        image: 'img/planeta6.png',
        label: 'GRAVEDAD DE AMOR',
        title: 'Gravedad de Amor',
        message: 'Tu amor es mi gravedad. Sin ti, floto perdido en el espacio. Contigo, cada órbita tiene un propósito.'
    },
    {
        image: 'img/planeta7.png',
        label: 'PROMESA ESTELAR',
        title: 'Promesa Estelar',
        message: 'Prometo ser tu luz en las noches oscuras, tu sol en los días grises, y tu estrella fugaz para todos tus deseos.'
    },
    {
        image: 'img/planeta8.png',
        label: 'NUESTRO COSMOS',
        title: 'Nuestro Cosmos',
        message: 'Este cosmos es nuestro. Cada estrella, cada planeta, cada galaxia... todo me recuerda a lo infinito de mi amor por ti.'
    }
];

// ==================== VARIABLES GLOBALES ====================
let canvas, ctx;
let width, height;
let centerX, centerY;
let animationId;
let time = 0;
let planets = [];
let isStarted = false;

// Variables de cámara
let camera = {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
};

// Estrellas: dos capas — fijas en pantalla (fondo) + las del scene-container
const starsFixed = [];    // se dibujan en canvas siempre cubriendo pantalla completa
const starsBg = [];       // extras en scene-container (se mueven con zoom)

// Three.js
let scene3D, camera3D, renderer;
let heartMesh, galaxyPoints;
let heartAnimProgress = 0;
let heartAnimDone = false;

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {

    // Estrellas FIJAS (cubren pantalla completa siempre, no se escalan con zoom)
    for (let i = 0; i < 900; i++) {
        starsFixed.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.8 + 0.2,
            opacity: Math.random() * 0.7 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.004,
            twinkleOffset: Math.random() * Math.PI * 2,
            color: getStarColor()
        });
    }

    // Estrellas del scene-container (se ven más lejos, para profundidad)
    for (let i = 0; i < 500; i++) {
        starsBg.push({
            x: (Math.random() - 0.5) * 6000,
            y: (Math.random() - 0.5) * 6000,
            size: Math.random() * 1.2 + 0.15,
            opacity: Math.random() * 0.5 + 0.1,
            twinkleSpeed: Math.random() * 0.015 + 0.003,
            twinkleOffset: Math.random() * Math.PI * 2,
            color: getStarColor()
        });
    }

    document.getElementById('start-btn').addEventListener('click', startExperience);
    document.getElementById('close-modal').addEventListener('click', closeModal);

    document.getElementById('zoom-in').addEventListener('click', () => zoomCamera(CONFIG.zoomStep));
    document.getElementById('zoom-out').addEventListener('click', () => zoomCamera(-CONFIG.zoomStep));
    document.getElementById('zoom-reset').addEventListener('click', resetCamera);

    document.addEventListener('wheel', handleWheel, { passive: false });

    const mainContent = document.getElementById('main-content');
    mainContent.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    mainContent.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', dragTouch, { passive: false });
    document.addEventListener('touchend', endDrag);

    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal();
    });
});

function getStarColor() {
    const colors = [
        'rgba(255,255,255,',
        'rgba(210,225,255,',
        'rgba(255,210,230,',
        'rgba(255,245,180,',
        'rgba(200,215,255,'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function startExperience() {
    isStarted = true;
    document.getElementById('start-screen').classList.add('hidden');

    const mainContent = document.getElementById('main-content');
    mainContent.classList.remove('hidden');
    setTimeout(() => mainContent.classList.add('visible'), 100);

    initCanvas();
    initThreeJS();
    createPlanets();

    setTimeout(() => animatePhotosEntrance(), 2000);
    setTimeout(() => animateLabelsEntrance(), 3000);

    animate();
}

// ==================== CÁMARA ====================
function handleWheel(e) {
    if (!isStarted) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -CONFIG.zoomStep : CONFIG.zoomStep;
    zoomCamera(delta);
}

function zoomCamera(delta) {
    camera.zoom = Math.max(CONFIG.zoomMin, Math.min(CONFIG.zoomMax, camera.zoom + delta));
    updateCameraTransform();
}

function resetCamera() {
    camera.zoom = 1;
    camera.offsetX = 0;
    camera.offsetY = 0;
    updateCameraTransform();
}

function updateCameraTransform() {
    const sceneEl = document.getElementById('scene-container');
    sceneEl.style.transform = `translate(calc(-50% + ${camera.offsetX}px), calc(-50% + ${camera.offsetY}px)) scale(${camera.zoom})`;
}

function startDrag(e) {
    // Arrastre desactivado: se mantiene el fondo fijo.
    return;
}

function startDragTouch(e) {
    // Arrastre desactivado: se mantiene el fondo fijo.
    return;
}

function drag(e) {
    if (!camera.isDragging) return;
    e.preventDefault();
    camera.offsetX += e.clientX - camera.lastMouseX;
    camera.offsetY += e.clientY - camera.lastMouseY;
    camera.lastMouseX = e.clientX;
    camera.lastMouseY = e.clientY;
    updateCameraTransform();
}

function dragTouch(e) {
    if (!camera.isDragging) return;
    e.preventDefault();
    camera.offsetX += e.touches[0].clientX - camera.lastMouseX;
    camera.offsetY += e.touches[0].clientY - camera.lastMouseY;
    camera.lastMouseX = e.touches[0].clientX;
    camera.lastMouseY = e.touches[0].clientY;
    updateCameraTransform();
}

function endDrag() { camera.isDragging = false; }

// ==================== CANVAS 2D ====================
function initCanvas() {
    canvas = document.getElementById('galaxy-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;

    // Redistribuir estrellas fijas al cambiar tamaño
    starsFixed.forEach(s => {
        s.x = Math.random() * width;
        s.y = Math.random() * height;
    });

    if (renderer) {
        renderer.setSize(width, height);
        camera3D.aspect = width / height;
        camera3D.updateProjectionMatrix();
    }
}

// ==================== THREE.JS ====================
function initThreeJS() {
    scene3D = new THREE.Scene();
    camera3D = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const container = document.getElementById('scene-container');
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '-50vh';
    renderer.domElement.style.left = '-50vw';
    renderer.domElement.style.width = '100vw';
    renderer.domElement.style.height = '100vh';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '2';
    container.appendChild(renderer.domElement);

    camera3D.position.set(0, 3.5, 6);
    camera3D.lookAt(0, 0.5, 0);

    createHeartParticles();
    createGalaxyParticles();
}

// ==================== CORAZÓN RELLENO ====================
function createHeartParticles() {
    // Función paramétrica del corazón
    function heartPoint(t) {
        const scale = 0.082;
        return {
            x: scale * 16 * Math.pow(Math.sin(t), 3),
            y: scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
        };
    }

    const outlineCount = 1400;
    const fillCount = 1100;
    const particleCount = outlineCount + fillCount;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0xFF1744);  // Rojo-Rosa intenso
    const c2 = new THREE.Color(0xE63946);  // Rojo carmesí
    const c3 = new THREE.Color(0xFF4081);  // Rosa rojo
    const c4 = new THREE.Color(0xC2185B);  // Rojo profundo

    // --- CONTORNO ---
    for (let i = 0; i < outlineCount; i++) {
        const t = (i / outlineCount) * Math.PI * 2;
        const p = heartPoint(t);
        positions[i * 3]     = p.x + (Math.random() - 0.5) * 0.01;
        positions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.01;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.06;

        const mix = Math.random();
        const fc = new THREE.Color();
        if (mix < 0.4) fc.copy(c1).lerp(c2, Math.random());
        else if (mix < 0.75) fc.copy(c2).lerp(c4, Math.random());
        else fc.copy(c3).lerp(c1, Math.random());

        colors[i * 3] = fc.r;
        colors[i * 3 + 1] = fc.g;
        colors[i * 3 + 2] = fc.b;
    }

    // --- RELLENO: muestreo por bounding box + test de punto dentro del corazón ---
    // Límites del corazón paramétrico (en unidades scale=0.082)
    // x en [-1.31, 1.31], y en [-1.06, 1.07]
    const xMin = -1.32, xMax = 1.32;
    const yMin = -1.08, yMax = 1.08;
    const scale = 0.082;

    let filled = 0;
    let safety = 0;

    while (filled < fillCount && safety < fillCount * 30) {
        safety++;
        const rx = xMin + Math.random() * (xMax - xMin);
        const ry = yMin + Math.random() * (yMax - yMin);

        // Convertir de espacio "normalizado" a espacio de la ecuación implícita
        // Corazón implícito: (x²+y²-1)³ - x²y³ ≤ 0
        // Nuestro corazón paramétrico tiene centro distinto; usar aproximación con
        // ray-casting: contar cruces con el contorno paramétrico
        if (isInsideHeartImplicit(rx, ry)) {
            const idx = outlineCount + filled;
            positions[idx * 3]     = rx * scale;
            positions[idx * 3 + 1] = ry * scale;
            positions[idx * 3 + 2] = (Math.random() - 0.5) * 0.04;

            // Color interior más intenso y lleno
            const alpha = 0.65 + Math.random() * 0.35;  // Mayor opacidad
            const fc = new THREE.Color();
            fc.copy(c1).lerp(c2, Math.random());
            colors[idx * 3]     = fc.r * alpha;
            colors[idx * 3 + 1] = fc.g * alpha;
            colors[idx * 3 + 2] = fc.b * alpha;

            filled++;
        }
    }

    // Rellenar los no completados
    for (let i = outlineCount + filled; i < particleCount; i++) {
        const t = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.6;
        const p = heartPoint(t);
        positions[i * 3]     = p.x * r;
        positions[i * 3 + 1] = p.y * r;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
        colors[i * 3]     = c2.r * 0.3;
        colors[i * 3 + 1] = c2.g * 0.3;
        colors[i * 3 + 2] = c2.b * 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.055,  // Tamaño ligeramente mayor para mayor cobertura
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0
    });

    heartMesh = new THREE.Points(geometry, material);
    heartMesh.position.set(0, 1.8, 0);
    heartMesh.scale.set(0.01, 0.01, 0.01);
    scene3D.add(heartMesh);
}

// Ecuación implícita del corazón normalizado
// x ∈ [-1.5,1.5], y ∈ [-1.5,1.5]
function isInsideHeartImplicit(px, py) {
    // Mapear nuestras coordenadas (x∈[-1.32,1.32], y∈[-1.08,1.08]) al corazón implícito
    // El corazón implícito: (x²+y²-1)³ ≤ x²y³
    // Necesita x∈[-1.5,1.5], y∈[-1.2,1.2] aprox
    const x = px / 1.32 * 1.1;
    const y = -(py - 0.1) / 1.1 * 1.1;  // invertir y y ajustar centro
    const val = Math.pow(x * x + y * y - 1, 3) - x * x * Math.pow(y, 3);
    return val <= 0.05;
}

function createGalaxyParticles() {
    const particleCount = CONFIG.galaxyParticles;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const arms = CONFIG.galaxyArms;
    const galaxySize = 4.0;

    for (let i = 0; i < particleCount; i++) {
        const armIndex = i % arms;
        const t = i / particleCount;
        const armOffset = (armIndex / arms) * Math.PI * 2;
        const spiralAngle = armOffset + t * Math.PI * 5;
        const distance = t * galaxySize;
        const spread = 0.3;

        positions[i * 3]     = Math.cos(spiralAngle) * distance + (Math.random() - 0.5) * spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
        positions[i * 3 + 2] = Math.sin(spiralAngle) * distance + (Math.random() - 0.5) * spread;

        const color = new THREE.Color().setHSL(0.73 + t * 0.18 + Math.random() * 0.06, 0.5 + Math.random() * 0.5, 0.25 + t * 0.55);
        colors[i * 3]     = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.022,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.75
    });

    galaxyPoints = new THREE.Points(geometry, material);
    galaxyPoints.rotation.x = -Math.PI / 2.5;
    scene3D.add(galaxyPoints);
}

// ==================== PLANETAS BIEN ESPACIADOS ====================
function createPlanets() {
    const container = document.getElementById('planets-container');

    // 8 ángulos equidistantes sobre la elipse, empezando arriba
    const angles = Array.from({ length: 8 }, (_, i) =>
        -Math.PI / 2 + (i / 8) * Math.PI * 2
    );

    PLANETS_DATA.forEach((data, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'planet-wrapper';
        wrapper.dataset.index = index;

        const angle = angles[index];
        if (Math.cos(angle) < 0) wrapper.classList.add('left-side');

        const imgDiv = document.createElement('div');
        imgDiv.className = 'planet-img';
        imgDiv.innerHTML = `<img src="${data.image}" alt="${data.title}"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22><circle cx=%2240%22 cy=%2240%22 r=%2238%22 fill=%22%23ff69b4%22/><text x=%2240%22 y=%2245%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2230%22>❤️</text></svg>'">`;
        imgDiv.addEventListener('click', () => openModal(data));

        const label = document.createElement('span');
        label.className = 'planet-label';
        label.textContent = data.label;

        wrapper.appendChild(imgDiv);
        wrapper.appendChild(label);
        container.appendChild(wrapper);

        const rx = CONFIG.orbitRadiusX;
        const ry = CONFIG.orbitRadiusY;
        const x = Math.cos(angle) * rx;
        const y = Math.sin(angle) * ry;

        wrapper.style.left = `${x}px`;
        wrapper.style.top  = `${y}px`;

        planets.push({
            wrapper, imgDiv, label,
            angle,
            rx, ry,
            speed: CONFIG.orbitSpeed * (0.8 + Math.random() * 0.4),
            index
        });
    });
}

function animatePhotosEntrance() {
    planets.forEach(p => p.imgDiv.classList.add('visible'));
}

function animateLabelsEntrance() {
    planets.forEach((p, i) => {
        setTimeout(() => p.label.classList.add('visible'), i * 80);
    });
}

// ==================== LOOP PRINCIPAL ====================
function animate() {
    if (!isStarted) return;
    time += 0.016;

    // Animación de entrada elástica del corazón
    if (!heartAnimDone && heartMesh) {
        heartAnimProgress = Math.min(1, heartAnimProgress + 0.010);
        const s = easeOutElastic(heartAnimProgress);
        heartMesh.scale.set(s, s, s);
        heartMesh.material.opacity = Math.min(0.92, heartAnimProgress * 1.6);
        if (heartAnimProgress >= 1) heartAnimDone = true;
    }

    // ── CANVAS: fondo + estrellas FIJAS (no afectadas por zoom) ──
    ctx.fillStyle = 'rgba(0,0,5,1)';
    ctx.fillRect(0, 0, width, height);

    drawNebula();
    drawFixedStars();   // estrellas fijas cubriendo siempre la pantalla completa
    drawSceneStars();   // estrellas del scene-container (perspectiva)

    // Corazón: pulso suave una vez terminada la entrada
    if (heartAnimDone && heartMesh) {
        heartMesh.rotation.y = time * 0.18;
        const pulse = 1 + Math.sin(time * 1.8) * 0.025;
        heartMesh.scale.set(pulse, pulse, pulse);
    } else if (heartMesh) {
        heartMesh.rotation.y = time * 0.18;
    }

    if (renderer && scene3D && camera3D) renderer.render(scene3D, camera3D);

    updatePlanets();

    animationId = requestAnimationFrame(animate);
}

function easeOutElastic(t) {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
}

// ==================== NEBULOSA ====================
function drawNebula() {
    const g = ctx.createRadialGradient(centerX, centerY + 60, 0, centerX, centerY + 60, 420);
    g.addColorStop(0, 'rgba(90, 0, 70, 0.10)');
    g.addColorStop(0.5, 'rgba(40, 0, 80, 0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
}

// Estrellas FIJAS — siempre cubren toda la pantalla independientemente del zoom
function drawFixedStars() {
    starsFixed.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset);
        const opacity = star.opacity * (0.4 + (twinkle + 1) * 0.3);

        // Halo para estrellas grandes
        if (star.size > 1.3) {
            const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3.5);
            grd.addColorStop(0, `${star.color}${Math.min(opacity, 0.8).toFixed(2)})`);
            grd.addColorStop(1, `${star.color}0)`);
            ctx.fillStyle = grd;
            ctx.fillRect(star.x - star.size * 3.5, star.y - star.size * 3.5, star.size * 7, star.size * 7);
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${opacity.toFixed(2)})`;
        ctx.fill();
    });
}

// Estrellas del scene-container (con offset de cámara para profundidad parallax)
function drawSceneStars() {
    const px = centerX - camera.offsetX * 0.15;
    const py = centerY - camera.offsetY * 0.15;

    starsBg.forEach(star => {
        const twinkle = Math.sin(time * star.twinkleSpeed * 60 + star.twinkleOffset);
        const opacity = star.opacity * (0.3 + (twinkle + 1) * 0.25);

        ctx.beginPath();
        ctx.arc(px + star.x * 0.3, py + star.y * 0.3, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${opacity.toFixed(2)})`;
        ctx.fill();
    });
}

// ==================== PLANETAS ====================
function updatePlanets() {
    planets.forEach(planet => {
        planet.angle += planet.speed;

        const x = Math.cos(planet.angle) * planet.rx;
        const y = Math.sin(planet.angle) * planet.ry;

        planet.wrapper.style.left = `${x}px`;
        planet.wrapper.style.top  = `${y}px`;

        // Label izquierda/derecha según posición
        if (Math.cos(planet.angle) >= 0) {
            planet.wrapper.classList.remove('left-side');
        } else {
            planet.wrapper.classList.add('left-side');
        }

        // Profundidad: los de "atrás" (y negativo en la elipse) son más pequeños
        const depth = Math.sin(planet.angle);            // -1 (atrás) a +1 (adelante)
        const scale   = 0.62 + (depth + 1) * 0.30;      // 0.62 … 1.22
        const opacity = 0.50 + (depth + 1) * 0.24;      // 0.50 … 0.98
        const zIndex  = 10 + Math.floor((depth + 1) * 50);

        planet.wrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
        planet.wrapper.style.opacity   = Math.min(1, opacity);
        planet.wrapper.style.zIndex    = zIndex;
    });
}

// ==================== MODAL ====================
function openModal(data) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-img').src = data.image;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-message').textContent = data.message;
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
}

function openModal(data) {
    const modal = document.getElementById('modal');
    document.getElementById('modal-img').src = data.image;
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-message').textContent = data.message;
    modal.classList.remove('hidden');
    modal.focus();
}