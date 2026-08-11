// src/js/config.js

export const TOTAL_LEVELS = 20;

export const BRICK_TYPES = [
    { color: '#FF5733', points: 10 }, // Laranja vibrante
    { color: '#33FF57', points: 20 }, // Verde claro
    { color: '#00FFFF', points: 30 }, // Ciano brilhante (alto contraste)
    { color: '#F3FF33', points: 40 }, // Amarelo
    { color: '#FF33F3', points: 50 }  // Rosa choque
];

// Pesos dos bônus
export const CAPSULE_WEIGHTS = [
    { type: 'C', weight: 15 }, // Cola na raquete
    { type: 'E', weight: 15 }, // Expandir raquete
    { type: 'S', weight: 10 }, // Slow (bola lenta)
    { type: 'H', weight: 12 }, // Escudo Elétrico ('H')
    { type: 'G', weight: 10 }, // Giga Ball
    { type: 'D', weight: 15 }, // Multi-ball (Dividir)
    { type: 'P', weight: 10 }, // Vida extra
    { type: 'B', weight: 13 }  // Porta Warp
];

export const LEVEL_TEXT_COLORS = [
    '#FFD700', '#00FFFF', '#FF69B4', '#00FF00', '#FF4500',
    '#ADFF2F', '#1E90FF', '#FF1493', '#00FA9A', '#FFFF00',
    '#FFD700', '#00FFFF', '#FF69B4', '#00FF00', '#FF4500',
    '#ADFF2F', '#1E90FF', '#FF1493', '#00FA9A', '#FFFF00'
];

export const LEVEL_BACKGROUNDS = [
    { bg: '#050b30', stroke: '#1a2b6c', hexFill: '#0a154a' },
    { bg: '#2b0530', stroke: '#6c1a60', hexFill: '#4a0a40' },
    { bg: '#05302b', stroke: '#1a6c56', hexFill: '#0a4a39' },
    { bg: '#302b05', stroke: '#6c5c1a', hexFill: '#4a410a' },
    { bg: '#200530', stroke: '#501a6c', hexFill: '#350a4a' }
];
