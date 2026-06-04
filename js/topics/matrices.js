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
        animProgress: 1
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

        // Draw original faint unit square
        const originalPoints = unitSquare.map(p => ({
            x: cx + p.x * scale,
            y: cy - p.y * scale
        }));
        VizEngine.drawPolygon(ctx, originalPoints, 'rgba(107, 140, 174, 0.1)', VizEngine.colors.blueLight, 1);

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

        // Draw transformed grid
        VizEngine.drawTransformedGrid(ctx, width, height, interpM, scale);

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

    draw();

    window.addEventListener('resize', () => {
        const newSetup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
        if (newSetup) {
            Object.assign(setup, newSetup);
            draw();
        }
    });
}
