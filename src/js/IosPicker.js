// src/js/IosPicker.js

export class IosPicker {
    constructor(totalLevels, onSelectCallback) {
        this.totalLevels = totalLevels;
        this.onSelectCallback = onSelectCallback;
        this.overlay = document.getElementById('iosPickerOverlay');
        this.selectEl = document.getElementById('pickerSelect');
        this.confirmBtn = document.getElementById('pickerConfirmBtn');

        this.init();
    }

    init() {
        if (!this.overlay || !this.selectEl || !this.confirmBtn) return;

        // Popula as opções de fases
        this.selectEl.innerHTML = '';
        for (let i = 1; i <= this.totalLevels; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = `Fase ${i}`;
            this.selectEl.appendChild(opt);
        }

        // Confirmação da seleção
        this.confirmBtn.addEventListener('click', () => {
            const selected = parseInt(this.selectEl.value, 10) || 1;
            if (this.onSelectCallback) {
                this.onSelectCallback(selected);
            }
            this.close();
        });

        // Fecha se o jogador tocar na área escura de fora
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    }

    open(currentLevel = 1) {
        if (this.selectEl) {
            this.selectEl.value = currentLevel;
        }
        if (this.overlay) {
            this.overlay.style.display = 'flex';
        }
    }

    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
}
