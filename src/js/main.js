import { Game } from './game.js';
import { initInputs } from './input.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    // Inicializa os controles de toque e mouse para mover a raquete
    initInputs(canvas, game.paddle, {
        onLaunch: () => {
            game.launchBalls();
        }
    });

    // Botões de Dificuldade do Menu
    document.getElementById('btnEasy').addEventListener('click', () => game.startGame('easy'));
    document.getElementById('btnMedium').addEventListener('click', () => game.startGame('medium'));
    document.getElementById('btnHard').addEventListener('click', () => game.startGame('hard'));

    // Botão para abrir o seletor de fases
    document.getElementById('selectLevelBtn').addEventListener('click', () => game.openIosPicker());
    
    // Botões do Modal do Seletor
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

    // Loop principal do jogo
    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
    
    requestAnimationFrame(gameLoop);
});
