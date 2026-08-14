// src/js/input.js

export function initInputs(canvas, paddle, callbacks, isBlockedFn) {
    function updatePaddlePosition(clientX) {
        if (isBlockedFn && isBlockedFn()) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const mouseX = (clientX - rect.left) * scaleX;
        
        paddle.x = mouseX - paddle.width / 2;
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width) {
            paddle.x = canvas.width - paddle.width;
        }
    }

    // Mouse Desktop
    canvas.addEventListener('mousemove', (e) => {
        updatePaddlePosition(e.clientX);
    });

    canvas.addEventListener('click', () => {
        if (callbacks && callbacks.onLaunch) callbacks.onLaunch();
    });

    // Touch Mobile
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            updatePaddlePosition(e.touches[0].clientX);
            if (callbacks && callbacks.onLaunch) callbacks.onLaunch();
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            updatePaddlePosition(e.touches[0].clientX);
        }
    }, { passive: true });
}
