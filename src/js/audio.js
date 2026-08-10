let audioCtx = null;

export function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

export function playSound(type) {
    if (!audioCtx) return;
    try {
        const now = audioCtx.currentTime;
        // Coloque aqui toda a lógica que estava dentro da função playSound original
        // ... (o switch ou if/else com as lógicas de osciladores)
    } catch(err) {
        console.warn("Audio error:", err);
    }
}
