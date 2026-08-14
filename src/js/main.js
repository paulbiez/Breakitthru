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

    let validLevel = parseInt(game.currentLevel, 10);
    if (isNaN(validLevel) || validLevel < 1) {
        validLevel = 1;
        game.currentLevel = 1;
    }

    const selectBtn = document.getElementById('selectLevelBtn');
    if (selectBtn) {
        selectBtn.innerText = `Selecionar Fase: ${validLevel}`;
    }

    // Instancia o Grid Picker
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

    // --- CONTROLES DE SOM (Ouvindo input e change) ---
    const bgmSlider = document.getElementById('bgmVolumeSlider');
    if (bgmSlider) {
        ['input', 'change'].forEach(evt => {
            bgmSlider.addEventListener(evt, (e) => {
                setBgmVolume(e.target.value / 100);
                updateSoundUI();
            });
        });
    }

    const sfxSlider = document.getElementById('sfxVolumeSlider');
    if (sfxSlider) {
        ['input', 'change'].forEach(evt => {
            sfxSlider.addEventListener(evt, (e) => {
                setSfxVolume(e.target.value / 100);
                updateSoundUI();
            });
        });
    }

    // --- BOTÕES HUD IN-GAME ---
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

    // --- SUBMENUS DE CONFIGURAÇÃO (SLIDERS & PREVIEWS) ---
    
    // 1. Tamanho da Raquete (1 a 10)
    const paddleSlider = document.getElementById('paddleSlider');
    function updatePaddlePreview(val) {
        const lvl = parseInt(val, 10);
        const text = document.getElementById('paddleValText');
        const preview = document.getElementById('paddlePreview');
        if (text) text.innerText = lvl;
        if (preview) {
            const minW = 35;
            const maxW = 85.05;
            const calculatedW = minW + ((lvl - 1) / 9) * (maxW - minW);
            preview.style.width = calculatedW + 'px';
        }
    }
    if (paddleSlider) {
        ['input', 'change'].forEach(evt => {
            paddleSlider.addEventListener(evt, (e) => {
                game.setPaddleLevel(e.target.value);
                updatePaddlePreview(e.target.value);
            });
        });
    }

    // 2. Tamanho da Bola (1 a 5)
    const sizeSlider = document.getElementById('sizeSlider');
    function updateBallSizePreview(val) {
        const lvl = parseInt(val, 10);
        const text = document.getElementById('sizeValText');
        const preview = document.getElementById('ballSizePreview');
        if (text) text.innerText = lvl;
        if (preview) {
            const diameters = [8, 10, 12, 14, 16];
            const d = diameters[lvl - 1] || 12;
            preview.style.width = (d * 1.5) + 'px';
            preview.style.height = (d * 1.5) + 'px';
        }
    }
    if (sizeSlider) {
        ['input', 'change'].forEach(evt => {
            sizeSlider.addEventListener(evt, (e) => {
                game.setBallSizeLevel(e.target.value);
                updateBallSizePreview(e.target.value);
            });
        });
    }

    // 3. Velocidade da Bola (1 a 5) com Animação
    let currentSpeedVal = 3;
    let animPos = 0;
    let animDir = 1;

    const speedSlider = document.getElementById('speedSlider');
    function updateSpeedPreview(val) {
        currentSpeedVal = parseInt(val, 10);
        const text = document.getElementById('speedValText');
        if (text) text.innerText = currentSpeedVal;
    }
    if (speedSlider) {
        ['input', 'change'].forEach(evt => {
            speedSlider.addEventListener(evt, (e) => {
                game.setBallSpeedLevel(e.target.value);
                updateSpeedPreview(e.target.value);
            });
        });
    }

    function speedAnimLoop() {
        const track = document.getElementById('speedBallTrack');
        const ball = document.getElementById('speedBallAnim');
        if (track && ball) {
            const maxTrackWidth = track.clientWidth - 12;
            const speedMultipliers = [0.8, 1.4, 2.2, 3.2, 4.5];
            const speed = speedMultipliers[currentSpeedVal - 1] || 2.2;

            animPos += speed * animDir;
            if (animPos >= maxTrackWidth) {
                animPos = maxTrackWidth;
                animDir = -1;
            } else if (animPos <= 0) {
                animPos = 0;
                animDir = 1;
            }
            ball.style.left = animPos + 'px';
        }
        requestAnimationFrame(speedAnimLoop);
    }
    requestAnimationFrame(speedAnimLoop);

    // Inicialização imediata dos previews
    updatePaddlePreview(game.paddleLevel);
    updateSpeedPreview(game.ballSpeedLevel);
    updateBallSizePreview(game.ballSizeLevel);

    // --- NAVEGAÇÃO DOS MENUS ---
    const btnSettings = document.getElementById('btnSettings');
    if (btnSettings) {
        btnSettings.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    const btnSettingsSave = document.getElementById('btnSettingsSave');
    if (btnSettingsSave) {
        btnSettingsSave.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('menu').style.display = 'flex';
        });
    }

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

    const btnSettingsPaddle = document.getElementById('btnSettingsPaddle');
    if (btnSettingsPaddle) {
        btnSettingsPaddle.addEventListener('click', () => {
            hideAllMenus();
            if (paddleSlider) paddleSlider.value = game.paddleLevel;
            updatePaddlePreview(game.paddleLevel);
            document.getElementById('settingsPaddleMenu').style.display = 'flex';
        });
    }

    const btnPaddleBack = document.getElementById('btnPaddleBack');
    if (btnPaddleBack) {
        btnPaddleBack.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    const btnSettingsSpeed = document.getElementById('btnSettingsBallSpeed');
    if (btnSettingsSpeed) {
        btnSettingsSpeed.addEventListener('click', () => {
            hideAllMenus();
            if (speedSlider) speedSlider.value = game.ballSpeedLevel;
            updateSpeedPreview(game.ballSpeedLevel);
            document.getElementById('settingsBallSpeedMenu').style.display = 'flex';
        });
    }

    const btnSpeedBack = document.getElementById('btnSpeedBack');
    if (btnSpeedBack) {
        btnSpeedBack.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
        });
    }

    const btnSettingsBallSize = document.getElementById('btnSettingsBallSize');
    if (btnSettingsBallSize) {
        btnSettingsBallSize.addEventListener('click', () => {
            hideAllMenus();
            if (sizeSlider) sizeSlider.value = game.ballSizeLevel;
            updateBallSizePreview(game.ballSizeLevel);
            document.getElementById('settingsBallSizeMenu').style.display = 'flex';
        });
    }

    const btnSizeBack = document.getElementById('btnSizeBack');
    if (btnSizeBack) {
        btnSizeBack.addEventListener('click', () => {
            hideAllMenus();
            document.getElementById('settingsMenu').style.display = 'flex';
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
