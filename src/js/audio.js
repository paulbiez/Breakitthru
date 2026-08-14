// src/js/audio.js
let audioCtx = null;
let bgmAudio = null;

let state = {
    isBgmMuted: false,
    isSfxMuted: false,
    bgmVolume: 0.5,
    sfxVolume: 0.5
};

const soundCooldowns = {};
const COOLDOWN_MS = 40; 

export function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtx = new AudioContext();
        }
    }
}

function loadState() {
    const saved = localStorage.getItem('breakout_audio_state');
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {}
    }
}

function saveState() {
    localStorage.setItem('breakout_audio_state', JSON.stringify(state));
}

loadState();

export function setBgmVolume(vol) {
    state.bgmVolume = Math.max(0, Math.min(1, vol));
    if (bgmAudio) bgmAudio.volume = state.bgmVolume;
    saveState();
}

export function setSfxVolume(vol) {
    state.sfxVolume = Math.max(0, Math.min(1, vol));
    saveState();
}

export function toggleBgmMute() {
    state.isBgmMuted = !state.isBgmMuted;
    if (bgmAudio) {
        if (state.isBgmMuted) bgmAudio.pause();
        else bgmAudio.play().catch(()=>{});
    }
    saveState();
}

export function toggleSfxMute() {
    state.isSfxMuted = !state.isSfxMuted;
    saveState();
}

export function getAudioState() {
    return { ...state };
}

export function playSound(type) {
    if (state.isSfxMuted || !audioCtx) return;
    
    // Blindagem: Impede o efeito "Metralhadora" limitando a chamada
    const nowMs = performance.now();
    if (soundCooldowns[type] && (nowMs - soundCooldowns[type] < COOLDOWN_MS)) {
        return; 
    }
    soundCooldowns[type] = nowMs;

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    
    if (type === 'paddle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(state.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'brick') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gain.gain.setValueAtTime(state.sfxVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'wall') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        gain.gain.setValueAtTime(state.sfxVolume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'bonus') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(state.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'introJingle') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(400, now + 0.2);
        osc.frequency.setValueAtTime(500, now + 0.4);
        gain.gain.setValueAtTime(state.sfxVolume * 0.6, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
    } else if (type === 'laserZoom') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gain.gain.setValueAtTime(state.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'bumper') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(state.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(state.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'whoosh') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.5);
        gain.gain.setValueAtTime(state.sfxVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        let filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(2000, now + 0.5);
        
        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);
        
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'firework') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100 + Math.random()*200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(state.sfxVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    }
}

export function playMp3(path) {
    if (state.isSfxMuted) return;
    const a = new Audio(path);
    a.volume = state.sfxVolume;
    a.play().catch(e => console.log('Audio play blocked:', e));
}

export function playBgm() {
    if (!bgmAudio) {
        bgmAudio = new Audio('src/assets/bckMusic.mp3');
        bgmAudio.loop = true;
    }
    bgmAudio.volume = state.bgmVolume;
    if (!state.isBgmMuted) {
        bgmAudio.play().catch(e => console.log('BGM play blocked:', e));
    }
}

export function pauseBgm() {
    if (bgmAudio) {
        bgmAudio.pause();
    }
}

export function stopBgm() {
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
    }
}
