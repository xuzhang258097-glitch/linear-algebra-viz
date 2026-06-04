/**
 * Application Demos
 * Small interactive demos for each application area
 */

document.addEventListener('DOMContentLoaded', () => {
    initGraphicsDemo();
    initMLDemo();
    initSignalDemo();
    initDataDemo();
});

/* ============================================
   Computer Graphics: Rotating 3D Cube Projection
   ============================================ */
function initGraphicsDemo() {
    const canvas = document.getElementById('graphicsDemo');
    if (!canvas) return;

    const setup = VizEngine.setupCanvas(canvas, canvas.parentElement.clientWidth, 160);
    if (!setup) return;
    const { ctx, width, height } = setup;

    const vertices = [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    const edges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    let angle = 0;

    function project(v) {
        const fov = 2.5;
        const z = v[2] + 4;
        const s = fov / z;
        return {
            x: width / 2 + v[0] * s * 40,
            y: height / 2 + v[1] * s * 40
        };
    }

    function rotateY(v, a) {
        const c = Math.cos(a), s = Math.sin(a);
        return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
    }

    function rotateX(v, a) {
        const c = Math.cos(a), s = Math.sin(a);
        return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    }

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        const rotated = vertices.map(v => rotateY(rotateX(v, 0.3), angle));
        const projected = rotated.map(v => project(v));

        ctx.strokeStyle = 'rgba(91, 138, 114, 0.6)';
        ctx.lineWidth = 1.5;

        edges.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(projected[a].x, projected[a].y);
            ctx.lineTo(projected[b].x, projected[b].y);
            ctx.stroke();
        });

        // Draw vertices
        projected.forEach((p, i) => {
            const z = rotated[i][2];
            const alpha = (z + 2) / 4;
            ctx.fillStyle = `rgba(91, 138, 114, ${0.3 + alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
        angle += 0.015;
        requestAnimationFrame(draw);
    }

    draw();
}

/* ============================================
   Machine Learning: PCA / Data Clustering
   ============================================ */
function initMLDemo() {
    const canvas = document.getElementById('mlDemo');
    if (!canvas) return;

    const setup = VizEngine.setupCanvas(canvas, canvas.parentElement.clientWidth, 160);
    if (!setup) return;
    const { ctx, width, height } = setup;

    // Generate some correlated data points
    const points = [];
    for (let i = 0; i < 40; i++) {
        const t = (Math.random() - 0.5) * 3;
        const noise = (Math.random() - 0.5) * 0.6;
        points.push({
            x: t + noise,
            y: t * 0.7 + noise
        });
    }

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        const cx = width / 2;
        const cy = height / 2;
        const scale = 35;

        // Draw grid
        VizEngine.drawGrid(ctx, width, height, 25);

        // Draw principal component line
        ctx.strokeStyle = 'rgba(201, 123, 123, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(cx - 80, cy + 56);
        ctx.lineTo(cx + 80, cy - 56);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw points
        points.forEach(p => {
            const px = cx + p.x * scale;
            const py = cy - p.y * scale;

            // Point
            ctx.fillStyle = 'rgba(91, 138, 114, 0.6)';
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();

            // Projection line to PC
            const t = (p.x * 0.8 + p.y * 0.6) / 1;
            const projX = cx + t * 0.8 * scale;
            const projY = cy - t * 0.6 * scale;

            ctx.strokeStyle = 'rgba(91, 138, 114, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(projX, projY);
            ctx.stroke();
        });

        ctx.restore();
    }

    draw();
}

/* ============================================
   Signal Processing: Waveform / Fourier
   ============================================ */
function initSignalDemo() {
    const canvas = document.getElementById('signalDemo');
    if (!canvas) return;

    const setup = VizEngine.setupCanvas(canvas, canvas.parentElement.clientWidth, 160);
    if (!setup) return;
    const { ctx, width, height } = setup;

    let time = 0;

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        const cy = height / 2;

        // Composite signal (sum of sines)
        ctx.strokeStyle = 'rgba(212, 165, 116, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const t = x / width * 4 * Math.PI;
            const y = cy + Math.sin(t + time) * 25 + Math.sin(t * 2.5 + time) * 15 + Math.sin(t * 0.5) * 10;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Component 1
        ctx.strokeStyle = 'rgba(212, 165, 116, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const t = x / width * 4 * Math.PI;
            const y = cy + Math.sin(t + time) * 25;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Component 2
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const t = x / width * 4 * Math.PI;
            const y = cy + Math.sin(t * 2.5 + time) * 15;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.restore();
        time += 0.03;
        requestAnimationFrame(draw);
    }

    draw();
}

/* ============================================
   Data Compression: SVD / Matrix Approximation
   ============================================ */
function initDataDemo() {
    const canvas = document.getElementById('dataDemo');
    if (!canvas) return;

    const setup = VizEngine.setupCanvas(canvas, canvas.parentElement.clientWidth, 160);
    if (!setup) return;
    const { ctx, width, height } = setup;

    // 5x5 "image" matrix values (0-1)
    const image = [
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [0.2, 0.4, 0.6, 0.8, 0.7],
        [0.3, 0.6, 0.9, 0.7, 0.5],
        [0.4, 0.8, 0.7, 0.5, 0.3],
        [0.5, 0.7, 0.5, 0.3, 0.1]
    ];

    // Low-rank approximation (rank 1)
    const approx = [
        [0.15, 0.3, 0.45, 0.5, 0.45],
        [0.25, 0.5, 0.75, 0.83, 0.75],
        [0.3, 0.6, 0.9, 1.0, 0.9],
        [0.25, 0.5, 0.75, 0.83, 0.75],
        [0.15, 0.3, 0.45, 0.5, 0.45]
    ];

    const cellSize = 22;
    const gap = 40;
    const startX = (width - (cellSize * 5 * 2 + gap)) / 2;
    const startY = (height - cellSize * 5) / 2;

    function drawMatrix(mx, ox, oy, label) {
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, ox + cellSize * 2.5, oy - 8);

        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 5; j++) {
                const val = mx[i][j];
                const gray = Math.floor((1 - val) * 230 + 25);
                ctx.fillStyle = `rgb(${gray}, ${gray + 10}, ${gray + 20})`;
                ctx.fillRect(ox + j * cellSize, oy + i * cellSize, cellSize - 1, cellSize - 1);
            }
        }
    }

    function draw() {
        VizEngine.clear(ctx, width * window.devicePixelRatio, height * window.devicePixelRatio);
        ctx.save();
        ctx.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);

        drawMatrix(image, startX, startY, 'Original');

        // Arrow
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillText('→', startX + cellSize * 5 + gap / 2, startY + cellSize * 2.5 + 4);

        drawMatrix(approx, startX + cellSize * 5 + gap, startY, 'Compressed');

        ctx.restore();
    }

    draw();
}
