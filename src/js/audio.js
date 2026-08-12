// src/js/audio.js

let audioCtx = null;

export function initAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resumo necessário para navegadores modernos (especialmente Chrome/Firefox)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn("Audio resume falhou", e));
        }
    } catch(e) {
        console.warn("AudioContext não suportado ou bloqueado:", e);
    }
}

// Para efeitos sonoros sintéticos (raquete, tijolos, etc.)
export function playSound(type) {
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
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
            duration = 0.08;
        } else if (type === 'brick') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
            duration = 0.06;
        } else if (type === 'wall') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            duration = 0.05;
        } else if (type === 'bonus') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
            duration = 0.15;
        } else if (type === 'introJingle') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554.37, now + 0.1);
            osc.frequency.setValueAtTime(659.25, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
            duration = 0.4;
        }
        
        osc.start(now);
        osc.stop(now + duration);
    } catch(e) {
        console.warn("Erro ao reproduzir som sintético:", e);
    }
}

// Para arquivos de áudio externos (ex: scream1.mp3)
export function playMp3(filePath) {
    try {
        let audio = new Audio(filePath);
        // Garante que o áudio seja reproduzido com permissão
        audio.play().catch(e => console.warn("Erro ao reproduzir MP3:", e));
    } catch(e) {
        console.warn("Erro ao carregar arquivo MP3:", e);
    }
}
