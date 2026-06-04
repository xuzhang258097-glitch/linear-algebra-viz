/**
 * Matrix Visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    initMatrixViz();
});

function initMatrixViz() {
    const panel = document.getElementById('matrixViz');
    if (!panel) return;

    const setup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
    if (!setup) return;

    const { ctx, width, height } = setup;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 50;

    let state = {
        mode: 'multiply',
        matrix: [1, 0, 0, 1],
        animProgress: 1,
        controlPoints: [
            { x: scale, y: 0 },    // e1 transformed
            { x: 0, y: -scale }    // e2 transformed
        ],
        isDragging: false,
        dragTarget: null,
        comparisonMode: 'ab', // 'ab' or 'ba'
        matrixA: [1, 0.5, 0.3, 1],
        matrixB: [1.2, -0.3, 0.2, 0.8]
    };

    const unitSquare = [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 }
    ];

    function transformPoint(p, m) {
        return {
            x: m[0] * p.x + m[1] * p.y,
            y: m[2] * p.x + m[3] * p.y
        };
    }

    function getMousePos(e) {
        const rect = panel.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function findHandle(mx, my) {
        const threshold = 18;
        for (let i = 0; i < state.controlPoints.length; i++) {
            const p = state.controlPoints[i];
            if (Math.hypot(mx - (cx + p.x), my - (cy + p.y)) < threshold) return i;
        }
        return null;
    }

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        VizEngine.drawGrid(ctx, width, height, scale);
        VizEngine.drawAxes(ctx, width, height);

        const m = state.matrix;
        const progress = state.animProgress;

        // Interpolate matrix for animation
        const interpM = [
            VizEngine.lerp(1, m[0], progress),
            VizEngine.lerp(0, m[1], progress),
            VizEngine.lerp(0, m[2], progress),
            VizEngine.lerp(1, m[3], progress)
        ];

        if (state.mode === 'abba') {
            // AB vs BA comparison mode
            drawComparison(ctx, cx, cy, scale);
        } else {
            // Standard mode with rubber sheet
            VizEngine.initRubberSheet(width, height, 25);
            VizEngine.transformRubberSheet(interpM);
            VizEngine.drawRubberSheet(ctx, width, height, { showGrid: true, showBasis: true, color: VizEngine.colors.sage, opacity: 0.35 });

            // Draw original faint unit square
            const originalPoints = unitSquare.map(p => ({
                x: cx + p.x * scale,
                y: cy - p.y * scale
            }));
            VizEngine.drawPolygon(ctx, originalPoints, 'rgba(107, 140, 174, 0.08)', VizEngine.colors.blueLight, 1);

            // Draw transformed square
            const transformed = unitSquare.map(p => {
                const tp = transformPoint(p, interpM);
                return { x: cx + tp.x * scale, y: cy - tp.y * scale };
            });

            VizEngine.drawPolygon(ctx, transformed, 'rgba(91, 138, 114, 0.2)', VizEngine.colors.sage, 2.5);

            // Draw basis vectors
            const e1 = transformPoint({ x: 1, y: 0 }, interpM);
            const e2 = transformPoint({ x: 0, y: 1 }, interpM);

            VizEngine.drawVector(ctx, cx, cy, cx + e1.x * scale, cy - e1.y * scale, VizEngine.colors.sage, 'e₁');
            VizEngine.drawVector(ctx, cx, cy, cx + e2.x * scale, cy - e2.y * scale, VizEngine.colors.blue, 'e₂');

            // Draw control points for dragging
            state.controlPoints.forEach((p, i) => {
                const px = cx + p.x;
                const py = cy + p.y;
                const isActive = state.dragTarget === i;

                // Connection line from original
                ctx.save();
                ctx.strokeStyle = i === 0 ? VizEngine.colors.sageLight : VizEngine.colors.blueLight;
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(cx + (i === 0 ? scale : 0), cy + (i === 1 ? -scale : 0));
                ctx.lineTo(px, py);
                ctx.stroke();
                ctx.restore();

                // Handle circle
                ctx.save();
                ctx.fillStyle = isActive ? VizEngine.colors.highlight : (i === 0 ? VizEngine.colors.sage : VizEngine.colors.blue);
                ctx.beginPath();
                ctx.arc(px, py, isActive ? 10 : 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
            });
        }

        ctx.restore();
    }

    function drawComparison(ctx, cx, cy, scale) {
        const isAB = state.comparisonMode === 'ab';
        const mA = state.matrixA;
        const mB = state.matrixB;
        const result = isAB ? VizEngine.matMul(mA, mB) : VizEngine.matMul(mB, mA);

        // Draw original unit square (faint)
        const originalPoints = unitSquare.map(p => ({
            x: cx + p.x * scale * 0.5,
            y: cy - p.y * scale * 0.5
        }));
        VizEngine.drawPolygon(ctx, originalPoints, 'rgba(107, 140, 174, 0.05)', VizEngine.colors.blueLight, 0.8);

        // Draw transformed square
        const transformed = unitSquare.map(p => {
            const tp = transformPoint(p, result);
            return { x: cx + tp.x * scale * 0.5, y: cy - tp.y * scale * 0.5 };
        });

        VizEngine.drawPolygon(ctx, transformed, isAB ? 'rgba(91, 138, 114, 0.2)' : 'rgba(201, 123, 123, 0.2)',
            isAB ? VizEngine.colors.sage : VizEngine.colors.rose, 2.5);

        // Label
        ctx.save();
        ctx.fillStyle = isAB ? VizEngine.colors.sage : VizEngine.colors.rose;
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isAB ? 'AB = 先B后A' : 'BA = 先A后B', cx, cy + scale + 30);
        ctx.restore();
    }

    // Matrix inputs
    const inputs = ['m00', 'm01', 'm10', 'm11'];
    function updateMatrix() {
        state.matrix = inputs.map(id => {
            const el = document.getElementById(id);
            return el ? parseFloat(el.value) || 0 : 0;
        });

        // Animate transition
        state.animProgress = 0;
        VizEngine.animate((t) => {
            state.animProgress = t;
            draw();
        }, 600);

        if (AudioSystem && AudioSystem.enabled) AudioSystem.playMatrixUpdate();
    }

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', updateMatrix);
            el.addEventListener('input', () => {
                // Debounced visual update
                clearTimeout(el._timeout);
                el._timeout = setTimeout(updateMatrix, 300);
            });
        }
    });

    // Drag interaction for matrix control points
    panel.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const handle = findHandle(pos.x, pos.y);
        if (handle !== null) {
            state.isDragging = true;
            state.dragTarget = handle;
            panel.style.cursor = 'grabbing';
        }
    });

    panel.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (state.isDragging && state.dragTarget !== null) {
            const newX = pos.x - cx;
            const newY = pos.y - cy;
            state.controlPoints[state.dragTarget].x = newX;
            state.controlPoints[state.dragTarget].y = newY;

            // Update matrix from control points
            state.matrix = [
                state.controlPoints[0].x / scale,
                state.controlPoints[1].x / scale,
                -state.controlPoints[0].y / scale,
                -state.controlPoints[1].y / scale
            ];

            // Update input fields
            inputs.forEach((id, i) => {
                const el = document.getElementById(id);
                if (el) el.value = state.matrix[i].toFixed(2);
            });

            draw();
        } else {
            const handle = findHandle(pos.x, pos.y);
            panel.style.cursor = handle !== null ? 'grab' : 'default';
        }
    });

    panel.addEventListener('mouseup', () => {
        if (state.isDragging) {
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
        }
        state.isDragging = false;
        state.dragTarget = null;
        panel.style.cursor = 'default';
    });

    panel.addEventListener('mouseleave', () => {
        state.isDragging = false;
        state.dragTarget = null;
        panel.style.cursor = 'default';
    });

    // Mode switching with AB vs BA support
    const vizPanel = panel.closest('.viz-panel');
    vizPanel.addEventListener('vizchange', (e) => {
        const newMode = e.detail.type;
        state.mode = newMode;

        const abbaControls = document.getElementById('abbaControls');
        if (abbaControls) {
            abbaControls.style.display = newMode === 'abba' ? 'flex' : 'none';
        }

        draw();
        if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
    });

    // AB vs BA toggle
    document.querySelectorAll('.toggle-btn[data-order]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.toggle-btn[data-order]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.comparisonMode = btn.dataset.order;
            draw();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
        });
    });

    draw();

    window.addEventListener('resize', () => {
        const newSetup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
        if (newSetup) {
            Object.assign(setup, newSetup);
            draw();
        }
    });
}
