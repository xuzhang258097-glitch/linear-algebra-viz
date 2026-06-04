/**
 * LinearViz Main Entry
 * Handles navigation, scroll effects, hero animation, and KaTeX rendering
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initHeroCanvas();
    initScrollEffects();
    initCardPreviews();
    initKaTeX();
    initVizToolbars();
    initPlayground();
});

/* ============================================
   Navigation
   ============================================ */
function initNavigation() {
    const nav = document.getElementById('mainNav');
    const progressBar = document.getElementById('progressBar');
    const links = document.querySelectorAll('.nav-link');

    // Scroll behavior
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Nav background
                nav.classList.toggle('scrolled', scrollY > 50);

                // Progress bar
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = (scrollY / docHeight) * 100;
                progressBar.style.width = `${progress}%`;

                // Active section
                updateActiveSection();

                ticking = false;
            });
            ticking = true;
        }
    });

    // Smooth scroll for nav links
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function updateActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-link');
    const scrollPos = window.scrollY + 150;

    sections.forEach(section => {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        const id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < bottom) {
            links.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        }
    });
}

/* ============================================
   Hero Canvas Animation
   ============================================ */
function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const setup = VizEngine.setupCanvas(canvas);
    if (!setup) return;

    const { ctx, width, height } = setup;
    const dpr = window.devicePixelRatio || 1;

    // Floating particles representing vectors/points
    const particles = [];
    const numParticles = 40;

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            radius: Math.random() * 2 + 1,
            opacity: Math.random() * 0.3 + 0.1
        });
    }

    // Connection lines between nearby particles
    function drawConnections() {
        const maxDist = 120;
        ctx.strokeStyle = 'rgba(91, 138, 114, 0.08)';
        ctx.lineWidth = 1;

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    ctx.globalAlpha = (1 - dist / maxDist) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    // Draw faint grid
    function drawHeroGrid() {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 1;
        const spacing = 60;

        for (let x = 0; x < width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    // Draw a faint vector field
    function drawVectorField(time) {
        const spacing = 80;
        ctx.strokeStyle = 'rgba(107, 140, 174, 0.08)';
        ctx.lineWidth = 1.5;

        for (let x = spacing; x < width; x += spacing) {
            for (let y = spacing; y < height; y += spacing) {
                const angle = Math.sin(x * 0.01 + time * 0.001) * Math.cos(y * 0.01 + time * 0.001) * Math.PI * 2;
                const len = 15;
                const endX = x + Math.cos(angle) * len;
                const endY = y + Math.sin(angle) * len;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();

                // Arrowhead
                ctx.fillStyle = 'rgba(107, 140, 174, 0.1)';
                ctx.beginPath();
                ctx.arc(endX, endY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    let animationId;
    function animate(time) {
        VizEngine.clear(ctx, width * dpr, height * dpr);
        ctx.save();
        ctx.scale(1 / dpr, 1 / dpr);

        drawHeroGrid();
        drawVectorField(time);

        // Update and draw particles
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            ctx.fillStyle = `rgba(91, 138, 114, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        drawConnections();
        ctx.restore();
        animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);

    // Pause when not visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!animationId) animationId = requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        });
    });
    observer.observe(canvas);
}

/* ============================================
   Scroll Effects (GSAP)
   ============================================ */
function initScrollEffects() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Animate section headers
    document.querySelectorAll('.section-header').forEach(header => {
        gsap.from(header.children, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none none'
            }
        });
    });

    // Animate topic cards
    document.querySelectorAll('.topic-card').forEach((card, i) => {
        gsap.from(card, {
            y: 60,
            opacity: 0,
            duration: 0.7,
            delay: i * 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // Animate app cards
    document.querySelectorAll('.app-card').forEach((card, i) => {
        gsap.from(card, {
            y: 50,
            opacity: 0,
            duration: 0.7,
            delay: i * 0.12,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // Animate concept blocks
    document.querySelectorAll('.concept-block').forEach((block, i) => {
        gsap.from(block, {
            x: -30,
            opacity: 0,
            duration: 0.6,
            delay: i * 0.15,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: block,
                start: 'top 85%',
                toggleActions: 'play none none none'
            }
        });
    });

    // Detail header animations
    document.querySelectorAll('.detail-header').forEach(header => {
        gsap.from(header, {
            y: 30,
            opacity: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: header,
                start: 'top 80%',
                toggleActions: 'play none none none'
            }
        });
    });

    // Section enter sound
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
        ScrollTrigger.create({
            trigger: section,
            start: 'top 60%',
            onEnter: () => {
                if (AudioSystem && AudioSystem.enabled) {
                    AudioSystem.playSectionEnter();
                }
            }
        });
    });
}

/* ============================================
   Card Preview Canvases
   ============================================ */
function initCardPreviews() {
    // Vector preview
    drawVectorPreview();
    // Matrix preview
    drawMatrixPreview();
    // Transform preview
    drawTransformPreview();
    // Determinant preview
    drawDeterminantPreview();
    // Eigen preview
    drawEigenPreview();
}

function drawVectorPreview() {
    const setup = VizEngine.setupCanvas('vectorPreview');
    if (!setup) return;
    const { ctx, width, height } = setup;

    const cx = width / 2, cy = height / 2;
    VizEngine.drawGrid(ctx, width, height, 30);
    VizEngine.drawAxes(ctx, width, height);

    const angle = Math.PI / 4;
    const len = 50;
    const endX = cx + Math.cos(angle) * len;
    const endY = cy - Math.sin(angle) * len;

    VizEngine.drawVector(ctx, cx, cy, endX, endY, VizEngine.colors.sage, 'v');
}

function drawMatrixPreview() {
    const setup = VizEngine.setupCanvas('matrixPreview');
    if (!setup) return;
    const { ctx, width, height } = setup;

    const cx = width / 2, cy = height / 2;
    const spacing = 25;

    ctx.save();
    for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
            const x = cx + i * spacing;
            const y = cy + j * spacing;
            const intensity = 1 - Math.abs(i + j) / 6;
            ctx.fillStyle = `rgba(91, 138, 114, ${0.15 + intensity * 0.3})`;
            ctx.fillRect(x - 8, y - 8, 16, 16);
        }
    }
    ctx.restore();
}

function drawTransformPreview() {
    const setup = VizEngine.setupCanvas('transformPreview');
    if (!setup) return;
    const { ctx, width, height } = setup;

    const cx = width / 2, cy = height / 2;

    // Original square
    const size = 30;
    const original = [
        { x: cx - size, y: cy - size },
        { x: cx + size, y: cy - size },
        { x: cx + size, y: cy + size },
        { x: cx - size, y: cy + size }
    ];

    VizEngine.drawPolygon(ctx, original, 'rgba(107, 140, 174, 0.15)', VizEngine.colors.blue, 1.5);

    // Transformed square (shear)
    const shear = 0.5;
    const transformed = original.map(p => ({
        x: cx + (p.x - cx) + shear * (p.y - cy),
        y: p.y
    }));

    VizEngine.drawPolygon(ctx, transformed, 'rgba(91, 138, 114, 0.2)', VizEngine.colors.sage, 2);
}

function drawDeterminantPreview() {
    const setup = VizEngine.setupCanvas('determinantPreview');
    if (!setup) return;
    const { ctx, width, height } = setup;

    const cx = width / 2, cy = height / 2;
    const size = 25;

    // Unit square
    const square = [
        { x: cx - size, y: cy - size },
        { x: cx + size, y: cy - size },
        { x: cx + size, y: cy + size },
        { x: cx - size, y: cy + size }
    ];

    VizEngine.drawPolygon(ctx, square, 'rgba(212, 165, 116, 0.2)', VizEngine.colors.apricot, 1.5);

    // Area indicator
    ctx.fillStyle = 'rgba(212, 165, 116, 0.3)';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('det = 1', cx, cy + 4);
}

function drawEigenPreview() {
    const setup = VizEngine.setupCanvas('eigenPreview');
    if (!setup) return;
    const { ctx, width, height } = setup;

    const cx = width / 2, cy = height / 2;

    VizEngine.drawGrid(ctx, width, height, 25);
    VizEngine.drawAxes(ctx, width, height);

    // Eigenvector lines
    ctx.save();
    ctx.strokeStyle = 'rgba(201, 123, 123, 0.4)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cx - 50, cy - 30);
    ctx.lineTo(cx + 50, cy + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 40);
    ctx.lineTo(cx + 40, cy - 40);
    ctx.stroke();

    // Arrow on eigenvector
    VizEngine.drawPoint(ctx, cx + 50, cy + 30, VizEngine.colors.rose, 4);
    ctx.restore();
}

/* ============================================
   KaTeX Rendering
   ============================================ */
function initKaTeX() {
    if (typeof renderMathInElement === 'undefined') {
        // Retry after a short delay
        setTimeout(initKaTeX, 500);
        return;
    }

    renderMathInElement(document.body, {
        delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        trust: true
    });
}

/* ============================================
   Viz Toolbar Switching
   ============================================ */
function initVizToolbars() {
    document.querySelectorAll('.viz-toolbar').forEach(toolbar => {
        const buttons = toolbar.querySelectorAll('.viz-btn');
        const panel = toolbar.closest('.viz-panel');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const vizType = btn.dataset.viz;
                const event = new CustomEvent('vizchange', {
                    detail: { type: vizType, panel: panel.id }
                });
                panel.dispatchEvent(event);

                if (AudioSystem && AudioSystem.enabled) {
                    AudioSystem.playClick();
                }
            });
        });
    });
}

/* ============================================
   Playground Setup
   ============================================ */
function initPlayground() {
    const playground = document.getElementById('playground');
    if (!playground) return;

    // Tool switching
    playground.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playground.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Matrix presets
    playground.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            applyMatrixPreset(preset);
        });
    });
}

function applyMatrixPreset(preset) {
    const presets = {
        identity: [1, 0, 0, 1],
        rotate90: [0, -1, 1, 0],
        scale2: [2, 0, 0, 2],
        shear: [1, 1, 0, 1],
        reflection: [-1, 0, 0, 1]
    };

    const m = presets[preset];
    if (!m) return;

    document.getElementById('pg00').textContent = m[0];
    document.getElementById('pg01').textContent = m[1];
    document.getElementById('pg10').textContent = m[2];
    document.getElementById('pg11').textContent = m[3];

    // Dispatch event for playground canvas
    const canvas = document.getElementById('playgroundCanvas');
    if (canvas) {
        canvas.dispatchEvent(new CustomEvent('matrixpreset', { detail: { matrix: m } }));
    }

    if (AudioSystem && AudioSystem.enabled) {
        AudioSystem.playMatrixUpdate();
    }
}

/* ============================================
   Quiz Assessment System
   ============================================ */
const quizState = {
    total: 14,
    answered: new Set(),
    correct: 0,
    wrong: 0
};

function checkAnswer(element, correctChoice, exerciseId) {
    if (quizState.answered.has(exerciseId)) return;
    quizState.answered.add(exerciseId);

    const userChoice = element.dataset.choice;
    const isCorrect = userChoice === correctChoice;
    const feedbackEl = document.getElementById('feedback-' + exerciseId);
    const exerciseBlock = element.closest('.exercise-block');

    // Style choices
    exerciseBlock.querySelectorAll('.choice-item').forEach(item => {
        item.style.pointerEvents = 'none';
        if (item.dataset.choice === correctChoice) {
            item.classList.add('correct');
        } else if (item.dataset.choice === userChoice && !isCorrect) {
            item.classList.add('wrong');
        }
    });

    // Show feedback
    if (isCorrect) {
        quizState.correct++;
        feedbackEl.textContent = '回答正确！';
        feedbackEl.className = 'exercise-feedback show correct';
        if (AudioSystem && AudioSystem.enabled) AudioSystem.playSuccess();
    } else {
        quizState.wrong++;
        feedbackEl.textContent = '回答错误。正确答案是 ' + correctChoice + '。';
        feedbackEl.className = 'exercise-feedback show wrong';
        if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
    }

    updateQuizPanel();
}

function updateQuizPanel() {
    const answered = quizState.answered.size;
    const total = quizState.total;
    const correct = quizState.correct;

    document.getElementById('quizProgressText').textContent = answered + '/' + total;
    document.getElementById('quizProgressFill').style.width = (answered / total * 100) + '%';
    document.getElementById('quizCorrect').textContent = correct;
    document.getElementById('quizWrong').textContent = quizState.wrong;

    const masteryEl = document.getElementById('quizMastery');
    const ratio = answered > 0 ? correct / answered : 0;

    if (answered === 0) {
        masteryEl.textContent = '未开始';
        masteryEl.style.color = 'var(--text-muted)';
    } else if (ratio >= 0.9 && answered >= 10) {
        masteryEl.textContent = '已精通';
        masteryEl.style.color = 'var(--accent-sage)';
    } else if (ratio >= 0.7 && answered >= 6) {
        masteryEl.textContent = '掌握良好';
        masteryEl.style.color = 'var(--accent-blue)';
    } else if (ratio >= 0.5) {
        masteryEl.textContent = '入门水平';
        masteryEl.style.color = 'var(--accent-apricot)';
    } else {
        masteryEl.textContent = '需加强';
        masteryEl.style.color = 'var(--accent-rose)';
    }
}

function toggleQuiz() {
    const panel = document.getElementById('quizPanel');
    panel.classList.toggle('collapsed');
}

/* ============================================
   Sandbox Console Functions
   ============================================ */
function sandboxGetValues() {
    return {
        v: [
            parseFloat(document.getElementById('sandboxVx').value) || 0,
            parseFloat(document.getElementById('sandboxVy').value) || 0
        ],
        m: [
            parseFloat(document.getElementById('sandboxM00').value) || 0,
            parseFloat(document.getElementById('sandboxM01').value) || 0,
            parseFloat(document.getElementById('sandboxM10').value) || 0,
            parseFloat(document.getElementById('sandboxM11').value) || 0
        ],
        k: parseFloat(document.getElementById('sandboxK').value) || 0
    };
}

function sandboxUpdateResult(text) {
    const el = document.getElementById('sandboxResult');
    if (el) {
        el.textContent = text;
        el.classList.add('value-sync');
        setTimeout(() => el.classList.remove('value-sync'), 300);
    }
}

function sandboxApplyVector() {
    const { v } = sandboxGetValues();
    const canvas = document.getElementById('playgroundCanvas');
    if (canvas) {
        canvas.dispatchEvent(new CustomEvent('sandboxvector', { detail: { vector: v } }));
    }
    sandboxUpdateResult(`向量 v = [${v[0].toFixed(2)}, ${v[1].toFixed(2)}]`);
    if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
}

function sandboxApplyMatrix() {
    const { m } = sandboxGetValues();
    const canvas = document.getElementById('playgroundCanvas');
    if (canvas) {
        canvas.dispatchEvent(new CustomEvent('sandboxmatrix', { detail: { matrix: m } }));
    }
    sandboxUpdateResult(`矩阵 M = [[${m[0].toFixed(2)}, ${m[1].toFixed(2)}], [${m[2].toFixed(2)}, ${m[3].toFixed(2)}]]`);
    if (AudioSystem && AudioSystem.enabled) AudioSystem.playMatrixUpdate();
}

function sandboxApplyScalar() {
    const { v, k } = sandboxGetValues();
    const result = [k * v[0], k * v[1]];
    const canvas = document.getElementById('playgroundCanvas');
    if (canvas) {
        canvas.dispatchEvent(new CustomEvent('sandboxscalar', { detail: { vector: v, scalar: k, result } }));
    }
    sandboxUpdateResult(`${k} * [${v[0].toFixed(2)}, ${v[1].toFixed(2)}] = [${result[0].toFixed(2)}, ${result[1].toFixed(2)}]`);
    if (AudioSystem && AudioSystem.enabled) AudioSystem.playSuccess();
}

function sandboxAnimateTransform() {
    const { m } = sandboxGetValues();
    const canvas = document.getElementById('playgroundCanvas');
    if (canvas) {
        canvas.dispatchEvent(new CustomEvent('sandboxanimate', { detail: { matrix: m } }));
    }
    sandboxUpdateResult('播放变换动画...');
    if (AudioSystem && AudioSystem.enabled) AudioSystem.playSectionEnter();
}

function sandboxClear() {
    const canvas = document.getElementById('playgroundCanvas');
    if (canvas) {
        canvas.dispatchEvent(new CustomEvent('sandboxclear'));
    }
    sandboxUpdateResult('画布已清空');
}

/* ============================================
   Transform Animation Trigger
   ============================================ */
function playTransformAnimation() {
    // Dispatch event to transforms.js
    const panel = document.getElementById('transformViz');
    if (panel) {
        panel.dispatchEvent(new CustomEvent('playstepanimation'));
    }
}

/* ============================================
   Vector Drag Interaction
   ============================================ */
function initVectorDrag(canvasId, onUpdate) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const state = {
        vecA: { x: 80, y: -60 },
        vecB: { x: -60, y: -80 },
        dragging: null
    };

    const getMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left - rect.width / 2,
            y: rect.height / 2 - (clientY - rect.top)
        };
    };

    const findHandle = (x, y) => {
        const threshold = 15;
        const distA = Math.hypot(x - state.vecA.x, y - state.vecA.y);
        const distB = Math.hypot(x - state.vecB.x, y - state.vecB.y);
        if (distA < threshold) return 'A';
        if (distB < threshold) return 'B';
        return null;
    };

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const handle = findHandle(pos.x, pos.y);
        if (handle) {
            state.dragging = handle;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (state.dragging) {
            if (state.dragging === 'A') {
                state.vecA.x = pos.x;
                state.vecA.y = pos.y;
            } else {
                state.vecB.x = pos.x;
                state.vecB.y = pos.y;
            }
            if (onUpdate) onUpdate(state);
            drawVectorScene();
        } else {
            const handle = findHandle(pos.x, pos.y);
            canvas.style.cursor = handle ? 'grab' : 'default';
        }
    });

    canvas.addEventListener('mouseup', () => {
        state.dragging = null;
        canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseleave', () => {
        state.dragging = null;
        canvas.style.cursor = 'default';
    });

    function drawVectorScene() {
        const setup = VizEngine.setupCanvas(canvasId);
        if (!setup) return;
        const { ctx, width, height } = setup;
        const cx = width / 2;
        const cy = height / 2;

        ctx.clearRect(0, 0, width, height);
        VizEngine.drawGrid(ctx, width, height, 30);
        VizEngine.drawAxes(ctx, width, height);

        // Vector A
        VizEngine.drawVector(ctx, cx, cy, cx + state.vecA.x, cy - state.vecA.y, VizEngine.colors.sage, 'a', 2.5);
        VizEngine.drawPoint(ctx, cx + state.vecA.x, cy - state.vecA.y, VizEngine.colors.sage, 6);

        // Vector B
        VizEngine.drawVector(ctx, cx, cy, cx + state.vecB.x, cy - state.vecB.y, VizEngine.colors.blue, 'b', 2.5);
        VizEngine.drawPoint(ctx, cx + state.vecB.x, cy - state.vecB.y, VizEngine.colors.blue, 6);

        // Sum vector
        const sumX = state.vecA.x + state.vecB.x;
        const sumY = state.vecA.y + state.vecB.y;
        VizEngine.drawVector(ctx, cx, cy, cx + sumX, cy - sumY, VizEngine.colors.apricot, 'a+b', 2.5);

        // Parallelogram
        VizEngine.drawParallelogram(ctx, cx, cy, state.vecA.x, -state.vecA.y, state.vecB.x, -state.vecB.y, 'rgba(212,165,116,0.1)', VizEngine.colors.apricot);

        // Update displays
        document.getElementById('vecAValue').textContent = `[${(state.vecA.x/40).toFixed(2)}, ${(state.vecA.y/40).toFixed(2)}]`;
        document.getElementById('vecBValue').textContent = `[${(state.vecB.x/40).toFixed(2)}, ${(state.vecB.y/40).toFixed(2)}]`;
        const dot = state.vecA.x * state.vecB.x + state.vecA.y * state.vecB.y;
        document.getElementById('dotProductValue').textContent = (dot/1600).toFixed(2);
    }

    drawVectorScene();
    return state;
}

/* ============================================
   Matrix Grid Drag Interaction
   ============================================ */
function initMatrixDrag(canvasId, onUpdate) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const state = {
        controlPoints: [
            { x: 80, y: 0 },   // e1 transformed
            { x: 0, y: -80 }   // e2 transformed
        ],
        dragging: null
    };

    const getMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left - rect.width / 2,
            y: rect.height / 2 - (clientY - rect.top)
        };
    };

    const findHandle = (x, y) => {
        const threshold = 18;
        for (let i = 0; i < state.controlPoints.length; i++) {
            const p = state.controlPoints[i];
            if (Math.hypot(x - p.x, y - p.y) < threshold) return i;
        }
        return null;
    };

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const handle = findHandle(pos.x, pos.y);
        if (handle !== null) {
            state.dragging = handle;
            canvas.style.cursor = 'grabbing';
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (state.dragging !== null) {
            state.controlPoints[state.dragging].x = pos.x;
            state.controlPoints[state.dragging].y = pos.y;
            if (onUpdate) onUpdate(state);
            drawMatrixScene();
        } else {
            const handle = findHandle(pos.x, pos.y);
            canvas.style.cursor = handle !== null ? 'grab' : 'default';
        }
    });

    canvas.addEventListener('mouseup', () => {
        state.dragging = null;
        canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseleave', () => {
        state.dragging = null;
        canvas.style.cursor = 'default';
    });

    function drawMatrixScene() {
        const setup = VizEngine.setupCanvas(canvasId);
        if (!setup) return;
        const { ctx, width, height } = setup;
        const cx = width / 2;
        const cy = height / 2;
        const scale = 80;

        ctx.clearRect(0, 0, width, height);

        // Draw rubber sheet
        VizEngine.initRubberSheet(width, height, 25);
        const matrix = [
            state.controlPoints[0].x / scale,
            state.controlPoints[1].x / scale,
            -state.controlPoints[0].y / scale,
            -state.controlPoints[1].y / scale
        ];
        VizEngine.transformRubberSheet(matrix);
        VizEngine.drawRubberSheet(ctx, width, height, { showGrid: true, showBasis: true });

        // Draw control points
        state.controlPoints.forEach((p, i) => {
            VizEngine.drawPoint(ctx, cx + p.x, cy - p.y, i === 0 ? VizEngine.colors.sage : VizEngine.colors.blue, 8);
            ctx.strokeStyle = i === 0 ? VizEngine.colors.sage : VizEngine.colors.blue;
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(cx + (i === 0 ? scale : 0), cy - (i === 1 ? scale : 0));
            ctx.lineTo(cx + p.x, cy - p.y);
            ctx.stroke();
            ctx.setLineDash([]);
        });

        // Update matrix inputs
        document.getElementById('m00').value = matrix[0].toFixed(2);
        document.getElementById('m01').value = matrix[1].toFixed(2);
        document.getElementById('m10').value = matrix[2].toFixed(2);
        document.getElementById('m11').value = matrix[3].toFixed(2);
    }

    drawMatrixScene();
    return state;
}
