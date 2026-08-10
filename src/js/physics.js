/**
 * Lógica de Física do Jogo
 */

// Verifica se dois retângulos colidem (usado para bricks)
export function isColliding(ball, rect) {
    return ball.x + ball.radius > rect.x &&
           ball.x - ball.radius < rect.x + rect.w &&
           ball.y + ball.radius > rect.y &&
           ball.y - ball.radius < rect.y + rect.h;
}

// Calcula a nova direção da bola após colidir com um tijolo
export function resolveBrickCollision(ball, brick, brickW, brickH) {
    let overlapLeft = (ball.x + ball.radius) - brick.x;
    let overlapRight = (brick.x + brickW) - (ball.x - ball.radius);
    let overlapTop = (ball.y + ball.radius) - brick.y;
    let overlapBottom = (brick.y + brickH) - (ball.y - ball.radius);

    let minOverlapX = Math.min(overlapLeft, overlapRight);
    let minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapX < minOverlapY) {
        ball.dx *= -1;
        // Ajuste de posição para não prender a bola
        if (overlapLeft < overlapRight) ball.x = brick.x - ball.radius;
        else ball.x = brick.x + brickW + ball.radius;
    } else {
        ball.dy *= -1;
        if (overlapTop < overlapBottom) ball.y = brick.y - ball.radius;
        else ball.y = brick.y + brickH + ball.radius;
    }
}

// Lógica de colisão da raquete (permite controlar o ângulo)
export function resolvePaddleCollision(ball, paddle) {
    ball.dy = -Math.abs(ball.dy);
    let hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
    ball.dx = hitPoint * 4;
    
    // Evita velocidade horizontal muito baixa
    if (Math.abs(ball.dx) < 0.5) ball.dx = hitPoint < 0 ? -1.5 : 1.5;
}


