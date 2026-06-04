/**
 * Determinant Visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    initDeterminantViz();
});

function initDeterminantViz() {
    const panel = document.getElementById('determinantViz');
    if (!panel) return;

    const setup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
    if (!setup) return;

    const { ctx, width, height } = setup;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 55;

    let state = {
        matrix: [2, 1, 0.5, 1.5],
        mode: 'area'
    };

    function transformPoint(p, m) {
        return {
            x: m[0] * p.x + m[1] * p.y,
            y: m[2] * p.x + m[3] * p.y
        };
    }

    function getDeterminant(m) {
        return m[0] * m[3] - m[1] * m[2];
    }

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        VizEngine.drawGrid(ctx, width, height, scale);
        VizEngine.drawAxes(ctx, width, height);

        const m = state.matrix;
        const det = getDeterminant(m);

        if (state.mode === 'area') {
            // Original unit square
            const unit = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 1, y: 1 },
                { x: 0, y: 1 }
            ];

            // Draw original (faint)
            const origPoints = unit.map(p => ({
                x: cx + p.x * scale,
                y: cy - p.y * scale
            }));
            VizEngine.drawPolygon(ctx, origPoints, 'rgba(107, 140, 174, 0.1)', VizEngine.colors.blueLight, 1);

            // Draw transformed
            const transPoints = unit.map(p => {
                const tp = transformPoint(p, m);
                return { x: cx + tp.x * scale, y: cy - tp.y * scale };
            });

            const intensity = Math.min(Math.abs(det) / 3, 1);
            const fillColor = det >= 0
                ? `rgba(212, 165, 116, ${0.15 + intensity * 0.2})`
                : `rgba(201, 123, 123, ${0.15 + intensity * 0.2})`;

            VizEngine.drawPolygon(ctx, transPoints, fillColor, det >= 0 ? VizEngine.colors.apricot : VizEngine.colors.rose, 2.5);

            // Show basis vectors
            const e1 = transformPoint({ x: 1, y: 0 }, m);
            const e2 = transformPoint({ x: 0, y: 1 }, m);
            VizEngine.drawVector(ctx, cx, cy, cx + e1.x * scale, cy - e1.y * scale, VizEngine.colors.apricot, '');
            VizEngine.drawVector(ctx, cx, cy, cx + e2.x * scale, cy - e2.y * scale, VizEngine.colors.apricot, '');
        } else {
            // 3D volume visualization (projected to 2D)
            const cube = [
                { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }
            ];
            const transCube = cube.map(p => {
                const tp = transformPoint(p, m);
                return { x: cx + tp.x * scale, y: cy - tp.y * scale };
            });
            VizEngine.drawPolygon(ctx, transCube, 'rgba(91, 138, 114, 0.2)', VizEngine.colors.sage, 2);

            // Draw "3D" effect with offset
            const offset = 20;
            const shifted = transCube.map(p => ({ x: p.x + offset, y: p.y - offset }));
            VizEngine.drawPolygon(ctx, shifted, 'rgba(91, 138, 114, 0.1)', VizEngine.colors.sageLight, 1);

            // Connecting lines
            ctx.strokeStyle = 'rgba(91, 138, 114, 0.2)';
            ctx.setLineDash([3, 3]);
            for (let i = 0; i < transCube.length; i++) {
                ctx.beginPath();
                ctx.moveTo(transCube[i].x, transCube[i].y);
                ctx.lineTo(shifted[i].x, shifted[i].y);
                ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        // Update display
        updateDetDisplay(det);

        ctx.restore();
    }

    function updateDetDisplay(det) {
        const valEl = document.getElementById('detValue');
        const descEl = document.getElementById('detDesc');
        if (valEl) valEl.textContent = det.toFixed(2);
        if (descEl) {
            if (Math.abs(det) < 0.01) {
                descEl.textContent = '空间被压缩到更低维度';
                descEl.style.color = 'var(--accent-rose)';
            } else if (det < 0) {
                descEl.textContent = `空间翻转，面积缩放${Math.abs(det).toFixed(2)}倍`;
                descEl.style.color = 'var(--accent-rose)';
            } else {
                descEl.textContent = `面积放大${det.toFixed(2)}倍`;
                descEl.style.color = 'var(--accent-sage)';
            }
        }
    }

    // Matrix inputs
    const inputs = ['d00', 'd01', 'd10', 'd11'];
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

    draw();

    window.addEventListener('resize', () => {
        const newSetup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
        if (newSetup) {
            Object.assign(setup, newSetup);
            draw();
        }
    });
}
