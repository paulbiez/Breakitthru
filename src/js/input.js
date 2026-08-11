export function initInputs(canvas, paddle, callbacks) {
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        let touchX = e.touches[0].clientX - rect.left;
        let scale = canvas.width / rect.width;
        let targetX = (touchX * scale) - (paddle.width / 2);
        
        if (targetX < 0) targetX = 0;
        if (targetX + paddle.width > canvas.width) targetX = canvas.width - paddle.width;

        paddle.x = targetX;
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (callbacks.onLaunch) callbacks.onLaunch();
    }, { passive: false });

    canvas.addEventListener('mousemove', (e) => {
        let rect = canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let scale = canvas.width / rect.width;
        paddle.x = (mouseX * scale) - (paddle.width / 2);
        
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    });
}
