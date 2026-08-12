// src/js/main.js
import { Game } from './game.js';
import { IosPicker } from './IosPicker.js';
import { initInputs } from './input.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    let wasRunningBeforeRotation = false;
    let settingsBackup = null;

    const picker = new IosPicker(game.TOTAL_LEVELS, (level) => {
        game.currentLevel = level;
        let selectBtn = document.getElementById('selectLevelBtn');
        if (selectBtn) selectBtn.innerText = `Selecionar Fase: ${level}`;
    });

    initInputs(canvas, game.paddle, 
        { onLaunch: () => game.launchBalls() }, 
        () => game.levelIntroActive 
    );

    window.addEventListener("orientationchange", () => {
        setTimeout(() => {
            if (window.innerWidth > window.innerHeight) {
                wasRunningBeforeRotation = game.gameRunning;
                game.gameRunning = false;
            } else {
                if (wasRunningBeforeRotation) {
                    game.gameRunning = true;
                }
            }
        }, 300);
    });

    document.getElementById('btnStart').addEventListener('click', () => {
        game.startGame();
    });

    document.getElementById('selectLevelBtn').addEventListener('click', () => {
        picker.open(game.currentLevel);
    });

    // --- LÓGICA DE CONFIGURAÇÕES ---
    function hideAllMenus() {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'none';
        document.getElementById('settingsPaddleMenu').style.display = 'none';
        document.getElementById('settingsBallSpeedMenu').style.display = 'none';
        document.getElementById('settingsBallSizeMenu').style.display = 'none';
    }

    function updatePreviewPaddle(sizeOption) {
        let preview = document.getElementById('previewPaddle');
        if (!preview) return;
        let scale = 1.35;
        if (sizeOption === 'small') scale = 0.7;
        if (sizeOption === 'medium') scale = 1.0;
        if (sizeOption === 'large') scale = 1.35;
        preview.style.width = (90 * scale) + 'px';
    }

    function updatePreviewBall(sizeOption) {
        let preview = document.getElementById('previewBall');
        if (!preview) return;
        let radius = 6;
        if (sizeOption === 'small') radius = 4.5;
        if (sizeOption === 'normal') radius = 6;
        if (sizeOption === 'large') radius = 8;
        let diameter = (radius * 2) * 2; // Dobro para visualização nítida no preview
        preview.style.width = diameter + 'px';
        preview.style.height = diameter + 'px';
    }

    function highlightActiveOptions(className, activeVal, attrName) {
        document.querySelectorAll('.' + className).forEach(b => {
            if (b.getAttribute(attrName) === activeVal) {
                b.classList.add('active-option');
            } else {
                b.classList.remove('active-option');
            }
        });
    }

    // Abrir Configurações
    document.getElementById('btnSettings').addEventListener('click', () => {
        settingsBackup = game.backupSettings();
        hideAllMenus();
        document.getElementById('settingsMenu').style.display = 'flex';
    });

    // Salvar alterações (Compatível com Firefox)
    const saveBtn = document.getElementById('btnSettingsSave');
    if (saveBtn) {
        saveBtn.onclick = () => {
            settingsBackup = null;
            hideAllMenus();
            document.getElementById('menu').style.display = 'flex';
        };
    }

    // Cancelar Configurações
    const cancelBtn = document.getElementById('btnSettingsCancel');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            if (settingsBackup) {
                game.restoreSettings(settingsBackup);
            }
            hideAllMenus();
            document.getElementById('menu').style.display = 'flex';
        };
    }

    // Submenu: Tamanho do Jogador
    document.getElementById('btnSettingsPaddle').addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('settingsPaddleMenu').style.display = 'flex';
        updatePreviewPaddle(game.paddleSizeOption);
        highlightActiveOptions('btn-paddle-size', game.paddleSizeOption, 'data-size');
    });

    document.getElementById('btnPaddleBack').addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('settingsMenu').style.display = 'flex';
    });

    document.querySelectorAll('.btn-paddle-size').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let size = e.target.getAttribute('data-size');
            game.setPaddleSize(size);
            updatePreviewPaddle(size);
            highlightActiveOptions('btn-paddle-size', size, 'data-size');
        });
    });

    // Submenu: Velocidade da Bola
    document.getElementById('btnSettingsBallSpeed').addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('settingsBallSpeedMenu').style.display = 'flex';
        highlightActiveOptions('btn-ball-speed', game.ballSpeedOption, 'data-speed');
    });

    document.getElementById('btnSpeedBack').addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('settingsMenu').style.display = 'flex';
    });

    document.querySelectorAll('.btn-ball-speed').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let speed = e.target.getAttribute('data-speed');
            game.setBallSpeed(speed);
            highlightActiveOptions('btn-ball-speed', speed, 'data-speed');
        });
    });

    // Submenu: Tamanho da Bola
    document.getElementById('btnSettingsBallSize').addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('settingsBallSizeMenu').style.display = 'flex';
        updatePreviewBall(game.ballSizeOption);
        highlightActiveOptions('btn-ball-size', game.ballSizeOption, 'data-size');
    });

    document.getElementById('btnSizeBack').addEventListener('click', () => {
        hideAllMenus();
        document.getElementById('settingsMenu').style.display = 'flex';
    });

    document.querySelectorAll('.btn-ball-size').forEach(btn => {
        btn.addEventListener('click', (e) => {
            let size = e.target.getAttribute('data-size');
            game.setBallSize(size);
            updatePreviewBall(size);
            highlightActiveOptions('btn-ball-size', size, 'data-size');
        });
    });
    // -----------------------------------

    document.getElementById('quitBtn').addEventListener('click', () => {
        game.gameRunning = false;
        document.getElementById('pauseMenu').style.display = 'flex';
    });

    document.querySelector('#pauseMenu .btn-continue').addEventListener('click', () => game.resumeGame());
    document.querySelector('#pauseMenu .btn-restart').addEventListener('click', () => game.restartFromLevel1());
    document.querySelector('#pauseMenu .btn-quit').addEventListener('click', () => game.quitToMainMenu());

    document.querySelector('#gameOverMenu .btn-continue').addEventListener('click', () => game.continueGame());
    document.querySelector('#gameOverMenu .btn-quit').addEventListener('click', () => game.quitToMainMenu());
    document.querySelector('#winOverlay .btn-quit').addEventListener('click', () => game.quitToMainMenu());

    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
});
