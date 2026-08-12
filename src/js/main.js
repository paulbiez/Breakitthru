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

    // Inicializa os controles bloqueando o input durante a introdução da fase
    initInputs(canvas, game.paddle, 
        { onLaunch: () => game.launchBalls() }, 
        () => game.levelIntroActive 
    );

    window.addEventListener("orientationchange", () => {
        setTimeout(() => {
            if (window.innerWidth > window.innerHeight) {
                wasRunningBeforeRotation = game.gameRunning;
                game.gameRunning = false;
            } else {
                if (wasRunningBeforeRotation) {
                    game.gameRunning = true;
                }
            }
        }, 300);
    });

    document.getElementById('btnStart').addEventListener('click', () => {
        game.startGame();
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
