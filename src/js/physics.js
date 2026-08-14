// src/js/physics.js

export function isColliding(circle, rect) {
    let distX = Math.abs(circle.x - rect.x - rect.w / 2);
    let distY = Math.abs(circle.y - rect.y - rect.h / 2);

    if (distX > (rect.w / 2 + circle.radius)) return false;
    if (distY > (rect.h / 2 + circle.radius)) return false;

    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;

    let dx = distX - rect.w / 2;
    let dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

export function resolveBrickCollision(ball, brick, brickW, brickH) {
    let prevX = ball.x - ball.dx;
    let prevY = ball.y - ball.dy;

    if (prevY + ball.radius <= brick.y || prevY - ball.radius >= brick.y + brickH) {
        ball.dy = -ball.dy;
    } else if (prevX + ball.radius <= brick.x || prevX - ball.radius >= brick.x + brickW) {
        ball.dx = -ball.dx;
    } else {
        ball.dy = -ball.dy;
    }
}

export function resolvePaddleCollision(ball, paddle) {
    let collidePoint = ball.x - (paddle.x + paddle.width / 2);
    collidePoint = collidePoint / (paddle.width / 2);
    collidePoint = Math.max(-1, Math.min(1, collidePoint));

    let angle = collidePoint * (Math.PI / 3); // Ângulo máximo de 60 graus
    let currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    let speed = Math.max(currentSpeed, 4.5);

    ball.dx = speed * Math.sin(angle);
    ball.dy = -speed * Math.cos(angle);
    ball.y = paddle.y - ball.radius - 1;
}
