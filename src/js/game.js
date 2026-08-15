// src/js/game.js
import { isColliding, resolveBrickCollision, resolvePaddleCollision, enforceBallSpeed } from './physics.js';
import { playSound, initAudio, playMp3, playBgm, pauseBgm, stopBgm } from './audio.js';
import { TOTAL_LEVELS, BRICK_TYPES, LEVEL_TEXT_COLORS, LEVEL_BACKGROUNDS } from './config.js';
import { getLevelPattern } from './levels.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 600;

        this.topWallY = 40;
        this.INITIAL_LIVES = 5;
        this.TOTAL_LEVELS = TOTAL_LEVELS;

        this.currentLevel = 1; 
        this.score = 0;
        this.lives = this.INITIAL_LIVES;
        this.highScore = parseInt(localStorage.getItem('breakout_highscore'), 10) || 0;

        this.paddleLevel = 3; 
        this.ballSpeedLevel = 3; 
        this.ballSizeLevel = 3;  

        this.paddle = { x: 157.5, y: 520, width: 60.025, height: 12, glue: false, alpha: 1.0, extraScale: 0 };
        this.balls = [];
        this.bricks = [];
        this.bonuses = [];

        this.gameRunning = false;
        this.victoryExplosionActive = false;
        this.isCapsuleOnScreen = false;
        this.warpDoorActive = false;
        this.electricShieldActive = false;
        this.shieldY = 580;

        this.deathPauseActive = false;
        this.deathPauseTimer = 0;
        this.deathAnimType = 0;
        this.deathParticles = [];

        this.levelIntroActive = false;
        this.levelIntroTimer = 0;
        this.prepareActive = false; 
        this.prepareTimer = 0;
        this.warpAnimationActive = false;
        this.warpLaserTimer = 0;
        this.gigaBallTimer = 0;

        this.hexPattern = null;
        this.brickCols = 9;
        this.brickW = 35;
        this.brickH = 15;
        this.padding = 5;

        this.initLevel(this.currentLevel);
        this.applyPaddleSettings();
        this.resetBall('none'); 
    }

    setPaddleLevel(lvl) {
        this.paddleLevel = parseInt(lvl, 10);
        this.applyPaddleSettings();
    }

    setBallSpeedLevel(lvl) {
        this.ballSpeedLevel = parseInt(lvl, 10);
    }

    setBallSizeLevel(lvl) {
        this.ballSizeLevel = parseInt(lvl, 10);
        this.applyBallSettings();
    }

    applyPaddleSettings() {
        const minW = 35;
        const maxW = 85.05;
        this.paddle.width = minW + ((this.paddleLevel - 1) / 4) * (maxW - minW);

        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
        }
    }

    getBallRadius() {
        const radii = [4.0, 5.0, 6.0, 7.0, 8.0];
        return radii[this.ballSizeLevel - 1] || 6.0;
    }

    applyBallSettings() {
        const r = this.getBallRadius();
        this.balls.forEach(ball => { ball.radius = r; });
    }

    startGame() {
        initAudio();
        playBgm();
        this.score = 0;
        this.lives = this.INITIAL_LIVES;
        document.querySelectorAll('.modal-menu').forEach(el => el.style.display = 'none');
        this.initLevel(this.currentLevel);
        this.resetBall('intro');
        this.gameRunning = true;
    }

    resumeGame() { 
        playBgm();
        this.gameRunning = true; 
    }

    restartFromLevel1() { this.currentLevel = 1; this.startGame(); }

    quitToMainMenu() { 
        this.gameRunning = false; 
        stopBgm();
        document.querySelectorAll('.modal-menu').forEach(el => el.style.display = 'none');
        document.getElementById('menu').style.display = 'flex';
        let btn = document.getElementById('selectLevelBtn');
        if (btn) btn.innerText = `Selecionar Fase: ${this.currentLevel}`;
    }

    continueGame() { 
        document.getElementById('gameOverMenu').style.display = 'none'; 
        this.lives = 3; 
        playBgm();
        this.resetBall('respawn'); 
        this.gameRunning = true; 
    }

    clearActiveBonuses() {
        this.applyPaddleSettings();
        this.paddle.glue = false;
        this.electricShieldActive = false;
        this.warpDoorActive = false;
        this.isCapsuleOnScreen = false;
        this.applyBallSettings();
        this.gigaBallTimer = 0;
        this.bonuses = [];
    }

    generateLevelPattern(level, customColors = null) {
        let colors = customColors || LEVEL_BACKGROUNDS[(level - 1) % LEVEL_BACKGROUNDS.length];
        let patternCanvas = document.createElement('canvas');
        let pCtx = patternCanvas.getContext('2d');
        patternCanvas.width = 16; patternCanvas.height = 28;

        pCtx.fillStyle = colors.bg; pCtx.fillRect(0, 0, 16, 28);
        pCtx.strokeStyle = colors.stroke; pCtx.lineWidth = 1; pCtx.fillStyle = colors.hexFill;

        for (let y = -7; y < 35; y += 14) {
            for (let x = -8; x < 24; x += 16) {
                let offX = (Math.floor(y / 14) % 2 === 0) ? 0 : 8;
                pCtx.beginPath();
                for (let i = 0; i < 6; i++) {
                    let angle = (Math.PI / 3) * i;
                    let hx = (x + offX) + 6 * Math.cos(angle);
                    let hy = y + 6 * Math.sin(angle);
                    if (i === 0) pCtx.moveTo(hx, hy); else pCtx.lineTo(hx, hy);
                }
                pCtx.closePath(); pCtx.fill(); pCtx.stroke();
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

    drawCracks(ctx, x, y, w, h, damageLevel) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();

        const renderCrackPath = (points) => {
            ctx.beginPath();
            ctx.moveTo(x + points[0].x * w, y + points[0].y * h + 1);
            for(let i = 1; i < points.length; i++) {
                ctx.lineTo(x + points[i].x * w, y + points[i].y * h + 1);
            }
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + points[0].x * w, y + points[0].y * h);
            for(let i = 1; i < points.length; i++) {
                ctx.lineTo(x + points[i].x * w, y + points[i].y * h);
            }
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        };

        if (damageLevel >= 1) {
            renderCrackPath([
                {x: 0.1, y: 0}, {x: 0.25, y: 0.4}, {x: 0.15, y: 0.7}, {x: 0.4, y: 0.9}
            ]);
        }
        
        if (damageLevel >= 2) {
            renderCrackPath([
                {x: 0.85, y: 1}, {x: 0.7, y: 0.6}, {x: 0.8, y: 0.3}, {x: 0.45, y: 0.1}
            ]);
            renderCrackPath([
                {x: 0.95, y: 0.3}, {x: 0.7, y: 0.4}, {x: 0.6, y: 0.6}
            ]);
        }
        ctx.restore();
    }

    initLevel(level) {
        this.clearActiveBonuses();
        this.bricks = [];
        this.warpAnimationActive = false;
        this.deathPauseActive = false;

        this.generateLevelPattern(level);
        playSound('introJingle');

        const startX = (this.canvas.width - (this.brickCols * (this.brickW + this.padding))) / 2;
        let pattern = getLevelPattern(level);

        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[r].length; c++) {
                let val = pattern[r][c];
                if (val > 0) {
                    let isMoving = false;
                    let isBumper = false;
                    let isKinetic = false;
                    let hits = 1; 
                    let color = '#FFFFFF'; 
                    let points = 10; 
                    let indestructible = false;
                    let lightBase = null; 
                    let darkBase = null; 
                    let speed = 1.5;
                    let moveRange = 40;
                    
                    if (val === 6) { 
                        color = '#FF00FF'; points = 50; isMoving = true; hits = 2; 
                    }
                    else if (val === 7) { 
                        points = 150; indestructible = true; isBumper = true; 
                        if (c < 4) {
                            lightBase = '#00e676'; darkBase = '#004d26';
                        } else {
                            lightBase = '#ffea00'; darkBase = '#807500';
                        }
                    }
                    else if (val === 8) {
                        color = '#DAA520'; 
                        hits = 3; 
                        points = 0; 
                        indestructible = true; 
                        isKinetic = true;      
                        speed = 0.8;
                        moveRange = this.brickW + this.padding; 
                    }
                    else if (val === 5) {
                        color = '#DAA520'; hits = Infinity; points = 0; indestructible = true;
                    }
                    else if (val === 3) {
                        color = '#FFFF00'; hits = 3; points = 30;
                    }
                    else if (val === 4) {
                        color = '#FFD700'; hits = 4; points = 100;
                    }
                    else {
                        let type = BRICK_TYPES[r % BRICK_TYPES.length];
                        color = type.color; points = type.points;
                        if (val === 2) { color = '#FFD700'; points = 100; }
                    }

                    this.bricks.push({
                        x: startX + c * (this.brickW + this.padding),
                        y: this.topWallY + 35 + r * (this.brickH + this.padding),
                        w: this.brickW, h: this.brickH,
                        startX: startX + c * (this.brickW + this.padding),
                        moveDir: 1, speed: speed, moveRange: moveRange,
                        status: 1, hits: hits, maxHits: hits, color: color, points: points, 
                        indestructible: indestructible, hasCapsule: false,
                        isMoving: isMoving, isBumper: isBumper, isKinetic: isKinetic,
                        flashTimer: 0,
                        lightBase: lightBase, 
                        darkBase: darkBase    
                    });
                }
            }
        }

        let activeDestructibleBricks = this.bricks.filter(b => b.status === 1 && !b.indestructible && !b.isKinetic);
        let capsuleCount = Math.floor(activeDestructibleBricks.length * 0.25);
        let shuffled = [...activeDestructibleBricks].sort(() => Math.random() - 0.5);
        for (let i = 0; i < capsuleCount && i < shuffled.length; i++) {
            shuffled[i].hasCapsule = true;
        }
    }

    resetBall(reason = 'none') {
        this.clearActiveBonuses();
        
        this.paddle.y = 520;
        this.paddle.height = 12;
        this.paddle.alpha = 1.0;
        this.paddle.extraScale = 0;
        this.deathAnimType = 0;
        this.deathParticles = [];

        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        
        const radius = this.getBallRadius();
        this.balls = [{
            x: this.paddle.x + this.paddle.width / 2,
            y: this.paddle.y - radius - 2,
            dx: 0, dy: 0, radius: radius, stuck: true, baseSpeed: 0
        }];

        this.levelIntroActive = false;
        this.prepareActive = false;
        this.deathPauseActive = false;

        if (reason === 'intro') {
            this.levelIntroActive = true;
            this.levelIntroTimer = 120;
        } else if (reason === 'respawn') {
            this.prepareActive = true;
            this.prepareTimer = 180;
        } else {
            this.balls[0].stuck = true; 
        }
    }

    launchBalls() {
        const speeds = [-2.5, -3.5, -4.5, -5.5, -6.5];
        const dxRanges = [2.0, 2.5, 3.0, 3.5, 4.0];
        
        const initialDy = speeds[this.ballSpeedLevel - 1] || -4.5;
        const initialDxRange = dxRanges[this.ballSpeedLevel - 1] || 3.0;

        this.balls.forEach(ball => {
            if (ball.stuck) {
                ball.stuck = false;
                let randomDir = Math.random() > 0.5 ? 1 : -1;
                ball.dx = randomDir * (initialDxRange + Math.random() * 1.5);
                ball.dy = initialDy;
                ball.baseSpeed = Math.hypot(ball.dx, ball.dy);
            }
        });
    }

    spawnMultiBalls() {
        const radius = this.getBallRadius();
        let newBalls = [];
        this.balls.forEach(b => {
            for (let i = 0; i < 2; i++) {
                let dx = (Math.random() - 0.5) * 6;
                let dy = -Math.abs(b.dy || 4.5);
                let speed = Math.hypot(dx, dy);
                newBalls.push({ x: b.x, y: b.y, dx: dx, dy: dy, radius: radius, stuck: false, baseSpeed: speed });
            }
        });
        this.balls = this.balls.concat(newBalls);
    }

    triggerVictoryExplosion() {
        this.victoryExplosionActive = true; this.gameRunning = false; this.balls = []; this.bonuses = [];
        pauseBgm();
        playSound('whoosh');
        let startTime = performance.now(); let duration = 7000; let lastFireworkSpawn = 0; let fireworksParticles = [];

        const victoryLoop = (timestamp) => {
            let elapsed = timestamp - startTime;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let stroboscopicTimer = Math.floor(elapsed / 100);
            let randomBg = { bg: `hsl(${(stroboscopicTimer * 30) % 360}, 100%, 12%)`, stroke: `hsl(${(stroboscopicTimer * 30) % 360}, 100%, 50%)`, hexFill: `hsl(${(stroboscopicTimer * 30) % 360}, 100%, 25%)` };
            
            this.generateLevelPattern(20, randomBg);
            this.ctx.fillStyle = this.hexPattern; 
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#444'; this.ctx.fillRect(0, this.topWallY, this.canvas.width, 4);

            if (elapsed - lastFireworkSpawn > 500 && elapsed < duration - 1000) {
                playSound('firework'); lastFireworkSpawn = elapsed;
                let startX = 60 + Math.random() * (this.canvas.width - 120); let startY = 100 + Math.random() * 250;
                let hue = Math.floor(Math.random() * 360);
                for (let i = 0; i < 70; i++) {
                    let angle = Math.random() * Math.PI * 2; let speed = 1.5 + Math.random() * 4.5;
                    fireworksParticles.push({ x: startX, y: startY, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, alpha: 1, decay: 0.012 + Math.random() * 0.015, color: `hsl(${hue + Math.random() * 40}, 100%, 65%)` });
                }
            }

            for (let i = fireworksParticles.length - 1; i >= 0; i--) {
                let p = fireworksParticles[i]; p.x += p.dx; p.y += p.dy; p.dy += 0.05; p.alpha -= p.decay;
                if (p.alpha <= 0) fireworksParticles.splice(i, 1);
                else { this.ctx.save(); this.ctx.globalAlpha = p.alpha; this.ctx.fillStyle = p.color; this.ctx.beginPath(); this.ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); this.ctx.fill(); this.ctx.restore(); }
            }

            let shake = (Math.random() - 0.5) * 4;
            this.ctx.fillStyle = '#FFFFFF'; this.drawRoundedRect(this.paddle.x + shake, this.paddle.y, this.paddle.width, this.paddle.height, 6);

            if (elapsed < duration) requestAnimationFrame(victoryLoop);
            else { document.getElementById('winScore').innerText = `Pontos Totais: ${this.score}`; document.getElementById('winOverlay').style.display = 'flex'; }
        };
        requestAnimationFrame(victoryLoop);
    }

    triggerWarpLaserAnimation() { this.warpAnimationActive = true; this.warpLaserTimer = 35; playSound('laserZoom'); }

    update(dt) {
        if (!this.gameRunning || this.victoryExplosionActive) return;

        if (dt > 50) dt = 16.666; 
        const ts = dt / 16.666;

        let isPausedForIntro = false;

        if (this.deathPauseActive) {
            this.deathPauseTimer -= ts;
            if (this.deathPauseTimer <= 0) {
                this.deathPauseActive = false;
                if (this.lives <= 0) {
                    this.gameRunning = false;
                    pauseBgm();
                    let gTitle = document.getElementById('gameOverTitle'); if (gTitle) gTitle.innerText = "FIM DO JOGO";
                    let fScore = document.getElementById('finalScore'); if (fScore) fScore.innerText = `Pontos Totais: ${this.score}`;
                    let gMenu = document.getElementById('gameOverMenu'); if (gMenu) gMenu.style.display = 'flex';
                } else {
                    this.resetBall('respawn'); 
                }
            }
            isPausedForIntro = true;
        } 
        else if (this.levelIntroActive) {
            this.levelIntroTimer -= ts;
            if (this.levelIntroTimer <= 0) {
                this.levelIntroActive = false;
                this.launchBalls();
            }
            isPausedForIntro = true;
        } 
        else if (this.prepareActive) {
            this.prepareTimer -= ts;
            if (this.prepareTimer <= 0) {
                this.prepareActive = false;
                this.launchBalls();
            }
            isPausedForIntro = true;
        }

        if (this.warpAnimationActive && !isPausedForIntro) {
            this.warpLaserTimer -= ts;
            if (this.warpLaserTimer <= 0) {
                this.warpAnimationActive = false;
                this.advanceToNextLevel();
            }
            isPausedForIntro = true;
        } else if (this.warpDoorActive && this.paddle.x + this.paddle.width >= this.canvas.width - 6 && !isPausedForIntro) {
            this.triggerWarpLaserAnimation();
            isPausedForIntro = true;
        }

        if (isPausedForIntro) {
            this.balls.forEach(ball => {
                if (ball.stuck) {
                    ball.x = this.paddle.x + this.paddle.width / 2;
                    ball.y = this.paddle.y - ball.radius - 2;
                }
            });
            return; 
        }

        if (this.gigaBallTimer > 0) {
            this.gigaBallTimer -= ts;
            if (this.gigaBallTimer <= 0) { this.applyBallSettings(); }
        }

        this.bricks.forEach(b => {
            if (b.status === 1) {
                if (b.isMoving) {
                    b.x += b.speed * b.moveDir * ts;
                    if (b.x > b.startX + b.moveRange || b.x < b.startX - b.moveRange) {
                        b.moveDir *= -1;
                    }
                }
                if (b.flashTimer > 0) {
                    b.flashTimer -= ts;
                }
            }
        });

        for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
            let ball = this.balls[bIndex];
            if (!ball) continue;

            if (ball.stuck) {
                ball.x = this.paddle.x + this.paddle.width / 2;
                ball.y = this.paddle.y - ball.radius - 2;
            } else {
                ball.x += ball.dx * ts; 
                ball.y += ball.dy * ts;

                if (ball.x + ball.radius > this.canvas.width) { ball.x = this.canvas.width - ball.radius; ball.dx *= -1; playSound('wall'); enforceBallSpeed(ball); } 
                else if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.dx *= -1; playSound('wall'); enforceBallSpeed(ball); }

                if (ball.y - ball.radius < this.topWallY + 4) { ball.y = this.topWallY + 4 + ball.radius; ball.dy = Math.abs(ball.dy); playSound('wall'); enforceBallSpeed(ball); }

                if (ball.dy > 0 && ball.y + ball.radius > this.paddle.y && ball.y - ball.radius < this.paddle.y + this.paddle.height && ball.x > this.paddle.x && ball.x < this.paddle.x + this.paddle.width) {
                    playSound('paddle');
                    if (this.paddle.glue) { 
                        ball.stuck = true; ball.dx = 0; ball.dy = 0; 
                    } else { 
                        resolvePaddleCollision(ball, this.paddle); 
                    }
                }

                if (this.electricShieldActive && ball.y + ball.radius >= this.shieldY) { 
                    ball.dy = -Math.abs(ball.dy); this.electricShieldActive = false; playSound('shield'); enforceBallSpeed(ball); 
                }

                if (ball.y + ball.radius > this.canvas.height) {
                    this.balls.splice(bIndex, 1);
                    
                    if (this.balls.length === 0 && !this.deathPauseActive) {
                        this.bonuses = []; 
                        playMp3('src/assets/scream1.mp3'); 
                        this.lives--;
                        
                        this.deathPauseActive = true;
                        this.deathPauseTimer = 300;

                        this.deathAnimType = Math.floor(Math.random() * 4) + 1;
                        this.deathParticles = [];
                        this.paddle.alpha = 1.0;
                        this.paddle.extraScale = 0;

                        if (this.deathAnimType === 1) { 
                            for (let i = 0; i < 40; i++) {
                                this.deathParticles.push({
                                    x: this.paddle.x + Math.random() * this.paddle.width,
                                    y: this.paddle.y + Math.random() * this.paddle.height,
                                    dx: (Math.random() - 0.5) * 4,
                                    dy: (Math.random() - 0.8) * 4,
                                    size: Math.random() * 4 + 2,
                                    life: 1.0, decay: Math.random() * 0.003 + 0.002,
                                    color: Math.random() > 0.5 ? '#ffffff' : '#aaaaaa'
                                });
                            }
                        }
                    }
                    continue;
                }

                let hitBricks = [];

                this.bricks.forEach(b => {
                    if (b.status === 1) {
                        if (b.isBumper) {
                            let cx = b.x + b.w / 2; let cy = b.y + b.h / 2; 
                            let bumperRadius = (b.w / 2) * 1.45; 
                            let dx = ball.x - cx; let dy = ball.y - cy;
                            let dist = Math.hypot(dx, dy);
                            
                            if (dist <= ball.radius + bumperRadius) {
                                hitBricks.push({brick: b, dist: dist, isBumper: true, bumperRadius: bumperRadius});
                            }
                        } else {
                            if (isColliding(ball, { x: b.x, y: b.y, w: b.w, h: b.h })) {
                                hitBricks.push({brick: b, dist: Math.hypot(ball.x - (b.x + b.w/2), ball.y - (b.y + b.h/2)), isBumper: false});
                            }
                        }
                    }
                });

                if (hitBricks.length > 0) {
                    hitBricks.sort((a, b) => a.dist - b.dist);
                    let closest = hitBricks[0];
                    let b = closest.brick;

                    if (closest.isBumper) {
                        let cx = b.x + b.w / 2; let cy = b.y + b.h / 2; 
                        let dx = ball.x - cx; let dy = ball.y - cy;
                        let dist = closest.dist;
                        if (dist === 0) { dx = 1; dist = 1; }
                        
                        let nx = dx / dist; let ny = dy / dist;
                        let overlap = (ball.radius + closest.bumperRadius) - dist + 1;
                        ball.x += nx * overlap; ball.y += ny * overlap;
                        
                        let dot = (ball.dx * nx) + (ball.dy * ny);
                        ball.dx -= 2 * dot * nx;
                        ball.dy -= 2 * dot * ny;
                        enforceBallSpeed(ball);

                        playSound('bumper');
                        b.flashTimer = 20;
                    } else {
                        resolveBrickCollision(ball, b);
                        playSound('brick');
                    }

                    hitBricks.forEach(hit => {
                        let bk = hit.brick;
                        
                        if (bk.isKinetic) {
                            if (!bk.isMoving) {
                                bk.hits--;
                                if (bk.hits <= 0) {
                                    bk.isMoving = true;
                                }
                            }
                        } else if (!bk.indestructible && !bk.isBumper) {
                            bk.hits--;
                            if (bk.hits <= 0) {
                                bk.status = 0; this.score += bk.points;
                                if (bk.hasCapsule && !this.isCapsuleOnScreen && this.balls.length === 1) {
                                    const capsules = ['C', 'E', 'S', 'H', 'G', 'D', 'P', 'B'];
                                    let capType = capsules[Math.floor(Math.random() * capsules.length)];
                                    this.bonuses.push({ x: bk.x + bk.w / 2 - 12, y: bk.y, type: capType, speed: 2 });
                                    this.isCapsuleOnScreen = true;
                                }
                            } else {
                                if (bk.hits === 2) bk.color = '#DDDD00'; 
                                if (bk.hits === 1) bk.color = '#AAAA00'; 
                            }
                        }
                    });
                }
            }
        }

        let remainingDestructibleBricks = this.bricks.filter(b => b.status === 1 && !b.indestructible && !b.isKinetic).length;
        if (remainingDestructibleBricks === 0) { this.advanceToNextLevel(); return; }

        for (let i = this.bonuses.length - 1; i >= 0; i--) {
            let b = this.bonuses[i];
            b.y += b.speed * ts;

            if (b.y + 24 > this.paddle.y && b.y < this.paddle.y + this.paddle.height && b.x + 24 > this.paddle.x && b.x < this.paddle.x + this.paddle.width) {
                playSound('bonus');
                this.clearActiveBonuses();

                if (b.type === 'C') { this.paddle.glue = true; } 
                else if (b.type === 'E') {
                    let expandedWidth = this.paddle.width * 1.5;
                    this.paddle.width = Math.min(expandedWidth, this.canvas.width - 20);
                    if (this.paddle.x + this.paddle.width > this.canvas.width) this.paddle.x = this.canvas.width - this.paddle.width;
                } else if (b.type === 'S') { this.balls.forEach(ball => { ball.dx *= 0.65; ball.dy *= 0.65; ball.baseSpeed = Math.hypot(ball.dx, ball.dy); }); } 
                else if (b.type === 'H') { this.electricShieldActive = true; } 
                else if (b.type === 'G') {
                    this.balls.forEach(ball => { ball.radius = 14; });
                    this.gigaBallTimer = 15 * 60;
                } else if (b.type === 'D') { this.spawnMultiBalls(); } 
                else if (b.type === 'P') { this.lives++; } 
                else if (b.type === 'B') { this.warpDoorActive = true; }

                this.bonuses.splice(i, 1);
                this.isCapsuleOnScreen = false;
            } else if (b.y > this.canvas.height) {
                this.bonuses.splice(i, 1);
                this.isCapsuleOnScreen = false;
            }
        }
    }

    advanceToNextLevel() {
        if (this.currentLevel < this.TOTAL_LEVELS) {
            this.currentLevel++;
            this.initLevel(this.currentLevel);
            this.resetBall('intro');
        } else {
            this.triggerVictoryExplosion();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.hexPattern) { this.ctx.fillStyle = this.hexPattern; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
        
        this.ctx.fillStyle = '#444'; 
        this.ctx.fillRect(0, this.topWallY, this.canvas.width, 4);

        this.ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`Pts: ${this.score}`, 12, 26);
        this.ctx.fillText(`Fase: ${this.currentLevel}/${this.TOTAL_LEVELS}`, 115, 26);
        this.ctx.fillStyle = '#FF2A2A';
        this.ctx.fillText(`Vidas: ${this.lives}`, 210, 26);

        if (this.electricShieldActive) {
            this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#00FFFF'; this.ctx.strokeStyle = '#00FFFF'; this.ctx.lineWidth = 3;
            this.ctx.beginPath(); this.ctx.moveTo(0, this.shieldY);
            for (let x = 0; x <= this.canvas.width; x += 10) { let offset = (Math.random() - 0.5) * 4; this.ctx.lineTo(x, this.shieldY + offset); }
            this.ctx.stroke(); this.ctx.shadowBlur = 0;
        }

        if (this.warpDoorActive) {
            this.ctx.shadowBlur = 12; this.ctx.shadowColor = '#00FFFF'; this.ctx.strokeStyle = '#00FFFF'; this.ctx.lineWidth = 2; this.ctx.fillStyle = '#FF8C00';
            this.drawRoundedRect(this.canvas.width - 10, this.paddle.y - 18, 10, 45, 4);
            this.ctx.beginPath(); this.ctx.moveTo(this.canvas.width - 5, this.paddle.y - 18);
            for (let py = this.paddle.y - 18; py <= this.paddle.y + 27; py += 6) { let rx = (this.canvas.width - 5) + (Math.random() - 0.5) * 6; this.ctx.lineTo(rx, py); }
            this.ctx.stroke(); this.ctx.shadowBlur = 0;
        }

        if (this.warpAnimationActive) {
            this.ctx.shadowBlur = 20; this.ctx.shadowColor = '#00FFFF'; this.ctx.fillStyle = '#FFFFFF';
            let beamWidth = (35 - this.warpLaserTimer) * 12;
            this.ctx.fillRect(this.paddle.x, this.paddle.y, Math.min(this.canvas.width - this.paddle.x, beamWidth), this.paddle.height);
            this.ctx.shadowBlur = 0;
        } 
        else if (this.deathPauseActive && this.deathAnimType > 0) {
            if (this.deathAnimType === 1) { 
                for (let i = this.deathParticles.length - 1; i >= 0; i--) {
                    let p = this.deathParticles[i];
                    p.x += p.dx; p.y += p.dy; p.dy += 0.05; 
                    p.life -= p.decay;
                    if (p.life <= 0) { this.deathParticles.splice(i, 1); } 
                    else {
                        this.ctx.globalAlpha = Math.max(0, p.life); this.ctx.fillStyle = p.color;
                        this.ctx.fillRect(p.x, p.y, p.size, p.size);
                    }
                }
                this.ctx.globalAlpha = 1.0;
            } 
            else if (this.deathAnimType === 2) { 
                this.paddle.alpha -= 0.004;
                this.paddle.extraScale += 0.15; 
                if (this.paddle.alpha > 0) {
                    this.ctx.globalAlpha = Math.max(0, this.paddle.alpha);
                    this.ctx.fillStyle = '#ffffff';
                    this.drawRoundedRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 6);
                    
                    this.ctx.globalAlpha = Math.max(0, this.paddle.alpha * 0.5);
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    if(this.ctx.roundRect) {
                        this.ctx.roundRect(this.paddle.x - this.paddle.extraScale, this.paddle.y - this.paddle.extraScale, this.paddle.width + this.paddle.extraScale*2, this.paddle.height + this.paddle.extraScale*2, 8);
                    }
                    this.ctx.stroke();
                }
                this.ctx.globalAlpha = 1.0;
            } 
            else if (this.deathAnimType === 3) { 
                if (this.paddle.height > 0) {
                    this.paddle.height -= 0.05; 
                    this.paddle.y += 0.05; 
                    this.ctx.fillStyle = '#ffffff';
                    this.drawRoundedRect(this.paddle.x, this.paddle.y, this.paddle.width, Math.max(0, this.paddle.height), 6);
                    
                    if (Math.random() > 0.7) { 
                        this.deathParticles.push({
                            x: this.paddle.x + Math.random() * this.paddle.width,
                            y: this.paddle.y + this.paddle.height,
                            dx: 0, dy: Math.random() * 1 + 0.5,
                            size: Math.random() * 3 + 1,
                            life: 1.0, decay: 0.005, color: '#ffffff'
                        });
                    }
                }
                for (let i = this.deathParticles.length - 1; i >= 0; i--) {
                    let p = this.deathParticles[i];
                    p.y += p.dy; p.dy += 0.02; p.life -= p.decay;
                    if (p.life <= 0) this.deathParticles.splice(i, 1);
                    else {
                        this.ctx.globalAlpha = Math.max(0, p.life); this.ctx.fillStyle = p.color;
                        this.ctx.fillRect(p.x, p.y, p.size, p.size);
                    }
                }
                this.ctx.globalAlpha = 1.0;
            } 
            else if (this.deathAnimType === 4) { 
                this.paddle.alpha -= 0.004;
                if (this.paddle.alpha > 0) {
                    this.ctx.globalAlpha = Math.max(0, this.paddle.alpha);
                    this.ctx.fillStyle = '#ffffff';
                    this.drawRoundedRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 6);
                    
                    if (Math.random() > 0.5) {
                        this.deathParticles.push({
                            x: this.paddle.x + Math.random() * this.paddle.width,
                            y: this.paddle.y + Math.random() * this.paddle.height,
                            dx: Math.random() * 2 + 1, 
                            dy: (Math.random() - 0.5) * 1.0,
                            size: 2, life: 1.0, decay: 0.005, color: '#ffffff'
                        });
                    }
                }
                for (let i = this.deathParticles.length - 1; i >= 0; i--) {
                    let p = this.deathParticles[i];
                    p.x += p.dx; p.y += p.dy; p.life -= p.decay;
                    if (p.life <= 0) this.deathParticles.splice(i, 1);
                    else {
                        this.ctx.globalAlpha = Math.max(0, p.life); this.ctx.fillStyle = p.color;
                        this.ctx.fillRect(p.x, p.y, p.size, p.size);
                    }
                }
                this.ctx.globalAlpha = 1.0;
            }
        } 
        else {
            this.ctx.fillStyle = '#ffffff';
            this.drawRoundedRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 6);
        }

        this.ctx.fillStyle = '#ffffff';
        this.balls.forEach(ball => {
            this.ctx.beginPath(); this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2); this.ctx.fill();
        });

        this.bricks.forEach(b => {
            if (b.status === 1) { 
                if (b.isBumper) {
                    let bumperRadius = (b.w / 2) * 1.45;
                    let cx = b.x + b.w / 2;
                    let cy = b.y + b.h / 2;
                    let isHit = b.flashTimer > 0;
                    
                    let lightX = cx - bumperRadius * 0.35;
                    let lightY = cy - bumperRadius * 0.35;

                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(cx + 5, cy + 8, bumperRadius, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    this.ctx.filter = 'blur(4px)';
                    this.ctx.fill();
                    this.ctx.restore();

                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(cx, cy, bumperRadius, 0, Math.PI * 2);
                    let gradOuter = this.ctx.createRadialGradient(lightX, lightY, bumperRadius * 0.1, cx, cy, bumperRadius * 1.1);
                    gradOuter.addColorStop(0, b.lightBase);
                    gradOuter.addColorStop(0.7, b.darkBase);
                    gradOuter.addColorStop(1, '#000000');
                    this.ctx.fillStyle = gradOuter;
                    this.ctx.fill();
                    
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    this.ctx.stroke();
                    this.ctx.restore();

                    let innerR = bumperRadius * 0.65;
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
                    let gradInner = this.ctx.createRadialGradient(cx + innerR*0.3, cy + innerR*0.3, innerR * 0.1, cx, cy, innerR);
                    gradInner.addColorStop(0, b.lightBase);
                    gradInner.addColorStop(1, '#000000');
                    this.ctx.fillStyle = gradInner;
                    this.ctx.fill();
                    this.ctx.restore();

                    let coreR = bumperRadius * 0.45;
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
                    
                    if (isHit) {
                        let gradHit = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
                        gradHit.addColorStop(0, '#ffffff'); 
                        gradHit.addColorStop(0.5, b.lightBase);
                        gradHit.addColorStop(1, b.darkBase);
                        
                        this.ctx.shadowColor = b.lightBase; 
                        this.ctx.shadowBlur = 15;
                        this.ctx.fillStyle = gradHit;
                    } else {
                        let gradCore = this.ctx.createRadialGradient(lightX, lightY, coreR * 0.1, cx, cy, coreR);
                        gradCore.addColorStop(0, 'rgba(255,255,255,0.8)'); 
                        gradCore.addColorStop(0.4, b.darkBase);
                        gradCore.addColorStop(1, '#000000'); 
                        this.ctx.fillStyle = gradCore;
                    }
                    this.ctx.fill();
                    this.ctx.restore();

                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.ellipse(cx - bumperRadius * 0.4, cy - bumperRadius * 0.4, bumperRadius * 0.2, bumperRadius * 0.1, Math.PI / 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    this.ctx.filter = 'blur(1px)';
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.ellipse(cx - innerR * 0.5, cy - innerR * 0.5, innerR * 0.3, innerR * 0.1, Math.PI / 4, 0, Math.PI * 2);
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.fill();
                    this.ctx.restore();

                } else {
                    const depth = 4;
                    
                    this.ctx.fillStyle = b.color; 
                    this.ctx.fillRect(b.x, b.y, b.w, b.h); 

                    if (!b.indestructible && !b.isKinetic && b.maxHits > 1) {
                        let damage = b.maxHits - b.hits;
                        if (damage > 0) {
                            this.drawCracks(this.ctx, b.x + 1, b.y + 1, b.w - 2, b.h - 2, damage);
                        }
                    }
                    
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(b.x, b.y);
                    this.ctx.lineTo(b.x + b.w, b.y);
                    this.ctx.lineTo(b.x + b.w - depth, b.y + depth);
                    this.ctx.lineTo(b.x + depth, b.y + depth);
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.moveTo(b.x, b.y);
                    this.ctx.lineTo(b.x + depth, b.y + depth);
                    this.ctx.lineTo(b.x + depth, b.y + b.h - depth);
                    this.ctx.lineTo(b.x, b.y + b.h);
                    this.ctx.fill();

                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(b.x, b.y + b.h);
                    this.ctx.lineTo(b.x + b.w, b.y + b.h);
                    this.ctx.lineTo(b.x + b.w - depth, b.y + b.h - depth);
                    this.ctx.lineTo(b.x + depth, b.y + b.h - depth);
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.moveTo(b.x + b.w, b.y);
                    this.ctx.lineTo(b.x + b.w, b.y + b.h);
                    this.ctx.lineTo(b.x + b.w - depth, b.y + b.h - depth);
                    this.ctx.lineTo(b.x + b.w - depth, b.y + depth);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(b.x, b.y, b.w, b.h);
                }
            }
        });

        this.bonuses.forEach(b => {
            let capColor = '#FFFFFF'; let textColor = '#000000';
            if (b.type === 'C') { capColor = '#00AA00'; textColor = '#FFFFFF'; }
            else if (b.type === 'E') { capColor = '#FFFFFF'; textColor = '#00AA00'; }
            else if (b.type === 'S') { capColor = '#3498db'; textColor = '#FFFFFF'; }
            else if (b.type === 'H') { capColor = '#008B8B'; textColor = '#FFFFFF'; }
            else if (b.type === 'G') { capColor = '#FF1493'; textColor = '#FFFF00'; }
            else if (b.type === 'D') { capColor = '#00FF00'; textColor = '#FFFFFF'; }
            else if (b.type === 'P') { capColor = '#006400'; textColor = '#FFFFFF'; }
            else if (b.type === 'B') { capColor = '#FF8C00'; textColor = '#FFFFFF'; }

            this.ctx.fillStyle = capColor; this.drawRoundedRect(b.x, b.y, 24, 24, 6);
            this.ctx.fillStyle = textColor; this.ctx.font = 'bold 16px Arial'; this.ctx.fillText(b.type, b.x + 6, b.y + 18);
        });

        let overlayActive = this.levelIntroActive || this.prepareActive;
        
        if (overlayActive && !this.deathPauseActive) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 60, this.canvas.width, 120);
            this.ctx.textAlign = 'center';
            this.ctx.shadowBlur = 12;
            
            if (this.levelIntroActive) {
                this.ctx.font = '900 32px -apple-system, BlinkMacSystemFont, Arial';
                this.ctx.fillStyle = LEVEL_TEXT_COLORS[(this.currentLevel - 1) % LEVEL_TEXT_COLORS.length];
                this.ctx.shadowColor = this.ctx.fillStyle;
                this.ctx.fillText(`FASE ${this.currentLevel}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            } 
            else if (this.prepareActive) {
                this.ctx.font = '900 22px -apple-system, BlinkMacSystemFont, Arial';
                this.ctx.fillStyle = '#FFD700';
                this.ctx.shadowColor = this.ctx.fillStyle;
                this.ctx.fillText("PREPARE-SE, JOGADOR", this.canvas.width / 2, this.canvas.height / 2 + 8);
            }
            
            this.ctx.textAlign = 'left';
            this.ctx.shadowBlur = 0;
        }
    }
}
