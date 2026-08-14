// src/js/IosPicker.js

export class IosPicker {
    constructor(totalLevels, onSelect) {
        this.totalLevels = totalLevels;
        this.onSelect = onSelect;
        this.itemHeight = 36;
        this.selectedIndex = 0;
        this.scrollOffset = 0;
        this.startY = 0;
        this.startOffset = 0;
        this.isDragging = false;

        this.overlay = document.getElementById('iosPickerOverlay');
        this.container = document.getElementById('pickerWheelContainer');
        this.wheelList = document.getElementById('pickerWheelList');
        this.confirmBtn = document.getElementById('pickerConfirmBtn');

        this.init();
    }

    init() {
        if (!this.overlay || !this.container || !this.wheelList) return;

        // Monta os itens de fase como DIVs
        this.wheelList.innerHTML = '';
        for (let i = 1; i <= this.totalLevels; i++) {
            const item = document.createElement('div');
            item.className = 'picker-wheel-item';
            item.textContent = `Fase ${i}`;
            this.wheelList.appendChild(item);
        }

        this.items = this.wheelList.querySelectorAll('.picker-wheel-item');

        // Eventos de Toque / Mouse para arrastar o rolo
        const onStart = (e) => {
            this.isDragging = true;
            this.startY = e.touches ? e.touches[0].clientY : e.clientY;
            this.startOffset = this.scrollOffset;
            this.wheelList.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!this.isDragging) return;
            const currentY = e.touches ? e.touches[0].clientY : e.clientY;
            const deltaY = currentY - this.startY;
            this.scrollOffset = this.startOffset + deltaY;
            this.render();
        };

        const onEnd = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.snapToNearest();
        };

        this.container.addEventListener('touchstart', onStart, { passive: true });
        this.container.addEventListener('touchmove', onMove, { passive: true });
        this.container.addEventListener('touchend', onEnd);

        this.container.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);

        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => {
                const selectedLevel = this.selectedIndex + 1;
                if (this.onSelect) {
                    this.onSelect(selectedLevel);
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

    render() {
        this.items.forEach((item, idx) => {
            const itemY = idx * this.itemHeight + this.scrollOffset;
            const angle = (itemY / this.itemHeight) * -20; // Rotação 3D
            const distance = Math.abs(itemY);

            if (distance < this.itemHeight * 3.5) {
                item.style.display = 'block';
                item.style.transform = `translateY(${this.scrollOffset}px) rotateX(${angle}deg) scale(${Math.max(0.75, 1 - distance / 200)})`;
                item.style.opacity = Math.max(0.2, 1 - distance / 120);

                if (distance < this.itemHeight / 2) {
                    item.classList.add('selected');
                    this.selectedIndex = idx;
                } else {
                    item.classList.remove('selected');
                }
            } else {
                item.style.display = 'none';
            }
        });
    }

    snapToNearest() {
        const minOffset = -(this.totalLevels - 1) * this.itemHeight;
        const clamped = Math.max(minOffset, Math.min(0, this.scrollOffset));
        this.selectedIndex = Math.round(-clamped / this.itemHeight);
        this.scrollOffset = -this.selectedIndex * this.itemHeight;

        this.wheelList.style.transition = 'transform 0.2s ease-out';
        this.render();
    }

    open(currentLevel = 1) {
        this.selectedIndex = Math.max(0, Math.min(this.totalLevels - 1, currentLevel - 1));
        this.scrollOffset = -this.selectedIndex * this.itemHeight;
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            this.render();
        }
    }

    close() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
}
