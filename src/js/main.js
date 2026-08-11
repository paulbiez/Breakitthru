import { Game } from './game.js';
import { initInputs } from './input.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas); // Instancia o jogo

// Adiciona os eventos de clique agora que temos acesso ao objeto 'game'
document.getElementById('btnEasy').addEventListener('click', () => game.startGame('easy'));
document.getElementById('btnMedium').addEventListener('click', () => game.startGame('medium'));
document.getElementById('btnHard').addEventListener('click', () => game.startGame('hard'));
document.getElementById('btnSelect').addEventListener('click', () => game.openIosPicker());


import { TOTAL_LEVELS, BRICK_TYPES } from './config.js';
import { initAudio, playSound } from './audio.js';

// Agora você pode usar as constantes importadas:
console.log("Total de níveis:", TOTAL_LEVELS);

// Exemplo de inicialização:
window.addEventListener('click', () => {
    initAudio();
    playSound('paddle');
});

// A lógica do loop do jogo (game loop) continuaria aqui ou em game.js

