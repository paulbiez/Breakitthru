// src/js/graphics.js
import { LEVEL_BACKGROUNDS } from './config.js';

export function drawRoundedRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    if (ctx.roundRect) { 
        ctx.roundRect(x, y, w, h, radius); 
    } else { 
        ctx.moveTo(x + radius, y); 
        ctx.arcTo(x + w, y, x + w, y + h, radius); 
        ctx.arcTo(x + w, y + h, x, y + h, radius); 
        ctx.arcTo(x, y + h, x, y, radius); 
        ctx.arcTo(x, y, x + w, y, radius); 
    }
    ctx.fill();
}

export function generateHexPattern(ctx, level, customColors = null) {
    let colors = customColors || LEVEL_BACKGROUNDS[(level - 1) % LEVEL_BACKGROUNDS.length];
    let patternCanvas = document.createElement('canvas');
    let pCtx = patternCanvas.getContext('2d');
    patternCanvas.width = 16; 
    patternCanvas.height = 28;

    pCtx.fillStyle = colors.bg; 
    pCtx.fillRect(0, 0, 16, 28);
    pCtx.strokeStyle = colors.stroke; 
    pCtx.lineWidth = 1; 
    pCtx.fillStyle = colors.hexFill;

    for (let y = -7; y < 35; y += 14) {
        for (let x = -8; x < 24; x += 16) {
            let offX = (Math.floor(y / 14) % 2 === 0) ? 0 : 8;
            pCtx.beginPath();
            for (let i = 0; i < 6; i++) {
                let angle = (Math.PI / 3) * i;
                let hx = (x + offX) + 6 * Math.cos(angle);
                let hy = y + 6 * Math.sin(angle);
                if (i === 0) pCtx.moveTo(hx, hy); else pCtx.lineTo(hx, hy);
            }
            pCtx.closePath(); pCtx.fill(); pCtx.stroke();
        }
    }
    return ctx.createPattern(patternCanvas, 'repeat');
}


