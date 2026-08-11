import { Game } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);

    // Conecta os botões de dificuldade do menu
    document.getElementById('btnEasy').addEventListener('click', () => game.startGame('easy'));
    document.getElementById('btnMedium').addEventListener('click', () => game.startGame('medium'));
    document.getElementById('btnHard').addEventListener('click', () => game.startGame('hard'));

    // Conecta o botão que abre o seletor de fases
    document.getElementById('selectLevelBtn').addEventListener('click', () => game.openIosPicker());

    // Conecta os botões de ação do Modal do Seletor (iOS Picker)
    const btnCancel = document.querySelector('.ios-btn-cancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => game.closeIosPicker());
    }

    const btnConfirm = document.querySelector('.ios-btn-select');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => game.confirmIosPicker());
    }

    // Loop principal de renderização e atualização contínua do jogo
    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
    
    requestAnimationFrame(gameLoop);
});
