// src/js/game.js
import { isColliding, resolveBrickCollision, resolvePaddleCollision } from './physics.js';
import { playSound, initAudio } from './audio.js';
import { TOTAL_LEVELS, BRICK_TYPES, CAPSULE_WEIGHTS, LEVEL_TEXT_COLORS, LEVEL_BACKGROUNDS } from './config.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;

        this.topWallY = 40;
        this.INITIAL_LIVES = 5;
        this.TOTAL_LEVELS = TOTAL_LEVELS;

        this.baseWidth = 90;
        this.sizeState = 0;
        this.paddle = { x: 150, y: 520, width: 90, height: 12, glue: false };
        this.balls = [];
        this.bricks = [];
        this.bonuses = [];

        this.score = 0;
        this.lives = this.INITIAL_LIVES;
        this.currentLevel = 1;
        this.highScore = parseInt(localStorage.getItem('breakout_highscore')) || 0;

        this.gameRunning = false;
        this.victoryExplosionActive = false;
        this.isCapsuleOnScreen = false;
        this.warpDoorActive = false;
        this.electricShieldActive = false;
        this.shieldY = 580;

        this.levelIntroActive = false;
        this.levelIntroTimer = 0;
        this.warpAnimationActive = false;
        this.warpLaserTimer = 0;
        this.gigaBallTimeout = null;
        this.autoLaunchTimer = null;

        this.hexPattern = null;
        this.brickCols = 9;
        this.brickW = 35;
        this.brickH = 15;
        this.padding = 5;
    }

    startGame(difficulty) {
        initAudio();
        this.gameRunning = true;
        this.score = 0;
        this.lives = 5;
        
        let menuEl = document.getElementById('menu');
        if (menuEl) menuEl.style.display = 'none';

        this.initLevel(this.currentLevel);
        this.resetBall();
    }

    openIosPicker() {
        const overlay = document.getElementById('iosPickerOverlay');
        const wheelList = document.getElementById('wheelList');
        if (!overlay || !wheelList) return;

        wheelList.innerHTML = '';
        for (let i = 1; i <= this.TOTAL_LEVELS; i++) {
            let li = document.createElement('li');
            li.className = 'ios-wheel-item' + (i === this.currentLevel ? ' selected' : '');
            li.innerText = `Fase ${i}`;
            li.dataset.level = i;
            
            li.addEventListener('click', () => {
                this.currentLevel = i;
                document.querySelectorAll('.ios-wheel-item').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
                document.getElementById('selectLevelBtn').innerText = `Fase: ${this.currentLevel}`;
            });
            
            wheelList.appendChild(li);
        }
        overlay.style.display = 'flex';
    }

    closeIosPicker() {
        const overlay = document.getElementById('iosPickerOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    confirmIosPicker() {
        this.closeIosPicker();
        document.getElementById('selectLevelBtn').innerText = `Fase: ${this.currentLevel}`;
        
        let highScoreEl = document.getElementById('menuHighScore');
        if (highScoreEl) highScoreEl.innerText = `RECORDE: ${this.highScore}`;
    }

    getDeterministicCapsule() {
        let totalWeight = CAPSULE_WEIGHTS.reduce((acc, c) => acc + c.weight, 0);
        let seed = (Math.abs(this.score) % 10) + Math.floor(Math.abs(this.paddle.x));
        let value = seed % totalWeight;

        for (let c of CAPSULE_WEIGHTS) {
            if (value < c.weight) return c.type;
            value -= c.weight;
        }
        return 'C';
    }

    updatePaddleSize() {
        let scale = 1;
        if (this.sizeState === -1) scale = 0.65;
        if (this.sizeState === 1) scale = 1.35;
        this.paddle.width = this.baseWidth * scale;

        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
        }
    }

    clearActiveBonuses() {
        this.sizeState = 0;
        this.updatePaddleSize();
        this.paddle.glue = false;
        this.electricShieldActive = false;
        this.balls.forEach(ball => { ball.radius = 6; });
        if (this.gigaBallTimeout) {
            clearTimeout(this.gigaBallTimeout);
            this.gigaBallTimeout = null;
        }
    }

    generateLevelPattern(level, customColors = null) {
        let colors = customColors || LEVEL_BACKGROUNDS[(level - 1) % LEVEL_BACKGROUNDS.length];
        let patternCanvas = document.createElement('canvas');
        let pCtx = patternCanvas.getContext('2d');
        patternCanvas.width = 16;
        patternCanvas.height = 28;

        pCtx.fillStyle = colors.bg;
        pCtx.fillRect(0, 0, 16, 28);
        pCtx.strokeStyle = colors.stroke;
        pCtx.lineWidth = 1;
        pCtx.fillStyle = colors.hexFill;

        for (let y = -7; y < 35; y += 14) {
            for (let x = -8; x < 24; x += 16) {
                let offX = (Math.floor(y / 14) % 2 === 0) ? 0 : 8;
                pCtx.beginPath();
                for (let i = 0; i < 6; i++) {
                    let angle = (Math.PI / 3) * i;
                    let hx = (x + offX) + 6 * Math.cos(angle);
                    let hy = y + 6 * Math.sin(angle);
                    if (i === 0) pCtx.moveTo(hx, hy);
                    else pCtx.lineTo(hx, hy);
                }
                pCtx.closePath();
                pCtx.fill();
                pCtx.stroke();
            }
        }
        this.hexPattern = this.ctx.createPattern(patternCanvas, 'repeat');
    }

    drawRoundedRect(x, y, w, h, radius) {
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, w, h, radius);
        } else {
            this.ctx.moveTo(x + radius, y);
            this.ctx.arcTo(x + w, y, x + w, y + h, radius);
            this.ctx.arcTo(x + w, y + h, x, y + h, radius);
            this.ctx.arcTo(x, y + h, x, y, radius);
            this.ctx.arcTo(x, y, x + w, y, radius);
        }
        this.ctx.fill();
    }

    initLevel(level) {
        this.bricks = [];
        this.bonuses = [];
        this.isCapsuleOnScreen = false;
        this.warpDoorActive = false;
        this.electricShieldActive = false;
        this.warpAnimationActive = false;

        this.generateLevelPattern(level);

        this.levelIntroActive = true;
        this.levelIntroTimer = 120;
        playSound('introJingle');

        const startX = (this.canvas.width - (this.brickCols * (this.brickW + this.padding))) / 2;
        let pattern = [];

        if (level === 1) {
            for (let r = 0; r < 6; r++) pattern.push([1,1,1,1,1,1,1,1,1]);
        } else if (level === 2) {
            pattern = [
                [1,1,1, 0, 1,0,0,0,1],
                [1,0,0, 0, 1,1,0,1,1],
                [1,0,0, 0, 1,0,1,0,1],
                [1,0,0, 0, 1,0,1,0,1],
                [1,0,0, 0, 1,0,0,0,1],
                [1,0,0, 0, 1,0,0,0,1],
                [1,1,1, 0, 1,0,0,0,1]
            ];
        } else if (level === 8) {
            pattern = [
                [5,0,0,5, 0, 0,0,0,0],
                [5,1,1,5, 0, 0,0,0,0],
                [5,5,5,5, 0, 5,0,0,5],
                [0,0,0,0, 0, 5,1,1,5],
                [0,0,0,0, 0, 5,5,5,5],
                [0,0, 5,0,0,5, 0,0,0],
                [0,0, 5,1,1,5, 0,0,0],
                [0,0, 5,5,5,5, 0,0,0]
            ];
        } else if (level === 10) {
            pattern = [
                [3,3,3,3,3,3,3,3,3],
                [1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1,1],
                [4,4,4,4,4,4,4,4,4]
            ];
        } else if (level === 11) {
            pattern = [
                [5,0,0,0,0,0,0,0,5],
                [0,5,0,0,0,0,0,5,0],
                [0,0,5,1,1,1,5,0,0],
                [0,0,1,5,1,5,1,0,0],
                [0,0,1,1,3,1,1,0,0],
                [0,0,1,5,1,5,1,0,0],
                [0,0,5,1,1,1,5,0,0],
                [0,5,0,0,0,0,0,5,0],
                [5,0,0,0,0,0,0,0,5]
            ];
        } else if (level === 20) {
            pattern = [
                [0,0,3,3,3,3,3,0,0],
                [0,3,4,4,4,4,4,3,0],
                [3,4,4,3,0,0,0,0,0],
                [3,4,3,0,0,0,0,0,0],
                [3,4,4,3,0,0,0,0,0],
                [0,3,4,4,4,4,4,3,0],
                [0,0,3,3,3,3,3,0,0]
            ];
        } else {
            for (let r = 0; r < 5; r++) pattern.push([1,1,1,1,1,1,1,1,1]);
        }

        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[r].length; c++) {
                let val = pattern[r][c];
                if (val > 0) {
                    let type = BRICK_TYPES[0];
                    let hits = 1;
                    let color = type.color;
                    let points = type.points;
                    let indestructible = false;

                    if (val === 2) { color = '#FFD700'; points = 100; }
                    else if (val === 3) { color = '#AAAAAA'; hits = 3; points = 15; }
                    else if (val === 4) { color = '#FFD700'; hits = 4; points = 100; }
                    else if (val === 5) { color = '#E0E0E0'; hits = Infinity; points = 0; indestructible = true; }

                    this.bricks.push({
                        x: startX + c * (this.brickW + this.padding),
                        y: this.topWallY + 35 + r * (this.brickH + this.padding),
                        status: 1,
                        hits: hits,
                        maxHits: hits,
                        color: color,
                        points: points,
                        indestructible: indestructible,
                        hasCapsule: false
                    });
                }
            }
        }

        let activeDestructibleBricks = this.bricks.filter(b => b.status === 1 && !b.indestructible);
        let capsuleCount = Math.floor(activeDestructibleBricks.length * 0.20);
        let shuffled = [...activeDestructibleBricks].sort(() => Math.random() - 0.5);
        for (let i = 0; i < capsuleCount && i < shuffled.length; i++) {
            shuffled[i].hasCapsule = true;
        }
    }

    resetBall() {
        if (this.autoLaunchTimer) clearTimeout(this.autoLaunchTimer);
        this.clearActiveBonuses();

        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        this.balls = [{
            x: this.paddle.x + this.paddle.width / 2,
            y: this.paddle.y - 6 - 2,
            dx: 0, dy: 0, radius: 6, stuck: true
        }];

        this.autoLaunchTimer = setTimeout(() => { this.launchBalls(); }, 3000);
    }

    launchBalls() {
        if (this.autoLaunchTimer) clearTimeout(this.autoLaunchTimer);
        this.balls.forEach(ball => {
            if (ball.stuck) {
                ball.stuck = false;
                let randomDir = Math.random() > 0.5 ? 1 : -1;
                ball.dx = randomDir * (2 + Math.random() * 2);
                ball.dy = -3.5;
            }
        });
    }

    spawnMultiBalls() {
        let newBalls = [];
        this.balls.forEach(b => {
            for (let i = 0; i < 2; i++) {
                newBalls.push({
                    x: b.x, y: b.y,
                    dx: (Math.random() - 0.5) * 6,
                    dy: -Math.abs(b.dy || 3.5),
                    radius: b.radius || 6, stuck: false
                });
            }
        });
        this.balls = this.balls.concat(newBalls);
    }

    triggerVictoryExplosion() {
        this.victoryExplosionActive = true;
        this.gameRunning = false;
        this.balls = [];
        this.bonuses = [];

        playSound('whoosh');

        let startTime = performance.now();
        let duration = 7000;
        let lastFireworkSpawn = 0;
        let fireworksParticles = [];

        const victoryLoop = (timestamp) => {
            let elapsed = timestamp - startTime;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            let stroboscopicTimer = Math.floor(elapsed / 100);
            let randomBg = {
                bg: `hsl(${(stroboscopicTimer * 30) % 360}, 100%, 12%)`,
                stroke: `hsl(${(stroboscopicTimer * 30) % 360}, 100%, 50%)`,
                hexFill: `hsl(${(stroboscopicTimer * 30) % 360}, 100%, 25%)`
            };
            this.generateLevelPattern(20, randomBg);

            this.ctx.fillStyle = this.hexPattern;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = '#444';
            this.ctx.fillRect(0, this.topWallY, this.canvas.width, 4);

            if (elapsed - lastFireworkSpawn > 500 && elapsed < duration - 1000) {
                playSound('firework');
                lastFireworkSpawn = elapsed;

                let startX = 60 + Math.random() * (this.canvas.width - 120);
                let startY = 100 + Math.random() * 250;
                let particleCount = 70;
                let hue = Math.floor(Math.random() * 360);

                for (let i = 0; i < particleCount; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let speed = 1.5 + Math.random() * 4.5;
                    fireworksParticles.push({
                        x: startX, y: startY,
                        dx: Math.cos(angle) * speed,
                        dy: Math.sin(angle) * speed,
                        alpha: 1,
                        decay: 0.012 + Math.random() * 0.015,
                        color: `hsl(${hue + Math.random() * 40}, 100%, 65%)`
                    });
                }
            }

            for (let i = fireworksParticles.length - 1; i >= 0; i--) {
                let p = fireworksParticles[i];
                p.x += p.dx;
                p.y += p.dy;
                p.dy += 0.05;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    fireworksParticles.splice(i, 1);
                } else {
                    this.ctx.save();
                    this.ctx.globalAlpha = p.alpha;
                    this.ctx.fillStyle = p.color;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }

            let shake = (Math.random() - 0.5) * 4;
            this.ctx.fillStyle = '#FFFFFF';
            this.drawRoundedRect(this.paddle.x + shake, this.paddle.y, this.paddle.width, this.paddle.height, 6);

            if (elapsed < duration) {
                requestAnimationFrame(victoryLoop);
            } else {
                document.getElementById('winScore').innerText = `Pontos Totais: ${this.score}`;
                document.getElementById('winOverlay').style.display = 'flex';
            }
        };

        requestAnimationFrame(victoryLoop);
    }

    triggerWarpLaserAnimation() {
        this.warpAnimationActive = true;
        this.warpLaserTimer = 35;
        playSound('laserZoom');
    }

    update() {
        if (!this.gameRunning || this.victoryExplosionActive) return;

        if (this.levelIntroActive) {
            this.levelIntroTimer--;
            if (this.levelIntroTimer <= 0) this.levelIntroActive = false;
            this.draw();
            return;
        }

        if (this.warpAnimationActive) {
            this.warpLaserTimer--;
            if (this.warpLaserTimer <= 0) {
                this.warpAnimationActive = false;
                this.advanceToNextLevel();
            }
            this.draw();
            return;
        }

        if (this.warpDoorActive && this.paddle.x + this.paddle.width >= this.canvas.width - 6) {
            this.triggerWarpLaserAnimation();
            this.draw();
            return;
        }

        for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
            let ball = this.balls[bIndex];
            if (!ball) continue;

            if (ball.stuck) {
                ball.x = this.paddle.x + this.paddle.width / 2;
                ball.y = this.paddle.y - ball.radius - 2;
            } else {
                ball.x += ball.dx;
                ball.y += ball.dy;

                if (Math.abs(ball.dx) < 0.3) {
                    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 2.5;
                }

                if (ball.x + ball.radius > this.canvas.width) {
                    ball.x = this.canvas.width - ball.radius;
                    ball.dx *= -1;
                    playSound('wall');
                } else if (ball.x - ball.radius < 0) {
                    ball.x = ball.radius;
                    ball.dx *= -1;
                    playSound('wall');
                }

                if (ball.y - ball.radius < this.topWallY + 4) {
                    ball.y = this.topWallY + 4 + ball.radius;
                    ball.dy = Math.abs(ball.dy);
                    playSound('wall');
                }

                if (ball.y + ball.radius > this.paddle.y && ball.y - ball.radius < this.paddle.y + this.paddle.height &&
                    ball.x > this.paddle.x && ball.x < this.paddle.x + this.paddle.width) {
                    playSound('paddle');
                    if (this.paddle.glue) {
                        ball.stuck = true; ball.dx = 0; ball.dy = 0;
                    } else {
                        resolvePaddleCollision(ball, this.paddle);
                    }
                }

                if (this.electricShieldActive && ball.y + ball.radius >= this.shieldY) {
                    ball.dy = -Math.abs(ball.dy);
                    this.electricShieldActive = false;
                    playSound('shield');
                }

                if (ball.y + ball.radius > this.canvas.height) {
                    this.balls.splice(bIndex, 1);
                    continue;
                }

                this.bricks.forEach(b => {
                    if (b.status === 1) {
                        if (isColliding(ball, { x: b.x, y: b.y, w: this.brickW, h: this.brickH })) {
                            resolveBrickCollision(ball, b, this.brickW, this.brickH);
                            playSound('brick');

                            if (!b.indestructible) {
                                b.hits--;
                                if (b.hits <= 0) {
                                    b.status = 0;
                                    this.score += b.points;
                                    this.updateHUD();

                                    if (b.hasCapsule && !this.isCapsuleOnScreen && this.balls.length === 1) {
                                        let capType = this.getDeterministicCapsule();
                                        this.bonuses.push({ x: b.x + this.brickW / 2 - 12, y: b.y, type: capType, speed: 2 });
                                        this.isCapsuleOnScreen = true;
                                    }
                                } else {
                                    if (b.hits === 3) b.color = '#888888';
                                    if (b.hits === 2) b.color = '#666666';
                                    if (b.hits === 1) b.color = '#444444';
                                }
                            }
                        }
                    }
                });
            }
        }

        if (this.balls.length === 0) {
            playSound('lose');
            this.lives--;
            this.updateHUD();

            if (this.lives <= 0) {
                this.gameRunning = false;
                document.getElementById('gameOverTitle').innerText = "FIM DE JOGO";
                document.getElementById('finalScore').innerText = `Pontos Totais: ${this.score}`;
                document.getElementById('gameOverMenu').style.display = 'flex';
                return;
            } else {
                this.resetBall();
            }
        }

        let remainingDestructibleBricks = this.bricks.filter(b => b.status === 1 && !b.indestructible).length;
        if (remainingDestructibleBricks === 0) {
            this.advanceToNextLevel();
            return;
        }

        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            let b = this.bonuses[i];
            b.y += b.speed;

            if (b.y + 24 > this.paddle.y && b.y < this.paddle.y + this.paddle.height &&
                b.x + 24 > this.paddle.x && b.x < this.paddle.x + this.paddle.width) {
                playSound('bonus');
                this.clearActiveBonuses();

                if (b.type === 'C') {
                    this.paddle.glue = true;
                } else if (b.type === 'E') {
                    this.sizeState = 1; this.updatePaddleSize();
                } else if (b.type === 'S') {
                    this.balls.forEach(ball => { ball.dx *= 0.65; ball.dy *= 0.65; });
                } else if (b.type === 'H') {
                    this.electricShieldActive = true;
                } else if (b.type === 'G') {
                    this.balls.forEach(ball => { ball.radius = 12; });
                    this.gigaBallTimeout = setTimeout(() => {
                        this.balls.forEach(ball => { ball.radius = 6; });
                    }, 15000);
                } else if (b.type === 'D') {
                    this.spawnMultiBalls();
                } else if (b.type === 'P') {
                    this.lives++; this.updateHUD();
                } else if (b.type === 'B') {
                    this.warpDoorActive = true;
                }

                this.bonuses.splice(i, 1);
                this.isCapsuleOnScreen = false;
            } else if (b.y > this.canvas.height) {
                this.bonuses.splice(i, 1);
                this.isCapsuleOnScreen = false;
            }
        }

        this.draw();
    }

    advanceToNextLevel() {
        if (this.currentLevel < this.TOTAL_LEVELS) {
            this.currentLevel++;
            this.initLevel(this.currentLevel);
            this.resetBall();
            this.updateHUD();
        } else {
            this.triggerVictoryExplosion();
        }
    }

    updateHUD() {
        document.getElementById('scoreText').innerText = `Pts: ${this.score}`;
        document.getElementById('levelText').innerText = `Fase: ${this.currentLevel}/${this.TOTAL_LEVELS}`;
        document.getElementById('livesText').innerText = `Vidas: ${this.lives}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.hexPattern) {
            this.ctx.fillStyle = this.hexPattern;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        this.ctx.fillStyle = '#444';
        this.ctx.fillRect(0, this.topWallY, this.canvas.width, 4);

        if (this.electricShieldActive) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#00FFFF';
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.shieldY);
            for (let x = 0; x <= this.canvas.width; x += 10) {
                let offset = (Math.random() - 0.5) * 4;
                this.ctx.lineTo(x, this.shieldY + offset);
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        if (this.warpDoorActive) {
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = '#00FFFF';
            this.ctx.strokeStyle = '#00FFFF';
            this.ctx.lineWidth = 2;
            this.ctx.fillStyle = '#FF8C00';
            this.drawRoundedRect(this.canvas.width - 10, this.paddle.y - 18, 10, 45, 4);

            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width - 5, this.paddle.y - 18);
            for (let py = this.paddle.y - 18; py <= this.paddle.y + 27; py += 6) {
                let rx = (this.canvas.width - 5) + (Math.random() - 0.5) * 6;
                this.ctx.lineTo(rx, py);
            }
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        if (this.warpAnimationActive) {
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#00FFFF';
            this.ctx.fillStyle = '#FFFFFF';
            let beamWidth = (35 - this.warpLaserTimer) * 12;
            this.ctx.fillRect(this.paddle.x, this.paddle.y, Math.min(this.canvas.width - this.paddle.x, beamWidth), this.paddle.height);
            this.ctx.shadowBlur = 0;
        } else {
            this.ctx.fillStyle = '#ffffff';
            this.drawRoundedRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 6);
        }

        this.ctx.fillStyle = '#ffffff';
        this.balls.forEach(ball => {
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.bricks.forEach(b => {
            if (b.status === 1) {
                this.ctx.fillStyle = b.color;
                this.drawRoundedRect(b.x, b.y, this.brickW, this.brickH, 4);
            }
        });

        this.bonuses.forEach(b => {
            let capColor = '#FFFFFF';
            let textColor = '#000000';

            if (b.type === 'C') { capColor = '#00AA00'; textColor = '#FFFFFF'; }
            else if (b.type === 'E') { capColor = '#FFFFFF'; textColor = '#00AA00'; }
            else if (b.type === 'S') { capColor = '#3498db'; textColor = '#FFFFFF'; }
            else if (b.type === 'H') { capColor = '#008B8B'; textColor = '#FFFFFF'; }
            else if (b.type === 'G') { capColor = '#FF1493'; textColor = '#FFFF00'; }
            else if (b.type === 'D') { capColor = '#00FF00'; textColor = '#FFFFFF'; }
            else if (b.type === 'P') { capColor = '#006400'; textColor = '#FFFFFF'; }
            else if (b.type === 'B') { capColor = '#FF8C00'; textColor = '#FFFFFF'; }

            this.ctx.fillStyle = capColor;
            this.drawRoundedRect(b.x, b.y, 24, 24, 6);

            this.ctx.fillStyle = textColor;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText(b.type, b.x + 6, b.y + 18);
        });

        if (this.levelIntroActive) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 45, this.canvas.width, 90);

            this.ctx.font = '900 32px -apple-system, BlinkMacSystemFont, Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = LEVEL_TEXT_COLORS[(this.currentLevel - 1) % LEVEL_TEXT_COLORS.length];
            this.ctx.shadowBlur = 12;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.fillText(`FASE ${this.currentLevel}`, this.canvas.width / 2, this.canvas.height / 2 + 10);

            this.ctx.textAlign = 'left';
            this.ctx.shadowBlur = 0;
        }
    }
}
