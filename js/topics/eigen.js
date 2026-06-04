/**
 * Eigenvalue & Eigenvector Visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    initEigenViz();
});

function initEigenViz() {
    const panel = document.getElementById('eigenViz');
    if (!panel) return;

    const setup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
    if (!setup) return;

    const { ctx, width, height } = setup;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 55;

    let state = {
        matrix: [2, 1, 1, 2],
        mode: 'eigen2d',
        animTime: 0
    };

    function transformPoint(p, m) {
        return {
            x: m[0] * p.x + m[1] * p.y,
            y: m[2] * p.x + m[3] * p.y
        };
    }

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        VizEngine.drawGrid(ctx, width, height, scale);
        VizEngine.drawAxes(ctx, width, height);

        const m = state.matrix;
        const eigen = VizEngine.calculateEigen(m);

        if (state.mode === 'eigen2d') {
            // Draw unit circle
            VizEngine.drawUnitCircle(ctx, cx, cy, scale, 'rgba(107, 140, 174, 0.15)');

            // Draw eigenvector lines
            if (eigen) {
                const lineLen = 120;

                // Eigenvector 1
                ctx.save();
                ctx.strokeStyle = 'rgba(201, 123, 123, 0.5)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(cx - eigen.v1[0] * lineLen, cy + eigen.v1[1] * lineLen);
                ctx.lineTo(cx + eigen.v1[0] * lineLen, cy - eigen.v1[1] * lineLen);
                ctx.stroke();

                // Eigenvector 2
                ctx.strokeStyle = 'rgba(212, 165, 116, 0.5)';
                ctx.beginPath();
                ctx.moveTo(cx - eigen.v2[0] * lineLen, cy + eigen.v2[1] * lineLen);
                ctx.lineTo(cx + eigen.v2[0] * lineLen, cy - eigen.v2[1] * lineLen);
                ctx.stroke();
                ctx.restore();

                // Draw transformed ellipse
                ctx.strokeStyle = 'rgba(91, 138, 114, 0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let t = 0; t <= Math.PI * 2; t += 0.05) {
                    const p = { x: Math.cos(t), y: Math.sin(t) };
                    const tp = transformPoint(p, m);
                    const px = cx + tp.x * scale;
                    const py = cy - tp.y * scale;
                    if (t === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.stroke();

                // Mark eigenvector points on ellipse
                const tp1 = transformPoint({ x: eigen.v1[0], y: eigen.v1[1] }, m);
                VizEngine.drawPoint(ctx, cx + tp1.x * scale, cy - tp1.y * scale, VizEngine.colors.rose, 5);

                const tp2 = transformPoint({ x: eigen.v2[0], y: eigen.v2[1] }, m);
                VizEngine.drawPoint(ctx, cx + tp2.x * scale, cy - tp2.y * scale, VizEngine.colors.apricot, 5);
            }
        } else {
            // Animated visualization of vectors being transformed
            const numVecs = 12;
            for (let i = 0; i < numVecs; i++) {
                const angle = (i / numVecs) * Math.PI * 2 + state.animTime * 0.5;
                const p = { x: Math.cos(angle), y: Math.sin(angle) };
                const tp = transformPoint(p, m);

                const startX = cx + p.x * scale;
                const startY = cy - p.y * scale;
                const endX = cx + tp.x * scale;
                const endY = cy - tp.y * scale;

                // Draw original vector (faint)
                VizEngine.drawVector(ctx, cx, cy, startX, startY, 'rgba(107, 140, 174, 0.15)', '', 1);

                // Draw transformed vector
                const t = (Math.sin(state.animTime + i * 0.5) + 1) / 2;
                const curX = VizEngine.lerp(startX, endX, t);
                const curY = VizEngine.lerp(startY, endY, t);
                VizEngine.drawVector(ctx, cx, cy, curX, curY,
                    i % 2 === 0 ? VizEngine.colors.sageLight : VizEngine.colors.blueLight, '', 1.5);
            }
        }

        // Update eigen info
        updateEigenInfo(eigen);

        ctx.restore();
    }

    function updateEigenInfo(eigen) {
        const infoEl = document.getElementById('eigenInfo');
        if (!infoEl || !eigen) return;

        infoEl.innerHTML = `
            <div class="eigen-item">
                <span class="eigen-lambda">λ₁ = ${eigen.lambda1.toFixed(2)}</span>
                <span class="eigen-vec">v₁ = (${eigen.v1[0].toFixed(2)}, ${eigen.v1[1].toFixed(2)})</span>
            </div>
            <div class="eigen-item">
                <span class="eigen-lambda">λ₂ = ${eigen.lambda2.toFixed(2)}</span>
                <span class="eigen-vec">v₂ = (${eigen.v2[0].toFixed(2)}, ${eigen.v2[1].toFixed(2)})</span>
            </div>
        `;
    }

    // Matrix inputs
    const inputs = ['e00', 'e01', 'e10', 'e11'];
    function updateMatrix() {
        state.matrix = inputs.map(id => {
            const el = document.getElementById(id);
            return el ? parseFloat(el.value) || 0 : 0;
        });
        draw();
        if (AudioSystem && AudioSystem.enabled) AudioSystem.playMatrixUpdate();
    }

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', updateMatrix);
        }
    });

    // Mode switching
    const vizPanel = panel.closest('.viz-panel');
    vizPanel.addEventListener('vizchange', (e) => {
        state.mode = e.detail.type;
        draw();
        if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
    });

    // Animation loop for eigen visualization
    let animId;
    function animate(time) {
        state.animTime = time * 0.001;
        if (state.mode === 'eigenvis') {
            draw();
        }
        animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);

    draw();

    window.addEventListener('resize', () => {
        const newSetup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
        if (newSetup) {
            Object.assign(setup, newSetup);
            draw();
        }
    });
}
