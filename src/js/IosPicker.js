// src/js/IosPicker.js

export class IosPicker {
    constructor(totalLevels, onSelect) {
        this.totalLevels = totalLevels;
        this.onSelect = onSelect;
        this.overlay = document.getElementById('iosPickerOverlay');
        this.select = document.getElementById('pickerSelect');
        this.confirmBtn = document.getElementById('pickerConfirmBtn');

        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => {
                if (this.select && this.onSelect) {
                    const level = parseInt(this.select.value, 10);
                    this.onSelect(level);
                }
                this.close();
            });
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
        }
    }

    open(currentLevel) {
        if (!this.overlay || !this.select) return;

        this.select.innerHTML = '';
        for (let i = 1; i <= this.totalLevels; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `Fase ${i}`;
            if (i === currentLevel) {
                opt.selected = true;
            }
            this.select.appendChild(opt);
        }

        this.overlay.style.display = 'flex';
    }

    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
}
