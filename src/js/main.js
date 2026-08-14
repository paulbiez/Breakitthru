// src/js/main.js
import { Game } from './game.js';
import { IosPicker } from './IosPicker.js';
import { initInputs } from './input.js';
import { setBgmVolume, setSfxVolume, toggleBgmMute, toggleSfxMute, getAudioState, pauseBgm } from './audio.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    const game = new Game(canvas);
    let wasRunningBeforeRotation = false;
    let settingsBackup = null;

    let validLevel = parseInt(game.currentLevel, 10);
    if (isNaN(validLevel) || validLevel < 1) {
        validLevel = 1;
        game.currentLevel = 1;
    }

    const selectBtn = document.getElementById('selectLevelBtn');
    if (selectBtn) {
        selectBtn.innerText = `Selecionar Fase: ${validLevel}`;
    }

    // Instancia o IosPicker original
    const picker = new IosPicker(game.TOTAL_LEVELS, (level) => {
        let selected = parseInt(level, 10) || 1;
        game.currentLevel = selected;
        if (selectBtn) selectBtn.innerText = `Selecionar Fase: ${selected}`;
    });

    initInputs(canvas, game.paddle, 
        { onLaunch: () => game.launchBalls() }, 
        () => game.levelIntroActive || game.prepareActive || game.deathPauseActive
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

    const btnStart = document.getElementById('btnStart');
    if (btnStart) {
        btnStart.addEventListener('click', () => {
            game.startGame();
        });
    }

    if (selectBtn) {
        selectBtn.addEventListener('click', () => {
            picker.open(game.currentLevel || 1);
        });
    }

    function hideAllMenus() {
        document.querySelectorAll('#menu, #settingsMenu, #settingsSoundMenu, #settingsPaddleMenu, #settingsBallSpeedMenu, #settingsBallSizeMenu, #pauseMenu, #gameOverMenu, #winOverlay')
                .forEach(el => el.style.display = 'none');
    }

    function updateSoundUI() {
        const state = getAudioState();
        
        const bgmSlider = document.getElementById('bgmVolumeSlider');
        const bgmText = document.getElementById('bgmValText');
        const btnHudBgm = document.getElementById('btnHudBgm');
        if (bgmSlider) bgmSlider.value = Math.round(state.bgmVolume * 100);
        if (bgmText) bgmText.innerText = state.isBgmMuted ? "MUTO" : `${Math.round(state.bgmVolume * 100)}%`;
        if (btnHudBgm) btnHudBgm.style.opacity = state.isBgmMuted ? "0.4" : "1.0";

        const sfxSlider = document.getElementById('sfxVolumeSlider');
        const sfxText = document.getElementById('sfxValText');
        const btnHudSfx = document.getElementById('btnHudSfx');
        if (sfxSlider) sfxSlider.value = Math.round(state.sfxVolume * 100);
        if (sfxText) sfxText.innerText = state.isSfxMuted ? "MUTO" : `${Math.round(state.sfxVolume * 100)}%`;
        if (btnHudSfx) btnHudSfx.style.opacity = state.isSfxMuted ? "0.4" : "1.0";
    }

    // Controles de som
    const bgmSlider = document.getElementById('bgmVolumeSlider');
    if (bgmSlider) {
        bgmSlider.addEventListener('input', (e) => {
            setBgmVolume(e.target.value / 100);
            updateSoundUI();
        });
    }

    const sfxSlider = document.getElementById('sfxVolumeSlider');
    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => {
            setSfxVolume(e.target.value / 100);
            updateSoundUI();
        });
    }

    // Botões HUD
    const btnPause = document.getElementById('btnPause');
    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (game.gameRunning) {
                game.gameRunning = false;
                pauseBgm();
                document.getElementById('pauseMenu').style.display = 'flex';
            }
        });
    }

    const btnHudBgm = document.getElementById('btnHudBgm');
    if (btnHudBgm) {
        btnHudBgm.addEventListener('click', () => {
            toggleBgmMute();
            updateSoundUI();
        });
    }

    const btnHudSfx = document.getElementById('btnHudSfx');
    if (btnHudSfx) {
        btnHudSfx.addEventListener('click', () => {
            toggleSfxMute();
            updateSoundUI();
        });
    }

    // Navegação de menus
    const btnSettingsSound = document.getElementById('btnSettingsSound');
    if (btnSettingsSound) {
        btnSettingsSound.addEventListener('click', () => {
            hideAllMenus();
            updateSoundUI();
            document.getElementById('settingsSoundMenu').style.display = 'flex';
        });
    }

    const btnSoundBack = document.getElementById('btnSoundBack');
    if (btnSoundBack) {
        btnSoundBack.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    function updatePreviewPaddle(sizeOption) {
        let preview = document.getElementById('previewPaddle');
        if (!preview) return;
        let scale = 1.35;
        if (sizeOption === 'small') scale = 0.7;
        if (sizeOption === 'medium') scale = 1.0;
        if (sizeOption === 'large') scale = 1.35;
        preview.style.width = (63 * scale) + 'px';
    }

    function updatePreviewBall(sizeOption) {
        let preview = document.getElementById('previewBall');
        if (!preview) return;
        let radius = 6;
        if (sizeOption === 'small') radius = 4.5;
        if (sizeOption === 'normal') radius = 6;
        if (sizeOption === 'large') radius = 8;
        let diameter = (radius * 2) * 2;
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

    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            settingsBackup = game.backupSettings();
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    const saveBtn = document.getElementById('btnSettingsSave');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            settingsBackup = null;
            hideAllMenus();
            document.getElementById('menu').style.display = 'flex';
        });
    }

    const btnPaddle = document.getElementById('btnSettingsPaddle');
    if (btnPaddle) {
        btnPaddle.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsPaddleMenu').style.display = 'flex';
            updatePreviewPaddle(game.paddleSizeOption);
            highlightActiveOptions('btn-paddle-size', game.paddleSizeOption, 'data-size');
        });
    }

    const btnPaddleBack = document.getElementById('btnPaddleBack');
    if (btnPaddleBack) {
        btnPaddleBack.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    document.querySelectorAll('.btn-paddle-size').forEach(btn => {
        btn.addEventListener('click', () => {
            let size = btn.getAttribute('data-size');
            game.setPaddleSize(size);
            updatePreviewPaddle(size);
            highlightActiveOptions('btn-paddle-size', size, 'data-size');
        });
    });

    const btnSpeed = document.getElementById('btnSettingsBallSpeed');
    if (btnSpeed) {
        btnSpeed.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsBallSpeedMenu').style.display = 'flex';
            highlightActiveOptions('btn-ball-speed', game.ballSpeedOption, 'data-speed');
        });
    }

    const btnSpeedBack = document.getElementById('btnSpeedBack');
    if (btnSpeedBack) {
        btnSpeedBack.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    document.querySelectorAll('.btn-ball-speed').forEach(btn => {
        btn.addEventListener('click', () => {
            let speed = btn.getAttribute('data-speed');
            game.setBallSpeed(speed);
            highlightActiveOptions('btn-ball-speed', speed, 'data-speed');
        });
    });

    const btnBallSize = document.getElementById('btnSettingsBallSize');
    if (btnBallSize) {
        btnBallSize.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsBallSizeMenu').style.display = 'flex';
            updatePreviewBall(game.ballSizeOption);
            highlightActiveOptions('btn-ball-size', game.ballSizeOption, 'data-size');
        });
    }

    const btnSizeBack = document.getElementById('btnSizeBack');
    if (btnSizeBack) {
        btnSizeBack.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    document.querySelectorAll('.btn-ball-size').forEach(btn => {
        btn.addEventListener('click', () => {
            let size = btn.getAttribute('data-size');
            game.setBallSize(size);
            updatePreviewBall(size);
            highlightActiveOptions('btn-ball-size', size, 'data-size');
        });
    });

    const quitBtn = document.getElementById('quitBtn');
    if (quitBtn) {
        quitBtn.addEventListener('click', () => {
            game.gameRunning = false;
            pauseBgm();
            document.getElementById('pauseMenu').style.display = 'flex';
        });
    }

    document.querySelector('#pauseMenu .btn-continue')?.addEventListener('click', () => game.resumeGame());
    document.querySelector('#pauseMenu .btn-restart')?.addEventListener('click', () => game.restartFromLevel1());
    document.querySelector('#pauseMenu .btn-quit')?.addEventListener('click', () => game.quitToMainMenu());

    document.querySelector('#gameOverMenu .btn-continue')?.addEventListener('click', () => game.continueGame());
    document.querySelector('#gameOverMenu .btn-quit')?.addEventListener('click', () => game.quitToMainMenu());
    document.querySelector('#winOverlay .btn-quit')?.addEventListener('click', () => game.quitToMainMenu());

    function gameLoop() {
        game.update();
        game.draw();
        requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
});
