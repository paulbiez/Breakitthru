// src/js/audio.js
let audioCtx = null;
let bgmBuffer = null;
let bgmSourceNode = null;
let bgmGainNode = null;

let sfxVolume = 1.0;
let bgmVolume = 0.5;

let prevSfxVolume = 1.0;
let prevBgmVolume = 0.5;

let isSfxMuted = false;
let isBgmMuted = false;
let isBgmPlaying = false;

export function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn("AudioContext resume falhou", e));
        }
        if (!bgmGainNode) {
            bgmGainNode = audioCtx.createGain();
            bgmGainNode.connect(audioCtx.destination);
            bgmGainNode.gain.value = isBgmMuted ? 0 : bgmVolume;
        }
    } catch(e) { 
        console.warn("AudioContext não suportado:", e); 
    }
}

async function loadBgmBuffer() {
    if (bgmBuffer) return bgmBuffer;
    try {
        const response = await fetch('src/assets/bckMusic.mp3');
        const arrayBuffer = await response.arrayBuffer();
        bgmBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        return bgmBuffer;
    } catch (e) {
        console.warn("Erro ao carregar/decodificar bckMusic.mp3:", e);
        return null;
    }
}

export async function playBgm() {
    initAudio();
    if (isBgmPlaying) return;

    const buffer = await loadBgmBuffer();
    if (!buffer) return;

    try {
        if (bgmSourceNode) {
            bgmSourceNode.stop();
            bgmSourceNode.disconnect();
        }
        bgmSourceNode = audioCtx.createBufferSource();
        bgmSourceNode.buffer = buffer;
        bgmSourceNode.loop = true; // Loop perfeito e gapless via Web Audio API
        bgmSourceNode.connect(bgmGainNode);
        
        bgmGainNode.gain.value = isBgmMuted ? 0 : bgmVolume;
        bgmSourceNode.start(0);
        isBgmPlaying = true;
    } catch (e) {
        console.warn("Erro ao reproduzir BGM:", e);
    }
}

export function pauseBgm() {
    if (bgmSourceNode && isBgmPlaying) {
        try {
            bgmSourceNode.stop();
            bgmSourceNode.disconnect();
        } catch(e) {}
        bgmSourceNode = null;
        isBgmPlaying = false;
    }
}

export function stopBgm() {
    pauseBgm();
}

export function setBgmVolume(val) {
    initAudio();
    let volume = parseFloat(val);
    bgmVolume = volume;
    if (volume > 0) {
        prevBgmVolume = volume;
        isBgmMuted = false;
    } else {
        isBgmMuted = true;
    }
    if (bgmGainNode) {
        bgmGainNode.gain.value = isBgmMuted ? 0 : bgmVolume;
    }
}

export function setSfxVolume(val) {
    initAudio();
    let volume = parseFloat(val);
    sfxVolume = volume;
    if (volume > 0) {
        prevSfxVolume = volume;
        isSfxMuted = false;
    } else {
        isSfxMuted = true;
    }
}

export function toggleBgmMute() {
    initAudio();
    if (isBgmMuted) {
        isBgmMuted = false;
        bgmVolume = prevBgmVolume > 0 ? prevBgmVolume : 0.5;
    } else {
        if (bgmVolume > 0) prevBgmVolume = bgmVolume;
        isBgmMuted = true;
        bgmVolume = 0;
    }
    if (bgmGainNode) {
        bgmGainNode.gain.value = isBgmMuted ? 0 : bgmVolume;
    }
    return { isMuted: isBgmMuted, volume: bgmVolume };
}

export function toggleSfxMute() {
    initAudio();
    if (isSfxMuted) {
        isSfxMuted = false;
        sfxVolume = prevSfxVolume > 0 ? prevSfxVolume : 1.0;
    } else {
        if (sfxVolume > 0) prevSfxVolume = sfxVolume;
        isSfxMuted = true;
        sfxVolume = 0;
    }
    return { isMuted: isSfxMuted, volume: sfxVolume };
}

export function getAudioState() {
    return { bgmVolume, sfxVolume, isBgmMuted, isSfxMuted };
}

export function playSound(type) {
    if (isSfxMuted || sfxVolume <= 0) return;
    if (!audioCtx || audioCtx.state !== 'running') return;
    try {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        let now = audioCtx.currentTime;
        let duration = 0.1;

        if (type === 'paddle') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
            gain.gain.setValueAtTime(0.3 * sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            duration = 0.08;
        } else if (type === 'brick') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
            gain.gain.setValueAtTime(0.2 * sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
            duration = 0.06;
        } else if (type === 'wall') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.15 * sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            duration = 0.05;
        } else if (type === 'bonus') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
            gain.gain.setValueAtTime(0.3 * sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            duration = 0.15;
        } else if (type === 'introJingle') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554.37, now + 0.1);
            osc.frequency.setValueAtTime(659.25, now + 0.2);
            gain.gain.setValueAtTime(0.2 * sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            duration = 0.4;
        } else if (type === 'bumper') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
            gain.gain.setValueAtTime(0.3 * sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            duration = 0.15;
        }
        
        osc.start(now);
        osc.stop(now + duration);
    } catch(e) { console.warn("Erro ao reproduzir som sintético:", e); }
}

export function playMp3(filePath) {
    if (isSfxMuted || sfxVolume <= 0) return;
    try {
        let audio = new Audio(filePath);
        audio.volume = sfxVolume;
        audio.play().catch(e => console.warn("Erro ao reproduzir MP3:", e));
    } catch(e) { console.warn("Erro ao carregar arquivo MP3:", e); }
}
