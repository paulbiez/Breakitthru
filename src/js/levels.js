// src/js/levels.js
export function getLevelPattern(level) {
    if (level === 1) {
        // 9 Linhas de tijolos tipo 1
        return [
            [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1], 
            [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1], 
            [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1]
        ];
    }
    // ... (restante das fases 2-20 permanecem iguais às anteriores)
    return [[1,1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1,1]]; // Default
}
