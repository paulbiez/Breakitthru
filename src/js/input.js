// src/js/input.js

export function initInputs(canvas, paddle, callbacks, pauseCheck) {
    let activeTouchId = null;

    function movePaddle(clientX) {
        if (pauseCheck()) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        let newX = (clientX - rect.left) * scaleX - paddle.width / 2;
        paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, newX));
    }

    canvas.addEventListener('mousemove', (e) => movePaddle(e.clientX));

    // Blindagem de toque nativo: Lê apenas o identificador primário
    canvas.addEventListener('touchstart', (e) => { 
        e.preventDefault();
        if (callbacks.onLaunch) callbacks.onLaunch(); 

        for (let i = 0; i < e.changedTouches.length; i++) {
            if (activeTouchId === null) {
                activeTouchId = e.changedTouches[i].identifier;
                movePaddle(e.changedTouches[i].clientX);
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
                movePaddle(e.changedTouches[i].clientX);
                break;
            }
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
                activeTouchId = null;
                break;
            }
        }
    });

    canvas.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === activeTouchId) {
                activeTouchId = null;
                break;
            }
        }
    });

    canvas.addEventListener('mousedown', () => { if (callbacks.onLaunch) callbacks.onLaunch(); });
}
