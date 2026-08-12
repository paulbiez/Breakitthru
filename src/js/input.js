// src/js/input.js

export function initInputs(canvas, paddle, callbacks, shouldIgnoreInput) {
    function handleMove(clientX) {
        if (shouldIgnoreInput && shouldIgnoreInput()) return;
        
        let rect = canvas.getBoundingClientRect();
        let mouseX = clientX - rect.left;
        
        let scaleX = canvas.width / rect.width;
        let targetX = (mouseX * scaleX) - (paddle.width / 2);
        
        if (targetX < 0) targetX = 0;
        if (targetX + paddle.width > canvas.width) {
            targetX = canvas.width - paddle.width;
        }

        paddle.x = targetX;
    }

    canvas.addEventListener('touchmove', (e) => {
        if (shouldIgnoreInput && shouldIgnoreInput()) return;
        e.preventDefault();
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX);
        }
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (shouldIgnoreInput && shouldIgnoreInput()) return;
        e.preventDefault();
        if (callbacks.onLaunch) callbacks.onLaunch();
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX);
        }
    }, { passive: false });

    canvas.addEventListener('mousemove', (e) => {
        if (shouldIgnoreInput && shouldIgnoreInput()) return;
        handleMove(e.clientX);
    });
}
