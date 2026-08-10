
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

