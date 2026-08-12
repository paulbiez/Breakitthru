// src/js/main.js
import { Game } from './game.js';
import { IosPicker } from './IosPicker.js';
import { initInputs } from './input.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    let wasRunningBeforeRotation = false;

    const picker = new IosPicker(game.TOTAL_LEVELS, (level) => {
        game.currentLevel = level;
        let selectBtn = document.getElementById('selectLevelBtn');
        if (selectBtn) selectBtn.innerText = `Selecionar Fase: ${level}`;
    });

    initInputs(canvas, game.paddle, { onLaunch: () => game.launchBalls() });

    async function lockPortrait() {
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('portrait');
            }
        } catch (err) { console.log("Bloqueio não suportado."); }
    }

    const landscapeQuery = window.matchMedia("(orientation: landscape)");
    function handleOrientationChange(e) {
        if (window.innerWidth <= 900) {
            if (e.matches) {
                wasRunningBeforeRotation = game.gameRunning;
                game.gameRunning = false; 
            } else {
                if (wasRunningBeforeRotation) {
                    game.gameRunning = true;
                }
            }
        }
    }
    landscapeQuery.addEventListener('change', handleOrientationChange);

    document.getElementById('btnStart').addEventListener('click', () => {
        lockPortrait();
        game.startGame('easy');
    });

    document.getElementById('selectLevelBtn').addEventListener('click', () => {
        picker.open(game.currentLevel);
    });

    document.getElementById('quitBtn').addEventListener('click', () => {
        game.gameRunning = false;
        document.getElementById('pauseMenu').style.display = 'flex';
    });

    document.querySelector('#pauseMenu .btn-continue').addEventListener('click', () => game.resumeGame());
    document.querySelector('#pauseMenu .btn-restart').addEventListener('click', () => game.restartFromLevel1());
    document.querySelector('#pauseMenu .btn-quit').addEventListener('click', () => game.quitToMainMenu());

    document.querySelector('#gameOverMenu .btn-continue').addEventListener('click', () => game.continueGame());
    document.querySelector('#gameOverMenu .btn-quit').addEventListener('click', () => game.quitToMainMenu());
    document.querySelector('#winOverlay .btn-quit').addEventListener('click', () => game.quitToMainMenu());

    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
});
