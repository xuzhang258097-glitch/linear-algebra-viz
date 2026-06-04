/**
 * LinearViz Audio System
 * Uses Tone.js for pleasant, non-intrusive sound effects
 */

const AudioSystem = {
    initialized: false,
    enabled: false,
    synth: null,
    ambient: null,
    reverb: null,

    async init() {
        if (this.initialized) return;

        this.reverb = new Tone.Reverb({
            decay: 2.5,
            preDelay: 0.1,
            wet: 0.25
        }).toDestination();

        this.synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.01,
                decay: 0.15,
                sustain: 0.05,
                release: 0.5
            },
            volume: -12
        }).connect(this.reverb);

        this.ambient = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: {
                attack: 2,
                decay: 1,
                sustain: 0.3,
                release: 4
            },
            volume: -25
        }).connect(this.reverb);

        this.initialized = true;
    },

    async start() {
        await Tone.start();
        await this.init();
        this.enabled = true;
        this.playAmbient();
    },

    stop() {
        this.enabled = false;
        if (this.ambient) {
            this.ambient.releaseAll();
        }
    },

    toggle() {
        if (this.enabled) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    },

    playHover() {
        if (!this.enabled || !this.synth) return;
        this.synth.triggerAttackRelease('C5', '64n', undefined, 0.08);
    },

    playClick() {
        if (!this.enabled || !this.synth) return;
        this.synth.triggerAttackRelease(['E5', 'G5'], '32n', undefined, 0.15);
    },

    playSectionEnter() {
        if (!this.enabled || !this.synth) return;
        const now = Tone.now();
        this.synth.triggerAttackRelease('C4', '16n', now, 0.12);
        this.synth.triggerAttackRelease('E4', '16n', now + 0.08, 0.12);
        this.synth.triggerAttackRelease('G4', '16n', now + 0.16, 0.12);
    },

    playSliderChange() {
        if (!this.enabled || !this.synth) return;
        this.synth.triggerAttackRelease('A4', '64n', undefined, 0.05);
    },

    playMatrixUpdate() {
        if (!this.enabled || !this.synth) return;
        const now = Tone.now();
        this.synth.triggerAttackRelease('D4', '32n', now, 0.08);
        this.synth.triggerAttackRelease('F4', '32n', now + 0.06, 0.08);
    },

    playSuccess() {
        if (!this.enabled || !this.synth) return;
        const now = Tone.now();
        this.synth.triggerAttackRelease('C4', '16n', now, 0.1);
        this.synth.triggerAttackRelease('E4', '16n', now + 0.1, 0.1);
        this.synth.triggerAttackRelease('G4', '16n', now + 0.2, 0.1);
        this.synth.triggerAttackRelease('C5', '8n', now + 0.3, 0.15);
    },

    playAmbient() {
        if (!this.enabled || !this.ambient) return;
        const chords = [
            ['C3', 'E3', 'G3'],
            ['F3', 'A3', 'C4'],
            ['G3', 'B3', 'D4'],
            ['A3', 'C4', 'E4']
        ];

        const playNext = () => {
            if (!this.enabled) return;
            const chord = chords[Math.floor(Math.random() * chords.length)];
            this.ambient.triggerAttackRelease(chord, '4n');
            setTimeout(playNext, 12000 + Math.random() * 8000);
        };

        setTimeout(playNext, 2000);
    }
};

function setupAudioControl() {
    const btn = document.getElementById('audio-control');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const isActive = await AudioSystem.toggle();
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('muted', !isActive);
        btn.title = isActive ? '关闭音效' : '开启音效';
    });
}

function setupHoverSounds() {
    document.querySelectorAll('.btn, .nav-link, .card-link, .viz-btn, .tool-btn, .preset-btn').forEach(el => {
        el.addEventListener('mouseenter', () => AudioSystem.playHover());
        el.addEventListener('click', () => AudioSystem.playClick());
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupAudioControl();
    setupHoverSounds();
});
