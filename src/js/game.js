// src/js/game.js
import { isColliding, resolveBrickCollision, resolvePaddleCollision } from './physics.js';
import { playSound, initAudio, playMp3 } from './audio.js';
import { BRICK_TYPES } from './config.js';
import { getLevelPattern } from './levels.js';
import { drawRoundedRect, generateHexPattern } from './graphics.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas; this.ctx = canvas.getContext('2d');
        this.canvas.width = 400; this.canvas.height = 600;
        this.paddle = { x: 155, y: 520, width: 90, height: 12, glue: false };
        this.balls = []; this.bricks = []; this.bonuses = [];
        this.lives = 5; this.score = 0; this.currentLevel = 1;
        this.gameRunning = false;
        
        // Timers de estado (Frames: 60fps)
        this.deathPauseActive = false; this.deathPauseTimer = 0; // 3 segundos (180f)
        this.levelIntroActive = false; this.levelIntroTimer = 0;
        this.prepareActive = false; this.prepareTimer = 0; // 4 segundos (240f)

        this.initLevel(1);
    }

    initLevel(level) {
        this.bricks = []; this.bonuses = [];
        this.hexPattern = generateHexPattern(this.ctx, level);
        let pattern = getLevelPattern(level);
        const startX = (400 - (9 * 40)) / 2 + 2.5;
        
        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[r].length; c++) {
                let val = pattern[r][c];
                if (val > 0) {
                    let isMoving = (val === 6);
                    let isBumper = (val === 7);
                    let type = BRICK_TYPES[r % BRICK_TYPES.length];
                    this.bricks.push({
                        x: startX + c * 40, y: 75 + r * 20, w: 35, h: 15,
                        startX: startX + c * 40, moveDir: 1, speed: 1.5,
                        status: 1, hits: 1, color: type.color, points: 10,
                        isMoving: isMoving, isBumper: isBumper
                    });
                }
            }
        }
    }

    resetBall(reason) {
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        this.balls = [{ x: 200, y: 500, dx: 0, dy: 0, radius: 6, stuck: true }];
        this.deathPauseActive = false;
        if (reason === 'intro') { this.levelIntroActive = true; this.levelIntroTimer = 120; }
        else if (reason === 'respawn') { this.prepareActive = true; this.prepareTimer = 240; }
    }

    launchBalls() {
        this.balls.forEach(b => { b.stuck = false; b.dx = 3; b.dy = -5; });
    }

    update() {
        if (!this.gameRunning) return;

        // Máquina de estados dramática
        if (this.deathPauseActive) {
            if (--this.deathPauseTimer <= 0) {
                if (this.lives <= 0) { this.gameRunning = false; document.getElementById('gameOverMenu').style.display = 'flex'; }
                else { this.resetBall('respawn'); }
            }
            return;
        }

        if (this.levelIntroActive) { if (--this.levelIntroTimer <= 0) { this.levelIntroActive = false; this.launchBalls(); } return; }
        if (this.prepareActive) { if (--this.prepareTimer <= 0) { this.prepareActive = false; this.launchBalls(); } return; }

        // Física
        this.bricks.forEach(b => { if(b.isMoving) { b.x += b.speed * b.moveDir; if(b.x > b.startX+40 || b.x < b.startX-40) b.moveDir *= -1; } });

        this.balls.forEach((b, i) => {
            if (b.stuck) { b.x = this.paddle.x + 45; b.y = 508; }
            else {
                b.x += b.dx; b.y += b.dy;
                // Colisões parede
                if (b.x > 394 || b.x < 6) b.dx *= -1;
                if (b.y < 46) b.dy *= -1;
                // Colisão morte
                if (b.y > 600) {
                    this.balls.splice(i, 1);
                    if (this.balls.length === 0) {
                        playMp3('src/assets/scream1.mp3');
                        this.lives--;
                        this.deathPauseActive = true; this.deathPauseTimer = 180;
                    }
                }
                // Colisões (Simplificada para o exemplo, usar resolveBrickCollision)
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, 400, 600);
        if (this.hexPattern) { this.ctx.fillStyle = this.hexPattern; this.ctx.fillRect(0,0,400,600); }
        // ... (Render da raquete e tijolos aqui)
        if (this.prepareActive) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)'; this.ctx.fillRect(0, 250, 400, 100);
            this.ctx.fillStyle = '#FFD700'; this.ctx.textAlign = 'center';
            this.ctx.fillText("PREPARE-SE, JOGADOR", 200, 300);
        }
    }
}
