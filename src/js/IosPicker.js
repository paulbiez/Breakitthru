// src/js/IosPicker.js

export class IosPicker {
    constructor(totalLevels, onSelect) {
        this.totalLevels = totalLevels;
        this.onSelect = onSelect;
        this.selectedIndex = 1;

        this.overlay = document.getElementById('iosPickerOverlay');
        this.container = document.getElementById('gridPickerContainer');
        this.cancelBtn = document.getElementById('pickerCancelBtn');
        this.confirmBtn = document.getElementById('pickerConfirmBtn');

        this.init();
    }

    init() {
        if (!this.overlay || !this.container) return;

        // Renderiza os 20 blocos numéricos
        this.container.innerHTML = '';
        for (let i = 1; i <= this.totalLevels; i++) {
            const item = document.createElement('button');
            item.className = 'grid-picker-item';
            item.textContent = i;
            item.type = 'button';
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectLevel(i);
            });
            this.container.appendChild(item);
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }

        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.onSelect) {
                    this.onSelect(this.selectedIndex);
                }
                this.close();
            });
        }

        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });
        }
    }

    selectLevel(level) {
        this.selectedIndex = level;
        const items = this.container.querySelectorAll('.grid-picker-item');
        items.forEach((item, idx) => {
            if (idx + 1 === level) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    open(currentLevel = 1) {
        this.selectLevel(currentLevel);
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
