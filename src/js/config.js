// src/js/config.js

export const TOTAL_LEVELS = 20;

export const BRICK_TYPES = [
    { color: '#FF5733', points: 10 },
    { color: '#33FF57', points: 20 },
    { color: '#00FFFF', points: 30 },
    { color: '#F3FF33', points: 40 },
    { color: '#FF33F3', points: 50 }
];

export const DIFFICULTY_CONFIGS = {
    easy: {
        spawnRate: 0.20, // 20%
        weights: [
            { type: 'C', weight: 15 },
            { type: 'E', weight: 15 },
            { type: 'S', weight: 10 },
            { type: 'H', weight: 12 },
            { type: 'G', weight: 10 },
            { type: 'D', weight: 15 },
            { type: 'P', weight: 10 },
            { type: 'B', weight: 13 }
        ]
    },
    medium: {
        spawnRate: 0.08, // 8%
        weights: [
            { type: 'C', weight: 40 },
            { type: 'E', weight: 30 },
            { type: 'D', weight: 18 },
            { type: 'B', weight: 3 },
            { type: 'H', weight: 5 },
            { type: 'S', weight: 2 },
            { type: 'G', weight: 1 },
            { type: 'P', weight: 1 }
        ]
    },
    hard: {
        spawnRate: 0.03, // 3%
        weights: [
            { type: 'C', weight: 50 },
            { type: 'E', weight: 10 },
            { type: 'D', weight: 35 },
            { type: 'B', weight: 1 },
            { type: 'H', weight: 1 },
            { type: 'S', weight: 1 },
            { type: 'G', weight: 1 },
            { type: 'P', weight: 1 }
        ]
    }
};

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
