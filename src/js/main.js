import { Game } from './game.js';
import { initInputs } from './input.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    // Controles de toque e mouse para mover a raquete
    initInputs(canvas, game.paddle, {
        onLaunch: () => {
            game.launchBalls();
        }
    });

    // Botões de Dificuldade do Menu Principal
    document.getElementById('btnEasy').addEventListener('click', () => game.startGame('easy'));
    document.getElementById('btnMedium').addEventListener('click', () => game.startGame('medium'));
    document.getElementById('btnHard').addEventListener('click', () => game.startGame('hard'));

    // Botão para abrir o seletor de fases
    document.getElementById('selectLevelBtn').addEventListener('click', () => game.openIosPicker());
    
    // Botões do Modal do Seletor de Fases
    const btnCancel = document.querySelector('.ios-btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => game.closeIosPicker());
    }

    const btnConfirm = document.querySelector('.ios-btn-select');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            game.confirmIosPicker();
        });
    }

    // Botão de Pausa (HUD superior "✕")
    const quitBtn = document.getElementById('quitBtn');
    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            game.gameRunning = false;
            document.getElementById('pauseMenu').style.display = 'flex';
        });
    }

    // Ações do Menu de Pausa
    const pauseContinue = document.querySelector('#pauseMenu .btn-continue');
    if (pauseContinue) pauseContinue.addEventListener('click', () => game.resumeGame());

    const pauseRestart = document.querySelector('#pauseMenu .btn-restart');
    if (pauseRestart) pauseRestart.addEventListener('click', () => game.restartFromLevel1());

    const pauseQuit = document.querySelector('#pauseMenu .btn-quit');
    if (pauseQuit) pauseQuit.addEventListener('click', () => game.quitToMainMenu());

    // Ações do Menu de Game Over
    const overContinue = document.querySelector('#gameOverMenu .btn-continue');
    if (overContinue) overContinue.addEventListener('click', () => game.continueGame());

    const overQuit = document.querySelector('#gameOverMenu .btn-quit');
    if (overQuit) overQuit.addEventListener('click', () => game.quitToMainMenu());

    // Ações da Tela de Vitória
    const winQuit = document.querySelector('#winOverlay .btn-quit');
    if (winQuit) winQuit.addEventListener('click', () => game.quitToMainMenu());

    // Loop principal do jogo
    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
    
    requestAnimationFrame(gameLoop);
});
