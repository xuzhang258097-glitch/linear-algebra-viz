/**
 * LinearViz Core Visualization Engine
 * Reusable Canvas-based math visualization primitives
 */

const VizEngine = {
    // Color palette for visualizations
    colors: {
        sage: '#5b8a72',
        sageLight: 'rgba(91, 138, 114, 0.3)',
        blue: '#6b8cae',
        blueLight: 'rgba(107, 140, 174, 0.3)',
        apricot: '#d4a574',
        apricotLight: 'rgba(212, 165, 116, 0.3)',
        rose: '#c97b7b',
        roseLight: 'rgba(201, 123, 123, 0.3)',
        grid: 'rgba(0, 0, 0, 0.06)',
        axis: 'rgba(0, 0, 0, 0.25)',
        text: '#6b6b6b'
    },

    /**
     * Initialize a canvas with proper DPI scaling
     */
    setupCanvas(canvasId, width = null, height = null) {
        const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = (width || rect.width) * dpr;
        canvas.height = (height || rect.height) * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.dpr = dpr;
        ctx.cssWidth = width || rect.width;
        ctx.cssHeight = height || rect.height;

        return { canvas, ctx, width: ctx.cssWidth, height: ctx.cssHeight };
    },

    /**
     * Draw a coordinate grid
     */
    drawGrid(ctx, width, height, spacing = 40, offsetX = 0, offsetY = 0) {
        ctx.save();
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        const centerX = width / 2 + offsetX;
        const centerY = height / 2 + offsetY;

        // Vertical lines
        for (let x = centerX % spacing; x < width; x += spacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = centerY % spacing; y < height; y += spacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        ctx.restore();
    },

    /**
     * Draw axes with arrows
     */
    drawAxes(ctx, width, height, scale = 1, offsetX = 0, offsetY = 0) {
        ctx.save();
        const cx = width / 2 + offsetX;
        const cy = height / 2 + offsetY;

        ctx.strokeStyle = this.colors.axis;
        ctx.lineWidth = 1.5;
        ctx.fillStyle = this.colors.axis;

        // X axis
        ctx.beginPath();
        ctx.moveTo(20, cy);
        ctx.lineTo(width - 20, cy);
        ctx.stroke();

        // X arrow
        ctx.beginPath();
        ctx.moveTo(width - 20, cy);
        ctx.lineTo(width - 28, cy - 4);
        ctx.lineTo(width - 28, cy + 4);
        ctx.closePath();
        ctx.fill();

        // Y axis
        ctx.beginPath();
        ctx.moveTo(cx, height - 20);
        ctx.lineTo(cx, 20);
        ctx.stroke();

        // Y arrow
        ctx.beginPath();
        ctx.moveTo(cx, 20);
        ctx.lineTo(cx - 4, 28);
        ctx.lineTo(cx + 4, 28);
        ctx.closePath();
        ctx.fill();

        // Labels
        ctx.font = '12px Outfit, sans-serif';
        ctx.fillStyle = this.colors.text;
        ctx.fillText('x', width - 16, cy + 14);
        ctx.fillText('y', cx + 10, 24);

        ctx.restore();
    },

    /**
     * Draw a vector from origin
     */
    drawVector(ctx, fromX, fromY, toX, toY, color = this.colors.sage, label = null, lineWidth = 2.5) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        // Line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLen = 10;
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Label
        if (label) {
            ctx.font = 'bold 13px Outfit, sans-serif';
            ctx.fillStyle = color;
            const labelX = toX + 10 * Math.cos(angle);
            const labelY = toY + 10 * Math.sin(angle);
            ctx.fillText(label, labelX, labelY);
        }

        ctx.restore();
    },

    /**
     * Draw a point/dot
     */
    drawPoint(ctx, x, y, color = this.colors.sage, radius = 5) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    /**
     * Draw a dashed line
     */
    drawDashedLine(ctx, fromX, fromY, toX, toY, color = this.colors.grid, dash = [5, 5]) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.restore();
    },

    /**
     * Draw a parallelogram from two vectors
     */
    drawParallelogram(ctx, ox, oy, vx, vy, wx, wy, color = this.colors.sageLight, strokeColor = null) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + vx, oy + vy);
        ctx.lineTo(ox + vx + wx, oy + vy + wy);
        ctx.lineTo(ox + wx, oy + wy);
        ctx.closePath();
        ctx.fill();

        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        ctx.restore();
    },

    /**
     * Draw a unit circle
     */
    drawUnitCircle(ctx, cx, cy, radius, color = this.colors.grid) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    },

    /**
     * Draw a transformed grid (for linear transform visualization)
     */
    drawTransformedGrid(ctx, width, height, matrix, spacing = 40) {
        const cx = width / 2;
        const cy = height / 2;
        const [a, b, c, d] = matrix;

        ctx.save();
        ctx.strokeStyle = 'rgba(91, 138, 114, 0.15)';
        ctx.lineWidth = 1;

        // Transform basis vectors
        const range = Math.ceil(Math.max(width, height) / spacing / 2) + 2;

        for (let i = -range; i <= range; i++) {
            // Vertical lines transformed
            const x1 = cx + (i * spacing) * a;
            const y1 = cy + (i * spacing) * c;
            const x2 = cx + (i * spacing) * a + height * b;
            const y2 = cy + (i * spacing) * c + height * d;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        for (let j = -range; j <= range; j++) {
            // Horizontal lines transformed
            const x1 = cx + (j * spacing) * b;
            const y1 = cy + (j * spacing) * d;
            const x2 = cx + width * a + (j * spacing) * b;
            const y2 = cy + width * c + (j * spacing) * d;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        ctx.restore();
    },

    /**
     * Draw a polygon (for shape transformation)
     */
    drawPolygon(ctx, points, fillColor = null, strokeColor = this.colors.sage, lineWidth = 2) {
        if (points.length < 3) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();

        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
        ctx.restore();
    },

    /**
     * Clear canvas
     */
    clear(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
    },

    /**
     * Animation helper - linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Animation helper - ease in out cubic
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    /**
     * Matrix multiplication: 2x2 * vector
     */
    matVecMul(m, v) {
        return [
            m[0] * v[0] + m[1] * v[1],
            m[2] * v[0] + m[3] * v[1]
        ];
    },

    /**
     * Matrix multiplication: 2x2 * 2x2
     */
    matMul(a, b) {
        return [
            a[0] * b[0] + a[1] * b[2],
            a[0] * b[1] + a[1] * b[3],
            a[2] * b[0] + a[3] * b[2],
            a[2] * b[1] + a[3] * b[3]
        ];
    },

    /**
     * Calculate eigenvalues and eigenvectors for 2x2 matrix
     */
    calculateEigen(m) {
        const [a, b, c, d] = m;
        const trace = a + d;
        const det = a * d - b * c;
        const discriminant = trace * trace - 4 * det;

        if (discriminant < 0) return null; // Complex eigenvalues

        const sqrtD = Math.sqrt(discriminant);
        const lambda1 = (trace + sqrtD) / 2;
        const lambda2 = (trace - sqrtD) / 2;

        // Eigenvectors
        let v1, v2;
        if (Math.abs(b) > 0.001) {
            v1 = [lambda1 - d, b];
            v2 = [lambda2 - d, b];
        } else if (Math.abs(c) > 0.001) {
            v1 = [c, lambda1 - a];
            v2 = [c, lambda2 - a];
        } else {
            v1 = [1, 0];
            v2 = [0, 1];
        }

        // Normalize
        const normalize = (v) => {
            const len = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
            return len > 0.001 ? [v[0] / len, v[1] / len] : [0, 0];
        };

        return {
            lambda1, lambda2,
            v1: normalize(v1),
            v2: normalize(v2)
        };
    },

    /**
     * Animation loop helper
     */
    animate(drawFn, duration = 1000, onComplete = null) {
        const start = performance.now();

        const loop = (now) => {
            const elapsed = now - start;
            const t = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(t);

            drawFn(eased, t);

            if (t < 1) {
                requestAnimationFrame(loop);
            } else if (onComplete) {
                onComplete();
            }
        };

        requestAnimationFrame(loop);
    }
};
