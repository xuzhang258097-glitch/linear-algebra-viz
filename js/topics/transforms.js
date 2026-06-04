/**
 * Linear Transformation Visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    initTransformViz();
});

function initTransformViz() {
    const panel = document.getElementById('transformViz');
    if (!panel) return;

    const setup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
    if (!setup) return;

    const { ctx, width, height } = setup;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 45;

    let state = {
        mode: 'rotate',
        rotateAngle: 30,
        scaleX: 1,
        scaleY: 1,
        shearK: 0.5,
        animating: false,
        animProgress: 1,
        stepPhase: 0 // 0: original, 1: first transform, 2: second transform
    };

    const houseShape = [
        { x: -1.5, y: -1 },
        { x: 1.5, y: -1 },
        { x: 1.5, y: 1 },
        { x: 0, y: 1.8 },
        { x: -1.5, y: 1 }
    ];

    function getMatrix() {
        const rad = state.rotateAngle * Math.PI / 180;
        switch (state.mode) {
            case 'rotate':
                return [
                    Math.cos(rad), -Math.sin(rad),
                    Math.sin(rad), Math.cos(rad)
                ];
            case 'scale':
                return [state.scaleX, 0, 0, state.scaleY];
            case 'shear':
                return [1, state.shearK, 0, 1];
            case 'compose':
                // Rotate then scale
                const rot = [
                    Math.cos(rad), -Math.sin(rad),
                    Math.sin(rad), Math.cos(rad)
                ];
                const scl = [state.scaleX, 0, 0, state.scaleY];
                return VizEngine.matMul(scl, rot);
            default:
                return [1, 0, 0, 1];
        }
    }

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

        let m = getMatrix();

        // Handle step animation for compose mode
        if (state.mode === 'compose' && state.animating) {
            const rad = state.rotateAngle * Math.PI / 180;
            const rot = [
                Math.cos(rad), -Math.sin(rad),
                Math.sin(rad), Math.cos(rad)
            ];
            const scl = [state.scaleX, 0, 0, state.scaleY];

            if (state.stepPhase === 1) {
                // First step: rotate
                const progress = state.animProgress;
                m = [
                    VizEngine.lerp(1, rot[0], progress),
                    VizEngine.lerp(0, rot[1], progress),
                    VizEngine.lerp(0, rot[2], progress),
                    VizEngine.lerp(1, rot[3], progress)
                ];
            } else if (state.stepPhase === 2) {
                // Second step: scale after rotate
                const rotResult = rot;
                m = [
                    VizEngine.lerp(rotResult[0], scl[0] * rotResult[0] + scl[1] * rotResult[2], state.animProgress),
                    VizEngine.lerp(rotResult[1], scl[0] * rotResult[1] + scl[1] * rotResult[3], state.animProgress),
                    VizEngine.lerp(rotResult[2], scl[2] * rotResult[0] + scl[3] * rotResult[2], state.animProgress),
                    VizEngine.lerp(rotResult[3], scl[2] * rotResult[1] + scl[3] * rotResult[3], state.animProgress)
                ];
            }
        }

        // Original shape (faint)
        const original = houseShape.map(p => ({
            x: cx + p.x * scale,
            y: cy - p.y * scale
        }));
        VizEngine.drawPolygon(ctx, original, 'rgba(107, 140, 174, 0.08)', VizEngine.colors.blueLight, 1);

        // Transformed shape
        const transformed = houseShape.map(p => {
            const tp = transformPoint(p, m);
            return { x: cx + tp.x * scale, y: cy - tp.y * scale };
        });

        // Different colors for different modes
        const colorMap = {
            rotate: VizEngine.colors.sage,
            scale: VizEngine.colors.apricot,
            shear: VizEngine.colors.blue,
            compose: VizEngine.colors.rose
        };
        const fillMap = {
            rotate: 'rgba(91, 138, 114, 0.2)',
            scale: 'rgba(212, 165, 116, 0.2)',
            shear: 'rgba(107, 140, 174, 0.2)',
            compose: 'rgba(201, 123, 123, 0.2)'
        };

        VizEngine.drawPolygon(ctx, transformed, fillMap[state.mode], colorMap[state.mode], 2.5);

        // Draw rubber sheet plane
        VizEngine.initRubberSheet(width, height, 25);
        VizEngine.transformRubberSheet(m);
        VizEngine.drawRubberSheet(ctx, width, height, { showGrid: true, showBasis: true, color: colorMap[state.mode], opacity: 0.25 });

        // Step indicator for compose mode
        if (state.mode === 'compose' && state.animating) {
            ctx.save();
            ctx.fillStyle = colorMap.compose;
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const stepText = state.stepPhase === 1 ? '步骤 1: 旋转' : '步骤 2: 缩放';
            ctx.fillText(stepText, cx, 30);
            ctx.restore();
        }

        ctx.restore();
    }

    function playStepAnimation() {
        if (state.mode !== 'compose') return;

        state.animating = true;
        state.stepPhase = 1;
        state.animProgress = 0;

        // Step 1: Rotate animation
        VizEngine.animate((t) => {
            state.animProgress = t;
            draw();
        }, 1200, () => {
            // Step 2: Scale animation
            state.stepPhase = 2;
            state.animProgress = 0;

            setTimeout(() => {
                VizEngine.animate((t) => {
                    state.animProgress = t;
                    draw();
                }, 1200, () => {
                    state.animating = false;
                    state.stepPhase = 0;
                    draw();
                    if (AudioSystem && AudioSystem.enabled) AudioSystem.playSuccess();
                });
            }, 500);
        });

        if (AudioSystem && AudioSystem.enabled) AudioSystem.playSectionEnter();
    }

    // Controls
    const rotateInput = document.getElementById('rotateAngle');
    const scaleXInput = document.getElementById('scaleX');
    const scaleYInput = document.getElementById('scaleY');
    const shearInput = document.getElementById('shearK');

    function updateControls() {
        document.getElementById('rotateControl').style.display = 'none';
        document.getElementById('scaleControl').style.display = 'none';
        document.getElementById('shearControl').style.display = 'none';

        const animControl = document.getElementById('composeAnimControl');
        if (animControl) {
            animControl.style.display = state.mode === 'compose' ? 'flex' : 'none';
        }

        if (state.mode === 'rotate' || state.mode === 'compose') {
            document.getElementById('rotateControl').style.display = 'flex';
        }
        if (state.mode === 'scale' || state.mode === 'compose') {
            document.getElementById('scaleControl').style.display = 'flex';
        }
        if (state.mode === 'shear') {
            document.getElementById('shearControl').style.display = 'flex';
        }
    }

    if (rotateInput) {
        rotateInput.addEventListener('input', () => {
            state.rotateAngle = parseFloat(rotateInput.value);
            rotateInput.parentElement.querySelector('.control-value').textContent = `${state.rotateAngle}°`;
            draw();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playSliderChange();
        });
    }

    if (scaleXInput) {
        scaleXInput.addEventListener('input', () => {
            state.scaleX = parseFloat(scaleXInput.value);
            scaleXInput.parentElement.querySelectorAll('.control-value')[0].textContent = state.scaleX.toFixed(1);
            draw();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playSliderChange();
        });
    }

    if (scaleYInput) {
        scaleYInput.addEventListener('input', () => {
            state.scaleY = parseFloat(scaleYInput.value);
            scaleYInput.parentElement.querySelectorAll('.control-value')[1].textContent = state.scaleY.toFixed(1);
            draw();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playSliderChange();
        });
    }

    if (shearInput) {
        shearInput.addEventListener('input', () => {
            state.shearK = parseFloat(shearInput.value);
            shearInput.parentElement.querySelector('.control-value').textContent = state.shearK.toFixed(1);
            draw();
            if (AudioSystem && AudioSystem.enabled) AudioSystem.playSliderChange();
        });
    }

    // Mode switching
    const vizPanel = panel.closest('.viz-panel');
    vizPanel.addEventListener('vizchange', (e) => {
        state.mode = e.detail.type;
        state.animating = false;
        state.stepPhase = 0;
        updateControls();
        draw();

        // Auto-play animation when switching to compose mode
        if (state.mode === 'compose') {
            setTimeout(playStepAnimation, 300);
        }

        if (AudioSystem && AudioSystem.enabled) AudioSystem.playClick();
    });

    // Listen for external animation trigger
    panel.addEventListener('playstepanimation', () => {
        playStepAnimation();
    });

    updateControls();
    draw();

    window.addEventListener('resize', () => {
        const newSetup = VizEngine.setupCanvas(panel, panel.parentElement.clientWidth, 350);
        if (newSetup) {
            Object.assign(setup, newSetup);
            draw();
        }
    });
}
