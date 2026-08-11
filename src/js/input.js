// src/js/input.js

export function initInputs(canvas, paddle, callbacks) {
    function handleMove(clientX) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = clientX - rect.left;
        
        // Fator de proporção exato entre a largura lógica interna e a largura real na tela
        let scaleX = canvas.width / rect.width;
        let targetX = (mouseX * scaleX) - (paddle.width / 2);
        
        if (targetX < 0) targetX = 0;
        if (targetX + paddle.width > canvas.width) {
            targetX = canvas.width - paddle.width;
        }

        paddle.x = targetX;
    }

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX);
        }
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (callbacks.onLaunch) callbacks.onLaunch();
        if (e.touches.length > 0) {
            handleMove(e.touches[0].clientX);
        }
    }, { passive: false });

    canvas.addEventListener('mousemove', (e) => {
        handleMove(e.clientX);
    });
}
