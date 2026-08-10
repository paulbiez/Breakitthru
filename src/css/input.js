// src/js/input.js

export function initInputs(canvas, paddle, callbacks) {
    // callbacks seria um objeto contendo { onLaunch: function, onMove: function }
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Evita scroll da página
        let rect = canvas.getBoundingClientRect();
        let touchX = e.touches[0].clientX - rect.left;
        let scale = canvas.width / rect.width;
        let targetX = (touchX * scale) - (paddle.width / 2);
        
        // Limites da tela
        if (targetX < 0) targetX = 0;
        if (targetX + paddle.width > canvas.width) targetX = canvas.width - paddle.width;

        paddle.x = targetX;
        
        if (callbacks.onMove) callbacks.onMove(paddle);
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        if (callbacks.onLaunch) callbacks.onLaunch();
    });

    // Se quiser adicionar suporte a mouse também:
    canvas.addEventListener('mousemove', (e) => {
        let rect = canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let scale = canvas.width / rect.width;
        paddle.x = (mouseX * scale) - (paddle.width / 2);
        
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    });
}


