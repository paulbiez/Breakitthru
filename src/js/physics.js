// src/js/physics.js

export function enforceBallSpeed(ball) {
    let speed = Math.hypot(ball.dx, ball.dy);
    if (speed === 0) return;

    let targetSpeed = ball.baseSpeed || speed;

    if (Math.abs(ball.dy) < 0.8) {
        ball.dy = ball.dy >= 0 ? 0.8 : -0.8;
    }

    let newSpeed = Math.hypot(ball.dx, ball.dy);
    ball.dx = (ball.dx / newSpeed) * targetSpeed;
    ball.dy = (ball.dy / newSpeed) * targetSpeed;
}

export function isColliding(ball, rect) {
    let testX = ball.x;
    let testY = ball.y;

    if (ball.x < rect.x) testX = rect.x;
    else if (ball.x > rect.x + rect.w) testX = rect.x + rect.w;

    if (ball.y < rect.y) testY = rect.y;
    else if (ball.y > rect.y + rect.h) testY = rect.y + rect.h;

    let distX = ball.x - testX;
    let distY = ball.y - testY;
    let distance = Math.hypot(distX, distY);

    return distance <= ball.radius;
}

export function resolveBrickCollision(ball, brick) {
    let testX = ball.x;
    let testY = ball.y;

    if (ball.x < brick.x) testX = brick.x;
    else if (ball.x > brick.x + brick.w) testX = brick.x + brick.w;

    if (ball.y < brick.y) testY = brick.y;
    else if (ball.y > brick.y + brick.h) testY = brick.y + brick.h;

    let distX = ball.x - testX;
    let distY = ball.y - testY;
    let distance = Math.hypot(distX, distY);

    if (distance <= ball.radius) {
        let overlap = ball.radius - distance;
        if (distance === 0) { distX = 1; distY = 0; distance = 1; overlap = ball.radius; }
        
        let nx = distX / distance;
        let ny = distY / distance;

        ball.x += nx * overlap;
        ball.y += ny * overlap;

        let dot = (ball.dx * nx) + (ball.dy * ny);
        ball.dx -= 2 * dot * nx;
        ball.dy -= 2 * dot * ny;

        enforceBallSpeed(ball);
        return true;
    }
    return false;
}

export function resolvePaddleCollision(ball, paddle) {
    ball.y = paddle.y - ball.radius;
    
    let hitPoint = ball.x - (paddle.x + paddle.width / 2);
    let normalizedHit = hitPoint / (paddle.width / 2);
    normalizedHit = Math.max(-1, Math.min(1, normalizedHit));
    
    let bounceAngle = normalizedHit * (Math.PI / 3); 
    let targetSpeed = ball.baseSpeed || Math.hypot(ball.dx, ball.dy);
    
    ball.dx = targetSpeed * Math.sin(bounceAngle);
    ball.dy = -targetSpeed * Math.cos(bounceAngle);
    
    enforceBallSpeed(ball);
}
