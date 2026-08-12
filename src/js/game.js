// src/js/game.js
import { isColliding, resolveBrickCollision, resolvePaddleCollision } from './physics.js';
import { playSound, initAudio, playMp3 } from './audio.js';
import { TOTAL_LEVELS, BRICK_TYPES, DIFFICULTY_CONFIGS, LEVEL_TEXT_COLORS, LEVEL_BACKGROUNDS } from './config.js';

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

        // Configurações personalizáveis
        this.paddleSizeOption = 'large'; 
        this.ballSpeedOption = 'fast';   
        this.ballSizeOption = 'normal';  
        this.difficulty = 'easy';

        this.gameRunning = false;
        this.victoryExplosionActive = false;
        this.isCapsuleOnScreen = false;
        this.warpDoorActive = false;
        this.electricShieldActive = false;
        this.shieldY = 580;

        this.levelIntroActive = false;
        this.levelIntroTimer = 0;
        this.prepareActive = false; 
        this.warpAnimationActive = false;
        this.warpLaserTimer = 0;
        this.gigaBallTimeout = null;
        this.autoLaunchTimer = null;

        this.hexPattern = null;
        this.brickCols = 9;
        this.brickW = 35;
        this.brickH = 15;
        this.padding = 5;

        this.initLevel(1);
        this.applyPaddleSizeOption();
        this.applyBallSizeOption();
    }

    calculateSecretDifficulty() {
        let paddleDiff = (this.paddleSizeOption === 'small') ? 'hard' : (this.paddleSizeOption === 'medium' ? 'medium' : 'easy');
        let speedDiff = (this.ballSpeedOption === 'slow') ? 'easy' : (this.ballSpeedOption === 'normal' ? 'medium' : 'hard');
        let sizeDiff = (this.ballSizeOption === 'small') ? 'hard' : (this.ballSizeOption === 'normal' ? 'medium' : 'easy');

        let counts = { easy: 0, medium: 0, hard: 0 };
        counts[paddleDiff]++; counts[speedDiff]++; counts[sizeDiff]++;

        if (counts.easy >= 2) return 'easy';
        if (counts.hard >= 2) return 'hard';
        return 'medium';
    }

    setPaddleSize(o) { this.paddleSizeOption = o; this.applyPaddleSizeOption(); }
    setBallSpeed(o) { this.ballSpeedOption = o; }
    setBallSize(o) { this.ballSizeOption = o; this.applyBallSizeOption(); }

    applyPaddleSizeOption() {
        let scale = this.paddleSizeOption === 'small' ? 0.7 : (this.paddleSizeOption === 'medium' ? 1.0 : 1.35);
        this.paddle.width = 90 * scale;
        if (this.paddle.x + this.paddle.width > this.canvas.width) this.paddle.x = this.canvas.width - this.paddle.width;
    }

    applyBallSizeOption() {
        let r = this.ballSizeOption === 'small' ? 4.5 : (this.ballSizeOption === 'normal' ? 6 : 8);
        this.balls.forEach(b => b.radius = r);
    }

    backupSettings() { return { paddleSize: this.paddleSizeOption, ballSpeed: this.ballSpeedOption, ballSize: this.ballSizeOption }; }
    restoreSettings(b) { this.setPaddleSize(b.paddleSize); this.setBallSpeed(b.ballSpeed); this.setBallSize(b.ballSize); }

    startGame() {
        initAudio();
        this.gameRunning = true;
        this.score = 0;
        this.lives = 5;
        document.querySelectorAll('#menu, #settingsMenu, #settingsPaddleMenu, #settingsBallSpeedMenu, #settingsBallSizeMenu, #pauseMenu, #gameOverMenu, #winOverlay').forEach(el => el.style.display = 'none');
        this.initLevel(this.currentLevel);
        this.resetBall();
    }

    resumeGame() { document.getElementById('pauseMenu').style.display = 'none'; this.gameRunning = true; }
    restartFromLevel1() { this.currentLevel = 1; this.startGame(); }
    quitToMainMenu() { 
        this.gameRunning = false; 
        document.querySelectorAll('#settingsMenu, #settingsPaddleMenu, #settingsBallSpeedMenu, #settingsBallSizeMenu, #pauseMenu, #gameOverMenu, #winOverlay').forEach(el => el.style.display = 'none');
        document.getElementById('menu').style.display = 'flex';
    }
    continueGame() { document.getElementById('gameOverMenu').style.display = 'none'; this.lives = 3; this.gameRunning = true; this.resetBall(); this.updateHUD(); }

    getDeterministicCapsule() {
        let diff = this.calculateSecretDifficulty();
        const weights = DIFFICULTY_CONFIGS[diff].weights;
        let total = weights.reduce((acc, c) => acc + c.weight, 0);
        let val = ((Math.abs(this.score) % 10) + Math.floor(Math.abs(this.paddle.x))) % total;
        for (let c of weights) { if (val < c.weight) return c.type; val -= c.weight; }
        return 'C';
    }

    clearActiveBonuses() {
        this.sizeState = 0;
        this.applyPaddleSizeOption();
        this.paddle.glue = false;
        this.electricShieldActive = false;
        this.applyBallSizeOption();
        if (this.gigaBallTimeout) { clearTimeout(this.gigaBallTimeout); this.gigaBallTimeout = null; }
    }

    generateLevelPattern(level, customColors = null) {
        let colors = customColors || LEVEL_BACKGROUNDS[(level - 1) % LEVEL_BACKGROUNDS.length];
        let pCanvas = document.createElement('canvas');
        let pCtx = pCanvas.getContext('2d');
        pCanvas.width = 16; pCanvas.height = 28;
        pCtx.fillStyle = colors.bg; pCtx.fillRect(0, 0, 16, 28);
        pCtx.fillStyle = colors.hexFill;
        pCtx.strokeStyle = colors.stroke;
        for (let y = -7; y < 35; y += 14) {
            for (let x = -8; x < 24; x += 16) {
                let offX = (Math.floor(y / 14) % 2 === 0) ? 0 : 8;
                pCtx.beginPath();
                for (let i = 0; i < 6; i++) {
                    let angle = (Math.PI / 3) * i;
                    let hx = (x + offX) + 6 * Math.cos(angle);
                    let hy = y + 6 * Math.sin(angle);
                    i === 0 ? pCtx.moveTo(hx, hy) : pCtx.lineTo(hx, hy);
                }
                pCtx.closePath(); pCtx.fill(); pCtx.stroke();
            }
        }
        this.hexPattern = this.ctx.createPattern(pCanvas, 'repeat');
    }

    drawRoundedRect(x, y, w, h, r) {
        this.ctx.beginPath();
        if (this.ctx.roundRect) this.ctx.roundRect(x, y, w, h, r);
        else { this.ctx.moveTo(x+r, y); this.ctx.arcTo(x+w, y, x+w, y+h, r); this.ctx.arcTo(x+w, y+h, x, y+h, r); this.ctx.arcTo(x, y+h, x, y, r); this.ctx.arcTo(x, y, x+w, y, r); }
        this.ctx.fill();
    }

    initLevel(level) {
        this.bricks = []; this.bonuses = [];
        this.isCapsuleOnScreen = false;
        this.generateLevelPattern(level);
        this.levelIntroActive = true;
        this.levelIntroTimer = 120;
        playSound('introJingle');
        
        // --- Estrutura das Fases (1-20) ---
        const startX = (this.canvas.width - (this.brickCols * (this.brickW + this.padding))) / 2;
        let pattern = [];
        // (O preenchimento do pattern aqui deve ser o mesmo das versões anteriores)
        for(let r=0; r<6; r++) pattern.push([1,1,1,1,1,1,1,1,1]); // Placeholder para preenchimento
        
        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[r].length; c++) {
                if (pattern[r][c] > 0) {
                    this.bricks.push({
                        x: startX + c * (this.brickW + this.padding),
                        y: this.topWallY + 35 + r * (this.brickH + this.padding),
                        status: 1, hits: 1, color: '#FF5733', points: 10, indestructible: false, hasCapsule: false
                    });
                }
            }
        }
        let rate = DIFFICULTY_CONFIGS[this.calculateSecretDifficulty()].spawnRate;
        let active = this.bricks.filter(b => b.status === 1 && !b.indestructible);
        active.sort(() => Math.random() - 0.5).slice(0, Math.floor(active.length * rate)).forEach(b => b.hasCapsule = true);
    }

    resetBall() {
        if (this.autoLaunchTimer) clearTimeout(this.autoLaunchTimer);
        this.clearActiveBonuses();
        this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
        let r = (this.ballSizeOption === 'small' ? 4.5 : (this.ballSizeOption === 'normal' ? 6 : 8));
        this.balls = [{ x: this.paddle.x + this.paddle.width / 2, y: this.paddle.y - r - 2, dx: 0, dy: 0, radius: r, stuck: true }];
        
        this.prepareActive = true;
        this.autoLaunchTimer = setTimeout(() => { 
            this.prepareActive = false;
            this.launchBalls(); 
        }, 2000);
    }

    launchBalls() {
        let s = { slow: {dy: -2.5, dx: 2}, normal: {dy: -3.5, dx: 2.5}, fast: {dy: -5.0, dx: 3} }[this.ballSpeedOption];
        this.balls.forEach(b => {
            b.stuck = false;
            let dir = Math.random() > 0.5 ? 1 : -1;
            b.dx = dir * (s.dx + Math.random() * 2);
            b.dy = s.dy;
        });
    }

    update() {
        if (!this.gameRunning || this.victoryExplosionActive) return;
        if (this.levelIntroActive) { this.levelIntroTimer--; if (this.levelIntroTimer <= 0) this.levelIntroActive = false; this.draw(); return; }
        if (this.prepareActive) { this.draw(); return; }

        for (let bIndex = this.balls.length - 1; bIndex >= 0; bIndex--) {
            let b = this.balls[bIndex];
            if (b.stuck) { b.x = this.paddle.x + this.paddle.width / 2; b.y = this.paddle.y - b.radius - 2; }
            else {
                b.x += b.dx; b.y += b.dy;
                if (b.x + b.radius > this.canvas.width || b.x - b.radius < 0) { b.dx *= -1; playSound('wall'); }
                if (b.y - b.radius < this.topWallY + 4) { b.y = this.topWallY + 4 + b.radius; b.dy = Math.abs(b.dy); playSound('wall'); }
                if (b.y + b.radius > this.paddle.y && b.y - b.radius < this.paddle.y + this.paddle.height && b.x > this.paddle.x && b.x < this.paddle.x + this.paddle.width) {
                    playSound('paddle'); resolvePaddleCollision(b, this.paddle);
                }
                if (b.y + b.radius > this.canvas.height) {
                    this.balls.splice(bIndex, 1);
                    if (this.balls.length === 0) {
                        playMp3('src/assets/scream1.mp3'); 
                        this.lives--; this.updateHUD();
                        if (this.lives <= 0) { this.gameRunning = false; document.getElementById('gameOverTitle').innerText = "FIM DO JOGO"; document.getElementById('gameOverMenu').style.display = 'flex'; return; }
                        else { this.resetBall(); }
                    }
                    continue;
                }
                this.bricks.forEach(br => { if(br.status === 1 && isColliding(b, {x:br.x, y:br.y, w:this.brickW, h:this.brickH})) { resolveBrickCollision(b, br, this.brickW, this.brickH); playSound('brick'); br.hits--; if(br.hits <= 0) br.status = 0; } });
            }
        }
        if (this.bricks.filter(b => b.status === 1 && !b.indestructible).length === 0) this.advanceToNextLevel();
        this.draw();
    }

    updateHUD() {
        let s = document.getElementById('scoreText'); if(s) s.innerText = `Pts: ${this.score}`;
        let v = document.getElementById('livesText'); if(v) v.innerText = `Vidas: ${this.lives}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.hexPattern) { this.ctx.fillStyle = this.hexPattern; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
        // ... (Render da raquete, bolas e blocos)
        if (this.prepareActive) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, this.canvas.height / 2 - 45, this.canvas.width, 90);
            this.ctx.font = '900 22px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText("PREPARE-SE, JOGADOR", this.canvas.width / 2, this.canvas.height / 2 + 8);
        }
    }
}
