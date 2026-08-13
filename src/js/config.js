// src/js/config.js
export const TOTAL_LEVELS = 20;

export const BRICK_TYPES = [
    { color: '#FF2A2A', points: 10 }, // Linha 1 - Vermelho Neon
    { color: '#FF7700', points: 10 }, // Linha 2 - Laranja Neon
    { color: '#FFFF00', points: 10 }, // Linha 3 - Amarelo Sol
    { color: '#A6FF00', points: 10 }, // Linha 4 - Verde Lima
    { color: '#00FF66', points: 10 }, // Linha 5 - Verde Brilhante
    { color: '#00FA9A', points: 10 }, // Linha 6 - Verde Menta
    { color: '#00E5FF', points: 10 }, // Linha 7 - Ciano
    { color: '#1E90FF', points: 10 }, // Linha 8 - Azul Elétrico
    { color: '#9B59B6', points: 10 }  // Linha 9 - Roxo Elétrico
];

export const LEVEL_TEXT_COLORS = ['#FF2A2A', '#00FF66', '#00E5FF', '#FFFF00', '#FF7700'];

export const LEVEL_BACKGROUNDS = [
    { bg: '#050b30', stroke: '#1a2b6c', hexFill: '#0a154a' }
];

export const DIFFICULTY_CONFIGS = {
    easy: { spawnRate: 0.15, weights: [{type: 'C', weight: 3}, {type: 'E', weight: 2}, {type: 'P', weight: 3}] },
    medium: { spawnRate: 0.25, weights: [{type: 'C', weight: 2}, {type: 'E', weight: 2}, {type: 'G', weight: 1}, {type: 'P', weight: 2}, {type: 'D', weight: 2}] },
    hard: { spawnRate: 0.35, weights: [{type: 'S', weight: 2}, {type: 'H', weight: 2}, {type: 'G', weight: 2}, {type: 'D', weight: 2}, {type: 'B', weight: 1}] }
};
