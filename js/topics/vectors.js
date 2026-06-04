/**
 * Vector Visualizations
 * Interactive demonstrations of vector concepts
 */

document.addEventListener('DOMContentLoaded', () => {
    initVectorViz();
});

function initVectorViz() {
    const panel = document.getElementById('vectorViz');
    if (!panel) return;

    const setup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
    if (!setup) return;

    const { ctx, width, height } = setup;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 60; // pixels per unit

    let state = {
        mode: 'addition',
        vecA: { angle: 45, len: 2 },
        vecB: { angle: 135, len: 1.5 },
        scaleFactor: 1
    };

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        VizEngine.drawGrid(ctx, width, height, scale);
        VizEngine.drawAxes(ctx, width, height);

        const ax = cx + Math.cos(state.vecA.angle * Math.PI / 180) * state.vecA.len * scale;
        const ay = cy - Math.sin(state.vecA.angle * Math.PI / 180) * state.vecA.len * scale;
        const bx = cx + Math.cos(state.vecB.angle * Math.PI / 180) * state.vecB.len * scale;
        const by = cy - Math.sin(state.vecB.angle * Math.PI / 180) * state.vecB.len * scale;

        if (state.mode === 'addition') {
            // Draw vector A
            VizEngine.drawVector(ctx, cx, cy, ax, ay, VizEngine.colors.sage, 'a');
            // Draw vector B
            VizEngine.drawVector(ctx, cx, cy, bx, by, VizEngine.colors.blue, 'b');
            // Draw a + b (resultant)
            VizEngine.drawVector(ctx, cx, cy, ax + bx - cx, ay + by - cy, VizEngine.colors.apricot, 'a+b');
            // Draw parallelogram lines
            VizEngine.drawDashedLine(ctx, ax, ay, ax + bx - cx, ay + by - cy);
            VizEngine.drawDashedLine(ctx, bx, by, ax + bx - cx, ay + by - cy);
            // Fill parallelogram
            VizEngine.drawParallelogram(ctx, cx, cy, ax - cx, ay - cy, bx - cx, by - cy,
                'rgba(212, 165, 116, 0.15)');
        } else if (state.mode === 'scaling') {
            const sx = cx + (ax - cx) * state.scaleFactor;
            const sy = cy + (ay - cy) * state.scaleFactor;
            VizEngine.drawVector(ctx, cx, cy, ax, ay, VizEngine.colors.sageLight, 'a', 1.5);
            VizEngine.drawVector(ctx, cx, cy, sx, sy, VizEngine.colors.sage, `${state.scaleFactor.toFixed(1)}a`);
        } else if (state.mode === 'dot') {
            VizEngine.drawVector(ctx, cx, cy, ax, ay, VizEngine.colors.sage, 'a');
            VizEngine.drawVector(ctx, cx, cy, bx, by, VizEngine.colors.blue, 'b');
            // Projection of b onto a
            const aLen = state.vecA.len;
            const bLen = state.vecB.len;
            const angleDiff = (state.vecB.angle - state.vecA.angle) * Math.PI / 180;
            const projLen = bLen * Math.cos(angleDiff);
            const projX = cx + Math.cos(state.vecA.angle * Math.PI / 180) * projLen * scale;
            const projY = cy - Math.sin(state.vecA.angle * Math.PI / 180) * projLen * scale;
            VizEngine.drawDashedLine(ctx, bx, by, projX, projY, VizEngine.colors.apricot);
            VizEngine.drawPoint(ctx, projX, projY, VizEngine.colors.apricot, 4);

            // Dot product value
            const dot = aLen * bLen * Math.cos(angleDiff);
            ctx.fillStyle = VizEngine.colors.text;
            ctx.font = '13px Outfit, sans-serif';
            ctx.fillText(`a·b = ${dot.toFixed(2)}`, 15, height - 15);
        }

        // Draw drag handles
        if (state.mode === 'addition' || state.mode === 'dot') {
            VizEngine.drawPoint(ctx, ax, ay, VizEngine.colors.sage, state.dragging === 'A' ? 10 : 7);
            VizEngine.drawPoint(ctx, bx, by, VizEngine.colors.blue, state.dragging === 'B' ? 10 : 7);
        }

        ctx.restore();
    }

    // Drag interaction
    let isDragging = false;
    let dragTarget = null;

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
        const ax = cx + Math.cos(state.vecA.angle * Math.PI / 180) * state.vecA.len * scale;
        const ay = cy - Math.sin(state.vecA.angle * Math.PI / 180) * state.vecA.len * scale;
        const bx = cx + Math.cos(state.vecB.angle * Math.PI / 180) * state.vecB.len * scale;
        const by = cy - Math.sin(state.vecB.angle * Math.PI / 180) * state.vecB.len * scale;

        const threshold = 15;
        if (Math.hypot(mx - ax, my - ay) < threshold) return 'A';
        if (Math.hypot(mx - bx, my - by) < threshold) return 'B';
        return null;
    }

    panel.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const handle = findHandle(pos.x, pos.y);
        if (handle && (state.mode === 'addition' || state.mode === 'dot')) {
            isDragging = true;
            dragTarget = handle;
            panel.style.cursor = 'grabbing';
        }
    });

    panel.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);

        if (isDragging && dragTarget) {
            const dx = pos.x - cx;
            const dy = cy - pos.y;
            const len = Math.hypot(dx, dy) / scale;
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            if (dragTarget === 'A') {
                state.vecA.len = Math.max(0.5, Math.min(3.5, len));
                state.vecA.angle = angle;
            } else {
                state.vecB.len = Math.max(0.5, Math.min(3.5, len));
                state.vecB.angle = angle;
            }

            // Update displays
            const vecAEl = document.getElementById('vecAValue');
            const vecBEl = document.getElementById('vecBValue');
            const dotEl = document.getElementById('dotProductValue');

            if (vecAEl) {
                const ax = Math.cos(state.vecA.angle * Math.PI / 180) * state.vecA.len;
                const ay = Math.sin(state.vecA.angle * Math.PI / 180) * state.vecA.len;
                vecAEl.textContent = `[${ax.toFixed(2)}, ${ay.toFixed(2)}]`;
                vecAEl.classList.add('value-sync');
                setTimeout(() => vecAEl.classList.remove('value-sync'), 300);
            }
            if (vecBEl) {
                const bx = Math.cos(state.vecB.angle * Math.PI / 180) * state.vecB.len;
                const by = Math.sin(state.vecB.angle * Math.PI / 180) * state.vecB.len;
                vecBEl.textContent = `[${bx.toFixed(2)}, ${by.toFixed(2)}]`;
                vecBEl.classList.add('value-sync');
                setTimeout(() => vecBEl.classList.remove('value-sync'), 300);
            }
            if (dotEl) {
                const ax = Math.cos(state.vecA.angle * Math.PI / 180) * state.vecA.len;
                const ay = Math.sin(state.vecA.angle * Math.PI / 180) * state.vecA.len;
                const bx = Math.cos(state.vecB.angle * Math.PI / 180) * state.vecB.len;
                const by = Math.sin(state.vecB.angle * Math.PI / 180) * state.vecB.len;
                const dot = ax * bx + ay * by;
                dotEl.textContent = dot.toFixed(2);
                dotEl.classList.add('value-sync');
                setTimeout(() => dotEl.classList.remove('value-sync'), 300);
            }

            draw();
        } else {
            const handle = findHandle(pos.x, pos.y);
            panel.style.cursor = handle ? 'grab' : 'default';
        }
    });

    panel.addEventListener('mouseup', () => {
        if (isDragging) {
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
        }
        isDragging = false;
        dragTarget = null;
        panel.style.cursor = 'default';
    });

    panel.addEventListener('mouseleave', () => {
        isDragging = false;
        dragTarget = null;
        panel.style.cursor = 'default';
    });

    // Controls
    const angleAInput = document.getElementById('vecAAngle');
    const angleBInput = document.getElementById('vecBAngle');
    const scaleInput = document.getElementById('vecScale');

    function updateFromInputs() {
        if (angleAInput) {
            state.vecA.angle = parseFloat(angleAInput.value);
            angleAInput.parentElement.querySelector('.control-value').textContent = `${state.vecA.angle}°`;
        }
        if (angleBInput) {
            state.vecB.angle = parseFloat(angleBInput.value);
            angleBInput.parentElement.querySelector('.control-value').textContent = `${state.vecB.angle}°`;
        }
        if (scaleInput) {
            state.scaleFactor = parseFloat(scaleInput.value);
            scaleInput.parentElement.querySelector('.control-value').textContent = `${state.scaleFactor.toFixed(1)}x`;
        }
        draw();
    }

    if (angleAInput) {
        angleAInput.addEventListener('input', () => {
            updateFromInputs();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playSliderChange();
        });
    }
    if (angleBInput) {
        angleBInput.addEventListener('input', () => {
            updateFromInputs();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playSliderChange();
        });
    }
    if (scaleInput) {
        scaleInput.addEventListener('input', () => {
            updateFromInputs();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playSliderChange();
        });
    }

    // Mode switching
    const vizPanel = panel.closest('.viz-panel');
    vizPanel.addEventListener('vizchange', (e) => {
        state.mode = e.detail.type;
        draw();
        if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
    });

    // Initial draw
    draw();

    // Handle resize
    window.addEventListener('resize', () => {
        const newSetup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
        if (newSetup) {
            Object.assign(setup, newSetup);
            draw();
        }
    });
}
