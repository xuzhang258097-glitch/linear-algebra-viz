/**
 * Interactive Playground
 * Free-form canvas for exploring linear algebra concepts
 */

document.addEventListener('DOMContentLoaded', () => {
    initPlaygroundCanvas();
});

function initPlaygroundCanvas() {
    const canvas = document.getElementById('playgroundCanvas');
    if (!canvas) return;

    const setup = VizEngine.setupCanvas(canvas, canvas.parentElement.clientWidth, 600);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const cx = width / 2;
    const cy = height / 2;
    const scale = 50;

    let state = {
        matrix: [1, 0, 0, 1],
        tool: 'vector',
        vectors: [],
        dragging: null,
        hovered: null
    };

    function transformPoint(p, m) {
        return {
            x: m[0] * p.x + m[1] * p.y,
            y: m[2] * p.x + m[3] * p.y
        };
    }

    function toCanvas(p) {
        return { x: cx + p.x * scale, y: cy - p.y * scale };
    }

    function fromCanvas(x, y) {
        return { x: (x - cx) / scale, y: (cy - y) / scale };
    }

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        VizEngine.drawGrid(ctx, width, height, scale);
        VizEngine.drawAxes(ctx, width, height);

        // Draw transformed grid
        VizEngine.drawTransformedGrid(ctx, width, height, state.matrix, scale);

        // Draw basis vectors of transformation
        const e1 = transformPoint({ x: 1, y: 0 }, state.matrix);
        const e2 = transformPoint({ x: 0, y: 1 }, state.matrix);
        VizEngine.drawVector(ctx, cx, cy, cx + e1.x * scale, cy - e1.y * scale,
            'rgba(91, 138, 114, 0.3)', '', 1.5);
        VizEngine.drawVector(ctx, cx, cy, cx + e2.x * scale, cy - e2.y * scale,
            'rgba(107, 140, 174, 0.3)', '', 1.5);

        // Draw user vectors
        state.vectors.forEach((v, i) => {
            const transformed = transformPoint(v, state.matrix);
            const start = toCanvas({ x: 0, y: 0 });
            const end = toCanvas(transformed);

            const isHovered = state.hovered === i;
            const color = isHovered ? VizEngine.colors.rose : VizEngine.colors.sage;
            const width = isHovered ? 3 : 2;

            VizEngine.drawVector(ctx, start.x, start.y, end.x, end.y, color, `v${i + 1}`, width);
            VizEngine.drawPoint(ctx, end.x, end.y, color, isHovered ? 6 : 4);
        });

        ctx.restore();
    }

    // Mouse interactions
    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    function findNearestVector(mx, my) {
        const mouseMath = fromCanvas(mx, my);
        let nearest = -1;
        let minDist = Infinity;

        state.vectors.forEach((v, i) => {
            const transformed = transformPoint(v, state.matrix);
            const dx = transformed.x - mouseMath.x;
            const dy = transformed.y - mouseMath.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.5 && dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        });

        return nearest;
    }

    canvas.addEventListener('mousemove', (e) => {
        const pos = getMousePos(e);
        const coordDisplay = document.getElementById('coordDisplay');

        if (state.dragging !== null) {
            const math = fromCanvas(pos.x, pos.y);
            state.vectors[state.dragging] = math;
            draw();
        } else {
            const hovered = findNearestVector(pos.x, pos.y);
            if (hovered !== state.hovered) {
                state.hovered = hovered;
                canvas.style.cursor = hovered !== -1 ? 'grab' : 'crosshair';
                draw();
            }
        }

        const math = fromCanvas(pos.x, pos.y);
        if (coordDisplay) {
            coordDisplay.textContent = `(${math.x.toFixed(1)}, ${math.y.toFixed(1)})`;
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        const pos = getMousePos(e);
        const hovered = findNearestVector(pos.x, pos.y);

        if (hovered !== -1) {
            state.dragging = hovered;
            canvas.style.cursor = 'grabbing';
        } else if (state.tool === 'vector') {
            const math = fromCanvas(pos.x, pos.y);
            state.vectors.push(math);
            draw();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
        }
    });

    canvas.addEventListener('mouseup', () => {
        state.dragging = null;
        canvas.style.cursor = state.hovered !== -1 ? 'grab' : 'crosshair';
    });

    canvas.addEventListener('dblclick', (e) => {
        const pos = getMousePos(e);
        const hovered = findNearestVector(pos.x, pos.y);
        if (hovered !== -1) {
            state.vectors.splice(hovered, 1);
            state.hovered = -1;
            draw();
        }
    });

    // Matrix preset events
    canvas.addEventListener('matrixpreset', (e) => {
        state.matrix = e.detail.matrix;
        draw();
    });

    // Initial draw
    // Add a default vector
    state.vectors.push({ x: 2, y: 1 });
    state.vectors.push({ x: -1, y: 1.5 });
    draw();

    window.addEventListener('resize', () => {
        const newSetup = VizEngine.setupCanvas(canvas, canvas.parentElement.clientWidth, 600);
        if (newSetup) {
            Object.assign(setup, newSetup);
            draw();
        }
    });
}
